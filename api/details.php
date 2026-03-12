<?php

declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load config and cache
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration missing']);
    exit;
}
$config = require $configPath;
require __DIR__ . '/cache.php';

// Validate required param
$placeId = $_GET['place_id'] ?? '';
if ($placeId === '') {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required parameter: place_id']);
    exit;
}

// Basic place_id format validation
if (!preg_match('/^ChIJ[A-Za-z0-9_-]+$/', $placeId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid place_id format']);
    exit;
}

// Check cache (unless ?fresh=true)
$fresh = ($_GET['fresh'] ?? '') === 'true';
if (!$fresh) {
    $cachedJson = detailCacheGet($placeId, DETAIL_TTL);
    if ($cachedJson !== null) {
        $cachedData = json_decode($cachedJson, true);
        $cachedData['cached'] = true;
        $cachedData['usage'] = ['today' => apiUsageToday(), 'limit' => DAILY_API_LIMIT];
        cacheCleanup();
        echo json_encode($cachedData, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Check daily limit before making an API call
if (!apiUsageRecord('details')) {
    http_response_code(429);
    echo json_encode([
        'error'   => 'Daily API limit reached',
        'message' => 'The daily limit of ' . DAILY_API_LIMIT . ' API calls has been reached. Try again tomorrow.',
        'usage'   => ['today' => apiUsageToday(), 'limit' => DAILY_API_LIMIT],
    ]);
    exit;
}

// Call Google Places API (New) - Place Details
$url = 'https://places.googleapis.com/v1/places/' . urlencode($placeId);
$fieldMask = 'photos,regularOpeningHours,websiteUri,nationalPhoneNumber,formattedAddress';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
    CURLOPT_HTTPHEADER     => [
        'X-Goog-Api-Key: ' . $config['google_api_key'],
        'X-Goog-FieldMask: ' . $fieldMask,
    ],
]);

$responseBody = curl_exec($ch);

if (curl_errno($ch)) {
    curl_close($ch);
    http_response_code(500);
    echo json_encode(['error' => 'Failed to reach Google Places API']);
    exit;
}

$httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode !== 200) {
    $data = json_decode($responseBody, true);
    $message = $data['error']['message'] ?? 'Google Places API error';
    http_response_code(500);
    echo json_encode(['error' => $message]);
    exit;
}

$data = json_decode($responseBody, true);

// Normalize photos
$photos = [];
foreach (($data['photos'] ?? []) as $photo) {
    $photos[] = [
        'name'     => $photo['name'] ?? '',
        'widthPx'  => (int) ($photo['widthPx'] ?? 0),
        'heightPx' => (int) ($photo['heightPx'] ?? 0),
    ];
}

// Normalize hours
$dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
$hours = [];
foreach (($data['regularOpeningHours']['periods'] ?? []) as $period) {
    $dayIndex = (int) ($period['open']['day'] ?? 0);
    $openHour   = (int) ($period['open']['hour'] ?? 0);
    $openMinute = (int) ($period['open']['minute'] ?? 0);
    $closeHour   = (int) ($period['close']['hour'] ?? 0);
    $closeMinute = (int) ($period['close']['minute'] ?? 0);

    $hours[] = [
        'day'   => $dayNames[$dayIndex] ?? 'Unknown',
        'open'  => formatTime12($openHour, $openMinute),
        'close' => formatTime12($closeHour, $closeMinute),
    ];
}

$result = [
    'photos'  => $photos,
    'hours'   => $hours,
    'phone'   => $data['nationalPhoneNumber'] ?? '',
    'address' => $data['formattedAddress'] ?? '',
    'website' => $data['websiteUri'] ?? null,
    'cached'  => false,
    'usage'   => ['today' => apiUsageToday(), 'limit' => DAILY_API_LIMIT],
];

// Store in cache
detailCacheSet($placeId, json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
cacheCleanup();

echo json_encode($result, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

/**
 * Format hour/minute to 12-hour time string.
 */
function formatTime12(int $hour, int $minute): string
{
    $suffix = $hour >= 12 ? 'PM' : 'AM';
    $displayHour = $hour % 12;
    if ($displayHour === 0) $displayHour = 12;
    $displayMinute = str_pad((string) $minute, 2, '0', STR_PAD_LEFT);
    return $displayHour . ':' . $displayMinute . ' ' . $suffix;
}

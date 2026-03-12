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

// Load config
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server configuration missing']);
    exit;
}
$config = require $configPath;

// Validate required params
$latitude  = filter_input(INPUT_GET, 'latitude', FILTER_VALIDATE_FLOAT);
$longitude = filter_input(INPUT_GET, 'longitude', FILTER_VALIDATE_FLOAT);

if ($latitude === false || $latitude === null || $longitude === false || $longitude === null) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing or invalid required parameters: latitude, longitude']);
    exit;
}

if ($latitude < -90 || $latitude > 90 || $longitude < -180 || $longitude > 180) {
    http_response_code(400);
    echo json_encode(['error' => 'Coordinates out of range']);
    exit;
}

// Optional params with defaults
$radius = filter_input(INPUT_GET, 'radius', FILTER_VALIDATE_INT) ?? $config['defaults']['radius'];
$limit  = filter_input(INPUT_GET, 'limit', FILTER_VALIDATE_INT) ?? $config['defaults']['limit'];
$sortBy = $_GET['sort_by'] ?? $config['defaults']['sort_by'];
$categories = $_GET['categories'] ?? '';
$price  = $_GET['price'] ?? '';
$openAt = filter_input(INPUT_GET, 'open_at', FILTER_VALIDATE_INT) ?? 0;

// Validate optional params
$radius = max(1, min((int) $radius, 40000));
$limit  = max(1, min((int) $limit, 20));

$allowedSortBy = ['best_match', 'rating', 'review_count', 'distance'];
if (!in_array($sortBy, $allowedSortBy, true)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid sort_by value. Allowed: ' . implode(', ', $allowedSortBy)]);
    exit;
}

if ($categories !== '' && !preg_match('/^[a-z0-9_,]+$/i', $categories)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid categories format']);
    exit;
}

if ($price !== '' && !preg_match('/^[1-4](,[1-4])*$/', $price)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid price format. Use comma-separated values 1-4']);
    exit;
}

if ($openAt < 0) {
    http_response_code(400);
    echo json_encode(['error' => 'open_at must be a positive Unix timestamp']);
    exit;
}

// Load cache and check daily limit
require __DIR__ . '/cache.php';

if (!apiUsageRecord('search')) {
    http_response_code(429);
    echo json_encode([
        'error'   => 'Daily API limit reached',
        'message' => 'The daily limit of ' . DAILY_API_LIMIT . ' API calls has been reached. Try again tomorrow.',
        'usage'   => ['today' => apiUsageToday(), 'limit' => DAILY_API_LIMIT],
    ]);
    exit;
}

// Load providers
require_once __DIR__ . '/providers/ProviderInterface.php';
require_once __DIR__ . '/providers/GooglePlacesProvider.php';

use Eatout\Providers\GooglePlacesProvider;

$providerMap = [
    'google' => fn() => new GooglePlacesProvider($config['google_api_key']),
];

// Query enabled providers
$allResults    = [];
$rateLimit     = null;
$providerCount = 0;

foreach ($config['enabled_providers'] as $providerName) {
    if (!isset($providerMap[$providerName])) {
        continue;
    }

    try {
        $provider = $providerMap[$providerName]();
        $response = $provider->search(
            latitude:   $latitude,
            longitude:  $longitude,
            radius:     $radius,
            categories: $categories,
            price:      $price,
            openAt:     $openAt,
            sortBy:     $sortBy,
            limit:      $limit,
        );

        $allResults = array_merge($allResults, $response['results']);
        $rateLimit  = $response['rate_limit'];
        $providerCount++;

    } catch (\RuntimeException $e) {
        $code = $e->getCode();

        if ($code === 429) {
            http_response_code(429);
            echo json_encode([
                'error'   => 'Rate limit exceeded',
                'message' => $e->getMessage(),
            ]);
            exit;
        }

        http_response_code(502);
        echo json_encode([
            'error'   => 'Provider error',
            'message' => $e->getMessage(),
        ]);
        exit;
    }
}

http_response_code(200);
echo json_encode([
    'results'        => $allResults,
    'rate_limit'     => $rateLimit,
    'provider_count' => $providerCount,
    'usage'          => ['today' => apiUsageToday(), 'limit' => DAILY_API_LIMIT],
], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

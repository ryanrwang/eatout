<?php

declare(strict_types=1);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

// Load config
$configPath = __DIR__ . '/config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Server configuration missing']);
    exit;
}
$config = require $configPath;
require __DIR__ . '/cache.php';

// Validate required param
$name = $_GET['name'] ?? '';
if ($name === '') {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Missing required parameter: name']);
    exit;
}

// Validate photo resource name format: places/PLACE_ID/photos/PHOTO_REF
if (!preg_match('#^places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+$#', $name)) {
    http_response_code(400);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Invalid photo name format']);
    exit;
}

$maxWidth = filter_input(INPUT_GET, 'maxwidth', FILTER_VALIDATE_INT) ?? 400;
$maxWidth = max(1, min((int) $maxWidth, 4800));

// Check photo cache
$cached = photoCacheGet($name, $maxWidth);
if ($cached !== null) {
    header('Content-Type: ' . $cached['content_type']);
    header('Cache-Control: public, max-age=86400');
    header('Content-Length: ' . strlen($cached['bytes']));
    cacheCleanup();
    echo $cached['bytes'];
    exit;
}

// Step 1: Get the photoUri from Google (skipHttpRedirect=true returns JSON)
$metaUrl = 'https://places.googleapis.com/v1/' . $name . '/media'
    . '?maxWidthPx=' . $maxWidth
    . '&key=' . urlencode($config['google_api_key'])
    . '&skipHttpRedirect=true';

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $metaUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 10,
]);

$metaBody = curl_exec($ch);

if (curl_errno($ch)) {
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to reach Google Places API']);
    exit;
}

$metaStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($metaStatus !== 200) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Google photo metadata request failed']);
    exit;
}

$metaData = json_decode($metaBody, true);
$photoUri = $metaData['photoUri'] ?? '';

if ($photoUri === '') {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'No photoUri in Google response']);
    exit;
}

// Step 2: Fetch the actual image bytes
$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL            => $photoUri,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT        => 15,
    CURLOPT_FOLLOWLOCATION => true,
]);

$imageBytes = curl_exec($ch);

if (curl_errno($ch)) {
    curl_close($ch);
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch photo image']);
    exit;
}

$imageStatus = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE) ?: 'image/jpeg';
curl_close($ch);

if ($imageStatus !== 200) {
    http_response_code(502);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Photo image fetch failed']);
    exit;
}

// Cache and serve the image
photoCacheSet($name, $maxWidth, $imageBytes, $contentType);
cacheCleanup();

header('Content-Type: ' . $contentType);
header('Cache-Control: public, max-age=86400');
header('Content-Length: ' . strlen($imageBytes));
echo $imageBytes;

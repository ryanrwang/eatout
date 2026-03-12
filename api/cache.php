<?php

declare(strict_types=1);

define('CACHE_DIR', __DIR__ . '/data');
define('CACHE_DB', CACHE_DIR . '/cache.db');
define('PHOTO_DIR', CACHE_DIR . '/photos');
define('DETAIL_TTL', 21600);  // 6 hours
define('PHOTO_TTL', 86400);   // 24 hours
define('DAILY_API_LIMIT', 100);

/**
 * Get or create the SQLite database connection.
 */
function cacheDb(): PDO
{
    static $pdo = null;
    if ($pdo !== null) return $pdo;

    if (!is_dir(CACHE_DIR)) {
        mkdir(CACHE_DIR, 0755, true);
    }

    $pdo = new PDO('sqlite:' . CACHE_DB);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->exec('CREATE TABLE IF NOT EXISTS detail_cache (
        place_id TEXT PRIMARY KEY,
        response_json TEXT NOT NULL,
        cached_at INTEGER NOT NULL
    )');

    $pdo->exec('CREATE TABLE IF NOT EXISTS api_usage (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        endpoint TEXT NOT NULL,
        called_at TEXT NOT NULL DEFAULT (date(\'now\'))
    )');

    return $pdo;
}

/**
 * Get cached detail JSON for a place, or null if expired/missing.
 */
function detailCacheGet(string $placeId, int $maxAgeSec): ?string
{
    $pdo = cacheDb();
    $stmt = $pdo->prepare('SELECT response_json, cached_at FROM detail_cache WHERE place_id = ?');
    $stmt->execute([$placeId]);
    $row = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$row) return null;
    if (time() - (int) $row['cached_at'] > $maxAgeSec) return null;

    return $row['response_json'];
}

/**
 * Store detail JSON in cache.
 */
function detailCacheSet(string $placeId, string $json): void
{
    $pdo = cacheDb();
    $stmt = $pdo->prepare('INSERT OR REPLACE INTO detail_cache (place_id, response_json, cached_at) VALUES (?, ?, ?)');
    $stmt->execute([$placeId, $json, time()]);
}

/**
 * Generate deterministic cache file path for a photo.
 */
function photoCachePath(string $name, int $maxWidth): string
{
    return PHOTO_DIR . '/' . md5($name . '|' . $maxWidth);
}

/**
 * Get cached photo bytes and content type, or null if expired/missing.
 */
function photoCacheGet(string $name, int $maxWidth): ?array
{
    $path = photoCachePath($name, $maxWidth);
    $metaPath = $path . '.meta';

    if (!file_exists($path) || !file_exists($metaPath)) return null;
    if (time() - filemtime($path) > PHOTO_TTL) return null;

    return [
        'bytes'        => file_get_contents($path),
        'content_type' => trim(file_get_contents($metaPath)),
    ];
}

/**
 * Store photo bytes and content type in cache.
 */
function photoCacheSet(string $name, int $maxWidth, string $bytes, string $contentType): void
{
    if (!is_dir(PHOTO_DIR)) {
        mkdir(PHOTO_DIR, 0755, true);
    }

    $path = photoCachePath($name, $maxWidth);
    file_put_contents($path, $bytes);
    file_put_contents($path . '.meta', $contentType);
}

/**
 * Get today's API call count.
 */
function apiUsageToday(): int
{
    $pdo = cacheDb();
    $stmt = $pdo->prepare('SELECT COUNT(*) FROM api_usage WHERE called_at = date(\'now\')');
    $stmt->execute();
    return (int) $stmt->fetchColumn();
}

/**
 * Record an API call and return true if under the daily limit, false if over.
 */
function apiUsageRecord(string $endpoint): bool
{
    $count = apiUsageToday();
    if ($count >= DAILY_API_LIMIT) {
        return false;
    }

    $pdo = cacheDb();
    $stmt = $pdo->prepare('INSERT INTO api_usage (endpoint, called_at) VALUES (?, date(\'now\'))');
    $stmt->execute([$endpoint]);
    return true;
}

/**
 * Delete expired cache entries. Called probabilistically (1 in 50 requests).
 */
function cacheCleanup(): void
{
    if (random_int(1, 50) !== 1) return;

    // SQLite cleanup
    $pdo = cacheDb();
    $cutoff = time() - DETAIL_TTL;
    $pdo->prepare('DELETE FROM detail_cache WHERE cached_at < ?')->execute([$cutoff]);

    // Photo cleanup
    if (!is_dir(PHOTO_DIR)) return;
    $cutoff = time() - PHOTO_TTL;
    foreach (scandir(PHOTO_DIR) as $file) {
        if ($file === '.' || $file === '..') continue;
        $filePath = PHOTO_DIR . '/' . $file;
        if (is_file($filePath) && filemtime($filePath) < $cutoff) {
            unlink($filePath);
        }
    }

    // Clean old API usage (older than 30 days)
    $pdo->prepare('DELETE FROM api_usage WHERE called_at < date(\'now\', \'-30 days\')')->execute();
}

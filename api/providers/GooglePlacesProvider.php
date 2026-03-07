<?php

declare(strict_types=1);

namespace Eatout\Providers;

require_once __DIR__ . '/ProviderInterface.php';

class GooglePlacesProvider implements ProviderInterface
{
    private const API_BASE = 'https://places.googleapis.com/v1/places:searchNearby';

    private const FIELD_MASK = 'places.displayName,places.formattedAddress,places.location,'
        . 'places.rating,places.priceLevel,places.types,places.photos,'
        . 'places.nationalPhoneNumber,places.websiteUri,places.regularOpeningHours,'
        . 'places.userRatingCount,places.id';

    private const PRICE_LEVEL_MAP = [
        'PRICE_LEVEL_FREE'           => 0,
        'PRICE_LEVEL_INEXPENSIVE'    => 1,
        'PRICE_LEVEL_MODERATE'       => 2,
        'PRICE_LEVEL_EXPENSIVE'      => 3,
        'PRICE_LEVEL_VERY_EXPENSIVE' => 4,
    ];

    public function __construct(
        private readonly string $apiKey,
    ) {}

    public function search(
        float  $latitude,
        float  $longitude,
        int    $radius,
        string $categories,
        string $price,
        int    $openAt,
        string $sortBy,
        int    $limit,
    ): array {
        $body = [
            'locationRestriction' => [
                'circle' => [
                    'center' => [
                        'latitude'  => $latitude,
                        'longitude' => $longitude,
                    ],
                    'radius' => (float) min($radius, 50000),
                ],
            ],
            'maxResultCount' => min($limit, 20),
            'rankPreference' => $sortBy === 'distance' ? 'DISTANCE' : 'POPULARITY',
        ];

        if ($categories !== '') {
            $body['includedTypes'] = explode(',', $categories);
        }

        $response = $this->executeRequest($body);

        if ($response['status'] !== 200) {
            $data = json_decode($response['body'], true);
            $message = $data['error']['message'] ?? 'Unknown Google Places API error';
            throw new \RuntimeException($message, $response['status']);
        }

        $data = json_decode($response['body'], true);

        return [
            'results'    => array_map([$this, 'normalizePlace'], $data['places'] ?? []),
            'rate_limit' => null,
        ];
    }

    /**
     * @return array{body: string, status: int}
     */
    private function executeRequest(array $body): array
    {
        $ch = curl_init();

        curl_setopt_array($ch, [
            CURLOPT_URL            => self::API_BASE,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT        => 10,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode($body, JSON_UNESCAPED_SLASHES),
            CURLOPT_HTTPHEADER     => [
                'Content-Type: application/json',
                'X-Goog-Api-Key: ' . $this->apiKey,
                'X-Goog-FieldMask: ' . self::FIELD_MASK,
            ],
        ]);

        $responseBody = curl_exec($ch);

        if (curl_errno($ch)) {
            curl_close($ch);
            throw new \RuntimeException('Google Places API service unavailable', 502);
        }

        $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        return [
            'body'   => $responseBody,
            'status' => $httpCode,
        ];
    }

    private function normalizePlace(array $place): array
    {
        $openNow = $place['regularOpeningHours']['openNow'] ?? null;

        return [
            'name'         => $place['displayName']['text'] ?? '',
            'address'      => $place['formattedAddress'] ?? '',
            'latitude'     => (float) ($place['location']['latitude'] ?? 0),
            'longitude'    => (float) ($place['location']['longitude'] ?? 0),
            'rating'       => (float) ($place['rating'] ?? 0),
            'price_level'  => self::PRICE_LEVEL_MAP[$place['priceLevel'] ?? ''] ?? 0,
            'cuisine_tags' => $place['types'] ?? [],
            'image_url'    => '',
            'phone'        => $place['nationalPhoneNumber'] ?? '',
            'source'       => 'google',
            'source_url'   => 'https://www.google.com/maps/place/?q=place_id:' . ($place['id'] ?? ''),
            'source_id'    => $place['id'] ?? '',
            'distance'     => 0.0,
            'review_count' => (int) ($place['userRatingCount'] ?? 0),
            'transactions' => [],
            'is_closed'    => $openNow === null ? false : !$openNow,
        ];
    }
}

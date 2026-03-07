<?php

declare(strict_types=1);

namespace Eatout\Providers;

interface ProviderInterface
{
    /**
     * Search for restaurants matching the given criteria.
     *
     * @return array{
     *     results: list<array{
     *         name: string,
     *         address: string,
     *         latitude: float,
     *         longitude: float,
     *         rating: float,
     *         price_level: int,
     *         cuisine_tags: list<string>,
     *         image_url: string,
     *         phone: string,
     *         source: string,
     *         source_url: string,
     *         source_id: string,
     *         distance: float,
     *         review_count: int,
     *         transactions: list<string>,
     *         is_closed: bool
     *     }>,
     *     rate_limit: array{
     *         daily_limit: int,
     *         remaining: int,
     *         reset_time: string
     *     }|null
     * }
     *
     * @throws \RuntimeException On API or network errors
     */
    public function search(
        float  $latitude,
        float  $longitude,
        int    $radius,
        string $categories,
        string $price,
        int    $openAt,
        string $sortBy,
        int    $limit,
    ): array;
}

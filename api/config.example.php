<?php

declare(strict_types=1);

return [
    'google_api_key' => 'YOUR_GOOGLE_API_KEY_HERE',

    'enabled_providers' => ['google'],

    'defaults' => [
        'radius'  => 1000,
        'limit'   => 5,
        'sort_by' => 'best_match',
    ],
];

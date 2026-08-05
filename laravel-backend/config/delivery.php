<?php

/*
|--------------------------------------------------------------------------
| Delivery partners
|--------------------------------------------------------------------------
|
| Rapido, Ola and Porter do not publish open APIs. All three are partner-gated:
| you sign a commercial agreement, get merchant onboarding, and are then issued
| credentials, a base URL for their sandbox, and their API documentation. Until
| that happens the adapters here run in sandbox mode — they quote and "book"
| plausible data, clearly flagged, so the whole flow is buildable and demoable
| without pretending anything shipped.
|
| Every adapter reads its base URL from config rather than hardcoding one, so
| pointing at a partner's sandbox and later at production is an env change.
| Confirm each partner's request/response shape against the docs they issue —
| the field maps in the adapters are written from their public integration
| guides and must be verified before go-live.
|
*/

return [

    // Which carriers may be quoted. Drop a key to disable a partner without
    // deleting its adapter.
    'enabled' => array_values(array_filter(array_map('trim', explode(',', env(
        'DELIVERY_CARRIERS',
        'porter,rapido,ola,shiprocket,delhivery',
    ))))),

    // Where stock ships from. Intracity rules are decided against this.
    'pickup_pincode' => env('DELIVERY_PICKUP_PINCODE', '560103'),

    'pickup_address' => [
        'name' => env('DELIVERY_PICKUP_NAME', 'BazaarX Fulfilment Centre'),
        'phone' => env('DELIVERY_PICKUP_PHONE', '9000000000'),
        'line1' => env('DELIVERY_PICKUP_LINE1', 'Plot 14, HSR Layout Sector 2'),
        'city' => env('DELIVERY_PICKUP_CITY', 'Bengaluru'),
        'state' => env('DELIVERY_PICKUP_STATE', 'Karnataka'),
        'pincode' => env('DELIVERY_PICKUP_PINCODE', '560103'),
        'lat' => env('DELIVERY_PICKUP_LAT', 12.9121),
        'lng' => env('DELIVERY_PICKUP_LNG', 77.6446),
    ],

    // Used when a product has no weight recorded. Deliberately generous: a
    // catalogue gap should over-estimate weight (we absorb a little margin)
    // rather than under-estimate it (the carrier bills us the difference later).
    'default_item_weight_grams' => (int) env('DELIVERY_DEFAULT_ITEM_WEIGHT_G', 500),

    // Free-shipping threshold in rupees, applied after discounts. Mirrors the
    // rule the storefront advertises.
    'free_above' => (int) env('DELIVERY_FREE_ABOVE', 1999),

    /*
    |----------------------------------------------------------------------
    | Per-carrier limits and credentials
    |----------------------------------------------------------------------
    |
    | The limits are ours, not the partners' — they are the envelope we are
    | willing to hand each partner, and the allocator shortlists on them
    | without a network call. Tighten them as real performance data arrives.
    |
    */

    'carriers' => [

        // Rider network. Intracity only, small parcels, sub-2-hour.
        'rapido' => [
            'label' => 'Rapido',
            'base_url' => env('RAPIDO_BASE_URL', 'https://api.rapido.bike/v1'),
            'client_id' => env('RAPIDO_CLIENT_ID'),
            'client_secret' => env('RAPIDO_CLIENT_SECRET'),
            'max_weight_grams' => 15000,
            'max_longest_side_cm' => 45,
            'intracity_only' => true,
            'cod' => false, // rider networks generally will not collect cash
        ],

        // Rider network. Same envelope as Rapido; kept separate so the
        // allocator can rate-shop between them.
        'ola' => [
            'label' => 'Ola',
            'base_url' => env('OLA_BASE_URL', 'https://api.olacabs.com/logistics/v1'),
            'client_id' => env('OLA_CLIENT_ID'),
            'client_secret' => env('OLA_CLIENT_SECRET'),
            'max_weight_grams' => 20000,
            'max_longest_side_cm' => 50,
            'intracity_only' => true,
            'cod' => false,
        ],

        // Trucks and tempos. This is the one that takes the furniture and the
        // white goods that no rider network will touch.
        'porter' => [
            'label' => 'Porter',
            'base_url' => env('PORTER_BASE_URL', 'https://pfe-apigw-uat.porter.in'),
            'api_key' => env('PORTER_API_KEY'),
            'max_weight_grams' => 750000, // 750kg — a Tata Ace
            'max_longest_side_cm' => 300,
            'intracity_only' => true,
            'cod' => true,
        ],

        // Aggregator. The workhorse for everything crossing a city boundary.
        'shiprocket' => [
            'label' => 'Shiprocket',
            'base_url' => env('SHIPROCKET_BASE_URL', 'https://apiv2.shiprocket.in/v1/external'),
            'email' => env('SHIPROCKET_EMAIL'),
            'password' => env('SHIPROCKET_PASSWORD'),
            'pickup_location' => env('SHIPROCKET_PICKUP_LOCATION', 'Primary'),
            'max_weight_grams' => 50000,
            'max_longest_side_cm' => 120,
            'intracity_only' => false,
            'cod' => true,
        ],

        // Direct carrier contract, usually cheaper than the aggregator once
        // volume justifies it.
        'delhivery' => [
            'label' => 'Delhivery',
            'base_url' => env('DELHIVERY_BASE_URL', 'https://track.delhivery.com'),
            'api_token' => env('DELHIVERY_API_TOKEN'),
            'client_name' => env('DELHIVERY_CLIENT_NAME'),
            'max_weight_grams' => 50000,
            'max_longest_side_cm' => 120,
            'intracity_only' => false,
            'cod' => true,
        ],
    ],

    /*
    |----------------------------------------------------------------------
    | Sandbox pricing
    |----------------------------------------------------------------------
    |
    | Only used when a carrier has no credentials. Rates are shaped like the
    | real ones (base + per-km or per-500g slab) so the checkout UI and the
    | order totals are exercised against realistic numbers.
    |
    */
    'sandbox_rates' => [
        'instant_base_paise' => 4900,
        'instant_per_km_paise' => 900,
        'same_day_base_paise' => 7900,
        'express_base_paise' => 9900,
        'standard_base_paise' => 4900,
        'standard_per_500g_paise' => 1900,
        'heavy_base_paise' => 39900,
        'heavy_per_kg_paise' => 1200,
        'cod_fee_paise' => 3900,
    ],
];

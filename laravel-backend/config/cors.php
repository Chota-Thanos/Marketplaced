<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // The API has two browser clients now — the Next storefront and the Flutter
    // app when it is served for the web/dev target. Native iOS and Android
    // builds aren't subject to CORS at all, so this list only ever needs the
    // origins a browser will load. Comma-separated, overridable per environment.
    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', env('FRONTEND_URLS', env('FRONTEND_URL', 'http://localhost:3000') . ',http://localhost:8080')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,

];

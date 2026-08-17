<?php

return [
    /*
    |--------------------------------------------------------------------------
    | WebSocket Server Binding
    |--------------------------------------------------------------------------
    |
    | Address the lightweight socket server listens on, and that Broadcaster
    | connects to when pushing events. In production the server binds to
    | loopback only and nginx proxies /ws to it.
    |
    */

    'host' => env('WEBSOCKET_HOST', '0.0.0.0'),

    'port' => (int) env('WEBSOCKET_PORT', 8080),
];

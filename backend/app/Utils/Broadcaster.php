<?php

namespace App\Utils;

class Broadcaster
{
    /**
     * Broadcast an event to all connected WebSocket clients.
     *
     * @param string $event
     * @param array $data
     */
    public static function trigger(string $event, array $data = []): void
    {
        try {
            // Non-blocking socket connect to local WebSocket server
            $port = (int) config('websocket.port', 8080);
            $socket = @fsockopen('127.0.0.1', $port, $errno, $errstr, 0.5);
            if ($socket) {
                $payload = json_encode([
                    'event' => $event,
                    'data' => $data
                ]);
                @fwrite($socket, $payload);
                @fclose($socket);
            }
        } catch (\Exception $e) {
            // Ignore broadcast failure to ensure reliability of main transaction
        }
    }
}

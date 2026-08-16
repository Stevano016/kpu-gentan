<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class WebSocketServer extends Command
{
    protected $signature = 'websocket:serve {--port=8080}';
    protected $description = 'Start the lightweight custom WebSocket server using stream sockets';

    public function handle()
    {
        $port = intval($this->option('port') ?: 8080);
        $this->info("WebSocket Server starting on port {$port}...");

        $server = @stream_socket_server("tcp://0.0.0.0:{$port}", $errno, $errstr);
        if (!$server) {
            $this->error("Could not bind stream socket to port {$port}: {$errstr} ({$errno})");
            return 1;
        }

        $this->info("Server listening on port {$port}...");

        $clients = [$server];
        $handshakes = [];

        while (true) {
            $read = $clients;
            $write = null;
            $except = null;

            // Wait for activity on any socket (timeout 0.1s)
            if (@stream_select($read, $write, $except, 0, 100000) > 0) {
                // Check if new connection is arriving
                if (in_array($server, $read)) {
                    $newSocket = @stream_socket_accept($server);
                    if ($newSocket) {
                        $clients[] = $newSocket;
                        $socketId = intval($newSocket);
                        $handshakes[$socketId] = false;
                    }
                    
                    // Remove server from read list
                    $key = array_search($server, $read);
                    unset($read[$key]);
                }

                // Check other active client sockets
                foreach ($read as $socket) {
                    $socketId = intval($socket);
                    $data = @fread($socket, 8192);

                    if ($data === false || $data === '') {
                        // Connection closed
                        $this->closeConnection($socket, $clients, $handshakes);
                        continue;
                    }

                    // Check if handshaken
                    if (!$handshakes[$socketId]) {
                        // Determine if it is a WebSocket handshake or local IPC notification
                        if (str_contains($data, 'Upgrade: websocket')) {
                            // WebSocket handshake
                            $this->doHandshake($socket, $data);
                            $handshakes[$socketId] = true;
                            $this->info("New WebSocket client connected (ID: {$socketId})");
                        } else {
                            // Local IPC Notification (e.g. JSON from Controller)
                            $this->handleIpcNotification($data, $clients, $handshakes);
                            // Close the IPC socket immediately
                            $this->closeConnection($socket, $clients, $handshakes);
                        }
                    } else {
                        // Client sent message (typically we just ping-pong or broadcast)
                        $decoded = $this->decodeFrame($data);
                        if ($decoded) {
                            if ($decoded['opcode'] === 8) { // Connection close frame
                                $this->closeConnection($socket, $clients, $handshakes);
                            } else if ($decoded['opcode'] === 9) { // Ping
                                $pong = $this->encodeFrame($decoded['text'], 10);
                                @fwrite($socket, $pong);
                            } else if ($decoded['opcode'] === 1) { // Text message
                                $this->info("Client {$socketId} sent: " . $decoded['text']);
                            }
                        }
                    }
                }
            }
        }
    }

    private function closeConnection($socket, &$clients, &$handshakes)
    {
        $socketId = intval($socket);
        @fclose($socket);
        
        $key = array_search($socket, $clients);
        if ($key !== false) {
            unset($clients[$key]);
        }
        unset($handshakes[$socketId]);
    }

    private function doHandshake($socket, $headers)
    {
        if (preg_match("/Sec-WebSocket-Key: (.*)\r\n/", $headers, $match)) {
            $key = trim($match[1]);
            $accept = base64_encode(sha1($key . '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', true));
            $response = "HTTP/1.1 101 Switching Protocols\r\n" .
                        "Upgrade: websocket\r\n" .
                        "Connection: Upgrade\r\n" .
                        "Sec-WebSocket-Accept: $accept\r\n\r\n";
            @fwrite($socket, $response);
        }
    }

    private function handleIpcNotification($data, $clients, $handshakes)
    {
        // Broadcast the raw JSON data to all handshaken WebSocket clients
        $encodedFrame = $this->encodeFrame($data);
        
        foreach ($clients as $client) {
            $socketId = intval($client);
            // Skip the listening server socket and un-handshaken sockets
            if (isset($handshakes[$socketId]) && $handshakes[$socketId]) {
                @fwrite($client, $encodedFrame);
            }
        }
    }

    private function encodeFrame($text, $opcode = 1)
    {
        $b1 = 0x80 | ($opcode & 0x0f);
        $length = strlen($text);
        
        if ($length <= 125) {
            $header = pack('CC', $b1, $length);
        } elseif ($length > 125 && $length < 65536) {
            $header = pack('CCn', $b1, 126, $length);
        } else {
            $header = pack('CCNN', $b1, 127, 0, $length);
        }
        
        return $header . $text;
    }

    private function decodeFrame($data)
    {
        if (strlen($data) < 2) return null;
        $bytes = unpack('C*', substr($data, 0, 2));
        $opcode = $bytes[1] & 0x0f;
        $isMasked = ($bytes[2] & 0x80) === 0x80;
        $length = $bytes[2] & 0x7f;
        
        $offset = 2;
        if ($length === 126) {
            if (strlen($data) < 4) return null;
            $lenBytes = unpack('n', substr($data, 2, 2));
            $length = $lenBytes[1];
            $offset = 4;
        } elseif ($length === 127) {
            if (strlen($data) < 10) return null;
            $lenBytes = unpack('N', substr($data, 6, 4));
            $length = $lenBytes[1];
            $offset = 10;
        }
        
        if ($isMasked) {
            if (strlen($data) < $offset + 4 + $length) return null;
            $masks = unpack('C*', substr($data, $offset, 4));
            $offset += 4;
            $payload = substr($data, $offset, $length);
            $text = '';
            for ($i = 0; $i < $length; ++$i) {
                $text .= chr(ord($payload[$i]) ^ $masks[($i % 4) + 1]);
            }
            return ['opcode' => $opcode, 'text' => $text];
        } else {
            if (strlen($data) < $offset + $length) return null;
            $payload = substr($data, $offset, $length);
            return ['opcode' => $opcode, 'text' => $payload];
        }
    }
}

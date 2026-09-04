#!/usr/bin/env bash
#
# Pengawas WebSocket Gentan.
#
# systemd sudah memasang `Restart=always` pada gentan-websocket.service, dan itu
# menangani proses yang **mati**. Yang tidak bisa ditangani systemd adalah
# proses yang **masih hidup tapi berhenti melayani** — loop `stream_select`
# yang tertahan, socket pendengar yang tidak lagi menerima, atau proses yang
# tinggal tapi tidak menjawab. Bagi systemd ia tetap "active (running)",
# sementara layar quick count di lapangan berhenti bergerak sendiri.
#
# Karena itu pemeriksaannya harus dari luar dan harus benar-benar berjabat
# tangan, bukan sekadar mengetuk port: port yang terbuka tidak membuktikan
# handshake-nya masih dijawab.
#
# Dua kegagalan berurutan dulu, baru dimulai ulang. Satu kegagalan sesaat —
# beban CPU, GC PHP — bukan alasan memutus semua layar yang sedang menonton.
#
# Pemasangan (sekali saja, sebagai root):
#   cp /storage/kpps/kpu-gentan/deploy/gentan-websocket-watchdog.{service,timer} \
#      /etc/systemd/system/
#   systemctl daemon-reload
#   systemctl enable --now gentan-websocket-watchdog.timer
#
# Melihat kerjanya:
#   journalctl -t gentan-websocket-watchdog --since today   # hanya kegagalan
#   systemctl list-timers gentan-websocket-watchdog.timer

# Sengaja tanpa `-e`: pemeriksaan yang gagal adalah bagian normal dari alur ini.
set -uo pipefail

UNIT=gentan-websocket.service
HOST=127.0.0.1
PORT=8090
PENGHITUNG=/run/gentan-websocket-watchdog.gagal
AMBANG=2
TAG=gentan-websocket-watchdog

catat() { logger -t "$TAG" -- "$*"; }

# Handshake sungguhan lalu tutup segera.
#
# Ditulis dengan PHP, bukan curl: curl menahan sambungan yang sudah di-upgrade
# sampai `--max-time` habis, jadi tiap pemeriksaan meninggalkan satu klien
# menggantung di server selama beberapa detik — tiap menit, selamanya. Klien
# di bawah ini membaca satu baris status lalu menutup dengan rapi.
baris=$(/usr/bin/php -r '
$soket = @stream_socket_client("tcp://" . $argv[1] . ":" . $argv[2], $e, $m, 3);
if (!$soket) { echo "tidak-bisa-menyambung"; exit; }
$kunci = base64_encode(random_bytes(16));
$permintaan = "GET / HTTP/1.1\r\n"
    . "Host: " . $argv[1] . "\r\n"
    . "Connection: Upgrade\r\n"
    . "Upgrade: websocket\r\n"
    . "Sec-WebSocket-Version: 13\r\n"
    . "Sec-WebSocket-Key: " . $kunci . "\r\n\r\n";
fwrite($soket, $permintaan);
stream_set_timeout($soket, 3);
echo trim((string) fgets($soket, 256));
fclose($soket);
' "$HOST" "$PORT" 2>/dev/null)

if [[ "$baris" == *101* ]]; then
  # Sehat. Hapus jejak kegagalan sebelumnya supaya ambangnya hanya berlaku
  # untuk kegagalan yang benar-benar berurutan.
  rm -f "$PENGHITUNG"
  exit 0
fi

gagal=$(( $(cat "$PENGHITUNG" 2>/dev/null || echo 0) + 1 ))
echo "$gagal" > "$PENGHITUNG"
catat "handshake ke $HOST:$PORT gagal ($gagal/$AMBANG), jawaban: '${baris:-tidak ada}'"

if (( gagal >= AMBANG )); then
  catat "memulai ulang $UNIT setelah $gagal kegagalan berurutan"
  systemctl restart "$UNIT"
  rm -f "$PENGHITUNG"
fi

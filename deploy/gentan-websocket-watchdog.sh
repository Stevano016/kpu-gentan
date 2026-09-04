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
#   chmod +x /storage/kpps/kpu-gentan/deploy/gentan-websocket-watchdog.sh
#   cp /storage/kpps/kpu-gentan/deploy/gentan-websocket-watchdog.{service,timer} \
#      /etc/systemd/system/
#   systemctl daemon-reload
#   systemctl enable --now gentan-websocket-watchdog.timer
#
# Melihat kerjanya:
#   journalctl -t gentan-websocket-watchdog --since today
#   systemctl list-timers gentan-websocket-watchdog.timer

# Sengaja tanpa `-e`: curl yang gagal adalah bagian normal dari alur di sini.
set -uo pipefail

UNIT=gentan-websocket.service
HOST=127.0.0.1
PORT=8090
PENGHITUNG=/run/gentan-websocket-watchdog.gagal
AMBANG=2
TAG=gentan-websocket-watchdog

catat() { logger -t "$TAG" -- "$*"; }

# Handshake sungguhan: Sec-WebSocket-Key acak, harapkan "101 Switching Protocols".
# `--max-time` wajib — setelah 101 sambungannya memang tidak ditutup server.
kunci=$(head -c 16 /dev/urandom | base64)
baris=$(curl -sS -i --http1.1 --max-time 5 \
  -H 'Connection: Upgrade' \
  -H 'Upgrade: websocket' \
  -H 'Sec-WebSocket-Version: 13' \
  -H "Sec-WebSocket-Key: $kunci" \
  "http://$HOST:$PORT/" 2>/dev/null | head -n 1 | tr -d '\r')

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

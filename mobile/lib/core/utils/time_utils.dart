/// Format waktu yang dipakai di log aktivitas dan kartu pemilih.
library;

/// `HH:mm:ss` untuk penanda baris log.
String formatLogTime(DateTime time) =>
    '${_pad(time.hour)}:${_pad(time.minute)}:${_pad(time.second)}';

/// `HH:mm` waktu lokal dari stempel ISO-8601; `null` bila tidak terbaca.
String? formatClock(String? isoTimestamp) {
  if (isoTimestamp == null) return null;
  final parsed = DateTime.tryParse(isoTimestamp);
  if (parsed == null) return null;
  final local = parsed.toLocal();
  return '${_pad(local.hour)}:${_pad(local.minute)}';
}

String _pad(int value) => value.toString().padLeft(2, '0');

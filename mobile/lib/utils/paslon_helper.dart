import 'package:flutter/material.dart';

/// Jumlah slot suara yang tersedia di backend (kandidat_1 .. kandidat_3).
const int maxPaslonSlots = 3;

/// Nama cadangan bila daftar paslon belum pernah tersinkron ke perangkat.
const Map<int, String> _fallbackPaslonNames = {
  1: 'Budi - Ami',
  2: 'Candra - Dodi',
  3: 'Eka - Fani',
};

const List<Color> _paslonColors = [
  Color(0xFF0D9488),
  Colors.blue,
  Colors.orange,
];

/// Cari data paslon berdasarkan nomor urut pada daftar hasil sinkronisasi.
Map<String, dynamic>? findPaslon(List<dynamic> paslons, int nomorUrut) {
  for (final p in paslons) {
    if (p is Map) {
      final raw = p['nomor_urut'];
      final n = raw is int ? raw : int.tryParse(raw?.toString() ?? '');
      if (n == nomorUrut) return Map<String, dynamic>.from(p);
    }
  }
  return null;
}

/// Label paslon: "Paslon 01 (Ketua - Wakil)" mengikuti data dinamis dari server.
String paslonLabel(List<dynamic> paslons, int nomorUrut) {
  final nomor = nomorUrut.toString().padLeft(2, '0');
  final match = findPaslon(paslons, nomorUrut);
  final names = match != null
      ? '${match['nama_ketua']} - ${match['nama_wakil']}'
      : _fallbackPaslonNames[nomorUrut];
  return names == null ? 'Paslon $nomor' : 'Paslon $nomor ($names)';
}

Color paslonColor(int nomorUrut) => _paslonColors[(nomorUrut - 1) % _paslonColors.length];

/// Slot suara yang layak ditampilkan: paslon yang terdaftar di server, ditambah
/// slot yang terlanjur punya suara (mis. paslon dihapus setelah suara diinput).
/// Bila daftar paslon belum tersedia, tampilkan seluruh slot default.
List<int> visiblePaslonSlots(List<dynamic> paslons, int Function(int) votesOf) {
  final slots = <int>[];
  for (var n = 1; n <= maxPaslonSlots; n++) {
    if (paslons.isEmpty || findPaslon(paslons, n) != null || votesOf(n) > 0) {
      slots.add(n);
    }
  }
  return slots;
}

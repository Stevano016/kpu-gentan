import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/json_utils.dart';

/// Calon di pemilihan ini maju sendiri, jadi hanya ada nama ketua.
class Paslon {
  const Paslon({required this.nomorUrut, required this.namaKetua});

  final int nomorUrut;
  final String namaKetua;

  factory Paslon.fromJson(Map<String, dynamic> json) => Paslon(
        nomorUrut: asInt(json['nomor_urut']),
        namaKetua: asString(json['nama_ketua']),
      );
}

/// Daftar paslon hasil sinkronisasi, lengkap dengan aturan tampilannya.
///
/// Menggantikan kumpulan fungsi lepas yang dulu menerima `List<dynamic>`
/// mentah di setiap pemanggilan.
class PaslonCatalog {
  const PaslonCatalog(this.items);
  const PaslonCatalog.empty() : items = const [];

  final List<Paslon> items;

  factory PaslonCatalog.fromJson(List<Map<String, dynamic>> json) =>
      PaslonCatalog(json.map(Paslon.fromJson).toList(growable: false));

  bool get isEmpty => items.isEmpty;
  int get length => items.length;

  /// Nama cadangan bila daftar paslon belum pernah tersinkron ke perangkat.
  static const Map<int, String> _fallbackNames = {
    1: 'Budi - Ami',
    2: 'Candra - Dodi',
    3: 'Eka - Fani',
  };

  Paslon? byNomor(int nomorUrut) {
    for (final paslon in items) {
      if (paslon.nomorUrut == nomorUrut) return paslon;
    }
    return null;
  }

  /// Label paslon: `Paslon 01 (Nama)` mengikuti data dinamis dari server.
  String labelOf(int nomorUrut) {
    final nomor = nomorUrut.toString().padLeft(2, '0');
    final nama = byNomor(nomorUrut)?.namaKetua ?? _fallbackNames[nomorUrut];
    return nama == null ? 'Paslon $nomor' : 'Paslon $nomor ($nama)';
  }

  static Color colorOf(int nomorUrut) =>
      AppColors.paslonPalette[(nomorUrut - 1) % AppColors.paslonPalette.length];

  /// Slot suara yang layak ditampilkan: paslon yang terdaftar di server,
  /// ditambah slot yang terlanjur punya suara (mis. paslon dihapus setelah
  /// suara diinput). Bila daftar paslon belum tersedia, tampilkan semua slot.
  List<int> visibleSlots(int Function(int nomorUrut) votesOf) => [
        for (var nomor = 1; nomor <= AppConstants.maxPaslonSlots; nomor++)
          if (isEmpty || byNomor(nomor) != null || votesOf(nomor) > 0) nomor,
      ];
}

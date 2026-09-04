import 'package:flutter/material.dart';

/// Palet warna aplikasi.
///
/// Nilainya mengikuti token yang dipakai panel web supaya tampilan lapangan
/// dan sekretariat terasa satu produk.
abstract final class AppColors {
  static const Color primary = Color(0xFF0D9488);
  static const Color secondary = Color(0xFF14B8A6);

  /// Nada gelap dari [primary], khusus AppBar.
  ///
  /// Teks putih di atas [primary] hanya berkontras 3.74:1 — cukup untuk
  /// label tombol yang besar dan tebal, tapi di bawah ambang 4.5:1 untuk
  /// teks kecil. Baris status Online/Offline di AppBar justru teks kecil,
  /// dan justru itu yang paling perlu terbaca sekilas di bawah matahari.
  /// Nada ini menaikkannya ke 5.07:1 tanpa mengubah warna mereknya.
  static const Color primaryDark = Color(0xFF0B7C72);

  static const Color surface = Colors.white;
  static const Color background = Color(0xFFF9FAFB);
  static const Color border = Color(0xFFE5E7EB);
  static const Color inputBorder = Color(0xFFD1D5DB);
  static const Color neutralBg = Color(0xFFF3F4F6);
  static const Color dark = Color(0xFF1F2937);

  static const Color textPrimary = Color(0xFF111827);
  static const Color textStrong = Color(0xFF1F2937);
  static const Color textBody = Color(0xFF374151);
  static const Color textMuted = Color(0xFF4B5563);
  static const Color textFaint = Color(0xFF6B7280);
  static const Color textDisabled = Color(0xFF9CA3AF);

  static const Color successBg = Color(0xFFECFDF5);
  static const Color successBorder = Color(0xFF6EE7B7);
  static const Color success = Color(0xFF059669);
  static const Color successText = Color(0xFF047857);
  static const Color successTextDeep = Color(0xFF065F46);

  static const Color dangerBg = Color(0xFFFEF2F2);
  static const Color dangerBorder = Color(0xFFFCA5A5);
  static const Color danger = Color(0xFFB91C1C);

  static const Color warningBg = Color(0xFFFEF3C7);
  static const Color warningBorder = Color(0xFFFCD34D);
  static const Color warning = Color(0xFFD97706);
  static const Color warningText = Color(0xFFB45309);

  static const Color infoBg = Color(0xFFEFF6FF);
  static const Color info = Colors.blue;

  /// Warna batang perolehan suara, diputar bila paslon lebih banyak dari daftar.
  static const List<Color> paslonPalette = [
    primary,
    Colors.blue,
    Colors.orange,
    Colors.purple,
    Colors.red,
    Colors.green,
    Colors.pink,
    Colors.teal,
    Colors.indigo,
    Colors.cyan,
  ];
}

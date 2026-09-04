import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/features/quick_count/batas_suara.dart';

/// Total perolehan suara tidak boleh melewati kehadiran saat itu.
///
/// Diuji sebagai angka, bukan lewat layar: ini aturan yang menentukan hasil
/// hitung cepat yang dikirim ke sekretariat, dan satu-satunya cara memastikan
/// ia benar adalah menghadapkannya pada kasus-kasus yang benar-benar terjadi
/// di TPS.
void main() {
  int total(Map<String, int> m) => m.values.fold(0, (a, b) => a + b);

  group('tahanDiBatas', () {
    test('di bawah batas: tidak ada yang diubah', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 100, 'k2': 80, 'invalid': 5},
        terakhir: {'k1': 99, 'k2': 80, 'invalid': 5},
        batas: 300,
      );

      expect(hasil, {'k1': 100, 'k2': 80, 'invalid': 5});
    });

    test('tepat di batas: masih diterima utuh', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 100, 'k2': 80, 'invalid': 5},
        terakhir: {'k1': 99, 'k2': 80, 'invalid': 5},
        batas: 185,
      );

      expect(total(hasil), 185);
      expect(hasil['k1'], 100);
    });

    test('kolom yang dinaikkan itulah yang dipotong, bukan paslon lain', () {
      // k2 dinaikkan 90 -> 96 sementara batasnya hanya menyisakan 3.
      final hasil = tahanDiBatas(
        nilai: {'k1': 100, 'k2': 96, 'invalid': 0},
        terakhir: {'k1': 100, 'k2': 90, 'invalid': 0},
        batas: 193,
      );

      expect(total(hasil), 193);
      expect(hasil['k1'], 100, reason: 'perolehan paslon lain tidak boleh ikut dikurangi');
      expect(hasil['k2'], 93);
    });

    test('tekan-tahan yang kebablasan berhenti tepat di batas', () {
      // Penekanan-tahan menambah 40 sekaligus sebelum listener menyusul.
      final hasil = tahanDiBatas(
        nilai: {'k1': 140, 'k2': 10, 'invalid': 0},
        terakhir: {'k1': 100, 'k2': 10, 'invalid': 0},
        batas: 120,
      );

      expect(total(hasil), 120);
      expect(hasil['k1'], 110);
      expect(hasil['k2'], 10);
    });

    test('batas nol: tidak ada suara yang bisa masuk', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 3, 'invalid': 1},
        terakhir: {'k1': 0, 'invalid': 0},
        batas: 0,
      );

      expect(total(hasil), 0);
    });

    test('dua kolom naik sekaligus: yang naik paling banyak dipotong dulu', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 60, 'k2': 30, 'invalid': 0},
        terakhir: {'k1': 50, 'k2': 28, 'invalid': 0},
        batas: 85,
      );

      expect(total(hasil), 85);
      expect(hasil['k1'], 55, reason: 'k1 naik 10, k2 hanya 2');
      expect(hasil['k2'], 30);
    });

    test('kelebihan lebih besar dari satu kolom: pemotongan berlanjut', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 10, 'k2': 200, 'invalid': 0},
        terakhir: {'k1': 0, 'k2': 0, 'invalid': 0},
        batas: 50,
      );

      expect(total(hasil), 50);
      expect(hasil.values.every((v) => v >= 0), isTrue);
    });

    test('tanpa kolom yang naik, kolom terbesar dipotong lebih dulu', () {
      // Terjadi ketika batasnya sendiri turun — mis. data check-in disegarkan
      // dan ternyata lebih kecil daripada yang tersimpan di perangkat.
      final hasil = tahanDiBatas(
        nilai: {'k1': 100, 'k2': 20, 'invalid': 5},
        terakhir: {'k1': 100, 'k2': 20, 'invalid': 5},
        batas: 110,
      );

      expect(total(hasil), 110);
      expect(hasil['k1'], 85, reason: 'yang terbesar yang menyerap pemotongan');
      expect(hasil['k2'], 20);
      expect(hasil['invalid'], 5);
    });

    test('suara tidak sah ikut dihitung terhadap batas', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 100, 'invalid': 20},
        terakhir: {'k1': 100, 'invalid': 0},
        batas: 105,
      );

      expect(total(hasil), 105);
      expect(hasil['invalid'], 5);
      expect(hasil['k1'], 100);
    });

    test('batas negatif diperlakukan sebagai nol', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 5},
        terakhir: {'k1': 0},
        batas: -3,
      );

      expect(total(hasil), 0);
    });

    test('hasil tidak pernah negatif walau kelebihannya besar', () {
      final hasil = tahanDiBatas(
        nilai: {'k1': 1, 'k2': 1, 'invalid': 1},
        terakhir: {'k1': 0, 'k2': 0, 'invalid': 0},
        batas: 0,
      );

      expect(hasil.values.every((v) => v >= 0), isTrue);
      expect(total(hasil), 0);
    });
  });
}

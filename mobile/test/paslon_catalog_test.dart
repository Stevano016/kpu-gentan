import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/constants.dart';
import 'package:mobile/data/models/paslon.dart';

void main() {
  group('PaslonCatalog', () {
    final catalog = PaslonCatalog.fromJson(const [
      {'nomor_urut': 1, 'nama_ketua': 'Budi'},
      {'nomor_urut': '2', 'nama_ketua': 'Candra'},
    ]);

    test('nomor urut berupa string tetap terbaca', () {
      expect(catalog.byNomor(2)?.namaKetua, 'Candra');
    });

    test('label memakai nama dari server', () {
      expect(catalog.labelOf(1), 'Paslon 01 (Budi)');
    });

    test('label memakai nama cadangan bila paslon belum tersinkron', () {
      expect(
        const PaslonCatalog.empty().labelOf(1),
        'Paslon 01 (Budi - Ami)',
      );
      expect(const PaslonCatalog.empty().labelOf(9), 'Paslon 09');
    });

    test('hanya paslon terdaftar yang tampil', () {
      expect(catalog.visibleSlots((_) => 0), [1, 2]);
    });

    test('slot dengan suara tetap tampil walau paslonnya dihapus', () {
      expect(catalog.visibleSlots((n) => n == 5 ? 3 : 0), [1, 2, 5]);
    });

    test('semua slot tampil bila daftar paslon masih kosong', () {
      expect(
        const PaslonCatalog.empty().visibleSlots((_) => 0).length,
        AppConstants.maxPaslonSlots,
      );
    });

    test('warna diputar setelah palet habis', () {
      expect(
        PaslonCatalog.colorOf(AppConstants.maxPaslonSlots + 1),
        PaslonCatalog.colorOf(1),
      );
    });
  });
}

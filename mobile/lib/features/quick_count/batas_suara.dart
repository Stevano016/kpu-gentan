/// Menahan total perolehan suara agar tidak melewati kehadiran saat itu.
///
/// Dipisahkan dari `HomeController` supaya aturannya bisa diuji langsung
/// dengan angka, tanpa membangun seluruh layar. Ini aturan yang menentukan
/// angka suara sungguhan; ia tidak boleh hanya "kelihatan benar".
///
/// [nilai] adalah isi kolom sekarang (kunci `k1`..`k10` dan `invalid`),
/// [terakhir] adalah isi yang terakhir diterima, dan [batas] adalah jumlah
/// kehadiran saat ini. Hasilnya peta baru yang totalnya dijamin `<= batas`.
///
/// Yang dipotong adalah kolom yang **baru saja dinaikkan**, bukan kolom
/// sembarang: menekan-tahan tombol tambah harus berhenti di batas tanpa
/// mengurangi perolehan paslon lain yang sudah benar. Kalau tidak ada kolom
/// yang naik — misalnya batasnya sendiri yang turun setelah data check-in
/// disegarkan — pemotongan dimulai dari kolom terbesar, supaya kolom kecil
/// tidak habis lebih dulu.
Map<String, int> tahanDiBatas({
  required Map<String, int> nilai,
  required Map<String, int> terakhir,
  required int batas,
}) {
  final hasil = Map<String, int>.from(nilai);
  final ambang = batas < 0 ? 0 : batas;

  var kelebihan = hasil.values.fold(0, (a, b) => a + b) - ambang;
  if (kelebihan <= 0) return hasil;

  final naik = hasil.keys.where((k) => hasil[k]! > (terakhir[k] ?? 0)).toList();

  // Yang naik dipotong lebih dulu, dari yang paling banyak naik; sisanya
  // (kalau masih kurang) dari kolom terbesar.
  final sasaran = <String>[
    ...naik
      ..sort((a, b) {
        final naikA = hasil[a]! - (terakhir[a] ?? 0);
        final naikB = hasil[b]! - (terakhir[b] ?? 0);
        return naikB.compareTo(naikA);
      }),
    ...(hasil.keys.where((k) => !naik.contains(k)).toList()
      ..sort((a, b) => hasil[b]!.compareTo(hasil[a]!))),
  ];

  for (final kunci in sasaran) {
    if (kelebihan <= 0) break;
    final tersedia = hasil[kunci]!;
    final potong = tersedia < kelebihan ? tersedia : kelebihan;
    hasil[kunci] = tersedia - potong;
    kelebihan -= potong;
  }

  return hasil;
}

/// Nilai tetap yang dipakai lintas fitur.
///
/// Dikumpulkan di satu tempat supaya angka ajaib tidak tersebar di widget.
abstract final class AppConstants {
  /// Jumlah slot suara yang disediakan backend (`kandidat_1` .. `kandidat_10`).
  static const int maxPaslonSlots = 10;

  /// Awalan ID pemilih yang diterbitkan untuk wilayah Gentan.
  static const String voterIdPrefix = 'USH-GTN-026';

  /// Panjang NIK resmi.
  static const int nikLength = 16;

  /// Awalan payload QR yang tercetak di kartu pemilih.
  static const String qrPayloadPrefix = 'KPPSGENTAN-';

  /// Kredit yang tampil di layar login dan di bawah navigasi utama.
  static const String credit = 'Support by KKN-7 USH 2026';

  /// Batas atas penghitung suara; menahan salah tekan tombol tahan.
  static const int maxVoteCount = 999999;

  /// Jeda sebelum perubahan +/- otomatis dikirim ke server sebagai draft.
  ///
  /// Tombol +/- bisa ditekan-tahan (satu tap tiap 90ms); tanpa jeda ini tiap
  /// ketukan jadi satu permintaan jaringan. Menunggu sebentar setelah petugas
  /// berhenti menekan membuat satu rentetan ketukan cukup dikirim sekali.
  static const Duration qcAutoSaveDebounce = Duration(milliseconds: 600);
}

/// Batas waktu jaringan.
///
/// Server utama diberi waktu lebih panjang karena melewati Cloudflare;
/// percobaan cadangan sengaja lebih pendek agar mode offline cepat menyala.
abstract final class ApiTimeouts {
  static const Duration request = Duration(seconds: 8);
  static const Duration fallback = Duration(seconds: 5);
  static const Duration auth = Duration(seconds: 5);
  static const Duration connectivityProbe = Duration(seconds: 2);
  static const Duration webSocketConnect = Duration(seconds: 5);
  static const Duration webSocketReconnect = Duration(seconds: 10);
}

/// Nama berkas cache offline di direktori dokumen aplikasi.
abstract final class CacheFiles {
  static const String dpt = 'dpt_cache.json';
  static const String paslon = 'paslon_cache.json';
  static const String checkinQueue = 'checkin_queue.json';
  static const String quickCount = 'quick_count.json';

  /// Seluruh cache yang harus ikut terhapus saat sesi dibersihkan.
  static const List<String> all = [dpt, paslon, checkinQueue, quickCount];
}

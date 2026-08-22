import '../../core/constants.dart';
import '../models/quick_count_entry.dart';
import '../models/result.dart';
import '../sources/api_client.dart';
import '../sources/json_file_store.dart';
import '../sources/session_store.dart';

/// Nasib satu pengiriman hasil hitung cepat.
enum QuickCountSyncStatus {
  /// Sudah diterima server.
  synced,

  /// Tersimpan di perangkat, menunggu jaringan.
  offline,

  /// Server menolak datanya.
  failed,
}

/// Penyimpanan dan pengiriman hasil hitung cepat TPS.
class QuickCountRepository {
  QuickCountRepository({
    ApiClient? api,
    JsonFileStore? files,
    SessionStore? session,
  })  : _api = api ?? ApiClient(),
        _files = files ?? JsonFileStore(),
        _session = session ?? SessionStore();

  final ApiClient _api;
  final JsonFileStore _files;
  final SessionStore _session;

  Future<QuickCountEntry?> readLocal() async {
    final json = await _files.readObject(CacheFiles.quickCount);
    return json == null ? null : QuickCountEntry.fromJson(json);
  }

  /// Menyimpan hasil ke perangkat lalu mencoba mengirimkannya.
  ///
  /// Penyimpanan lokal selalu didahulukan supaya angka yang sudah diketik
  /// petugas tidak hilang ketika jaringan TPS putus.
  Future<Result<QuickCountSyncStatus>> submit(QuickCountEntry entry) async {
    final payload = entry.toJson(
      deviceId: _session.current?.deviceId ?? 'FLUTTER-DEVICE-KPPS',
    );
    await _files.write(CacheFiles.quickCount, payload);

    try {
      final response = await _api.post(
        ApiEndpoints.syncQuickCount,
        body: payload,
      );

      if (response.isOk) {
        return const Result.success(
          QuickCountSyncStatus.synced,
          'Quick Count berhasil disinkronkan ke server.',
        );
      }
      return Result.failure(response.message ?? 'Gagal submit quick count.');
    } on ApiException {
      return const Result.success(
        QuickCountSyncStatus.offline,
        'Gagal menghubungi server. Data Quick Count telah disimpan secara '
        'offline di perangkat.',
      );
    }
  }
}

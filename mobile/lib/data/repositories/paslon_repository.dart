import '../../core/constants.dart';
import '../models/paslon.dart';
import '../models/result.dart';
import '../sources/api_client.dart';
import '../sources/json_file_store.dart';

/// Daftar paslon: diunduh dari server, dicache untuk dipakai saat offline.
class PaslonRepository {
  PaslonRepository({ApiClient? api, JsonFileStore? files})
      : _api = api ?? ApiClient(),
        _files = files ?? JsonFileStore();

  final ApiClient _api;
  final JsonFileStore _files;

  Future<PaslonCatalog> cached() async =>
      PaslonCatalog.fromJson(await _files.readObjects(CacheFiles.paslon));

  /// Mengunduh daftar paslon terbaru; mengembalikan jumlah paslon yang tersimpan.
  Future<Result<int>> download() async {
    try {
      final response = await _api.get(ApiEndpoints.paslon);
      if (!response.isOk) return const Result.failure('Gagal mengunduh Paslon');

      final paslons = response.dataList;
      await _files.write(CacheFiles.paslon, paslons);
      return Result.success(paslons.length);
    } on ApiException {
      return const Result.failure(
        'Gagal menghubungi server. Menggunakan cache lokal.',
      );
    }
  }
}

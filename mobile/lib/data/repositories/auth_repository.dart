import '../../core/constants.dart';
import '../../core/utils/json_utils.dart';
import '../models/result.dart';
import '../models/user_session.dart';
import '../sources/api_client.dart';
import '../sources/json_file_store.dart';
import '../sources/session_store.dart';

/// Masuk dan keluar akun KPPS.
class AuthRepository {
  AuthRepository({
    ApiClient? api,
    SessionStore? session,
    JsonFileStore? files,
  })  : _api = api ?? ApiClient(),
        _session = session ?? SessionStore(),
        _files = files ?? JsonFileStore();

  final ApiClient _api;
  final SessionStore _session;
  final JsonFileStore _files;

  static const String _nonKppsMessage =
      'Akun ini bukan akun KPPS. Akun Sekretariat hanya dapat masuk lewat panel web.';

  Future<Result<UserSession>> login(String username, String password) async {
    try {
      final response = await _api.post(
        ApiEndpoints.login,
        body: {'username': username, 'password': password},
        authenticated: false,
        timeout: ApiTimeouts.auth,
      );

      if (!response.isOk) {
        return Result.failure(response.message ?? 'Login gagal');
      }

      final user = response.objectAt('user');
      final session = UserSession(
        token: asString(response.body['token']),
        username: asString(user['username']),
        role: asString(user['role']),
        kppsRole: asStringOrNull(user['kpps_role']) ?? UserSession.kppsRoleFull,
        tpsId: asIntOrNull(user['tps_id']),
      );

      // Pemeriksaan peran dilakukan sekali di sini; sebelumnya jalur cadangan
      // melewatkannya sehingga akun sekretariat bisa lolos lewat percobaan
      // kedua.
      if (!session.isKpps) return const Result.failure(_nonKppsMessage);

      await _session.save(session);
      return Result.success(session, 'Login berhasil');
    } on ApiException catch (error) {
      return Result.failure(error.message);
    }
  }

  /// Membersihkan sesi sekaligus seluruh cache offline milik sesi tersebut.
  Future<void> logout() async {
    await _session.clear();
    await _files.deleteAll(CacheFiles.all);
  }
}

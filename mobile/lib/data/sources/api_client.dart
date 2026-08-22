import 'dart:convert';

import 'package:http/http.dart' as http;

import '../../core/constants.dart';
import '../../core/utils/json_utils.dart';
import 'session_store.dart';

/// Jalur endpoint backend.
abstract final class ApiEndpoints {
  static const String login = '/login';
  static const String dpt = '/kpps/dpt';
  static const String paslon = '/paslon';
  static const String syncCheckin = '/kpps/sync/checkin';
  static const String syncQuickCount = '/kpps/sync/quick-count';
}

/// Balasan server yang sudah diuraikan.
class ApiResponse {
  const ApiResponse(this.statusCode, this.body);

  final int statusCode;
  final Map<String, dynamic> body;

  bool get isOk => statusCode == 200;
  String? get message => asStringOrNull(body['message']);
  List<Map<String, dynamic>> get dataList => asObjectList(body['data']);
  Map<String, dynamic> objectAt(String key) {
    final value = body[key];
    return value is Map ? Map<String, dynamic>.from(value) : const {};
  }
}

/// Server tidak terjangkau, baik lewat alamat utama maupun cadangan.
class ApiException implements Exception {
  const ApiException(this.message);
  final String message;

  @override
  String toString() => 'ApiException: $message';
}

/// Satu-satunya tempat aplikasi berbicara HTTP dengan backend.
///
/// Percobaan ke alamat cadangan ditangani di sini; sebelumnya setiap metode
/// menyalin ulang seluruh isi permintaannya hanya untuk mengulang sekali.
class ApiClient {
  ApiClient({SessionStore? session, http.Client? httpClient})
      : _session = session ?? SessionStore(),
        _http = httpClient ?? http.Client();

  final SessionStore _session;
  final http.Client _http;

  /// Alamat produksi; ganti untuk uji lokal dengan
  /// `--dart-define=API_URL=http://<ip-pc-anda>:8000/api`.
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://kpps.ysmb.my.id/api',
  );

  static const String fallbackUrl = String.fromEnvironment(
    'API_FALLBACK_URL',
    defaultValue: 'https://kpps.ysmb.my.id/api',
  );

  /// Pembaruan langsung melewati Cloudflare dan proksi gateway — keduanya
  /// membuang header Connection/Upgrade yang dibutuhkan jabat tangan
  /// WebSocket — lalu menuju origin pada port yang diteruskan, tempat TLS
  /// diterminasi sertifikatnya sendiri. Ganti untuk uji lokal dengan
  /// `--dart-define=WS_URL=ws://<ip-pc-anda>:8080`.
  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'wss://ws.kpps.ysmb.my.id:10650/ws',
  );

  Map<String, String> _headers({required bool authenticated}) {
    final token = _session.token;
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (authenticated && token != null) 'Authorization': 'Bearer $token',
    };
  }

  Future<ApiResponse> get(
    String path, {
    bool authenticated = true,
    Duration timeout = ApiTimeouts.request,
  }) {
    return _withFallback(
      timeout,
      (base, limit) => _http
          .get(Uri.parse('$base$path'), headers: _headers(authenticated: authenticated))
          .timeout(limit),
    );
  }

  Future<ApiResponse> post(
    String path, {
    Object? body,
    bool authenticated = true,
    Duration timeout = ApiTimeouts.request,
  }) {
    final encoded = body == null ? null : jsonEncode(body);
    return _withFallback(
      timeout,
      (base, limit) => _http
          .post(
            Uri.parse('$base$path'),
            headers: _headers(authenticated: authenticated),
            body: encoded,
          )
          .timeout(limit),
    );
  }

  /// Coba alamat utama, lalu alamat cadangan bila jaringannya gagal.
  ///
  /// Balasan berstatus salah (mis. 401) tidak diulang: server terjangkau dan
  /// jawabannya memang perlu disampaikan apa adanya ke pemanggil.
  Future<ApiResponse> _withFallback(
    Duration primaryTimeout,
    Future<http.Response> Function(String baseUrl, Duration timeout) send,
  ) async {
    try {
      return _parse(await send(baseUrl, primaryTimeout));
    } catch (_) {
      try {
        return _parse(await send(fallbackUrl, ApiTimeouts.fallback));
      } catch (_) {
        throw const ApiException('Koneksi ke server gagal.');
      }
    }
  }

  ApiResponse _parse(http.Response response) {
    try {
      final decoded = jsonDecode(response.body);
      return ApiResponse(
        response.statusCode,
        decoded is Map ? Map<String, dynamic>.from(decoded) : const {},
      );
    } catch (_) {
      // Balasan non-JSON (mis. halaman error proksi) tetap membawa statusnya.
      return ApiResponse(response.statusCode, const {});
    }
  }
}

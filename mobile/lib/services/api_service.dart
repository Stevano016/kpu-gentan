import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'local_storage_service.dart';

class ApiService {
  // Defaults to production; override for local testing with
  // --dart-define=API_URL=http://<ip-pc-anda>:8000/api
  static const String baseUrl = String.fromEnvironment(
    'API_URL',
    defaultValue: 'https://gentan.wujud.id/api',
  );
  static const String fallbackUrl = String.fromEnvironment(
    'API_FALLBACK_URL',
    defaultValue: 'https://gentan.wujud.id/api',
  );

  // Live updates bypass Cloudflare and the gateway proxy entirely — both drop
  // the Connection/Upgrade headers a WebSocket handshake needs — and hit the
  // origin directly on a forwarded port. Override for local testing with
  // --dart-define=WS_URL=ws://<ip-pc-anda>:8080
  static const String wsUrl = String.fromEnvironment(
    'WS_URL',
    defaultValue: 'ws://202.10.45.61:10650/ws',
  );

  final LocalStorageService _storage = LocalStorageService();

  Future<String> _getApiUrl() async {
    return baseUrl;
  }

  Map<String, String> _getHeaders() {
    final token = _storage.getToken();
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  // Check if server is available
  Future<bool> isOnline() async {
    try {
      final clientUrl = await _getApiUrl();
      final uri = Uri.parse(clientUrl);
      final host = uri.host;
      final port = uri.port > 0 ? uri.port : 80;
      final socket = await Socket.connect(host, port, timeout: const Duration(seconds: 2));
      socket.destroy();
      return true;
    } catch (_) {
      // Fallback check on fallbackUrl host if baseUrl fails
      try {
        final uri = Uri.parse(fallbackUrl);
        final host = uri.host;
        final port = uri.port > 0 ? uri.port : 80;
        final socket = await Socket.connect(host, port, timeout: const Duration(seconds: 2));
        socket.destroy();
        return true;
      } catch (__) {
        return false;
      }
    }
  }

  Future<Map<String, dynamic>> login(String username, String password) async {
    final clientUrl = await _getApiUrl();
    try {
      final response = await http.post(
        Uri.parse('$clientUrl/login'),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: jsonEncode({
          'username': username,
          'password': password,
        }),
      ).timeout(const Duration(seconds: 5));

      final json = jsonDecode(response.body);
      if (response.statusCode == 200) {
        final user = json['user'];
        if (user['role'] != 'kpps') {
          return {
            'success': false,
            'message': 'Akun ini bukan akun KPPS. Akun Sekretariat hanya dapat masuk lewat panel web.'
          };
        }
        await _storage.saveSession(
          json['token'],
          user['username'],
          user['role'],
          user['kpps_role'],
          user['tps_id'],
        );
        return {'success': true, 'message': 'Login berhasil'};
      } else {
        return {'success': false, 'message': json['message'] ?? 'Login gagal'};
      }
    } catch (e) {
      // If emulator URL fails, try localhost fallback
      try {
        final response = await http.post(
          Uri.parse('$fallbackUrl/login'),
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: jsonEncode({
            'username': username,
            'password': password,
          }),
        ).timeout(const Duration(seconds: 5));
        
        final json = jsonDecode(response.body);
        if (response.statusCode == 200) {
          final user = json['user'];
          await _storage.saveSession(
            json['token'],
            user['username'],
            user['role'],
            user['kpps_role'],
            user['tps_id'],
          );
          return {'success': true, 'message': 'Login berhasil'};
        } else {
          return {'success': false, 'message': json['message'] ?? 'Login gagal'};
        }
      } catch (err) {
        return {'success': false, 'message': 'Koneksi ke server gagal.'};
      }
    }
  }

  // Fetch DPT list from server and cache it locally
  Future<Map<String, dynamic>> downloadAndCacheDpt() async {
    final clientUrl = await _getApiUrl();
    final tpsId = _storage.getTpsId();
    if (tpsId == null) {
      return {'success': false, 'message': 'Akun tidak terasosiasi dengan TPS'};
    }

    try {
      final response = await http.get(
        Uri.parse('$clientUrl/kpps/dpt'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final dptList = json['data'] as List<dynamic>;
        await _storage.cacheDptList(dptList);
        return {'success': true, 'count': dptList.length};
      } else {
        return {'success': false, 'message': 'Gagal mengunduh DPT'};
      }
    } catch (e) {
      // Try fallback URL
      try {
        final response = await http.get(
          Uri.parse('$fallbackUrl/kpps/dpt'),
          headers: _getHeaders(),
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          final json = jsonDecode(response.body);
          final dptList = json['data'] as List<dynamic>;
          await _storage.cacheDptList(dptList);
          return {'success': true, 'count': dptList.length};
        }
      } catch (_) {}
      return {'success': false, 'message': 'Gagal menghubungi server (Offline). Menggunakan cache lokal.'};
    }
  }

  // Fetch Paslon list from server and cache it locally
  Future<Map<String, dynamic>> downloadAndCachePaslons() async {
    final clientUrl = await _getApiUrl();
    try {
      final response = await http.get(
        Uri.parse('$clientUrl/paslon'),
        headers: _getHeaders(),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final paslonList = json['data'] as List<dynamic>;
        await _storage.cachePaslonList(paslonList);
        return {'success': true, 'count': paslonList.length};
      } else {
        return {'success': false, 'message': 'Gagal mengunduh Paslon'};
      }
    } catch (e) {
      try {
        final response = await http.get(
          Uri.parse('$fallbackUrl/paslon'),
          headers: _getHeaders(),
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          final json = jsonDecode(response.body);
          final paslonList = json['data'] as List<dynamic>;
          await _storage.cachePaslonList(paslonList);
          return {'success': true, 'count': paslonList.length};
        }
      } catch (_) {}
      return {'success': false, 'message': 'Gagal menghubungi server. Menggunakan cache lokal.'};
    }
  }

  // Sync pending checkins to Server
  Future<Map<String, dynamic>> syncCheckins() async {
    final clientUrl = await _getApiUrl();
    final queue = await _storage.getCheckinQueue();
    if (queue.isEmpty) {
      return {'success': true, 'message': 'Tidak ada data check-in yang perlu disinkronkan.'};
    }

    final payload = {
      'checkins': queue,
      'device_id': 'FLUTTER-DEVICE-KPPS-${_storage.getTpsId()}',
    };

    try {
      var response = await http.post(
        Uri.parse('$clientUrl/kpps/sync/checkin'),
        headers: _getHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        await _storage.clearCheckinQueue();
        return {'success': true, 'message': 'Sinkronisasi berhasil!'};
      }
    } catch (_) {
      try {
        var response = await http.post(
          Uri.parse('$fallbackUrl/kpps/sync/checkin'),
          headers: _getHeaders(),
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          await _storage.clearCheckinQueue();
          return {'success': true, 'message': 'Sinkronisasi berhasil!'};
        }
      } catch (_) {}
    }

    return {'success': false, 'message': 'Gagal sinkronisasi. Server tidak merespon.'};
  }

  // Submit Quick Count to Server
  Future<Map<String, dynamic>> submitQuickCount(
    int k1, int k2, int k3, int invalid, String status) async {
    final clientUrl = await _getApiUrl();
    final payload = {
      'kandidat_1': k1,
      'kandidat_2': k2,
      'kandidat_3': k3,
      'suara_tidak_sah': invalid,
      'status': status,
      'device_id': 'FLUTTER-DEVICE-KPPS-${_storage.getTpsId()}',
    };

    // Save locally first
    await _storage.saveLocalQuickCount(payload);

    try {
      var response = await http.post(
        Uri.parse('$clientUrl/kpps/sync/quick-count'),
        headers: _getHeaders(),
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        return {'success': true, 'status': 'synced', 'message': 'Quick Count berhasil disinkronkan ke server.'};
      } else {
        final json = jsonDecode(response.body);
        return {'success': false, 'status': 'failed', 'message': json['message'] ?? 'Gagal submit quick count.'};
      }
    } catch (_) {
      try {
        var response = await http.post(
          Uri.parse('$fallbackUrl/kpps/sync/quick-count'),
          headers: _getHeaders(),
          body: jsonEncode(payload),
        ).timeout(const Duration(seconds: 5));

        if (response.statusCode == 200) {
          return {'success': true, 'status': 'synced', 'message': 'Quick Count berhasil disinkronkan ke server.'};
        }
      } catch (_) {}
      return {
        'success': true,
        'status': 'offline',
        'message': 'Gagal menghubungi server. Data Quick Count telah disimpan secara offline di perangkat.'
      };
    }
  }
}

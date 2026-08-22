import 'dart:io';

import '../../core/constants.dart';
import '../sources/api_client.dart';

/// Menebak ketersediaan server dengan membuka soket ke host API.
///
/// Sengaja tidak memakai permintaan HTTP penuh: yang perlu diketahui hanya
/// apakah TPS masih punya jalur ke server, dan jawabannya harus cepat.
class ConnectivityService {
  const ConnectivityService();

  Future<bool> isOnline() async {
    for (final url in const [ApiClient.baseUrl, ApiClient.fallbackUrl]) {
      if (await _canReach(url)) return true;
    }
    return false;
  }

  Future<bool> _canReach(String url) async {
    try {
      final uri = Uri.parse(url);
      final socket = await Socket.connect(
        uri.host,
        uri.port > 0 ? uri.port : 80,
        timeout: ApiTimeouts.connectivityProbe,
      );
      socket.destroy();
      return true;
    } catch (_) {
      return false;
    }
  }
}

import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../../core/constants.dart';
import '../sources/api_client.dart';

/// Peristiwa yang dikirim server lewat WebSocket.
enum RealtimeEvent {
  paslonUpdated('paslon_updated'),
  checkin('checkin'),
  update('update'),
  quickCount('quick-count');

  const RealtimeEvent(this.code);

  final String code;

  static RealtimeEvent? fromCode(String? code) {
    for (final event in values) {
      if (event.code == code) return event;
    }
    return null;
  }

  /// Peristiwa yang cukup ditangani dengan menyegarkan DPT.
  bool get affectsVoters => this != RealtimeEvent.paslonUpdated;
}

/// Sambungan WebSocket ke server, lengkap dengan penyambungan ulang otomatis.
///
/// Layar tidak perlu tahu soal soket: cukup mendengarkan [events] dan menerima
/// [onLog] untuk ditampilkan di log aktivitas.
class RealtimeService {
  RealtimeService({this.onLog});

  /// Dipanggil untuk tiap perubahan status sambungan, agar bisa masuk ke log.
  final void Function(String message)? onLog;

  final StreamController<RealtimeEvent> _events =
      StreamController<RealtimeEvent>.broadcast();

  WebSocket? _socket;
  Timer? _reconnectTimer;
  bool _disposed = false;

  Stream<RealtimeEvent> get events => _events.stream;

  Future<void> connect() async {
    if (_disposed) return;

    await _closeSocket();
    _reconnectTimer?.cancel();

    final url = ApiClient.wsUrl;
    if (Uri.tryParse(url)?.host.isEmpty ?? true) {
      _log('Alamat WebSocket tidak valid, real-time dilewati.');
      return;
    }

    _log('Menghubungkan ke WebSocket: $url');
    try {
      _socket = await WebSocket.connect(url)
          .timeout(ApiTimeouts.webSocketConnect);
      _log('WebSocket terhubung!');
      _socket!.listen(
        _onMessage,
        onError: (Object error) {
          _log('WebSocket Error: $error');
          _scheduleReconnect();
        },
        onDone: () {
          _log('WebSocket Terputus.');
          _scheduleReconnect();
        },
        cancelOnError: true,
      );
    } catch (_) {
      _log('Gagal menghubungkan WebSocket. Mencoba kembali...');
      _scheduleReconnect();
    }
  }

  void _onMessage(dynamic message) {
    try {
      final payload = jsonDecode(message as String);
      if (payload is! Map) return;
      final event = RealtimeEvent.fromCode(payload['event']?.toString());
      if (event != null && !_events.isClosed) _events.add(event);
    } catch (_) {
      // Pesan yang tidak dikenali diabaikan; sambungan tetap dipertahankan.
    }
  }

  void _scheduleReconnect() {
    if (_disposed) return;
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(ApiTimeouts.webSocketReconnect, connect);
  }

  void _log(String message) => onLog?.call(message);

  Future<void> _closeSocket() async {
    final socket = _socket;
    _socket = null;
    await socket?.close();
  }

  Future<void> dispose() async {
    _disposed = true;
    _reconnectTimer?.cancel();
    await _closeSocket();
    await _events.close();
  }
}

import 'package:shared_preferences/shared_preferences.dart';

import '../models/user_session.dart';

/// Penyimpan sesi login di `SharedPreferences`.
///
/// Dibuat singleton karena dibaca dari mana saja tanpa perlu menunggu
/// `SharedPreferences` dibuka ulang setiap kali.
class SessionStore {
  SessionStore._internal();
  static final SessionStore _instance = SessionStore._internal();
  factory SessionStore() => _instance;

  static const String _keyToken = 'token';
  static const String _keyUsername = 'username';
  static const String _keyRole = 'role';
  static const String _keyKppsRole = 'kpps_role';
  static const String _keyTpsId = 'tps_id';

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  String? get token => _prefs?.getString(_keyToken);
  int? get tpsId => _prefs?.getInt(_keyTpsId);
  bool get hasSession => token != null;

  /// Sesi lengkap, atau `null` bila perangkat belum pernah login.
  UserSession? get current {
    final token = this.token;
    if (token == null) return null;
    return UserSession(
      token: token,
      username: _prefs?.getString(_keyUsername) ?? '',
      role: _prefs?.getString(_keyRole) ?? '',
      kppsRole: _prefs?.getString(_keyKppsRole) ?? UserSession.kppsRoleFull,
      tpsId: _prefs?.getInt(_keyTpsId),
    );
  }

  Future<void> save(UserSession session) async {
    final prefs = _prefs;
    if (prefs == null) return;
    await prefs.setString(_keyToken, session.token);
    await prefs.setString(_keyUsername, session.username);
    await prefs.setString(_keyRole, session.role);
    await prefs.setString(_keyKppsRole, session.kppsRole);
    if (session.tpsId != null) {
      await prefs.setInt(_keyTpsId, session.tpsId!);
    } else {
      await prefs.remove(_keyTpsId);
    }
  }

  Future<void> clear() async {
    final prefs = _prefs;
    if (prefs == null) return;
    for (final key in const [
      _keyToken,
      _keyUsername,
      _keyRole,
      _keyKppsRole,
      _keyTpsId,
    ]) {
      await prefs.remove(key);
    }
  }
}

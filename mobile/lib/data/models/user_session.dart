/// Sesi petugas yang sedang masuk di perangkat ini.
class UserSession {
  const UserSession({
    required this.token,
    required this.username,
    required this.role,
    required this.kppsRole,
    this.tpsId,
  });

  final String token;
  final String username;
  final String role;

  /// `full` untuk ketua KPPS, selain itu akses terbatas ke validasi dan sync.
  final String kppsRole;
  final int? tpsId;

  static const String roleKpps = 'kpps';
  static const String kppsRoleFull = 'full';

  bool get isKpps => role == roleKpps;
  bool get hasFullAccess => kppsRole == kppsRoleFull;

  /// `TPS 01`; menampilkan `Unknown` bila akun belum terhubung ke TPS mana pun.
  String get tpsName => 'TPS ${tpsId?.toString().padLeft(2, '0') ?? 'Unknown'}';

  String get deviceId => 'FLUTTER-DEVICE-KPPS-$tpsId';
}

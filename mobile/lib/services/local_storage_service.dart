import 'dart:convert';
import 'dart:io';
import 'package:path_provider/path_provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocalStorageService {
  static final LocalStorageService _instance = LocalStorageService._internal();
  factory LocalStorageService() => _instance;
  LocalStorageService._internal();

  SharedPreferences? _prefs;

  Future<void> init() async {
    _prefs = await SharedPreferences.getInstance();
  }

  // Session Management
  Future<void> saveSession(String token, String username, String role, String? kppsRole, int? tpsId) async {
    await _prefs?.setString('token', token);
    await _prefs?.setString('username', username);
    await _prefs?.setString('role', role);
    await _prefs?.setString('kpps_role', kppsRole ?? 'full');
    if (tpsId != null) {
      await _prefs?.setInt('tps_id', tpsId);
    } else {
      await _prefs?.remove('tps_id');
    }
  }

  String? getToken() => _prefs?.getString('token');
  String? getUsername() => _prefs?.getString('username');
  String? getRole() => _prefs?.getString('role');
  String? getKppsRole() => _prefs?.getString('kpps_role');
  int? getTpsId() => _prefs?.getInt('tps_id');

  Future<void> clearSession() async {
    await _prefs?.remove('token');
    await _prefs?.remove('username');
    await _prefs?.remove('role');
    await _prefs?.remove('kpps_role');
    await _prefs?.remove('tps_id');
    // Clear local file caches as well
    try {
      final fileDpt = await _getFile('dpt_cache.json');
      if (await fileDpt.exists()) await fileDpt.delete();
      final fileQueue = await _getFile('checkin_queue.json');
      if (await fileQueue.exists()) await fileQueue.delete();
      final fileQc = await _getFile('quick_count.json');
      if (await fileQc.exists()) await fileQc.delete();
      final filePaslon = await _getFile('paslon_cache.json');
      if (await filePaslon.exists()) await filePaslon.delete();
    } catch (_) {}
  }

  // Helper to get local storage files for offline-first caching
  Future<File> _getFile(String fileName) async {
    final directory = await getApplicationDocumentsDirectory();
    return File('${directory.path}/$fileName');
  }

  // Cache DPT list (Downloaded when logging in or when clicking sync)
  Future<void> cacheDptList(List<dynamic> dptList) async {
    final file = await _getFile('dpt_cache.json');
    await file.writeAsString(jsonEncode(dptList));
  }

  Future<List<dynamic>> getCachedDptList() async {
    try {
      final file = await _getFile('dpt_cache.json');
      if (!await file.exists()) return [];
      final contents = await file.readAsString();
      return jsonDecode(contents) as List<dynamic>;
    } catch (_) {
      return [];
    }
  }

  // Local Checkin Database (Queue of checkins pending to be synced to Server)
  Future<void> addToCheckinQueue(String nik, String waktuCheckin) async {
    final file = await _getFile('checkin_queue.json');
    List<dynamic> queue = [];
    if (await file.exists()) {
      final contents = await file.readAsString();
      queue = jsonDecode(contents) as List<dynamic>;
    }
    
    // Check if NIK already in queue to prevent duplicates
    final alreadyExists = queue.any((item) => item['nik'] == nik);
    if (!alreadyExists) {
      queue.add({
        'nik': nik,
        'waktu_checkin': waktuCheckin,
      });
      await file.writeAsString(jsonEncode(queue));
    }

    // Also update the cached DPT list immediately so the UI shows the voter as Checked In offline
    final cached = await getCachedDptList();
    for (var voter in cached) {
      if (voter['nik'] == nik) {
        voter['status_hadir'] = true;
        voter['waktu_checkin'] = waktuCheckin;
        break;
      }
    }
    await cacheDptList(cached);
  }

  Future<List<dynamic>> getCheckinQueue() async {
    try {
      final file = await _getFile('checkin_queue.json');
      if (!await file.exists()) return [];
      final contents = await file.readAsString();
      return jsonDecode(contents) as List<dynamic>;
    } catch (_) {
      return [];
    }
  }

  Future<void> clearCheckinQueue() async {
    try {
      final file = await _getFile('checkin_queue.json');
      if (await file.exists()) {
        await file.writeAsString(jsonEncode([]));
      }
    } catch (_) {}
  }

  // Cache/Store Quick Count locally
  Future<void> saveLocalQuickCount(Map<String, dynamic> qcData) async {
    final file = await _getFile('quick_count.json');
    await file.writeAsString(jsonEncode(qcData));
  }

  Future<Map<String, dynamic>?> getLocalQuickCount() async {
    try {
      final file = await _getFile('quick_count.json');
      if (!await file.exists()) return null;
      final contents = await file.readAsString();
      return jsonDecode(contents) as Map<String, dynamic>;
    } catch (_) {
      return null;
    }
  }

  // Cache Paslon list
  Future<void> cachePaslonList(List<dynamic> paslonList) async {
    final file = await _getFile('paslon_cache.json');
    await file.writeAsString(jsonEncode(paslonList));
  }

  Future<List<dynamic>> getCachedPaslonList() async {
    try {
      final file = await _getFile('paslon_cache.json');
      if (!await file.exists()) return [];
      final contents = await file.readAsString();
      return jsonDecode(contents) as List<dynamic>;
    } catch (_) {
      return [];
    }
  }
}

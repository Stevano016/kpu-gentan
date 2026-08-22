import 'dart:convert';
import 'dart:io';

import 'package:path_provider/path_provider.dart';

import '../../core/utils/json_utils.dart';

/// Cache offline berbasis berkas JSON di direktori dokumen aplikasi.
///
/// Semua kegagalan baca dianggap "cache kosong": aplikasi harus tetap jalan
/// di TPS meski berkasnya rusak atau belum pernah dibuat.
class JsonFileStore {
  JsonFileStore._internal();
  static final JsonFileStore _instance = JsonFileStore._internal();
  factory JsonFileStore() => _instance;

  Future<File> _file(String fileName) async {
    final directory = await getApplicationDocumentsDirectory();
    return File('${directory.path}/$fileName');
  }

  Future<void> write(String fileName, Object value) async {
    final file = await _file(fileName);
    await file.writeAsString(jsonEncode(value));
  }

  Future<List<Map<String, dynamic>>> readObjects(String fileName) async {
    try {
      final file = await _file(fileName);
      if (!await file.exists()) return const [];
      return asObjectList(jsonDecode(await file.readAsString()));
    } catch (_) {
      return const [];
    }
  }

  Future<Map<String, dynamic>?> readObject(String fileName) async {
    try {
      final file = await _file(fileName);
      if (!await file.exists()) return null;
      final decoded = jsonDecode(await file.readAsString());
      return decoded is Map ? Map<String, dynamic>.from(decoded) : null;
    } catch (_) {
      return null;
    }
  }

  Future<void> delete(String fileName) async {
    try {
      final file = await _file(fileName);
      if (await file.exists()) await file.delete();
    } catch (_) {
      // Berkas cache yang gagal dihapus tidak menghalangi logout.
    }
  }

  Future<void> deleteAll(Iterable<String> fileNames) async {
    for (final name in fileNames) {
      await delete(name);
    }
  }
}

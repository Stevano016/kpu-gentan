import '../../core/constants.dart';
import '../models/pending_checkin.dart';
import '../models/result.dart';
import '../models/voter.dart';
import '../sources/api_client.dart';
import '../sources/json_file_store.dart';
import '../sources/session_store.dart';

/// Daftar pemilih dan antrean kehadiran.
///
/// Semuanya bekerja secara offline-first: perubahan ditulis ke cache lokal
/// lebih dulu, lalu didorong ke server saat perangkat kembali online.
class VoterRepository {
  VoterRepository({
    ApiClient? api,
    JsonFileStore? files,
    SessionStore? session,
  })  : _api = api ?? ApiClient(),
        _files = files ?? JsonFileStore(),
        _session = session ?? SessionStore();

  final ApiClient _api;
  final JsonFileStore _files;
  final SessionStore _session;

  Future<List<Voter>> cached() async {
    final rows = await _files.readObjects(CacheFiles.dpt);
    return rows.map(Voter.fromJson).toList(growable: false);
  }

  /// Mengunduh DPT milik TPS pada sesi ini; mengembalikan jumlah pemilih.
  Future<Result<int>> downloadDpt() async {
    if (_session.tpsId == null) {
      return const Result.failure('Akun tidak terasosiasi dengan TPS');
    }

    try {
      final response = await _api.get(ApiEndpoints.dpt);
      if (!response.isOk) return const Result.failure('Gagal mengunduh DPT');

      final rows = response.dataList;
      await _files.write(CacheFiles.dpt, rows);
      return Result.success(rows.length);
    } on ApiException {
      return const Result.failure(
        'Gagal menghubungi server (Offline). Menggunakan cache lokal.',
      );
    }
  }

  /// Mencari pemilih di cache berdasarkan NIK atau ID pemilih.
  Future<Voter?> findInCache(String query, {required bool byNik}) async {
    for (final voter in await cached()) {
      if (voter.matches(query, byNik: byNik)) return voter;
    }
    return null;
  }

  Future<List<PendingCheckin>> pendingCheckins() async {
    final rows = await _files.readObjects(CacheFiles.checkinQueue);
    return rows.map(PendingCheckin.fromJson).toList(growable: false);
  }

  /// Mencatat kehadiran secara lokal.
  ///
  /// Cache DPT ikut diperbarui agar daftar langsung menampilkan pemilih sebagai
  /// hadir meski perangkat sedang offline.
  Future<void> queueCheckin(String nik, String waktuCheckin) async {
    final queue = await pendingCheckins();
    if (!queue.any((item) => item.nik == nik)) {
      final updated = [
        ...queue,
        PendingCheckin(nik: nik, waktuCheckin: waktuCheckin),
      ];
      await _files.write(
        CacheFiles.checkinQueue,
        updated.map((item) => item.toJson()).toList(growable: false),
      );
    }

    final voters = await cached();
    final refreshed = voters
        .map((voter) =>
            voter.nik == nik ? voter.markHadir(waktuCheckin) : voter)
        .map((voter) => voter.toJson())
        .toList(growable: false);
    await _files.write(CacheFiles.dpt, refreshed);
  }

  /// Mendorong antrean kehadiran ke server dan mengosongkannya bila berhasil.
  Future<Result<void>> syncPendingCheckins() async {
    final queue = await pendingCheckins();
    if (queue.isEmpty) {
      return const Result.success(
        null,
        'Tidak ada data check-in yang perlu disinkronkan.',
      );
    }

    try {
      final response = await _api.post(
        ApiEndpoints.syncCheckin,
        body: {
          'checkins': queue.map((item) => item.toJson()).toList(),
          'device_id': _session.current?.deviceId,
        },
      );

      if (response.isOk) {
        await _files.write(CacheFiles.checkinQueue, const []);
        return const Result.success(null, 'Sinkronisasi berhasil!');
      }
    } on ApiException {
      // Ditangani sebagai kegagalan umum di bawah.
    }

    return const Result.failure('Gagal sinkronisasi. Server tidak merespon.');
  }
}

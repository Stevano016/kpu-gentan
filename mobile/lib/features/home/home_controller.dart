import 'dart:async';

import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/utils/time_utils.dart';
import '../../data/models/attendance_stats.dart';
import '../../data/models/paslon.dart';
import '../../data/models/quick_count_entry.dart';
import '../../data/models/user_session.dart';
import '../../data/models/voter.dart';
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/paslon_repository.dart';
import '../../data/repositories/quick_count_repository.dart';
import '../../data/repositories/voter_repository.dart';
import '../../data/services/connectivity_service.dart';
import '../../data/services/realtime_service.dart';
import '../../data/sources/session_store.dart';

/// Pesan sesaat untuk ditampilkan layar sebagai SnackBar.
class UiFeedback {
  const UiFeedback(this.message, {this.isError = false});

  final String message;
  final bool isError;
}

/// Pekerjaan jaringan yang sedang berjalan, dipakai untuk memilih tombol mana
/// yang menampilkan lingkaran pemuatan.
enum SyncAction { draft, finalize, sync }

/// Nasib penyimpanan otomatis hasil hitung cepat, untuk indikator kecil di
/// layar quick count.
enum QcSaveState {
  /// Belum ada perubahan sejak terakhir tersinkron.
  idle,

  /// Perubahan sedang menunggu jeda atau sedang dikirim ke server.
  saving,

  /// Perubahan terakhir sudah diterima server.
  saved,

  /// Tersimpan di perangkat, tetapi belum sampai ke server (offline/ditolak).
  offline,
}

/// Seluruh state dan aksi layar utama.
///
/// Dipisahkan dari widget supaya alur data (cache, sinkronisasi, real-time)
/// bisa dibaca dan diuji tanpa menyentuh pohon widget.
class HomeController extends ChangeNotifier {
  HomeController({
    AuthRepository? auth,
    VoterRepository? voters,
    PaslonRepository? paslons,
    QuickCountRepository? quickCount,
    ConnectivityService connectivity = const ConnectivityService(),
    SessionStore? session,
  })  : _auth = auth ?? AuthRepository(),
        _voters = voters ?? VoterRepository(),
        _paslonRepo = paslons ?? PaslonRepository(),
        _quickCount = quickCount ?? QuickCountRepository(),
        _connectivity = connectivity,
        _sessionStore = session ?? SessionStore();

  final AuthRepository _auth;
  final VoterRepository _voters;
  final PaslonRepository _paslonRepo;
  final QuickCountRepository _quickCount;
  final ConnectivityService _connectivity;
  final SessionStore _sessionStore;

  late final RealtimeService _realtime = RealtimeService(onLog: _addLog);

  // ---------------------------------------------------------------- state --

  UserSession? _session;
  bool _isOnline = false;
  int _pendingCheckins = 0;
  AttendanceStats _stats = const AttendanceStats.empty();
  PaslonCatalog _paslons = const PaslonCatalog.empty();

  Voter? _foundVoter;
  String? _validationMessage;
  bool _validationSuccess = false;

  /// `null` selama hasil hitung cepat belum pernah diisi di perangkat ini.
  QuickCountStatus? _qcStatus;
  SyncAction? _syncAction;

  /// Status penyimpanan otomatis dan penunda pengirimannya.
  QcSaveState _qcSaveState = QcSaveState.idle;
  Timer? _qcAutoSaveTimer;

  /// Ditinggikan selama controller diisi dari kode (muat lokal, perapian angka)
  /// supaya perubahan itu tidak disalahartikan sebagai ketikan petugas dan
  /// memicu penyimpanan otomatis.
  bool _suppressQcAutosave = false;

  final List<String> _syncLogs = [];
  bool _disposed = false;

  /// Kolom pencarian NIK / ID pemilih.
  final TextEditingController searchController = TextEditingController();

  /// Perolehan suara per slot; controller sekaligus menjadi sumber nilainya
  /// supaya penghitung bertombol dan penyimpanan draft membaca angka yang sama.
  final Map<int, TextEditingController> kandidatControllers = {
    for (var i = 1; i <= AppConstants.maxPaslonSlots; i++)
      i: TextEditingController(),
  };
  final TextEditingController invalidController = TextEditingController();

  /// Notifier gabungan seluruh kolom quick count, supaya dashboard ikut
  /// bergerak saat angka diubah di tab sebelah.
  late final Listenable quickCountInputs = Listenable.merge([
    ...kandidatControllers.values,
    invalidController,
  ]);

  // -------------------------------------------------------------- getters --

  String get tpsName => _session?.tpsName ?? 'TPS Unknown';
  bool get hasFullAccess => _session?.hasFullAccess ?? false;
  bool get isOnline => _isOnline;
  int get pendingCheckins => _pendingCheckins;
  AttendanceStats get stats => _stats;
  PaslonCatalog get paslons => _paslons;

  Voter? get foundVoter => _foundVoter;
  String? get validationMessage => _validationMessage;
  bool get validationSuccess => _validationSuccess;

  QuickCountStatus? get qcStatus => _qcStatus;
  bool get isQcLocked => _qcStatus?.isLocked ?? false;

  /// Label panjang untuk kartu input, mis. `FINAL (Terkunci)`.
  String get qcStatusLabel => _qcStatus?.label ?? 'Belum diisi';

  /// Label pendek untuk lencana dashboard, mis. `FINAL`.
  String get qcStatusBadge =>
      _qcStatus?.code.toUpperCase() ?? 'Belum diisi';
  SyncAction? get syncAction => _syncAction;

  /// Status penyimpanan otomatis untuk indikator kecil di layar quick count.
  QcSaveState get qcSaveState => _qcSaveState;

  /// Angka yang sedang tampil di kolom input, tanpa mengubah isinya.
  QuickCountEntry get liveEntry => QuickCountEntry(
        votes: {
          for (final slot in kandidatControllers.entries)
            slot.key: int.tryParse(slot.value.text) ?? 0,
        },
        invalid: int.tryParse(invalidController.text) ?? 0,
        status: _qcStatus ?? QuickCountStatus.draft,
      );

  bool get isSyncing => _syncAction != null;
  List<String> get syncLogs => List.unmodifiable(_syncLogs);

  // ----------------------------------------------------------- daur hidup --

  /// Memuat data lokal lebih dulu agar layar langsung terisi, baru menyusul
  /// pemeriksaan jaringan dan sambungan real-time.
  Future<void> init() async {
    _session = _sessionStore.current;
    _notify();

    await _loadPendingCount();
    await _loadLocalQuickCount();
    await _refreshStats();
    _paslons = await _paslonRepo.cached();
    _notify();

    // Dipasang setelah data lokal termuat supaya pengisian awal controller tidak
    // langsung memicu penyimpanan otomatis.
    quickCountInputs.addListener(_onQcInputChanged);

    _addLog(
      'Aplikasi dimulai. Sesi: $tpsName, '
      'Akses: ${_session?.kppsRole ?? UserSession.kppsRoleFull}',
    );

    _startBackgroundTasks();
  }

  /// Pekerjaan jaringan yang berjalan di latar setelah layar terisi data lokal.
  void _startBackgroundTasks() {
    _realtime.events.listen(_onRealtimeEvent);
    _realtime.connect();
    checkNetwork();
    _refreshPaslonsFromServer();
  }

  @override
  void dispose() {
    _disposed = true;
    _qcAutoSaveTimer?.cancel();
    quickCountInputs.removeListener(_onQcInputChanged);
    _realtime.dispose();
    searchController.dispose();
    for (final controller in kandidatControllers.values) {
      controller.dispose();
    }
    invalidController.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------- pemuat data --

  Future<void> checkNetwork() async {
    _isOnline = await _connectivity.isOnline();
    _notify();
  }

  Future<void> _refreshStats() async {
    _stats = AttendanceStats.from(await _voters.cached());
    _notify();
  }

  Future<void> _loadPendingCount() async {
    _pendingCheckins = (await _voters.pendingCheckins()).length;
    _notify();
  }

  Future<void> _loadLocalQuickCount() async {
    final entry = await _quickCount.readLocal();
    if (entry == null) return;
    _suppressQcAutosave = true;
    for (final slot in kandidatControllers.entries) {
      slot.value.text = entry.votesOf(slot.key).toString();
    }
    invalidController.text = entry.invalid.toString();
    _suppressQcAutosave = false;
    _qcStatus = entry.status;
    _notify();
  }

  /// Menyegarkan daftar paslon dari server supaya label dashboard dan quick
  /// count tidak tertinggal ketika sekretariat mengubah datanya.
  Future<void> _refreshPaslonsFromServer() async {
    final result = await _paslonRepo.download();
    if (result.isFailure) return;
    _paslons = await _paslonRepo.cached();
    _addLog('Daftar Paslon diperbarui (${result.data} paslon).');
    _notify();
  }

  Future<void> _onRealtimeEvent(RealtimeEvent event) async {
    if (event == RealtimeEvent.paslonUpdated) {
      _addLog('Perubahan Paslon terdeteksi. Memperbarui data paslon...');
      await _refreshPaslonsFromServer();
      return;
    }
    _addLog(
      'Real-time update terdeteksi (${event.code}). Memperbarui data...',
    );
    await _voters.downloadDpt();
    await _refreshStats();
  }

  // ------------------------------------------------------------- validasi --

  /// NIK berupa deretan angka saja; ID pemilih selalu memakai awalan huruf.
  static final RegExp _digitsOnly = RegExp(r'^\d+$');

  /// Mencari pemilih di cache; bila tidak ketemu dan perangkat online, DPT
  /// diunduh ulang lebih dulu karena datanya mungkin baru ditambahkan.
  Future<void> searchVoter(String query) async {
    final searchValue = query.trim().toUpperCase();
    final isNik = searchValue.length == AppConstants.nikLength &&
        _digitsOnly.hasMatch(searchValue);

    if (!isNik && !searchValue.startsWith(AppConstants.voterIdPrefix)) {
      _setValidationError(
        'Format ID Pemilih / NIK salah (ID diawali '
        '${AppConstants.voterIdPrefix}, NIK ${AppConstants.nikLength} digit)',
      );
      return;
    }

    var voter = await _voters.findInCache(searchValue, byNik: isNik);

    if (voter == null) {
      await checkNetwork();
      if (_isOnline) {
        _addLog(
          'Pemilih tidak ditemukan lokal. Mencoba memperbarui DPT dari server...',
        );
        final result = await _voters.downloadDpt();
        if (result.isSuccess) {
          await _refreshStats();
          voter = await _voters.findInCache(searchValue, byNik: isNik);
        }
      }
    }

    if (voter == null) {
      _setValidationError(
        isNik
            ? 'NIK Pemilih tidak ditemukan di DPT TPS ini!'
            : 'ID Pemilih tidak ditemukan di DPT TPS ini!',
      );
      return;
    }

    _foundVoter = voter;
    _validationMessage = null;
    _notify();
  }

  /// Membersihkan hasil pencarian beserta pesannya.
  void clearSearch() {
    searchController.clear();
    _foundVoter = null;
    _validationMessage = null;
    _validationSuccess = false;
    _notify();
  }

  /// Membuang awalan payload QR sebelum dicari sebagai ID pemilih.
  Future<void> searchScannedCode(String rawCode) async {
    final code = rawCode.replaceAll(AppConstants.qrPayloadPrefix, '').trim();
    if (code.isEmpty) return;
    searchController.text = code;
    await searchVoter(code);
  }

  /// Mencatat kehadiran pemilih yang sedang ditampilkan.
  Future<void> checkinFoundVoter() async {
    final voter = _foundVoter;
    if (voter == null) return;

    final timestamp = DateTime.now().toIso8601String();
    await _voters.queueCheckin(voter.nik, timestamp);
    await _loadPendingCount();
    await _refreshStats();

    _foundVoter = voter.markHadir(timestamp);
    _validationSuccess = true;
    _validationMessage = 'Pemilih ${voter.nama} berhasil check-in!';
    _notify();

    _addLog('Check-in offline berhasil untuk NIK: ${voter.nik}');

    // Dorong ke server di latar belakang bila jaringan tersedia.
    await checkNetwork();
    if (_isOnline) await runSync();
  }

  void _setValidationError(String message) {
    _foundVoter = null;
    _validationMessage = message;
    _validationSuccess = false;
    _notify();
  }

  // ---------------------------------------------------------- quick count --

  /// Membaca angka dari controller sekaligus merapikan tampilannya.
  QuickCountEntry _readQuickCountEntry(QuickCountStatus status) {
    final votes = <int, int>{};
    _suppressQcAutosave = true;
    for (final slot in kandidatControllers.entries) {
      final value = int.tryParse(slot.value.text) ?? 0;
      votes[slot.key] = value;
      slot.value.text = value.toString();
    }
    final invalid = int.tryParse(invalidController.text) ?? 0;
    invalidController.text = invalid.toString();
    _suppressQcAutosave = false;

    return QuickCountEntry(votes: votes, invalid: invalid, status: status);
  }

  /// Menunda pengiriman draft tiap kali angka berubah karena ketikan/tombol.
  ///
  /// Perubahan yang berasal dari kode (muat lokal, perapian) diabaikan lewat
  /// [_suppressQcAutosave], dan hasil yang sudah final tidak lagi ikut disimpan.
  void _onQcInputChanged() {
    if (_suppressQcAutosave || isQcLocked) return;
    _qcSaveState = QcSaveState.saving;
    _notify();
    _qcAutoSaveTimer?.cancel();
    _qcAutoSaveTimer = Timer(AppConstants.qcAutoSaveDebounce, _autoSaveDraft);
  }

  /// Mengirim angka terkini ke server sebagai draft, tanpa mengganggu petugas
  /// dengan popup. Kegagalan cukup ditandai lewat indikator kecil.
  Future<void> _autoSaveDraft() async {
    if (isQcLocked) return;

    // Saat tidak terkunci, liveEntry selalu berstatus draft.
    final result = await _quickCount.submit(liveEntry);
    if (_disposed) return;

    _qcStatus = QuickCountStatus.draft;
    _qcSaveState =
        (result.isSuccess && result.data == QuickCountSyncStatus.synced)
            ? QcSaveState.saved
            : QcSaveState.offline;
    _notify();
  }

  /// Menyimpan hasil hitung cepat sebagai draft atau final.
  ///
  /// Total suara diperiksa lebih dulu terhadap jumlah pemilih dan kehadiran
  /// agar kesalahan ketik tidak terlanjur dikirim ke sekretariat.
  Future<UiFeedback> submitQuickCount(QuickCountStatus status) async {
    // Batalkan draft yang masih menunggu jeda agar tidak menimpa hasil final
    // yang sedang dikunci.
    _qcAutoSaveTimer?.cancel();

    final entry = _readQuickCountEntry(status);
    final slots = _paslons.visibleSlots(entry.votesOf);
    final totalInput = entry.totalOn(slots);

    if (totalInput > _stats.eligibleVoters) {
      return UiFeedback(
        'Error: Total suara ($totalInput) tidak boleh melebihi Total Pemilih '
        '(${_stats.eligibleVoters}).',
        isError: true,
      );
    }
    if (totalInput > _stats.eligibleHadir) {
      return UiFeedback(
        'Error: Total suara ($totalInput) tidak boleh melebihi '
        'Kehadiran/Check-In (${_stats.eligibleHadir}).',
        isError: true,
      );
    }

    _syncAction =
        status.isLocked ? SyncAction.finalize : SyncAction.draft;
    _notify();

    final result = await _quickCount.submit(entry);

    _syncAction = null;
    _qcStatus = status;
    _qcSaveState =
        (result.isSuccess && result.data == QuickCountSyncStatus.synced)
            ? QcSaveState.saved
            : QcSaveState.offline;
    _notify();

    if (result.isSuccess) {
      _addLog('Quick Count disimpan. Status sync: ${result.data?.name}');
      return UiFeedback(result.message ?? 'Quick Count tersimpan.');
    }

    _addLog('Gagal submit QC ke server. Tersimpan offline.');
    return UiFeedback('Simpan lokal: ${result.message}', isError: true);
  }

  // --------------------------------------------------------- sinkronisasi --

  /// Mendorong seluruh data tertunda ke server lalu menarik data terbaru.
  Future<UiFeedback?> runSync() async {
    _syncAction = SyncAction.sync;
    _notify();
    _addLog('Memulai sinkronisasi data...');

    await checkNetwork();
    if (!_isOnline) {
      _syncAction = null;
      _notify();
      _addLog('Gagal sync: Device offline.');
      return const UiFeedback(
        'Tidak dapat menyinkronkan: Perangkat Offline.',
        isError: true,
      );
    }

    final checkinResult = await _voters.syncPendingCheckins();
    _addLog(
      checkinResult.isSuccess
          ? 'Sinkronisasi data kehadiran berhasil.'
          : 'Sync Kehadiran: ${checkinResult.message}',
    );

    final dptResult = await _voters.downloadDpt();
    if (dptResult.isSuccess) {
      _addLog(
        'DPT lokal berhasil diperbarui. Total: ${dptResult.data} pemilih.',
      );
    }

    await _refreshPaslonsFromServer();
    await _resubmitLocalQuickCount();

    await _loadPendingCount();
    await _loadLocalQuickCount();
    await _refreshStats();

    _syncAction = null;
    _notify();
    _addLog('Sinkronisasi selesai.');
    return null;
  }

  /// Mengirim ulang hasil hitung cepat yang tersimpan lokal, bila ada.
  Future<void> _resubmitLocalQuickCount() async {
    final local = await _quickCount.readLocal();
    if (local == null) return;

    final result = await _quickCount.submit(local);
    if (result.isSuccess && result.data == QuickCountSyncStatus.synced) {
      _addLog('Sinkronisasi Quick Count berhasil.');
    }
  }

  // -------------------------------------------------------------- log/sesi --

  void _addLog(String message) {
    if (_disposed) return;
    _syncLogs.insert(0, '[${formatLogTime(DateTime.now())}] $message');
    _notify();
  }

  Future<void> logout() => _auth.logout();

  void _notify() {
    if (_disposed) return;
    notifyListeners();
  }
}

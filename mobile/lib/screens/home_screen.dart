import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/local_storage_service.dart';
import 'login_screen.dart';
import 'scanner_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final ApiService _api = ApiService();
  final LocalStorageService _storage = LocalStorageService();

  // Local State
  int _pendingCheckinsCount = 0;
  bool _isOnline = false;
  String _tpsName = '';
  String? _kppsRole;
  
  // Tab 1: Validation State
  final _nikSearchController = TextEditingController();
  Map<String, dynamic>? _foundVoter;
  String? _validationMessage;
  bool _validationSuccess = false;

  // Tab 2: Quick Count State
  final _k1Controller = TextEditingController();
  final _k2Controller = TextEditingController();
  final _k3Controller = TextEditingController();
  final _invalidController = TextEditingController();
  bool _isQcLocked = false;
  String _qcStatusText = 'Belum diisi';

  // Tab 3: Logs and Telemetry
  final List<String> _syncLogs = [];
  bool _syncingInProgress = false;
  String? _syncAction;

  // Dashboard stats
  int _totalDptCount = 0;
  int _hadirDptCount = 0;
  double _hadirPercentage = 0.0;

  @override
  void initState() {
    super.initState();
    _initializeData();
    _checkNetworkStatus();
  }

  Future<void> _initializeData() async {
    final tpsId = _storage.getTpsId();
    final kppsRole = _storage.getKppsRole();
    setState(() {
      _tpsName = 'TPS ${tpsId?.toString().padLeft(2, '0') ?? 'Unknown'}';
      _kppsRole = kppsRole;
    });

    await _loadPendingCount();
    await _loadLocalQuickCount();
    await _loadDptStats();
    _addSyncLog('Aplikasi dimulai. Sesi: $_tpsName, Akses: ${_kppsRole ?? "full"}');
  }

  Future<void> _loadDptStats() async {
    final dptList = await _storage.getCachedDptList();
    final total = dptList.length;
    final hadir = dptList.where((e) => e['status_hadir'] == true || e['status_hadir'] == 1 || e['status_hadir'] == '1').length;
    final percentage = total > 0 ? (hadir / total) * 100 : 0.0;

    setState(() {
      _totalDptCount = total;
      _hadirDptCount = hadir;
      _hadirPercentage = percentage;
    });
  }

  Future<void> _checkNetworkStatus() async {
    final online = await _api.isOnline();
    setState(() {
      _isOnline = online;
    });
  }

  Future<void> _loadPendingCount() async {
    final queue = await _storage.getCheckinQueue();
    setState(() {
      _pendingCheckinsCount = queue.length;
    });
  }

  Future<void> _loadLocalQuickCount() async {
    final qc = await _storage.getLocalQuickCount();
    if (qc != null) {
      setState(() {
        _k1Controller.text = qc['kandidat_1']?.toString() ?? '0';
        _k2Controller.text = qc['kandidat_2']?.toString() ?? '0';
        _k3Controller.text = qc['kandidat_3']?.toString() ?? '0';
        _invalidController.text = qc['suara_tidak_sah']?.toString() ?? '0';
        _isQcLocked = qc['status'] == 'final';
        _qcStatusText = qc['status'] == 'final' ? 'FINAL (Terkunci)' : 'DRAFT (Belum Submit)';
      });
    }
  }

  void _addSyncLog(String log) {
    final time = DateTime.now().toString().substring(11, 19);
    setState(() {
      _syncLogs.insert(0, '[$time] $log');
    });
  }

  // Action: Search Voter by NIK
  Future<void> _searchVoter(String nik) async {
    if (nik.length != 16) {
      setState(() {
        _validationMessage = 'NIK harus 16 digit';
        _validationSuccess = false;
        _foundVoter = null;
      });
      return;
    }

    List<dynamic> dptList = await _storage.getCachedDptList();
    var voter = dptList.firstWhere(
      (element) => element['nik'] == nik,
      orElse: () => null,
    );

    if (voter == null) {
      // If not found locally, check if online and refresh cache in real-time!
      await _checkNetworkStatus();
      if (_isOnline) {
        _addSyncLog('NIK tidak ditemukan lokal. Mencoba memperbarui DPT dari server...');
        final res = await _api.downloadAndCacheDpt();
        if (res['success'] == true) {
          await _loadDptStats();
          dptList = await _storage.getCachedDptList();
          voter = dptList.firstWhere(
            (element) => element['nik'] == nik,
            orElse: () => null,
          );
        }
      }
    }

    setState(() {
      if (voter != null) {
        _foundVoter = Map<String, dynamic>.from(voter);
        _validationMessage = null;
      } else {
        _foundVoter = null;
        _validationMessage = 'NIK tidak ditemukan di DPT TPS ini!';
        _validationSuccess = false;
      }
    });
  }

  // Action: Process Validation Check-In
  Future<void> _validateCheckin() async {
    if (_foundVoter == null) return;

    final nik = _foundVoter!['nik'];
    final timeStr = DateTime.now().toIso8601String();

    await _storage.addToCheckinQueue(nik, timeStr);
    await _loadPendingCount();
    await _loadDptStats();

    setState(() {
      _foundVoter!['status_hadir'] = true;
      _foundVoter!['waktu_checkin'] = timeStr;
      _validationSuccess = true;
      _validationMessage = 'Pemilih ${_foundVoter!['nama']} berhasil check-in!';
    });

    _addSyncLog('Check-in offline berhasil untuk NIK: $nik');
    
    // Auto-trigger sync in background if online
    _checkNetworkStatus().then((_) {
      if (_isOnline) {
        _triggerSync();
      }
    });
  }

  // Action: Save/Submit Quick Count
  Future<void> _submitQuickCount(String status) async {
    final k1 = int.tryParse(_k1Controller.text) ?? 0;
    final k2 = int.tryParse(_k2Controller.text) ?? 0;
    final k3 = int.tryParse(_k3Controller.text) ?? 0;
    final invalid = int.tryParse(_invalidController.text) ?? 0;

    // Sanitize input values in textfields
    _k1Controller.text = k1.toString();
    _k2Controller.text = k2.toString();
    _k3Controller.text = k3.toString();
    _invalidController.text = invalid.toString();

    // Dismiss keyboard
    FocusScope.of(context).unfocus();

    setState(() {
      _syncingInProgress = true;
      _syncAction = status;
    });

    final res = await _api.submitQuickCount(k1, k2, k3, invalid, status);
    
    setState(() {
      _syncingInProgress = false;
      _syncAction = null;
      _isQcLocked = status == 'final';
      _qcStatusText = status == 'final' ? 'FINAL (Terkunci)' : 'DRAFT (Belum Submit)';
    });

    if (res['success'] == true) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['message'])),
      );
      _addSyncLog('Quick Count disimpan. Status sync: ${res['status']}');
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Simpan lokal: ${res['message']}')),
      );
      _addSyncLog('Gagal submit QC ke server. Tersimpan offline.');
    }
  }

  // Action: Main Sync trigger (voters + quick count)
  Future<void> _triggerSync() async {
    setState(() {
      _syncingInProgress = true;
      _syncAction = 'sync';
    });
    _addSyncLog('Memulai sinkronisasi data...');

    await _checkNetworkStatus();
    if (!_isOnline) {
      setState(() {
        _syncingInProgress = false;
        _syncAction = null;
      });
      _addSyncLog('Gagal sync: Device offline.');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tidak dapat menyinkronkan: Perangkat Offline.')),
      );
      return;
    }

    // 1. Sync check-in database queue
    final checkinRes = await _api.syncCheckins();
    if (checkinRes['success'] == true) {
      _addSyncLog('Sinkronisasi data kehadiran berhasil.');
    } else {
      _addSyncLog('Sync Kehadiran: ${checkinRes['message']}');
    }

    // 2. Fetch fresh DPT update from server
    final refreshRes = await _api.downloadAndCacheDpt();
    if (refreshRes['success'] == true) {
      _addSyncLog('DPT lokal berhasil diperbarui. Total: ${refreshRes['count']} pemilih.');
    }

    // 3. Sync Quick Count if draft or pending sync
    final localQc = await _storage.getLocalQuickCount();
    if (localQc != null) {
      final res = await _api.submitQuickCount(
        localQc['kandidat_1'] ?? 0,
        localQc['kandidat_2'] ?? 0,
        localQc['kandidat_3'] ?? 0,
        localQc['suara_tidak_sah'] ?? 0,
        localQc['status'] ?? 'draft',
      );
      if (res['success'] == true && res['status'] == 'synced') {
        _addSyncLog('Sinkronisasi Quick Count berhasil.');
      }
    }

    await _loadPendingCount();
    await _loadLocalQuickCount();
    await _loadDptStats();

    setState(() {
      _syncingInProgress = false;
      _syncAction = null;
    });
    _addSyncLog('Sinkronisasi selesai.');
  }

  // Open physical camera scanner screen
  Future<void> _openRealCameraScanner() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    if (code != null && code.isNotEmpty) {
      String cleanNik = code.replaceAll('KPPSGENTAN-', '');
      _nikSearchController.text = cleanNik;
      _searchVoter(cleanNik);
    }
  }



  Future<void> _handleLogout() async {
    if (!confirmLogout()) return;
    await _storage.clearSession();
    if (mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  Widget _buildDashboardTab() {
    final tealColor = const Color(0xFF0D9488);
    
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Welcome Card
          Card(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            color: const Color(0xFFF0FDF4),
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  Icon(Icons.how_to_reg, size: 48, color: tealColor),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Halo KPPS $_tpsName',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF166534)),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Berikut adalah ringkasan kehadiran pemilih di TPS Anda secara real-time.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF15803D)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Grid Rows for Total and Checked-In DPT
          Row(
            children: [
              Expanded(
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.people, color: tealColor),
                        ),
                        const SizedBox(height: 12),
                        const Text('DPT Terdaftar', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          '$_totalDptCount',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                        ),
                        const Text('Pemilih', style: TextStyle(color: Colors.grey, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.check_circle, color: Colors.blue),
                        ),
                        const SizedBox(height: 12),
                        const Text('DPT Hadir (Absen)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          '$_hadirDptCount',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                        ),
                        const Text('Sudah Check-in', style: TextStyle(color: Colors.grey, fontSize: 10)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Progress Circle Card
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Text(
                    'Persentase Partisipasi Pemilih',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF374151)),
                  ),
                  const SizedBox(height: 24),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 130,
                        height: 130,
                        child: CircularProgressIndicator(
                          value: _totalDptCount > 0 ? (_hadirDptCount / _totalDptCount) : 0,
                          strokeWidth: 12,
                          backgroundColor: Colors.grey[200],
                          valueColor: AlwaysStoppedAnimation<Color>(tealColor),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${_hadirPercentage.toStringAsFixed(1)}%',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                          ),
                          const SizedBox(height: 2),
                          const Text('Kehadiran', style: TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '$_hadirDptCount dari $_totalDptCount DPT telah menggunakan hak pilih.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Quick Count Results Card
          Builder(
            builder: (context) {
              final qc1 = int.tryParse(_k1Controller.text) ?? 0;
              final qc2 = int.tryParse(_k2Controller.text) ?? 0;
              final qc3 = int.tryParse(_k3Controller.text) ?? 0;
              final qcInvalid = int.tryParse(_invalidController.text) ?? 0;
              final qcTotal = qc1 + qc2 + qc3 + qcInvalid;

              return Card(
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: const BorderSide(color: Color(0xFFE5E7EB)),
                ),
                color: Colors.white,
                child: Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Hasil Perolehan Suara TPS',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF374151)),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: _isQcLocked ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              _qcStatusText.replaceAll(' (Terkunci)', '').replaceAll(' (Belum Submit)', ''),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: _isQcLocked ? const Color(0xFF059669) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      _buildQuickCountRow('Paslon 01 (Budi - Ami)', qc1, qcTotal, const Color(0xFF0D9488)),
                      const SizedBox(height: 12),
                      _buildQuickCountRow('Paslon 02 (Candra - Dodi)', qc2, qcTotal, Colors.blue),
                      const SizedBox(height: 12),
                      _buildQuickCountRow('Paslon 03 (Eka - Fani)', qc3, qcTotal, Colors.orange),
                      const SizedBox(height: 12),
                      _buildQuickCountRow('Suara Tidak Sah', qcInvalid, qcTotal, Colors.grey),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Suara Masuk',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF374151)),
                          ),
                          Text(
                            '$qcTotal suara',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF111827)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }
          ),
        ],
      ),
    );
  }

  Widget _buildValidasiTab() {
    final tealColor = const Color(0xFF0D9488);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Scan Trigger Options
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: _openRealCameraScanner,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Scan QR Pemilih', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: tealColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Center(child: Text('atau cari manual', style: TextStyle(color: Colors.grey, fontSize: 12))),
          const SizedBox(height: 16),

          // Manual NIK input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _nikSearchController,
                  keyboardType: TextInputType.number,
                  maxLength: 16,
                  decoration: InputDecoration(
                    hintText: 'Masukkan 16-Digit NIK',
                    border: const OutlineInputBorder(),
                    counterText: '',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _nikSearchController.clear();
                        setState(() {
                          _foundVoter = null;
                          _validationMessage = null;
                        });
                      },
                    ),
                  ),
                  onChanged: (val) {
                    if (val.length == 16) {
                      _searchVoter(val);
                    }
                  },
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => _searchVoter(_nikSearchController.text),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  backgroundColor: const Color(0xFF1F2937),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Icon(Icons.search),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Validation Results UI
          if (_validationMessage != null && !_validationSuccess) ...[
            Card(
              color: const Color(0xFFFEF2F2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: Color(0xFFFCA5A5)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        _validationMessage!,
                        style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          if (_validationSuccess && _validationMessage != null) ...[
            Card(
              color: const Color(0xFFECFDF5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: Color(0xFF6EE7B7)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle_outline, color: Color(0xFF059669)),
                        SizedBox(width: 12),
                        Text('VALIDASI BERHASIL', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(_validationMessage!, style: const TextStyle(color: Color(0xFF047857), fontSize: 14)),
                    const SizedBox(height: 8),
                    const Text('Data tersimpan secara lokal dan siap disinkronkan.', style: TextStyle(color: Color(0xFF065F46), fontSize: 12)),
                  ],
                ),
              ),
            ),
          ],

          if (_foundVoter != null) ...[
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Detail Data Pemilih', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF374151))),
                    const Divider(height: 24),
                    _buildDetailRow('Nama Lengkap', _foundVoter!['nama']),
                    _buildDetailRow('NIK Pemilih', _foundVoter!['nik']),
                    _buildDetailRow('Alokasi TPS', _tpsName),
                    const SizedBox(height: 24),

                    if (_foundVoter!['status_hadir'] == true) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'PERINGATAN: Pemilih sudah check-in kehadiran pada pukul ${_foundVoter!['waktu_checkin'] != null ? DateTime.parse(_foundVoter!['waktu_checkin']).toLocal().toString().substring(11, 16) : '-'}!',
                                style: const TextStyle(color: Color(0xFFB45309), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      ElevatedButton(
                        onPressed: _validateCheckin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: tealColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Konfirmasi Kehadiran Pemilih', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ]
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildQuickCountTab() {
    final tealColor = const Color(0xFF0D9488);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Input Perolehan Suara',
                        style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF374151)),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isQcLocked ? const Color(0xFFF3F4F6) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _qcStatusText.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: _isQcLocked ? Colors.grey[700] : const Color(0xFFD97706),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  
                  _buildCountInputField('Paslon 01 (Budi - Ami)', _k1Controller, _isQcLocked),
                  const SizedBox(height: 12),
                  _buildCountInputField('Paslon 02 (Candra - Dodi)', _k2Controller, _isQcLocked),
                  const SizedBox(height: 12),
                  _buildCountInputField('Paslon 03 (Eka - Fani)', _k3Controller, _isQcLocked),
                  const SizedBox(height: 12),
                  _buildCountInputField('Suara Tidak Sah', _invalidController, _isQcLocked),
                  
                  const SizedBox(height: 24),

                  if (!_isQcLocked) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: _syncingInProgress ? null : () => _submitQuickCount('draft'),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: _syncAction == 'draft'
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Color(0xFF0D9488)),
                                    ),
                                  )
                                : const Text('Simpan Draft'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _syncingInProgress ? null : () {
                              showDialog(
                                context: context,
                                builder: (context) => AlertDialog(
                                  title: const Text('Kunci Hasil Suara?'),
                                  content: const Text(
                                    'Hasil quick count yang disubmit final akan dikunci dan dikirim ke sekretariat. Anda tidak dapat mengeditnya kembali tanpa reset.',
                                  ),
                                  actions: [
                                    TextButton(
                                      onPressed: () => Navigator.pop(context),
                                      child: const Text('Batal'),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        Navigator.pop(context);
                                        _submitQuickCount('final');
                                      },
                                      child: const Text('Submit Final'),
                                    ),
                                  ],
                                ),
                              );
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: tealColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: _syncAction == 'final'
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Text('Submit Final', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusSyncTab() {
    final tealColor = const Color(0xFF0D9488);
    return Padding(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Connectivity & Pending widget
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Konektivitas Device', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _isOnline ? const Color(0xFFECFDF5) : const Color(0xFFFEF2F2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _isOnline ? 'ONLINE' : 'OFFLINE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: _isOnline ? const Color(0xFF059669) : const Color(0xFFB91C1C),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Menunggu Sinkronisasi', style: TextStyle(fontSize: 14)),
                      Text(
                        '$_pendingCheckinsCount Pemilih',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: _pendingCheckinsCount > 0 ? Colors.orange : Colors.grey,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton.icon(
                    onPressed: _syncingInProgress ? null : _triggerSync,
                    icon: _syncingInProgress 
                        ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation(Colors.white)))
                        : const Icon(Icons.sync),
                    label: const Text('Sinkronisasi Data Sekarang', style: TextStyle(fontWeight: FontWeight.bold)),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: tealColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      minimumSize: const Size.fromHeight(48),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Sync Log Title
          const Text(
            'Log Aktivitas Perangkat',
            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: Color(0xFF374151)),
          ),
          const SizedBox(height: 8),

          // Sync log view
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF9FAFB),
                border: Border.all(color: const Color(0xFFE5E7EB)),
                borderRadius: BorderRadius.circular(8),
              ),
              padding: const EdgeInsets.all(12),
              child: ListView.builder(
                itemCount: _syncLogs.length,
                itemBuilder: (context, index) {
                  return Padding(
                    padding: const EdgeInsets.symmetric(vertical: 4.0),
                    child: Text(
                      _syncLogs[index],
                      style: const TextStyle(
                        fontFamily: 'monospace',
                        fontSize: 12,
                        color: Color(0xFF4B5563),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  bool confirmLogout() {
    // Standard confirm, let's just make a simple dialog or return true for quick action
    return true;
  }

  @override
  Widget build(BuildContext context) {
    final tealColor = const Color(0xFF0D9488);

    final List<Widget> tabs = [];
    final List<BottomNavigationBarItem> navItems = [];

    // Assemble tabs dynamically based on kpps role
    if (_kppsRole == 'full') {
      tabs.add(_buildDashboardTab());
      navItems.add(const BottomNavigationBarItem(
        icon: Icon(Icons.dashboard),
        label: 'Dashboard',
      ));
    }

    tabs.add(_buildValidasiTab());
    navItems.add(const BottomNavigationBarItem(
      icon: Icon(Icons.qr_code_scanner),
      label: 'Validasi',
    ));

    if (_kppsRole == 'full') {
      tabs.add(_buildQuickCountTab());
      navItems.add(const BottomNavigationBarItem(
        icon: Icon(Icons.ballot),
        label: 'Quick Count',
      ));
    }

    tabs.add(_buildStatusSyncTab());
    navItems.add(const BottomNavigationBarItem(
      icon: Icon(Icons.sync_alt),
      label: 'Status Sync',
    ));

    // Clamp _selectedIndex safety check
    int currentIndex = _selectedIndex;
    if (currentIndex >= tabs.length) {
      currentIndex = 0;
    }

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('KPPS GENTAN — $_tpsName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.white)),
            Text(
              _isOnline ? 'Online (Terhubung)' : 'Offline (Mode Lokal)',
              style: const TextStyle(fontSize: 12, color: Colors.white70),
            ),
          ],
        ),
        backgroundColor: tealColor,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: Icon(_isOnline ? Icons.wifi : Icons.wifi_off, color: Colors.white),
            onPressed: () {
              _checkNetworkStatus();
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(content: Text(_isOnline ? 'Perangkat Online' : 'Perangkat Offline')),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.white),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: IndexedStack(
        index: currentIndex,
        children: tabs,
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: currentIndex,
        onTap: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        selectedItemColor: tealColor,
        unselectedItemColor: Colors.grey,
        type: BottomNavigationBarType.fixed,
        items: navItems,
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1F2937))),
          ),
        ],
      ),
    );
  }

  Widget _buildCountInputField(String label, TextEditingController controller, bool locked) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w500),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 12),
        SizedBox(
          width: 100,
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            enabled: !locked,
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(vertical: 8),
              border: OutlineInputBorder(),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickCountRow(String label, int votes, int total, Color color) {
    final double percentage = total > 0 ? (votes / total) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563))),
            Text(
              '$votes suara (${(percentage * 100).toStringAsFixed(1)}%)',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1F2937)),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 8,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

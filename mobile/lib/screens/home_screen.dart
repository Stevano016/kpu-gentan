import 'dart:io';
import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../services/local_storage_service.dart';
import 'login_screen.dart';
import 'scanner_screen.dart';
import 'tabs/dashboard_tab.dart';
import 'tabs/validasi_tab.dart';
import 'tabs/quick_count_tab.dart';
import 'tabs/status_sync_tab.dart';

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
  int _totalDpkCount = 0;
  int _hadirDpkCount = 0;
  int _totalDpsCount = 0;
  int _hadirDpsCount = 0;
  int _totalDptbCount = 0;
  int _hadirDptbCount = 0;
  double _hadirPercentage = 0.0;
  List<dynamic> _paslons = [];

  WebSocket? _webSocket;
  Timer? _reconnectTimer;

  void _connectWebSocket() async {
    if (_webSocket != null) {
      _webSocket!.close();
      _webSocket = null;
    }
    _reconnectTimer?.cancel();

    final wsUrl = ApiService.wsUrl;
    if (Uri.tryParse(wsUrl)?.host.isEmpty ?? true) {
      _addSyncLog('Alamat WebSocket tidak valid, real-time dilewati.');
      return;
    }
    _addSyncLog('Menghubungkan ke WebSocket: $wsUrl');

    try {
      _webSocket = await WebSocket.connect(wsUrl).timeout(const Duration(seconds: 5));
      _addSyncLog('WebSocket terhubung!');

      _webSocket!.listen(
        (message) async {
          try {
            final payload = jsonDecode(message);
            if (payload['event'] == 'paslon_updated') {
              _addSyncLog('Perubahan Paslon terdeteksi. Memperbarui data paslon...');
              await _refreshPaslonsFromServer();
            } else if (payload['event'] == 'checkin' || payload['event'] == 'update' || payload['event'] == 'quick-count') {
              _addSyncLog('Real-time update terdeteksi (${payload['event']}). Memperbarui data...');
              await _api.downloadAndCacheDpt();
              await _loadDptStats();
            }
          } catch (e) {
            // Abaikan kesalahan parse
          }
        },
        onError: (err) {
          _addSyncLog('WebSocket Error: $err');
          _scheduleReconnect();
        },
        onDone: () {
          _addSyncLog('WebSocket Terputus.');
          _scheduleReconnect();
        },
        cancelOnError: true,
      );
    } catch (e) {
      _addSyncLog('Gagal menghubungkan WebSocket. Mencoba kembali...');
      _scheduleReconnect();
    }
  }

  void _scheduleReconnect() {
    _reconnectTimer?.cancel();
    _reconnectTimer = Timer(const Duration(seconds: 10), () {
      if (mounted) {
        _connectWebSocket();
      }
    });
  }

  @override
  void initState() {
    super.initState();
    _initializeData();
    _checkNetworkStatus();
    _connectWebSocket();
  }

  @override
  void dispose() {
    _webSocket?.close();
    _reconnectTimer?.cancel();
    _nikSearchController.dispose();
    _k1Controller.dispose();
    _k2Controller.dispose();
    _k3Controller.dispose();
    _invalidController.dispose();
    super.dispose();
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
    await _loadPaslonList();
    _addSyncLog('Aplikasi dimulai. Sesi: $_tpsName, Akses: ${_kppsRole ?? "full"}');
    await _refreshPaslonsFromServer();
  }

  Future<void> _loadPaslonList() async {
    final paslons = await _storage.getCachedPaslonList();
    if (!mounted) return;
    setState(() {
      _paslons = paslons;
    });
  }

  // Ambil daftar paslon terbaru dari server agar label dashboard & quick count
  // tidak tertinggal ketika sekretariat mengubah data paslon.
  Future<void> _refreshPaslonsFromServer() async {
    final res = await _api.downloadAndCachePaslons();
    if (res['success'] == true) {
      await _loadPaslonList();
      _addSyncLog('Daftar Paslon diperbarui (${res['count']} paslon).');
    }
  }

  Future<void> _loadDptStats() async {
    final dptList = await _storage.getCachedDptList();
    
    final totalDpt = dptList.where((e) => e['jenis_pemilih'] == 'dpt' || e['jenis_pemilih'] == null).length;
    final totalDpk = dptList.where((e) => e['jenis_pemilih'] == 'dpk').length;
    final totalDps = dptList.where((e) => e['jenis_pemilih'] == 'dps').length;
    final totalDptb = dptList.where((e) => e['jenis_pemilih'] == 'dptb').length;
    final totalAll = totalDpt + totalDpk + totalDps + totalDptb;

    final hadirDpt = dptList.where((e) => (e['jenis_pemilih'] == 'dpt' || e['jenis_pemilih'] == null) && (e['status_hadir'] == true || e['status_hadir'] == 1 || e['status_hadir'] == '1')).length;
    final hadirDpk = dptList.where((e) => e['jenis_pemilih'] == 'dpk' && (e['status_hadir'] == true || e['status_hadir'] == 1 || e['status_hadir'] == '1')).length;
    final hadirDps = dptList.where((e) => e['jenis_pemilih'] == 'dps' && (e['status_hadir'] == true || e['status_hadir'] == 1 || e['status_hadir'] == '1')).length;
    final hadirDptb = dptList.where((e) => e['jenis_pemilih'] == 'dptb' && (e['status_hadir'] == true || e['status_hadir'] == 1 || e['status_hadir'] == '1')).length;
    final hadirAll = hadirDpt + hadirDpk + hadirDps + hadirDptb;

    final percentage = totalAll > 0 ? (hadirAll / totalAll) * 100 : 0.0;

    setState(() {
      _totalDptCount = totalDpt;
      _totalDpkCount = totalDpk;
      _totalDpsCount = totalDps;
      _totalDptbCount = totalDptb;
      _hadirDptCount = hadirDpt;
      _hadirDpkCount = hadirDpk;
      _hadirDpsCount = hadirDps;
      _hadirDptbCount = hadirDptb;
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
    if (!mounted) return;
    final time = DateTime.now().toString().substring(11, 19);
    setState(() {
      _syncLogs.insert(0, '[$time] $log');
    });
  }

  // Action: Search Voter by NIK or ID Pemilih
  Future<void> _searchVoter(String query) async {
    final searchVal = query.trim().toUpperCase();
    
    bool isNik = false;
    if (searchVal.length == 16 && RegExp(r'^\d+$').hasMatch(searchVal)) {
      isNik = true;
    } else if (!searchVal.startsWith('USH-GTN-026')) {
      setState(() {
        _validationMessage = 'Format ID Pemilih / NIK salah (ID diawali USH-GTN-026, NIK 16 digit)';
        _validationSuccess = false;
        _foundVoter = null;
      });
      return;
    }

    List<dynamic> dptList = await _storage.getCachedDptList();
    var voter = dptList.firstWhere(
      (element) {
        if (isNik) {
          return element['nik'] != null && element['nik'].toString() == searchVal;
        } else {
          return element['id_pemilih'] != null && element['id_pemilih'].toString().toUpperCase() == searchVal;
        }
      },
      orElse: () => null,
    );

    if (voter == null) {
      // If not found locally, check if online and refresh cache in real-time!
      await _checkNetworkStatus();
      if (_isOnline) {
        _addSyncLog('Pemilih tidak ditemukan lokal. Mencoba memperbarui DPT dari server...');
        final res = await _api.downloadAndCacheDpt();
        if (res['success'] == true) {
          await _loadDptStats();
          dptList = await _storage.getCachedDptList();
          voter = dptList.firstWhere(
            (element) {
              if (isNik) {
                return element['nik'] != null && element['nik'].toString() == searchVal;
              } else {
                return element['id_pemilih'] != null && element['id_pemilih'].toString().toUpperCase() == searchVal;
              }
            },
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
        _validationMessage = isNik 
            ? 'NIK Pemilih tidak ditemukan di DPT TPS ini!'
            : 'ID Pemilih tidak ditemukan di DPT TPS ini!';
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

    // Validation: total votes cannot exceed total registered voters and actual attendance
    final totalPemilih = _totalDptCount + _totalDpkCount + _totalDpsCount + _totalDptbCount;
    final totalKehadiran = _hadirDptCount + _hadirDpkCount + _hadirDpsCount + _hadirDptbCount;
    final totalSuaraInput = k1 + k2 + k3 + invalid;

    if (totalSuaraInput > totalPemilih) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: Total suara ($totalSuaraInput) tidak boleh melebihi Total Pemilih ($totalPemilih).'),
          backgroundColor: Colors.red[600],
        ),
      );
      return;
    }

    if (totalSuaraInput > totalKehadiran) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: Total suara ($totalSuaraInput) tidak boleh melebihi Kehadiran/Check-In ($totalKehadiran).'),
          backgroundColor: Colors.red[600],
        ),
      );
      return;
    }

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

    // Fetch fresh Paslons update from server
    await _refreshPaslonsFromServer();

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
      String cleanCode = code.replaceAll('KPPSGENTAN-', '').trim();
      _nikSearchController.text = cleanCode;
      _searchVoter(cleanCode);
    }
  }



  void _showCustomConfirmDialog({
    required BuildContext context,
    required String title,
    required String message,
    required String confirmText,
    required VoidCallback onConfirm,
    Color? confirmColor,
  }) {
    final tealColor = const Color(0xFF0D9488);
    showDialog(
      context: context,
      builder: (context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        elevation: 8,
        backgroundColor: Colors.white,
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1F2937),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                message,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF4B5563),
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  TextButton(
                    onPressed: () => Navigator.pop(context),
                    style: TextButton.styleFrom(
                      foregroundColor: const Color(0xFF4B5563),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                    ),
                    child: const Text('Batal', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      onConfirm();
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: confirmColor ?? tealColor,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    ),
                    child: Text(confirmText, style: const TextStyle(fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogout() async {
    _showCustomConfirmDialog(
      context: context,
      title: 'Keluar Aplikasi?',
      message: 'Apakah Anda yakin ingin keluar dari akun KPPS ini?',
      confirmText: 'Keluar',
      confirmColor: Colors.red[600],
      onConfirm: () async {
        await _storage.clearSession();
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const LoginScreen()),
          );
        }
      },
    );
  }

  Widget _buildDashboardTab() {
    return DashboardTab(
      tpsName: _tpsName,
      totalDptCount: _totalDptCount,
      totalDpkCount: _totalDpkCount,
      totalDpsCount: _totalDpsCount,
      totalDptbCount: _totalDptbCount,
      hadirDptCount: _hadirDptCount,
      hadirDpkCount: _hadirDpkCount,
      hadirDpsCount: _hadirDpsCount,
      hadirDptbCount: _hadirDptbCount,
      hadirPercentage: _hadirPercentage,
      isQcLocked: _isQcLocked,
      qcStatusText: _qcStatusText,
      k1Controller: _k1Controller,
      k2Controller: _k2Controller,
      k3Controller: _k3Controller,
      invalidController: _invalidController,
      paslons: _paslons,
    );
  }

  Widget _buildValidasiTab() {
    return ValidasiTab(
      nikSearchController: _nikSearchController,
      foundVoter: _foundVoter,
      validationMessage: _validationMessage,
      validationSuccess: _validationSuccess,
      tpsName: _tpsName,
      onScanQR: _openRealCameraScanner,
      onSearch: (value) => _searchVoter(value),
      onCheckin: _validateCheckin,
      onClear: () {
        _nikSearchController.clear();
        setState(() {
          _foundVoter = null;
          _validationMessage = null;
        });
      },
    );
  }

  Widget _buildQuickCountTab() {
    return QuickCountTab(
      qcStatusText: _qcStatusText,
      isQcLocked: _isQcLocked,
      k1Controller: _k1Controller,
      k2Controller: _k2Controller,
      k3Controller: _k3Controller,
      invalidController: _invalidController,
      syncingInProgress: _syncingInProgress,
      syncAction: _syncAction,
      paslons: _paslons,
      onSubmitDraft: () => _submitQuickCount('draft'),
      onSubmitFinal: () {
        _showCustomConfirmDialog(
          context: context,
          title: 'Kunci Hasil Suara?',
          message: 'Hasil quick count yang disubmit final akan dikunci dan dikirim ke sekretariat. Anda tidak dapat mengeditnya kembali tanpa reset.',
          confirmText: 'Submit Final',
          onConfirm: () {
            _submitQuickCount('final');
          },
        );
      },
    );
  }

  Widget _buildStatusSyncTab() {
    return StatusSyncTab(
      isOnline: _isOnline,
      pendingCheckinsCount: _pendingCheckinsCount,
      syncingInProgress: _syncingInProgress,
      syncLogs: _syncLogs,
      onTriggerSync: _triggerSync,
    );
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
        title: Row(
          children: [
            Image.asset(
              'assets/images/logo.png',
              height: 36,
              fit: BoxFit.contain,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('KPPS GENTAN — $_tpsName', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                  Text(
                    _isOnline ? 'Online (Terhubung)' : 'Offline (Mode Lokal)',
                    style: const TextStyle(fontSize: 11, color: Colors.white70),
                  ),
                ],
              ),
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
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Watermark kredit — tipis dan redup agar tidak mengganggu konten
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 5),
            decoration: const BoxDecoration(
              color: Color(0xFFF9FAFB),
              border: Border(top: BorderSide(color: Color(0xFFE5E7EB))),
            ),
            child: const Text(
              'Support by KKN-7 USH 2026',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 10,
                color: Color(0xFF9CA3AF),
                letterSpacing: 0.2,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          BottomNavigationBar(
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
        ],
      ),
    );
  }
}

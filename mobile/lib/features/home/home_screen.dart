import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../data/models/quick_count_entry.dart';
import '../../shared/widgets/confirm_dialog.dart';
import '../auth/login_screen.dart';
import '../dashboard/dashboard_tab.dart';
import '../quick_count/quick_count_tab.dart';
import '../scanner/scanner_screen.dart';
import '../sync/status_sync_tab.dart';
import '../validation/validation_tab.dart';
import 'home_controller.dart';
import 'widgets/home_app_bar.dart';
import 'widgets/home_bottom_bar.dart';

/// Layar utama petugas KPPS.
///
/// Tugasnya hanya merangkai tab dan meneruskan aksi ke [HomeController];
/// seluruh logika data ada di controller tersebut.
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final HomeController _controller = HomeController();
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _controller.init();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  // ---------------------------------------------------------------- aksi --

  void _showFeedback(UiFeedback? feedback) {
    if (feedback == null || !mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(feedback.message),
        backgroundColor: feedback.isError ? AppColors.danger : null,
      ),
    );
  }

  Future<void> _openScanner() async {
    final code = await Navigator.push<String>(
      context,
      MaterialPageRoute(builder: (_) => const ScannerScreen()),
    );
    if (code != null) await _controller.searchScannedCode(code);
  }

  Future<void> _submitQuickCount(QuickCountStatus status) async {
    // Papan ketik menutupi tombol aksi; tutup dulu sebelum hasilnya muncul.
    FocusScope.of(context).unfocus();
    _showFeedback(await _controller.submitQuickCount(status));
  }

  Future<void> _submitFinal() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Kunci Hasil Suara?',
      message: 'Hasil quick count yang disubmit final akan dikunci dan '
          'dikirim ke sekretariat. Anda tidak dapat mengeditnya kembali '
          'tanpa reset.',
      confirmText: 'Submit Final',
    );
    if (confirmed) await _submitQuickCount(QuickCountStatus.finalized);
  }

  Future<void> _checkNetwork() async {
    await _controller.checkNetwork();
    _showFeedback(
      UiFeedback(
        _controller.isOnline ? 'Perangkat Online' : 'Perangkat Offline',
      ),
    );
  }

  Future<void> _handleLogout() async {
    final confirmed = await showConfirmDialog(
      context,
      title: 'Keluar Aplikasi?',
      message: 'Apakah Anda yakin ingin keluar dari akun KPPS ini?',
      confirmText: 'Keluar',
      confirmColor: AppColors.danger,
    );
    if (!confirmed) return;

    await _controller.logout();
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  // ----------------------------------------------------------------- ui --

  /// Tab yang tersedia mengikuti hak akses petugas: hanya ketua KPPS yang
  /// melihat dashboard dan input quick count.
  List<_HomeTab> _buildTabs() => [
        if (_controller.hasFullAccess)
          _HomeTab(
            icon: Icons.dashboard,
            label: 'Dashboard',
            view: DashboardTab(controller: _controller),
          ),
        _HomeTab(
          icon: Icons.qr_code_scanner,
          label: 'Validasi',
          view: ValidationTab(
            controller: _controller,
            onScanQr: _openScanner,
          ),
        ),
        if (_controller.hasFullAccess)
          _HomeTab(
            icon: Icons.ballot,
            label: 'Quick Count',
            view: QuickCountTab(
              controller: _controller,
              onSubmitFinal: _submitFinal,
            ),
          ),
        _HomeTab(
          icon: Icons.sync_alt,
          label: 'Status Sync',
          view: StatusSyncTab(
            controller: _controller,
            onSync: () async => _showFeedback(await _controller.runSync()),
          ),
        ),
      ];

  @override
  Widget build(BuildContext context) {
    return ListenableBuilder(
      listenable: _controller,
      builder: (context, _) {
        final tabs = _buildTabs();
        // Daftar tab menyusut saat hak akses terbatas; jaga indeksnya.
        final currentIndex =
            _selectedIndex < tabs.length ? _selectedIndex : 0;

        return Scaffold(
          appBar: HomeAppBar(
            tpsName: _controller.tpsName,
            isOnline: _controller.isOnline,
            onCheckNetwork: _checkNetwork,
            onLogout: _handleLogout,
          ),
          body: IndexedStack(
            index: currentIndex,
            children: [for (final tab in tabs) tab.view],
          ),
          bottomNavigationBar: HomeBottomBar(
            currentIndex: currentIndex,
            onTap: (index) => setState(() => _selectedIndex = index),
            items: [
              for (final tab in tabs)
                BottomNavigationBarItem(
                  icon: Icon(tab.icon),
                  label: tab.label,
                ),
            ],
          ),
        );
      },
    );
  }
}

/// Satu entri navigasi bawah beserta isinya.
class _HomeTab {
  const _HomeTab({
    required this.icon,
    required this.label,
    required this.view,
  });

  final IconData icon;
  final String label;
  final Widget view;
}

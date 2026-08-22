import 'package:flutter/material.dart';

/// AppBar layar utama: identitas TPS, status koneksi, dan tombol keluar.
class HomeAppBar extends StatelessWidget implements PreferredSizeWidget {
  const HomeAppBar({
    super.key,
    required this.tpsName,
    required this.isOnline,
    required this.onCheckNetwork,
    required this.onLogout,
  });

  final String tpsName;
  final bool isOnline;
  final VoidCallback onCheckNetwork;
  final VoidCallback onLogout;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    return AppBar(
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
                Text(
                  'KPPS GENTAN — $tpsName',
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                    color: Colors.white,
                  ),
                ),
                Text(
                  isOnline ? 'Online (Terhubung)' : 'Offline (Mode Lokal)',
                  style: const TextStyle(fontSize: 11, color: Colors.white70),
                ),
              ],
            ),
          ),
        ],
      ),
      actions: [
        IconButton(
          icon: Icon(isOnline ? Icons.wifi : Icons.wifi_off),
          onPressed: onCheckNetwork,
        ),
        IconButton(
          icon: const Icon(Icons.logout),
          onPressed: onLogout,
        ),
      ],
    );
  }
}

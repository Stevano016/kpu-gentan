import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/button_spinner.dart';
import '../../../shared/widgets/status_chip.dart';

/// Status koneksi perangkat, jumlah antrean, dan tombol sinkronisasi.
class ConnectivityCard extends StatelessWidget {
  const ConnectivityCard({
    super.key,
    required this.isOnline,
    required this.pendingCheckins,
    required this.isSyncing,
    required this.onSync,
  });

  final bool isOnline;
  final int pendingCheckins;
  final bool isSyncing;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Konektivitas Device',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              StatusChip(
                label: isOnline ? 'ONLINE' : 'OFFLINE',
                fontSize: 11,
                background:
                    isOnline ? AppColors.successBg : AppColors.dangerBg,
                foreground: isOnline ? AppColors.success : AppColors.danger,
              ),
            ],
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Menunggu Sinkronisasi',
                style: TextStyle(fontSize: 14),
              ),
              Text(
                '$pendingCheckins Pemilih',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: pendingCheckins > 0 ? Colors.orange : Colors.grey,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: isSyncing ? null : onSync,
            icon: isSyncing ? const ButtonSpinner() : const Icon(Icons.sync),
            label: const Text(
              'Sinkronisasi Data Sekarang',
              style: TextStyle(fontWeight: FontWeight.bold),
            ),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(
                vertical: 14,
                horizontal: 24,
              ),
              minimumSize: const Size.fromHeight(48),
            ),
          ),
        ],
      ),
    );
  }
}

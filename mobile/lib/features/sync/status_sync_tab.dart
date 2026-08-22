import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_controller.dart';
import 'widgets/connectivity_card.dart';
import 'widgets/sync_log_view.dart';

/// Status koneksi, antrean kehadiran, dan log aktivitas perangkat.
class StatusSyncTab extends StatelessWidget {
  const StatusSyncTab({
    super.key,
    required this.controller,
    required this.onSync,
  });

  final HomeController controller;
  final VoidCallback onSync;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          ConnectivityCard(
            isOnline: controller.isOnline,
            pendingCheckins: controller.pendingCheckins,
            isSyncing: controller.isSyncing,
            onSync: onSync,
          ),
          const SizedBox(height: 20),
          const Text(
            'Log Aktivitas Perangkat',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 15,
              color: AppColors.textBody,
            ),
          ),
          const SizedBox(height: 8),
          Expanded(child: SyncLogView(logs: controller.syncLogs)),
        ],
      ),
    );
  }
}

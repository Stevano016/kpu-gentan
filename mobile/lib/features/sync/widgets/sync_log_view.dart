import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

/// Daftar log aktivitas perangkat, terbaru di atas.
class SyncLogView extends StatelessWidget {
  const SyncLogView({super.key, required this.logs});

  final List<String> logs;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border.all(color: AppColors.border),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      padding: const EdgeInsets.all(12),
      child: ListView.builder(
        itemCount: logs.length,
        itemBuilder: (context, index) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 4),
          child: Text(
            logs[index],
            style: const TextStyle(
              fontFamily: 'monospace',
              fontSize: 12,
              color: AppColors.textMuted,
            ),
          ),
        ),
      ),
    );
  }
}

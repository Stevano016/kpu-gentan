import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';

/// Kartu angka ringkas: total pemilih atau jumlah kehadiran.
class StatCard extends StatelessWidget {
  const StatCard({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.iconBackground,
    required this.title,
    required this.value,
    required this.breakdown,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String title;
  final int value;

  /// Rincian per tahapan, mis. `DP4: 0 | DPS: 0 | DPT: 12`.
  final String breakdown;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: iconBackground,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Icon(icon, color: iconColor),
          ),
          const SizedBox(height: 12),
          Text(
            title,
            style: const TextStyle(color: AppColors.textFaint, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            '$value',
            style: const TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 24,
              color: AppColors.textStrong,
            ),
          ),
          Text(
            breakdown,
            style: const TextStyle(color: AppColors.textFaint, fontSize: 11),
          ),
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/app_card.dart';

/// Sapaan pembuka di puncak dashboard.
class WelcomeCard extends StatelessWidget {
  const WelcomeCard({super.key, required this.tpsName});

  final String tpsName;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      elevation: 0,
      child: Row(
        children: [
          Image.asset(
            'assets/images/logo.png',
            height: 64,
            width: 64,
            fit: BoxFit.contain,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Halo KPPS!',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 18,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Selamat datang kembali di panel monitoring KPPS. Semua '
                  'aktivitas check-in di $tpsName tersimpan otomatis.',
                  style: const TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

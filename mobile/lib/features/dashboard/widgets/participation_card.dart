import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/attendance_stats.dart';
import '../../../shared/widgets/app_card.dart';

/// Lingkaran persentase partisipasi pemilih.
class ParticipationCard extends StatelessWidget {
  const ParticipationCard({super.key, required this.stats});

  final AttendanceStats stats;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          const Text(
            'Persentase Partisipasi Pemilih',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 14,
              color: AppColors.textBody,
            ),
          ),
          const SizedBox(height: 24),
          Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 130,
                height: 130,
                child: CircularProgressIndicator(
                  value: stats.attendanceRatio,
                  strokeWidth: 12,
                  backgroundColor: Colors.grey[200],
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(AppColors.primary),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    '${stats.attendancePercentage.toStringAsFixed(1)}%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 24,
                      color: AppColors.textStrong,
                    ),
                  ),
                  const SizedBox(height: 2),
                  const Text(
                    'Kehadiran',
                    style: TextStyle(color: Colors.grey, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '${stats.totalHadir} dari ${stats.totalVoters} pemilih telah '
            'menggunakan hak pilih.',
            textAlign: TextAlign.center,
            style: const TextStyle(fontSize: 12, color: Colors.grey),
          ),
        ],
      ),
    );
  }
}

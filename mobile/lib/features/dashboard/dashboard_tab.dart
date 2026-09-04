import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../home/home_controller.dart';
import 'widgets/participation_card.dart';
import 'widgets/stat_card.dart';
import 'widgets/vote_result_card.dart';
import 'widgets/welcome_card.dart';

/// Ringkasan kondisi TPS: jumlah pemilih, kehadiran, dan perolehan suara.
class DashboardTab extends StatelessWidget {
  const DashboardTab({super.key, required this.controller});

  final HomeController controller;

  @override
  Widget build(BuildContext context) {
    final stats = controller.stats;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          WelcomeCard(tpsName: controller.tpsName),
          const SizedBox(height: 20),
          // `IntrinsicHeight` bukan hiasan — tanpa itu barisnya tidak bisa
          // dirender sama sekali.
          //
          // `CrossAxisAlignment.stretch` pada Row berarti "tinggi anak =
          // tinggi baris", dan itu menuntut tinggi yang terbatas. Di dalam
          // SingleChildScrollView tinggi yang diteruskan justru tak terbatas,
          // jadi Flutter melempar "BoxConstraints forces an infinite height"
          // — terbukti di test/tata_letak_kartu_test.dart, dan sudah begitu
          // sejak sebelum kartunya disentuh. `IntrinsicHeight` mengukur dulu
          // kartu tertinggi lalu mengikat barisnya di angka itu, sehingga
          // kedua kartu tetap sama tinggi seperti maksud aslinya.
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(
                  child: StatCard(
                    icon: Icons.people,
                    iconColor: AppColors.primary,
                    iconBackground: AppColors.successBg,
                    title: 'Total Pemilih',
                    value: stats.totalVoters,
                    breakdown: stats.breakdown(hadirSaja: false),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: StatCard(
                    icon: Icons.check_circle,
                    iconColor: AppColors.info,
                    iconBackground: AppColors.infoBg,
                    title: 'Kehadiran (Check-In)',
                    value: stats.totalHadir,
                    breakdown: stats.breakdown(hadirSaja: true),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),
          ParticipationCard(stats: stats),
          const SizedBox(height: 20),
          // Angka quick count dibaca langsung dari kolom inputnya agar rekap
          // ini ikut bergerak saat petugas mengetik di tab sebelah.
          ListenableBuilder(
            listenable: controller.quickCountInputs,
            builder: (context, _) => VoteResultCard(
              entry: controller.liveEntry,
              paslons: controller.paslons,
              statusBadge: controller.qcStatusBadge,
              locked: controller.isQcLocked,
            ),
          ),
        ],
      ),
    );
  }
}

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
    required this.rincian,
  });

  final IconData icon;
  final Color iconColor;
  final Color iconBackground;
  final String title;
  final int value;

  /// Jumlah per tahapan, hanya yang berangka — mis. `{'DPT': 1436}`.
  final Map<String, int> rincian;

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
          // Judul dikunci satu baris. Dua kartu ini berdampingan, dan begitu
          // salah satu judulnya membungkus, angka besar di bawahnya ikut
          // terdorong turun sehingga kedua angka tidak lagi sebaris — terlihat
          // seperti kartu yang melorot.
          Text(
            title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
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
          const SizedBox(height: 2),
          // Tiap pasangan nama-angka dibungkus sebagai satu satuan.
          //
          // Sebelumnya rinciannya satu kalimat panjang, dan di kartu selebar
          // setengah layar kalimat itu terpotong di mana saja — termasuk tepat
          // di antara `DPT:` dan angkanya. `Wrap` memindahkan pasangan yang
          // tidak muat ke baris berikutnya secara utuh.
          if (rincian.isEmpty)
            const Text(
              'belum ada data',
              style: TextStyle(color: AppColors.textFaint, fontSize: 11),
            )
          else
            Wrap(
              spacing: 10,
              runSpacing: 2,
              children: [
                for (final entri in rincian.entries)
                  _Rincian(label: entri.key, nilai: entri.value),
              ],
            ),
        ],
      ),
    );
  }
}

class _Rincian extends StatelessWidget {
  const _Rincian({required this.label, required this.nilai});

  final String label;
  final int nilai;

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        children: [
          TextSpan(
            text: '$label ',
            style: const TextStyle(color: AppColors.textFaint, fontSize: 11),
          ),
          TextSpan(
            text: '$nilai',
            style: const TextStyle(
              color: AppColors.textBody,
              fontSize: 11,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
      // Satu pasangan tidak boleh dipecah di tengah.
      softWrap: false,
      overflow: TextOverflow.visible,
    );
  }
}

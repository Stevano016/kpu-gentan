import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/time_utils.dart';
import '../../../data/models/voter.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/detail_row.dart';

/// Detail lengkap pemilih beserta tombol konfirmasi kehadirannya.
class VoterDetailCard extends StatelessWidget {
  const VoterDetailCard({
    super.key,
    required this.voter,
    required this.tpsName,
    required this.onCheckin,
  });

  final Voter voter;
  final String tpsName;
  final VoidCallback onCheckin;

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const Text(
            'Detail Data Pemilih',
            style: TextStyle(
              fontWeight: FontWeight.bold,
              fontSize: 16,
              color: AppColors.textBody,
            ),
          ),
          const Divider(height: 24),
          DetailRow(label: 'Nama Lengkap', value: voter.nama),
          DetailRow(label: 'ID Pemilih', value: voter.idPemilih ?? '-'),
          DetailRow(label: 'NIK Pemilih', value: voter.nik),
          DetailRow(label: 'NKK Pemilih', value: voter.nkk ?? '-'),
          DetailRow(label: 'Alokasi TPS', value: tpsName),
          DetailRow(
            label: 'Umur',
            value: voter.umur != null ? '${voter.umur} Tahun' : '-',
          ),
          DetailRow(label: 'Jenis Kelamin', value: voter.jenisKelamin ?? '-'),
          DetailRow(label: 'Status Kawin', value: voter.statusKawin ?? '-'),
          DetailRow(label: 'Pekerjaan', value: voter.pekerjaan ?? '-'),
          DetailRow(label: 'Alamat', value: voter.alamat ?? '-'),
          DetailRow(
            label: 'RT / RW',
            value: 'RT ${voter.rt ?? '-'} / RW ${voter.rw ?? '-'}',
          ),
          DetailRow(label: 'Disabilitas', value: voter.disabilitas ?? '-'),
          DetailRow(label: 'Keterangan', value: voter.keterangan ?? '-'),
          const SizedBox(height: 24),
          if (voter.hadir)
            _AlreadyCheckedInNotice(waktuCheckin: voter.waktuCheckin)
          else
            ElevatedButton(
              onPressed: onCheckin,
              child: const Text(
                'Konfirmasi Kehadiran Pemilih',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
        ],
      ),
    );
  }
}

class _AlreadyCheckedInNotice extends StatelessWidget {
  const _AlreadyCheckedInNotice({required this.waktuCheckin});

  final String? waktuCheckin;

  @override
  Widget build(BuildContext context) {
    final clock = formatClock(waktuCheckin) ?? '-';

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.warningBg,
        border: Border.all(color: AppColors.warningBorder),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Row(
        children: [
          const Icon(Icons.warning_amber_rounded, color: AppColors.warning),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              'PERINGATAN: Pemilih sudah check-in kehadiran pada pukul $clock!',
              style: const TextStyle(
                color: AppColors.warningText,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

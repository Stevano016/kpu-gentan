import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../data/models/paslon.dart';
import '../../../data/models/quick_count_entry.dart';
import '../../../shared/widgets/app_card.dart';
import '../../../shared/widgets/status_chip.dart';

/// Rekap perolehan suara TPS beserta batang persentasenya.
class VoteResultCard extends StatelessWidget {
  const VoteResultCard({
    super.key,
    required this.entry,
    required this.paslons,
    required this.statusBadge,
    required this.locked,
  });

  final QuickCountEntry entry;
  final PaslonCatalog paslons;

  /// Lencana status singkat, mis. `DRAFT`, `FINAL`, atau `Belum diisi`.
  final String statusBadge;
  final bool locked;

  @override
  Widget build(BuildContext context) {
    final slots = paslons.visibleSlots(entry.votesOf);
    // Total memakai seluruh slot agar suara paslon yang sudah dihapus tetap
    // terhitung dalam pembagi persentase.
    final total = entry.votes.values.fold(entry.invalid, (a, b) => a + b);

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'Hasil Perolehan Suara TPS',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: AppColors.textBody,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              StatusChip(
                label: statusBadge,
                background:
                    locked ? AppColors.successBg : AppColors.warningBg,
                foreground: locked ? AppColors.success : AppColors.warning,
              ),
            ],
          ),
          const Divider(height: 24),
          for (final nomor in slots) ...[
            _VoteBar(
              label: paslons.labelOf(nomor),
              votes: entry.votesOf(nomor),
              total: total,
              color: PaslonCatalog.colorOf(nomor),
            ),
            const SizedBox(height: 12),
          ],
          _VoteBar(
            label: 'Suara Tidak Sah',
            votes: entry.invalid,
            total: total,
            color: AppColors.textDisabled,
          ),
          const Divider(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Total Suara Masuk',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                  color: AppColors.textBody,
                ),
              ),
              Text(
                '$total suara',
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  color: AppColors.textPrimary,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _VoteBar extends StatelessWidget {
  const _VoteBar({
    required this.label,
    required this.votes,
    required this.total,
    required this.color,
  });

  final String label;
  final int votes;
  final int total;
  final Color color;

  @override
  Widget build(BuildContext context) {
    final ratio = total > 0 ? votes / total : 0.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(
                  fontSize: 12,
                  color: AppColors.textMuted,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$votes suara (${(ratio * 100).toStringAsFixed(1)}%)',
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 12,
                color: AppColors.textStrong,
              ),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: ratio,
            minHeight: 8,
            backgroundColor: AppColors.neutralBg,
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

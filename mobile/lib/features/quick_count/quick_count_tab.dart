import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/button_spinner.dart';
import '../../shared/widgets/status_chip.dart';
import '../home/home_controller.dart';
import 'widgets/vote_input_row.dart';

/// Input perolehan suara TPS, tersimpan sebagai draft atau dikunci final.
class QuickCountTab extends StatelessWidget {
  const QuickCountTab({
    super.key,
    required this.controller,
    required this.onSubmitDraft,
    required this.onSubmitFinal,
  });

  final HomeController controller;
  final VoidCallback onSubmitDraft;
  final VoidCallback onSubmitFinal;

  @override
  Widget build(BuildContext context) {
    final locked = controller.isQcLocked;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: AppCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Expanded(
                  child: Text(
                    'Input Perolehan Suara',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                      color: AppColors.textBody,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                StatusChip(
                  label: controller.qcStatusLabel.toUpperCase(),
                  background:
                      locked ? AppColors.neutralBg : AppColors.warningBg,
                  foreground:
                      locked ? Colors.grey[700]! : AppColors.warning,
                ),
              ],
            ),
            const Divider(height: 24),
            // Slot yang tampil bergantung pada angka yang sedang diketik, jadi
            // daftarnya ikut menyimak perubahan kolom input.
            ListenableBuilder(
              listenable: controller.quickCountInputs,
              builder: (context, _) {
                final entry = controller.liveEntry;
                final slots = controller.paslons.visibleSlots(entry.votesOf);

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    for (final nomor in slots) ...[
                      VoteInputRow(
                        label: controller.paslons.labelOf(nomor),
                        controller: controller.kandidatControllers[nomor]!,
                        enabled: !locked,
                      ),
                      const SizedBox(height: 12),
                    ],
                    VoteInputRow(
                      label: 'Suara Tidak Sah',
                      controller: controller.invalidController,
                      enabled: !locked,
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 24),
            if (!locked) _buildActions(),
          ],
        ),
      ),
    );
  }

  Widget _buildActions() {
    final busy = controller.isSyncing;

    return Row(
      children: [
        Expanded(
          child: OutlinedButton(
            onPressed: busy ? null : onSubmitDraft,
            child: controller.syncAction == SyncAction.draft
                ? const ButtonSpinner(color: AppColors.primary)
                : const Text('Simpan Draft'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: busy ? null : onSubmitFinal,
            child: controller.syncAction == SyncAction.finalize
                ? const ButtonSpinner()
                : const Text(
                    'Submit Final',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
          ),
        ),
      ],
    );
  }
}

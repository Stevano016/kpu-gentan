import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';
import '../../shared/widgets/app_card.dart';
import '../../shared/widgets/button_spinner.dart';
import '../../shared/widgets/status_chip.dart';
import '../home/home_controller.dart';
import 'widgets/vote_input_row.dart';

/// Input perolehan suara TPS. Tiap perubahan angka tersimpan otomatis sebagai
/// draft dan langsung tampil realtime di dashboard; tombol Submit Final
/// mengunci hasilnya.
class QuickCountTab extends StatelessWidget {
  const QuickCountTab({
    super.key,
    required this.controller,
    required this.onSubmitFinal,
  });

  final HomeController controller;
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
                      locked ? AppColors.textMuted : AppColors.warning,
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
            const SizedBox(height: 20),
            if (!locked) ...[
              _buildAutoSaveHint(),
              const SizedBox(height: 12),
              _buildFinalAction(),
            ] else
              _buildLockedHint(),
          ],
        ),
      ),
    );
  }

  /// Indikator kecil status simpan otomatis, pengganti tombol Simpan Draft.
  Widget _buildAutoSaveHint() {
    late final IconData icon;
    late final Color color;
    late final String text;

    switch (controller.qcSaveState) {
      case QcSaveState.saving:
        icon = Icons.cloud_sync_outlined;
        color = AppColors.primary;
        text = 'Menyimpan otomatis...';
      case QcSaveState.saved:
        icon = Icons.cloud_done_outlined;
        color = AppColors.success;
        text = 'Tersimpan — tampil realtime di dashboard';
      case QcSaveState.offline:
        icon = Icons.cloud_off_outlined;
        color = AppColors.warning;
        text = 'Tersimpan di perangkat, menunggu jaringan';
      case QcSaveState.idle:
        icon = Icons.bolt_outlined;
        color = AppColors.textFaint;
        text = 'Setiap perubahan tersimpan & terkirim otomatis';
    }

    return Row(
      children: [
        Icon(icon, size: 16, color: color),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: TextStyle(fontSize: 12, color: color),
          ),
        ),
      ],
    );
  }

  Widget _buildFinalAction() {
    final busy = controller.isSyncing;

    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: busy ? null : onSubmitFinal,
        child: controller.syncAction == SyncAction.finalize
            ? const ButtonSpinner()
            : const Text(
                'Submit Final',
                style: TextStyle(fontWeight: FontWeight.bold),
              ),
      ),
    );
  }

  Widget _buildLockedHint() {
    return Row(
      children: [
        const Icon(Icons.lock_outline, size: 16, color: AppColors.textFaint),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            'Hasil sudah dikunci final. Hubungi sekretariat untuk perubahan.',
            style: const TextStyle(fontSize: 12, color: AppColors.textMuted),
          ),
        ),
      ],
    );
  }
}

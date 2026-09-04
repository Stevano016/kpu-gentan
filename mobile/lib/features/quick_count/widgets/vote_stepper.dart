import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

/// Penghitung suara dengan tombol tambah dan kurang.
///
/// Angkanya disimpan di [TextEditingController] yang sama seperti saat masih
/// diketik, supaya logika penyimpanan draft dan submit tidak perlu ikut
/// berubah.
///
/// Tombolnya bisa ditekan-tahan: perolehan suara satu TPS bisa ratusan, dan
/// mengharuskan petugas mengetuk ratusan kali jelas tidak masuk akal.
class VoteStepper extends StatefulWidget {
  const VoteStepper({
    super.key,
    required this.controller,
    required this.enabled,
    this.bolehTambah = true,
  });

  final TextEditingController controller;
  final bool enabled;

  /// Tombol tambah dimatikan saat total suara sudah menyentuh kehadiran.
  /// Tanpa ini angkanya tetap ditahan, tapi petugas hanya melihat angka yang
  /// membalik sendiri tanpa tahu sebabnya.
  final bool bolehTambah;

  /// Jeda antar penambahan saat tombol ditahan.
  static const Duration repeatInterval = Duration(milliseconds: 90);

  @override
  State<VoteStepper> createState() => _VoteStepperState();
}

class _VoteStepperState extends State<VoteStepper> {
  Timer? _repeater;

  @override
  void dispose() {
    _repeater?.cancel();
    super.dispose();
  }

  int get _value => int.tryParse(widget.controller.text.trim()) ?? 0;

  void _changeBy(int delta) {
    if (delta > 0 && !widget.bolehTambah) {
      // Sudah di batas kehadiran; hentikan juga penekanan-tahan yang sedang
      // berjalan supaya tidak berputar sia-sia.
      _stopRepeating();
      return;
    }
    // Suara tidak mungkin negatif.
    widget.controller.text =
        (_value + delta).clamp(0, AppConstants.maxVoteCount).toString();
  }

  void _startRepeating(int delta) {
    _changeBy(delta);
    _repeater?.cancel();
    _repeater = Timer.periodic(
      VoteStepper.repeatInterval,
      (_) => _changeBy(delta),
    );
  }

  void _stopRepeating() {
    _repeater?.cancel();
    _repeater = null;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.inputBorder),
        borderRadius: BorderRadius.circular(AppTheme.radius),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _StepButton(
            icon: Icons.remove,
            color: AppColors.danger,
            enabled: widget.enabled,
            onStart: () => _startRepeating(-1),
            onStop: _stopRepeating,
            onTap: () => _changeBy(-1),
          ),
          // Angkanya ikut berubah tanpa perlu setState karena controller
          // memang sudah berupa notifier.
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: widget.controller,
            builder: (context, value, _) => Container(
              constraints: const BoxConstraints(minWidth: 56),
              alignment: Alignment.center,
              padding: const EdgeInsets.symmetric(vertical: 10),
              child: Text(
                '${int.tryParse(value.text.trim()) ?? 0}',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: widget.enabled
                      ? AppColors.textPrimary
                      : AppColors.textDisabled,
                ),
              ),
            ),
          ),
          _StepButton(
            icon: Icons.add,
            color: AppColors.primary,
            // Ikut mati begitu batas kehadiran tercapai. Kalau hanya
            // penambahannya yang ditolak sementara tombolnya tetap tampak
            // hidup, petugas cuma melihat angka membalik sendiri.
            enabled: widget.enabled && widget.bolehTambah,
            onStart: () => _startRepeating(1),
            onStop: _stopRepeating,
            onTap: () => _changeBy(1),
          ),
        ],
      ),
    );
  }
}

class _StepButton extends StatelessWidget {
  const _StepButton({
    required this.icon,
    required this.color,
    required this.enabled,
    required this.onStart,
    required this.onStop,
    required this.onTap,
  });

  final IconData icon;
  final Color color;
  final bool enabled;
  final VoidCallback onStart;
  final VoidCallback onStop;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onLongPressStart: enabled ? (_) => onStart() : null,
      onLongPressEnd: enabled ? (_) => onStop() : null,
      onLongPressCancel: enabled ? onStop : null,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: enabled ? onTap : null,
          borderRadius: BorderRadius.circular(AppTheme.radius),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Icon(
              icon,
              size: 22,
              color: enabled ? color : AppColors.textDisabled,
            ),
          ),
        ),
      ),
    );
  }
}

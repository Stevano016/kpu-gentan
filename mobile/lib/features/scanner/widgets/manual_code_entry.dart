import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

/// Ganti input saat kamera fisik tidak tersedia (emulator atau PC).
class ManualCodeEntry extends StatefulWidget {
  const ManualCodeEntry({super.key, required this.onSubmit});

  final ValueChanged<String> onSubmit;

  @override
  State<ManualCodeEntry> createState() => _ManualCodeEntryState();
}

class _ManualCodeEntryState extends State<ManualCodeEntry> {
  final TextEditingController _controller = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _submit() {
    final code = _controller.text.trim();
    if (code.isNotEmpty) widget.onSubmit(code);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: AppColors.dark,
      padding: const EdgeInsets.all(24),
      child: Center(
        child: Card(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppTheme.cardRadius),
          ),
          color: AppColors.surface,
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.videocam_off, size: 48, color: AppColors.textFaint),
                const SizedBox(height: 16),
                const Text(
                  'Kamera Tidak Tersedia',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                ),
                const SizedBox(height: 8),
                const Text(
                  'Kamera fisik tidak terdeteksi (Emulator/PC). Silakan ketik '
                  'payload QR secara manual untuk simulasi scan.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.textFaint),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _controller,
                  textInputAction: TextInputAction.done,
                  onSubmitted: (_) => _submit(),
                  decoration: const InputDecoration(
                    labelText: 'Simulasi Payload QR / ID Pemilih',
                    hintText: 'USH-GTN-0260001',
                  ),
                ),
                const SizedBox(height: 16),
                ElevatedButton(
                  onPressed: _submit,
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                  ),
                  child: const Text(
                    'Simulasi Scan QR',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

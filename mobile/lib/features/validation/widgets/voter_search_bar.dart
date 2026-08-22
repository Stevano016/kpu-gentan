import 'package:flutter/material.dart';

import '../../../core/constants.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

/// Tombol scan QR dan kolom pencarian manual di puncak tab validasi.
class VoterSearchBar extends StatelessWidget {
  const VoterSearchBar({
    super.key,
    required this.controller,
    required this.onScanQr,
    required this.onSearch,
    required this.onClear,
  });

  final TextEditingController controller;
  final VoidCallback onScanQr;
  final ValueChanged<String> onSearch;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        ElevatedButton.icon(
          onPressed: onScanQr,
          icon: const Icon(Icons.camera_alt),
          label: const Text(
            'Scan QR Pemilih',
            style: TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 16),
        const Center(
          child: Text(
            'atau cari manual',
            style: TextStyle(color: Colors.grey, fontSize: 12),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: controller,
                textInputAction: TextInputAction.search,
                onSubmitted: onSearch,
                decoration: InputDecoration(
                  hintText:
                      'Masukkan ID Pemilih (${AppConstants.voterIdPrefix}...)',
                  counterText: '',
                  suffixIcon: IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: onClear,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 8),
            ElevatedButton(
              onPressed: () => onSearch(controller.text),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.dark,
                padding: const EdgeInsets.symmetric(
                  vertical: 16,
                  horizontal: 16,
                ),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(AppTheme.radius),
                ),
              ),
              child: const Icon(Icons.search),
            ),
          ],
        ),
      ],
    );
  }
}

import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_theme.dart';

/// Pemberitahuan hasil pencarian: merah untuk gagal, hijau untuk check-in
/// yang berhasil.
class ValidationBanner extends StatelessWidget {
  const ValidationBanner({
    super.key,
    required this.message,
    required this.success,
  });

  final String message;
  final bool success;

  @override
  Widget build(BuildContext context) {
    return success ? _buildSuccess() : _buildError();
  }

  Widget _buildError() {
    return Card(
      color: AppColors.dangerBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        side: const BorderSide(color: AppColors.dangerBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            const Icon(Icons.error_outline, color: AppColors.danger),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                message,
                style: const TextStyle(
                  color: AppColors.danger,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSuccess() {
    return Card(
      color: AppColors.successBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppTheme.radius),
        side: const BorderSide(color: AppColors.successBorder),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Row(
              children: [
                Icon(Icons.check_circle_outline, color: AppColors.success),
                SizedBox(width: 12),
                Text(
                  'VALIDASI BERHASIL',
                  style: TextStyle(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(
              message,
              style: const TextStyle(
                color: AppColors.successText,
                fontSize: 14,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              'Data tersimpan secara lokal dan siap disinkronkan.',
              style: TextStyle(
                color: AppColors.successTextDeep,
                fontSize: 12,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

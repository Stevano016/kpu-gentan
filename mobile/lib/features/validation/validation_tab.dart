import 'package:flutter/material.dart';

import '../home/home_controller.dart';
import 'widgets/validation_banner.dart';
import 'widgets/voter_detail_card.dart';
import 'widgets/voter_search_bar.dart';

/// Pencarian pemilih dan pencatatan kehadiran di TPS.
class ValidationTab extends StatelessWidget {
  const ValidationTab({
    super.key,
    required this.controller,
    required this.onScanQr,
  });

  final HomeController controller;
  final VoidCallback onScanQr;

  @override
  Widget build(BuildContext context) {
    final voter = controller.foundVoter;
    final message = controller.validationMessage;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          VoterSearchBar(
            controller: controller.searchController,
            onScanQr: onScanQr,
            onSearch: controller.searchVoter,
            onClear: controller.clearSearch,
          ),
          const SizedBox(height: 24),
          if (message != null)
            ValidationBanner(
              message: message,
              success: controller.validationSuccess,
            ),
          if (voter != null) ...[
            const SizedBox(height: 12),
            VoterDetailCard(
              voter: voter,
              tpsName: controller.tpsName,
              onCheckin: controller.checkinFoundVoter,
            ),
          ],
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

import 'vote_stepper.dart';

/// Satu baris input suara: nama paslon di kiri, penghitung di kanan.
class VoteInputRow extends StatelessWidget {
  const VoteInputRow({
    super.key,
    required this.label,
    required this.controller,
    required this.enabled,
    this.bolehTambah = true,
  });

  final String label;
  final TextEditingController controller;
  final bool enabled;
  final bool bolehTambah;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w500),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 12),
        VoteStepper(
          controller: controller,
          enabled: enabled,
          bolehTambah: bolehTambah,
        ),
      ],
    );
  }
}

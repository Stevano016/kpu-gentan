import 'package:flutter/material.dart';

import '../../core/constants.dart';
import '../../core/theme/app_colors.dart';

/// Kredit pembuat aplikasi; tipis dan redup agar tidak mengganggu konten.
class CreditText extends StatelessWidget {
  const CreditText({super.key, this.fontSize = 12});

  final double fontSize;

  @override
  Widget build(BuildContext context) {
    return Text(
      AppConstants.credit,
      textAlign: TextAlign.center,
      style: TextStyle(
        fontSize: fontSize,
        color: AppColors.textDisabled,
        letterSpacing: 0.2,
        fontWeight: FontWeight.w500,
      ),
    );
  }
}

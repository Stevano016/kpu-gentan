import 'package:flutter/material.dart';

import 'core/theme/app_theme.dart';
import 'data/sources/session_store.dart';
import 'features/auth/login_screen.dart';
import 'features/home/home_screen.dart';

/// Akar aplikasi.
///
/// Layar pembuka ditentukan sekali di sini: perangkat yang masih memegang
/// token langsung masuk ke layar utama supaya petugas tidak perlu login ulang
/// di tengah pemungutan suara.
class KppsApp extends StatelessWidget {
  const KppsApp({super.key});

  @override
  Widget build(BuildContext context) {
    final hasSession = SessionStore().hasSession;

    return MaterialApp(
      title: 'KPPS Gentan',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.build(),
      home: hasSession ? const HomeScreen() : const LoginScreen(),
    );
  }
}

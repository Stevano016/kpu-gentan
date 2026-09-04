@Tags(['lihat'])
library;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/models/attendance_stats.dart';
import 'package:mobile/data/models/voter.dart';
import 'package:mobile/features/dashboard/widgets/participation_card.dart';
import 'package:mobile/features/dashboard/widgets/stat_card.dart';
import 'package:mobile/features/dashboard/widgets/welcome_card.dart';
import 'package:mobile/features/home/home_controller.dart';
import 'package:mobile/features/quick_count/quick_count_tab.dart';

/// Perkakas lihat-sendiri: merender Dashboard ke PNG tanpa perangkat.
///
/// Aplikasi ini hanya bertarget Android dan tidak ada emulator di mesin ini,
/// jadi satu-satunya cara melihat hasil tata letaknya adalah merendernya di
/// dalam uji lalu menyimpannya sebagai gambar. Font uji bawaan Flutter
/// menggambar setiap huruf sebagai kotak hitam, jadi Roboto asli dari SDK
/// dimuat lebih dulu — tanpa itu gambarnya tidak bisa dinilai.
///
/// Jalankan: flutter test --update-goldens test/lihat_dashboard_test.dart
void main() {
  setUpAll(() async {
    final akar = Platform.environment['FLUTTER_ROOT'] ?? r'C:\flutter';
    final dir = Directory('$akar/bin/cache/artifacts/material_fonts');

    Future<void> muat(String nama, String berkas) async {
      final f = File('${dir.path}/$berkas');
      if (!f.existsSync()) return;
      final pemuat = FontLoader(nama)
        ..addFont(Future.value(ByteData.sublistView(f.readAsBytesSync())));
      await pemuat.load();
    }

    await muat('Roboto', 'roboto-regular.ttf');
    await muat('Roboto', 'roboto-bold.ttf');
  });

  testWidgets('render kartu 320px, tiga tahapan berangka', (tester) async {
    tester.view.physicalSize = const Size(320, 420);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final tema = AppTheme.build();

    await tester.pumpWidget(
      MaterialApp(
        theme: tema.copyWith(
          textTheme: tema.textTheme.apply(fontFamily: 'Roboto'),
        ),
        home: Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: const [
                      Expanded(
                        child: StatCard(
                          icon: Icons.people,
                          iconColor: Color(0xFF0D9488),
                          iconBackground: Color(0xFFECFDF5),
                          title: 'Total Pemilih',
                          value: 7462,
                          rincian: {'DP4': 4492, 'DPS': 1533, 'DPT': 1436},
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          icon: Icons.check_circle,
                          iconColor: Colors.blue,
                          iconBackground: Color(0xFFEFF6FF),
                          title: 'Sudah Check-In',
                          value: 0,
                          rincian: {},
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(Scaffold),
      matchesGoldenFile('lihat/kartu-320-tiga-tahapan.png'),
    );
  });

  testWidgets('render Dashboard 360px', (tester) async {
    tester.view.physicalSize = const Size(360, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final tema = AppTheme.build();

    await tester.pumpWidget(
      MaterialApp(
        theme: tema.copyWith(
          textTheme: tema.textTheme.apply(fontFamily: 'Roboto'),
        ),
        home: Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const WelcomeCard(tpsName: 'TPS 01'),
                const SizedBox(height: 20),
                IntrinsicHeight(
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: const [
                      Expanded(
                        child: StatCard(
                          icon: Icons.people,
                          iconColor: Color(0xFF0D9488),
                          iconBackground: Color(0xFFECFDF5),
                          title: 'Total Pemilih',
                          value: 1436,
                          rincian: {'DPT': 1436},
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: StatCard(
                          icon: Icons.check_circle,
                          iconColor: Colors.blue,
                          iconBackground: Color(0xFFEFF6FF),
                          title: 'Sudah Check-In',
                          value: 1201,
                          rincian: {'DPT': 1201},
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                const ParticipationCard(
                  stats: AttendanceStats(
                    total: {VoterStage.dpt: 1436},
                    hadir: {VoterStage.dpt: 1201},
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
    await tester.pumpAndSettle();

    await expectLater(
      find.byType(Scaffold),
      matchesGoldenFile('lihat/dashboard-360.png'),
    );
  });

  testWidgets('render Quick Count 360px (batas kehadiran)', (tester) async {
    tester.view.physicalSize = const Size(360, 1250);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    final tema = AppTheme.build();
    final pengendali = HomeController();
    addTearDown(pengendali.dispose);

    await tester.pumpWidget(
      MaterialApp(
        theme: tema.copyWith(
          textTheme: tema.textTheme.apply(fontFamily: 'Roboto'),
        ),
        home: Scaffold(
          backgroundColor: const Color(0xFFF9FAFB),
          body: QuickCountTab(
            controller: pengendali,
            onSubmitFinal: () {},
          ),
        ),
      ),
    );
    await tester.pump();

    await expectLater(
      find.byType(Scaffold),
      matchesGoldenFile('lihat/quickcount-360.png'),
    );
  });
}

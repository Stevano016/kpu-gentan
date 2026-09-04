import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/theme/app_theme.dart';
import 'package:mobile/data/models/attendance_stats.dart';
import 'package:mobile/data/models/voter.dart';
import 'package:mobile/features/dashboard/widgets/participation_card.dart';
import 'package:mobile/features/dashboard/widgets/stat_card.dart';
import 'package:mobile/shared/widgets/detail_row.dart';

/// Kartu dashboard harus muat di layar tersempit yang dipakai petugas.
///
/// Baris rincian pada [StatCard] tadinya ditulis 8px — ukuran yang tidak
/// terbaca di lapangan. Setelah dinaikkan, satu-satunya risikonya adalah
/// tulisannya tidak lagi muat; uji ini yang menjaganya. Flutter menggagalkan
/// tes begitu ada RenderFlex yang meluber, jadi cukup merender lalu memastikan
/// tidak ada galat yang dilaporkan.
void main() {
  Future<void> render(WidgetTester tester, Widget anak, Size layar) async {
    tester.view.physicalSize = layar;
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(
      MaterialApp(
        theme: AppTheme.build(),
        home: Scaffold(
          // Struktur ini menirukan dashboard_tab.dart apa adanya:
          // SingleChildScrollView > Column(stretch) > kartu.
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [anak],
            ),
          ),
        ),
      ),
    );
  }

  // 320x568 = layar Android terkecil yang masih realistis dipakai petugas.
  const sempit = Size(320, 568);

  testWidgets('dua StatCard berdampingan muat di layar 320px', (tester) async {
    await render(
      tester,
      IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: const [
            Expanded(
              child: StatCard(
                icon: Icons.people,
                iconColor: Colors.teal,
                iconBackground: Colors.tealAccent,
                title: 'Total Pemilih',
                value: 1436,
                // Rincian terpanjang yang mungkin: tiap tahapan empat digit.
                rincian: {'DP4': 4492, 'DPS': 1533, 'DPT': 1436},
              ),
            ),
            SizedBox(width: 12),
            Expanded(
              child: StatCard(
                icon: Icons.check_circle,
                iconColor: Colors.blue,
                iconBackground: Colors.lightBlueAccent,
                title: 'Kehadiran (Check-In)',
                value: 0,
                rincian: {},
              ),
            ),
          ],
        ),
      ),
      sempit,
    );

    expect(tester.takeException(), isNull);
    expect(find.text('belum ada data'), findsOneWidget);
  });

  testWidgets('kartu partisipasi muat di layar 320px', (tester) async {
    await render(
      tester,
      const ParticipationCard(
        stats: AttendanceStats(
          total: {VoterStage.dpt: 1436, VoterStage.dpk: 12},
          hadir: {VoterStage.dpt: 1201, VoterStage.dpk: 9},
        ),
      ),
      sempit,
    );

    expect(tester.takeException(), isNull);
  });

  testWidgets('DetailRow dengan nama terpanjang tidak meluber', (tester) async {
    await render(
      tester,
      const DetailRow(
        label: 'Nama Lengkap',
        // Nama terpanjang yang benar-benar ada di daftar pemilih Gentan.
        value: 'NARESWARA JAGADDHITARTHA SUSELOPUTRA',
      ),
      sempit,
    );

    expect(tester.takeException(), isNull);
  });
}

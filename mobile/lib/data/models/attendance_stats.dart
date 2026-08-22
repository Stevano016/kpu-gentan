import 'voter.dart';

/// Rekap kehadiran per tahapan pendataan.
///
/// Dihitung sekali dari daftar pemilih, bukan disebar sebagai belasan variabel
/// terpisah seperti sebelumnya.
class AttendanceStats {
  const AttendanceStats({required this.total, required this.hadir});

  const AttendanceStats.empty()
      : total = const {},
        hadir = const {};

  final Map<VoterStage, int> total;
  final Map<VoterStage, int> hadir;

  factory AttendanceStats.from(List<Voter> voters) {
    final total = <VoterStage, int>{};
    final hadir = <VoterStage, int>{};
    for (final stage in VoterStage.values) {
      total[stage] = 0;
      hadir[stage] = 0;
    }
    for (final voter in voters) {
      total[voter.stage] = total[voter.stage]! + 1;
      if (voter.hadir) hadir[voter.stage] = hadir[voter.stage]! + 1;
    }
    return AttendanceStats(total: total, hadir: hadir);
  }

  int totalOf(VoterStage stage) => total[stage] ?? 0;
  int hadirOf(VoterStage stage) => hadir[stage] ?? 0;

  int get totalVoters => total.values.fold(0, (a, b) => a + b);
  int get totalHadir => hadir.values.fold(0, (a, b) => a + b);

  /// Rasio kehadiran 0..1; nol bila daftar pemilih masih kosong.
  double get attendanceRatio =>
      totalVoters > 0 ? totalHadir / totalVoters : 0.0;

  double get attendancePercentage => attendanceRatio * 100;

  /// Pemilih yang benar-benar berhak memilih hari itu — DP4 belum ditetapkan
  /// sehingga tidak ikut membatasi jumlah suara yang boleh dimasukkan.
  static const List<VoterStage> eligibleStages = [
    VoterStage.dpt,
    VoterStage.dpk,
    VoterStage.dps,
    VoterStage.dptb,
  ];

  int get eligibleVoters =>
      eligibleStages.fold(0, (sum, stage) => sum + totalOf(stage));

  int get eligibleHadir =>
      eligibleStages.fold(0, (sum, stage) => sum + hadirOf(stage));

  /// Ringkasan satu baris, mis. `DP4: 0 | DPS: 0 | DPTb: 0 | DPT: 12 | DPK: 1`.
  String breakdown({required bool hadirSaja}) => VoterStage.values
      .map((s) => '${s.label}: ${hadirSaja ? hadirOf(s) : totalOf(s)}')
      .join(' | ');
}

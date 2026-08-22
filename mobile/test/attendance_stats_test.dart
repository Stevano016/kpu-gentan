import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/data/models/attendance_stats.dart';
import 'package:mobile/data/models/voter.dart';

Voter _voter({
  required String nik,
  String tahapan = 'dpt',
  Object hadir = false,
}) =>
    Voter.fromJson({
      'nik': nik,
      'nama': 'Pemilih $nik',
      'tahapan': tahapan,
      'status_hadir': hadir,
    });

void main() {
  group('AttendanceStats', () {
    test('daftar kosong tidak membagi dengan nol', () {
      final stats = AttendanceStats.from(const []);

      expect(stats.totalVoters, 0);
      expect(stats.attendanceRatio, 0);
      expect(stats.attendancePercentage, 0);
    });

    test('menghitung total dan kehadiran per tahapan', () {
      final stats = AttendanceStats.from([
        _voter(nik: '1', hadir: true),
        _voter(nik: '2'),
        _voter(nik: '3', tahapan: 'dpk', hadir: 1),
        _voter(nik: '4', tahapan: 'dp4'),
      ]);

      expect(stats.totalOf(VoterStage.dpt), 2);
      expect(stats.hadirOf(VoterStage.dpt), 1);
      expect(stats.totalOf(VoterStage.dpk), 1);
      expect(stats.hadirOf(VoterStage.dpk), 1);
      expect(stats.totalVoters, 4);
      expect(stats.totalHadir, 2);
      expect(stats.attendancePercentage, 50);
    });

    test('DP4 tidak ikut membatasi jumlah suara yang boleh masuk', () {
      final stats = AttendanceStats.from([
        _voter(nik: '1', hadir: true),
        _voter(nik: '2', tahapan: 'dp4', hadir: true),
      ]);

      expect(stats.totalVoters, 2);
      expect(stats.eligibleVoters, 1);
      expect(stats.eligibleHadir, 1);
    });

    test('status hadir dari server dibaca apa pun tipenya', () {
      final stats = AttendanceStats.from([
        _voter(nik: '1', hadir: true),
        _voter(nik: '2', hadir: 1),
        _voter(nik: '3', hadir: '1'),
        _voter(nik: '4', hadir: 0),
      ]);

      expect(stats.totalHadir, 3);
    });
  });
}

import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/constants.dart';
import 'package:mobile/data/models/quick_count_entry.dart';

void main() {
  group('QuickCountEntry', () {
    test('membaca payload tersimpan termasuk status terkunci', () {
      final entry = QuickCountEntry.fromJson(const {
        'kandidat_1': 10,
        'kandidat_2': '5',
        'suara_tidak_sah': 2,
        'status': 'final',
      });

      expect(entry.votesOf(1), 10);
      expect(entry.votesOf(2), 5);
      expect(entry.votesOf(3), 0);
      expect(entry.invalid, 2);
      expect(entry.status, QuickCountStatus.finalized);
      expect(entry.status.isLocked, isTrue);
    });

    test('payload berisi seluruh slot yang disediakan backend', () {
      const entry = QuickCountEntry(
        votes: {1: 4},
        invalid: 1,
        status: QuickCountStatus.draft,
      );

      final json = entry.toJson(deviceId: 'DEVICE-1');

      expect(json['kandidat_1'], 4);
      expect(json['suara_tidak_sah'], 1);
      expect(json['status'], 'draft');
      expect(json['device_id'], 'DEVICE-1');
    });

    test('total hanya menjumlah slot yang tampil, ditambah suara tidak sah',
        () {
      const entry = QuickCountEntry(
        votes: {1: 10, 2: 5, 7: 99},
        invalid: 3,
        status: QuickCountStatus.draft,
      );

      expect(entry.totalOn([1, 2]), 18);
    });

    test('status tanpa nama yang dikenal dianggap draft', () {
      expect(QuickCountStatus.fromCode(null), QuickCountStatus.draft);
      expect(QuickCountStatus.fromCode('apa saja'), QuickCountStatus.draft);
    });

    test('slot maksimum mengikuti kapasitas backend', () {
      final entry = QuickCountEntry.fromJson(const {});
      expect(entry.votes.length, AppConstants.maxPaslonSlots);
    });
  });
}

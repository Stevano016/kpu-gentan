import '../../core/constants.dart';
import '../../core/utils/json_utils.dart';

/// Status penguncian hasil hitung cepat di sisi TPS.
enum QuickCountStatus {
  draft('draft', 'DRAFT (Belum Submit)'),
  finalized('final', 'FINAL (Terkunci)');

  const QuickCountStatus(this.code, this.label);

  final String code;
  final String label;

  bool get isLocked => this == QuickCountStatus.finalized;

  static QuickCountStatus fromCode(String? code) =>
      code == finalized.code ? finalized : draft;
}

/// Hasil pemungutan suara satu TPS.
class QuickCountEntry {
  const QuickCountEntry({
    required this.votes,
    required this.invalid,
    required this.status,
  });

  /// Perolehan per nomor urut paslon (`1` .. [AppConstants.maxPaslonSlots]).
  final Map<int, int> votes;
  final int invalid;
  final QuickCountStatus status;

  int votesOf(int nomorUrut) => votes[nomorUrut] ?? 0;

  factory QuickCountEntry.fromJson(Map<String, dynamic> json) =>
      QuickCountEntry(
        votes: {
          for (var i = 1; i <= AppConstants.maxPaslonSlots; i++)
            i: asInt(json['kandidat_$i']),
        },
        invalid: asInt(json['suara_tidak_sah']),
        status: QuickCountStatus.fromCode(asStringOrNull(json['status'])),
      );

  Map<String, dynamic> toJson({required String deviceId}) => {
        for (final entry in votes.entries) 'kandidat_${entry.key}': entry.value,
        'suara_tidak_sah': invalid,
        'status': status.code,
        'device_id': deviceId,
      };

  /// Total suara pada slot yang tampil saja, agar slot kosong dari paslon yang
  /// tidak terdaftar tidak ikut membesarkan angka validasi.
  int totalOn(List<int> slots) =>
      slots.fold(invalid, (sum, nomor) => sum + votesOf(nomor));
}

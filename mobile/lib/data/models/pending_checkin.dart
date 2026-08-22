import '../../core/utils/json_utils.dart';

/// Check-in yang sudah tercatat di perangkat tetapi belum sampai ke server.
class PendingCheckin {
  const PendingCheckin({required this.nik, required this.waktuCheckin});

  final String nik;
  final String waktuCheckin;

  factory PendingCheckin.fromJson(Map<String, dynamic> json) => PendingCheckin(
        nik: asString(json['nik']),
        waktuCheckin: asString(json['waktu_checkin']),
      );

  Map<String, dynamic> toJson() => {
        'nik': nik,
        'waktu_checkin': waktuCheckin,
      };
}

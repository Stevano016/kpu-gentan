import '../../core/utils/json_utils.dart';

/// Tahapan pendataan pemilih.
///
/// Server hanya mengirim pemilih yang berhak memilih (DPT dan DPK); tahapan
/// lain masih dalam proses pendataan dan biasanya tidak sampai ke perangkat,
/// tetapi tetap dimodelkan agar rekap tidak diam-diam menghilangkan data.
enum VoterStage {
  dp4('dp4', 'DP4'),
  dps('dps', 'DPS'),
  dptb('dptb', 'DPTb'),
  dpt('dpt', 'DPT'),
  dpk('dpk', 'DPK');

  const VoterStage(this.code, this.label);

  final String code;
  final String label;

  static VoterStage fromCode(String? code) {
    final normalized = code?.toLowerCase().trim();
    for (final stage in values) {
      if (stage.code == normalized) return stage;
    }
    return VoterStage.dpt;
  }
}

/// Satu baris daftar pemilih beserta status kehadirannya.
///
/// Payload asli ikut disimpan agar penulisan ulang cache tidak menghapus kolom
/// baru dari server yang belum dipakai aplikasi.
class Voter {
  const Voter({
    required this.nik,
    required this.nama,
    required this.stage,
    required this.hadir,
    this.idPemilih,
    this.nkk,
    this.umur,
    this.jenisKelamin,
    this.statusKawin,
    this.pekerjaan,
    this.alamat,
    this.rt,
    this.rw,
    this.disabilitas,
    this.keterangan,
    this.waktuCheckin,
    Map<String, dynamic> raw = const {},
  }) : _raw = raw;

  final String nik;
  final String nama;
  final VoterStage stage;
  final bool hadir;
  final String? idPemilih;
  final String? nkk;
  final int? umur;
  final String? jenisKelamin;
  final String? statusKawin;
  final String? pekerjaan;
  final String? alamat;
  final String? rt;
  final String? rw;
  final String? disabilitas;
  final String? keterangan;
  final String? waktuCheckin;

  final Map<String, dynamic> _raw;

  factory Voter.fromJson(Map<String, dynamic> json) {
    // `tahapan` adalah kolom baru; `jenis_pemilih` dipertahankan agar cache
    // lama di perangkat yang belum sinkron ulang tetap terbaca.
    final stageCode = asStringOrNull(json['tahapan']) ??
        asStringOrNull(json['jenis_pemilih']);

    return Voter(
      nik: asString(json['nik']),
      nama: asString(json['nama']),
      stage: VoterStage.fromCode(stageCode),
      hadir: asBool(json['status_hadir']),
      idPemilih: asStringOrNull(json['id_pemilih']),
      nkk: asStringOrNull(json['nkk']),
      umur: asIntOrNull(json['umur']),
      jenisKelamin: asStringOrNull(json['jenis_kelamin']),
      statusKawin: asStringOrNull(json['status_kawin']),
      pekerjaan: asStringOrNull(json['pekerjaan']),
      alamat: asStringOrNull(json['alamat']),
      rt: asStringOrNull(json['rt']),
      rw: asStringOrNull(json['rw']),
      disabilitas: asStringOrNull(json['disabilitas']),
      keterangan: asStringOrNull(json['keterangan']),
      waktuCheckin: asStringOrNull(json['waktu_checkin']),
      raw: json,
    );
  }

  Map<String, dynamic> toJson() => {
        ..._raw,
        'nik': nik,
        'nama': nama,
        'status_hadir': hadir,
        'waktu_checkin': waktuCheckin,
      };

  Voter markHadir(String waktuCheckin) => Voter(
        nik: nik,
        nama: nama,
        stage: stage,
        hadir: true,
        idPemilih: idPemilih,
        nkk: nkk,
        umur: umur,
        jenisKelamin: jenisKelamin,
        statusKawin: statusKawin,
        pekerjaan: pekerjaan,
        alamat: alamat,
        rt: rt,
        rw: rw,
        disabilitas: disabilitas,
        keterangan: keterangan,
        waktuCheckin: waktuCheckin,
        raw: _raw,
      );

  /// Cocokkan terhadap NIK atau ID pemilih yang sudah dinormalkan huruf besar.
  bool matches(String query, {required bool byNik}) => byNik
      ? nik == query
      : idPemilih != null && idPemilih!.toUpperCase() == query;
}

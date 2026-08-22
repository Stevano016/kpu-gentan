/// Pembaca nilai JSON yang toleran terhadap perbedaan tipe.
///
/// Backend mengirim angka dan boolean kadang sebagai string (mis. `"1"`),
/// sementara cache lama di perangkat bisa menyimpan bentuk yang berbeda lagi.
library;

int? asIntOrNull(Object? value) {
  if (value is int) return value;
  if (value is num) return value.toInt();
  if (value is String) return int.tryParse(value.trim());
  return null;
}

int asInt(Object? value, {int fallback = 0}) => asIntOrNull(value) ?? fallback;

/// Menganggap `true`, `1`, dan `'1'` sebagai benar; sisanya salah.
bool asBool(Object? value) =>
    value == true || value == 1 || value == '1' || value == 'true';

String? asStringOrNull(Object? value) {
  if (value == null) return null;
  final text = value.toString().trim();
  return text.isEmpty ? null : text;
}

String asString(Object? value, {String fallback = ''}) =>
    asStringOrNull(value) ?? fallback;

/// Menyaring elemen list JSON yang benar-benar berupa objek.
List<Map<String, dynamic>> asObjectList(Object? value) {
  if (value is! List) return const [];
  return value
      .whereType<Map>()
      .map((e) => Map<String, dynamic>.from(e))
      .toList(growable: false);
}

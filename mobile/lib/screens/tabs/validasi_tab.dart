import 'package:flutter/material.dart';

class ValidasiTab extends StatelessWidget {
  final TextEditingController nikSearchController;
  final Map<String, dynamic>? foundVoter;
  final String? validationMessage;
  final bool validationSuccess;
  final String tpsName;
  final VoidCallback onScanQR;
  final ValueChanged<String> onSearch;
  final VoidCallback onCheckin;
  final VoidCallback onClear;

  const ValidasiTab({
    super.key,
    required this.nikSearchController,
    required this.foundVoter,
    required this.validationMessage,
    required this.validationSuccess,
    required this.tpsName,
    required this.onScanQR,
    required this.onSearch,
    required this.onCheckin,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF0D9488);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Scan Trigger Options
          Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: onScanQR,
                  icon: const Icon(Icons.camera_alt),
                  label: const Text('Scan QR Pemilih', style: TextStyle(fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: tealColor,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Center(child: Text('atau cari manual', style: TextStyle(color: Colors.grey, fontSize: 12))),
          const SizedBox(height: 16),

          // Manual NIK input
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: nikSearchController,
                  keyboardType: TextInputType.text,
                  decoration: InputDecoration(
                    hintText: 'Masukkan ID Pemilih (USH-GTN-026...)',
                    border: const OutlineInputBorder(),
                    counterText: '',
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: onClear,
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () => onSearch(nikSearchController.text),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                  backgroundColor: const Color(0xFF1F2937),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: const Icon(Icons.search),
              ),
            ],
          ),
          const SizedBox(height: 24),

          // Validation Results UI
          if (validationMessage != null && !validationSuccess) ...[
            Card(
              color: const Color(0xFFFEF2F2),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: Color(0xFFFCA5A5)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, color: Color(0xFFB91C1C)),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        validationMessage!,
                        style: const TextStyle(color: Color(0xFFB91C1C), fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          if (validationSuccess && validationMessage != null) ...[
            Card(
              color: const Color(0xFFECFDF5),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
                side: const BorderSide(color: Color(0xFF6EE7B7)),
              ),
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.check_circle_outline, color: Color(0xFF059669)),
                        SizedBox(width: 12),
                        Text('VALIDASI BERHASIL', style: TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.bold, fontSize: 16)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(validationMessage!, style: const TextStyle(color: Color(0xFF047857), fontSize: 14)),
                    const SizedBox(height: 8),
                    const Text('Data tersimpan secara lokal dan siap disinkronkan.', style: TextStyle(color: Color(0xFF065F46), fontSize: 12)),
                  ],
                ),
              ),
            ),
          ],

          if (foundVoter != null) ...[
            const SizedBox(height: 12),
            Card(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: Color(0xFFE5E7EB)),
              ),
              color: Colors.white,
              child: Padding(
                padding: const EdgeInsets.all(20.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const Text('Detail Data Pemilih', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF374151))),
                    const Divider(height: 24),
                    _buildDetailRow('Nama Lengkap', foundVoter!['nama']),
                    _buildDetailRow('ID Pemilih', foundVoter!['id_pemilih'] ?? '-'),
                    _buildDetailRow('NIK Pemilih', foundVoter!['nik']),
                    _buildDetailRow('NKK Pemilih', foundVoter!['nkk'] ?? '-'),
                    _buildDetailRow('Alokasi TPS', tpsName),
                    _buildDetailRow('Umur', foundVoter!['umur'] != null ? '${foundVoter!['umur']} Tahun' : '-'),
                    _buildDetailRow('Jenis Kelamin', foundVoter!['jenis_kelamin'] ?? '-'),
                    _buildDetailRow('Status Kawin', foundVoter!['status_kawin'] ?? '-'),
                    _buildDetailRow('Pekerjaan', foundVoter!['pekerjaan'] ?? '-'),
                    _buildDetailRow('Alamat', foundVoter!['alamat'] ?? '-'),
                    _buildDetailRow('RT / RW', 'RT ${foundVoter!['rt'] ?? '-'} / RW ${foundVoter!['rw'] ?? '-'}'),
                    _buildDetailRow('Disabilitas', foundVoter!['disabilitas'] ?? '-'),
                    _buildDetailRow('Keterangan', foundVoter!['keterangan'] ?? '-'),
                    const SizedBox(height: 24),

                    if (foundVoter!['status_hadir'] == true || foundVoter!['status_hadir'] == 1 || foundVoter!['status_hadir'] == '1') ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFEF3C7),
                          border: Border.all(color: const Color(0xFFFCD34D)),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Color(0xFFD97706)),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'PERINGATAN: Pemilih sudah check-in kehadiran pada pukul ${foundVoter!['waktu_checkin'] != null ? DateTime.parse(foundVoter!['waktu_checkin']).toLocal().toString().substring(11, 16) : '-'}!',
                                style: const TextStyle(color: Color(0xFFB45309), fontSize: 12, fontWeight: FontWeight.bold),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ] else ...[
                      ElevatedButton(
                        onPressed: onCheckin,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: tealColor,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                        ),
                        child: const Text('Konfirmasi Kehadiran Pemilih', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ]
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label, style: const TextStyle(color: Colors.grey, fontSize: 13)),
          ),
          Expanded(
            child: Text(value, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13, color: Color(0xFF1F2937))),
          ),
        ],
      ),
    );
  }
}

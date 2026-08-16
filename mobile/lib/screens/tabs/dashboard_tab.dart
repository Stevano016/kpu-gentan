import 'package:flutter/material.dart';
import '../../utils/paslon_helper.dart';

class DashboardTab extends StatelessWidget {
  final String tpsName;
  final int totalDptCount;
  final int totalDpkCount;
  final int totalDpsCount;
  final int totalDptbCount;
  final int hadirDptCount;
  final int hadirDpkCount;
  final int hadirDpsCount;
  final int hadirDptbCount;
  final double hadirPercentage;
  final bool isQcLocked;
  final String qcStatusText;
  final TextEditingController k1Controller;
  final TextEditingController k2Controller;
  final TextEditingController k3Controller;
  final TextEditingController invalidController;
  final List<dynamic> paslons;

  const DashboardTab({
    super.key,
    required this.tpsName,
    required this.totalDptCount,
    required this.totalDpkCount,
    required this.totalDpsCount,
    required this.totalDptbCount,
    required this.hadirDptCount,
    required this.hadirDpkCount,
    required this.hadirDpsCount,
    required this.hadirDptbCount,
    required this.hadirPercentage,
    required this.isQcLocked,
    required this.qcStatusText,
    required this.k1Controller,
    required this.k2Controller,
    required this.k3Controller,
    required this.invalidController,
    required this.paslons,
  });

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF0D9488);
    final totalVoters = totalDptCount + totalDpkCount + totalDpsCount + totalDptbCount;
    final totalHadir = hadirDptCount + hadirDpkCount + hadirDpsCount + hadirDptbCount;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Welcome Card
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            color: Colors.white,
            elevation: 0,
            child: Padding(
              padding: const EdgeInsets.all(20.0),
              child: Row(
                children: [
                  Image.asset('assets/images/logo.png', height: 64, width: 64, fit: BoxFit.contain),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Halo KPPS!',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF111827)),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Selamat datang kembali di panel monitoring KPPS. Semua aktivitas check-in di $tpsName tersimpan otomatis.',
                          style: const TextStyle(color: Color(0xFF4B5563), fontSize: 12, height: 1.4),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Grid Rows for Total and Checked-In
          Row(
            children: [
              Expanded(
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFECFDF5),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.people, color: tealColor),
                        ),
                        const SizedBox(height: 12),
                        const Text('Total Pemilih', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          '$totalVoters',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                        ),
                        Text('DPT: $totalDptCount | DPK: $totalDpkCount | DPS: $totalDpsCount | DPTb: $totalDptbCount', style: const TextStyle(color: Colors.grey, fontSize: 8)),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Card(
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE5E7EB)),
                  ),
                  color: Colors.white,
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: const Color(0xFFEFF6FF),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: const Icon(Icons.check_circle, color: Colors.blue),
                        ),
                        const SizedBox(height: 12),
                        const Text('Kehadiran (Check-In)', style: TextStyle(color: Colors.grey, fontSize: 12)),
                        const SizedBox(height: 4),
                        Text(
                          '$totalHadir',
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                        ),
                        Text('DPT: $hadirDptCount | DPK: $hadirDpkCount | DPS: $hadirDpsCount | DPTb: $hadirDptbCount', style: const TextStyle(color: Colors.grey, fontSize: 8)),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Progress Circle Card
          Card(
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
              side: const BorderSide(color: Color(0xFFE5E7EB)),
            ),
            color: Colors.white,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                children: [
                  const Text(
                    'Persentase Partisipasi Pemilih',
                    style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF374151)),
                  ),
                  const SizedBox(height: 24),
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 130,
                        height: 130,
                        child: CircularProgressIndicator(
                          value: totalVoters > 0 ? (totalHadir / totalVoters) : 0,
                          strokeWidth: 12,
                          backgroundColor: Colors.grey[200],
                          valueColor: const AlwaysStoppedAnimation<Color>(tealColor),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '${hadirPercentage.toStringAsFixed(1)}%',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 24, color: Color(0xFF1F2937)),
                          ),
                          const SizedBox(height: 2),
                          const Text('Kehadiran', style: TextStyle(color: Colors.grey, fontSize: 11)),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    '$totalHadir dari $totalVoters pemilih telah menggunakan hak pilih.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Quick Count Results Card
          Builder(
            builder: (context) {
              final votes = <int, int>{
                1: int.tryParse(k1Controller.text) ?? 0,
                2: int.tryParse(k2Controller.text) ?? 0,
                3: int.tryParse(k3Controller.text) ?? 0,
              };
              final qcInvalid = int.tryParse(invalidController.text) ?? 0;
              final qcTotal = votes.values.fold(0, (a, b) => a + b) + qcInvalid;
              final slots = visiblePaslonSlots(paslons, (n) => votes[n] ?? 0);

              return Card(
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
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Expanded(
                            child: Text(
                              'Hasil Perolehan Suara TPS',
                              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF374151)),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            decoration: BoxDecoration(
                              color: isQcLocked ? const Color(0xFFECFDF5) : const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Text(
                              qcStatusText.replaceAll(' (Terkunci)', '').replaceAll(' (Belum Submit)', ''),
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: isQcLocked ? const Color(0xFF059669) : const Color(0xFFD97706),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const Divider(height: 24),
                      for (final nomor in slots) ...[
                        _buildQuickCountRow(
                          paslonLabel(paslons, nomor),
                          votes[nomor] ?? 0,
                          qcTotal,
                          paslonColor(nomor),
                        ),
                        const SizedBox(height: 12),
                      ],
                      _buildQuickCountRow('Suara Tidak Sah', qcInvalid, qcTotal, Colors.grey),
                      const Divider(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'Total Suara Masuk',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: Color(0xFF374151)),
                          ),
                          Text(
                            '$qcTotal suara',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14, color: Color(0xFF111827)),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              );
            }
          ),
        ],
      ),
    );
  }

  Widget _buildQuickCountRow(String label, int votes, int total, Color color) {
    final double percentage = total > 0 ? (votes / total) : 0.0;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Text(
                label,
                style: const TextStyle(fontSize: 12, color: Color(0xFF4B5563)),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '$votes suara (${(percentage * 100).toStringAsFixed(1)}%)',
              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: Color(0xFF1F2937)),
            ),
          ],
        ),
        const SizedBox(height: 6),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage,
            minHeight: 8,
            backgroundColor: const Color(0xFFF3F4F6),
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }
}

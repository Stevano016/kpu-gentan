import 'dart:async';

import 'package:flutter/material.dart';
import '../../utils/paslon_helper.dart';

class QuickCountTab extends StatelessWidget {
  final String qcStatusText;
  final bool isQcLocked;
  final TextEditingController k1Controller;
  final TextEditingController k2Controller;
  final TextEditingController k3Controller;
  final TextEditingController invalidController;
  final bool syncingInProgress;
  final String? syncAction;
  final VoidCallback onSubmitDraft;
  final VoidCallback onSubmitFinal;
  final List<dynamic> paslons;

  const QuickCountTab({
    super.key,
    required this.qcStatusText,
    required this.isQcLocked,
    required this.k1Controller,
    required this.k2Controller,
    required this.k3Controller,
    required this.invalidController,
    required this.syncingInProgress,
    required this.syncAction,
    required this.onSubmitDraft,
    required this.onSubmitFinal,
    required this.paslons,
  });

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF0D9488);
    final votes = <int, int>{
      1: int.tryParse(k1Controller.text) ?? 0,
      2: int.tryParse(k2Controller.text) ?? 0,
      3: int.tryParse(k3Controller.text) ?? 0,
    };
    final controllers = <int, TextEditingController>{
      1: k1Controller,
      2: k2Controller,
      3: k3Controller,
    };
    final slots = visiblePaslonSlots(paslons, (n) => votes[n] ?? 0);
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Input Perolehan Suara',
                          style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Color(0xFF374151)),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isQcLocked ? const Color(0xFFF3F4F6) : const Color(0xFFFEF3C7),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          qcStatusText.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                            color: isQcLocked ? Colors.grey[700] : const Color(0xFFD97706),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const Divider(height: 24),
                  
                  for (final nomor in slots) ...[
                    _buildCountInputField(paslonLabel(paslons, nomor), controllers[nomor]!, isQcLocked),
                    const SizedBox(height: 12),
                  ],
                  _buildCountInputField('Suara Tidak Sah', invalidController, isQcLocked),
                  
                  const SizedBox(height: 24),

                  if (!isQcLocked) ...[
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: syncingInProgress ? null : onSubmitDraft,
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: syncAction == 'draft'
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(tealColor),
                                    ),
                                  )
                                : const Text('Simpan Draft'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: syncingInProgress ? null : onSubmitFinal,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: tealColor,
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                            ),
                            child: syncAction == 'final'
                                ? const SizedBox(
                                    width: 16,
                                    height: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                    ),
                                  )
                                : const Text('Submit Final', style: TextStyle(fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCountInputField(String label, TextEditingController controller, bool locked) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Text(
            label,
            style: const TextStyle(fontWeight: FontWeight.w500),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ),
        const SizedBox(width: 12),
        StepperAngka(controller: controller, aktif: !locked),
      ],
    );
  }
}

/// Penghitung suara dengan tombol tambah dan kurang.
///
/// Angkanya tetap disimpan di [TextEditingController] yang sama seperti saat
/// masih diketik, supaya logika penyimpanan draft dan submit di layar induk
/// tidak perlu ikut berubah.
///
/// Tombolnya bisa ditekan-tahan: perolehan suara satu TPS bisa ratusan, dan
/// mengharuskan petugas mengetuk ratusan kali jelas tidak masuk akal.
class StepperAngka extends StatefulWidget {
  final TextEditingController controller;
  final bool aktif;

  const StepperAngka({super.key, required this.controller, required this.aktif});

  @override
  State<StepperAngka> createState() => _StepperAngkaState();
}

class _StepperAngkaState extends State<StepperAngka> {
  Timer? _pengulang;

  @override
  void dispose() {
    _pengulang?.cancel();
    super.dispose();
  }

  int get _nilai => int.tryParse(widget.controller.text.trim()) ?? 0;

  void _ubah(int selisih) {
    // Suara tidak mungkin negatif.
    final baru = (_nilai + selisih).clamp(0, 999999);
    widget.controller.text = baru.toString();
  }

  void _mulaiUlang(int selisih) {
    _ubah(selisih);
    _pengulang?.cancel();
    _pengulang = Timer.periodic(const Duration(milliseconds: 90), (_) => _ubah(selisih));
  }

  void _berhenti() {
    _pengulang?.cancel();
    _pengulang = null;
  }

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF0D9488);

    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: const Color(0xFFD1D5DB)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _tombol(
            ikon: Icons.remove,
            aktif: widget.aktif,
            selisih: -1,
            warna: const Color(0xFFB91C1C),
          ),
          // Angkanya ikut berubah tanpa perlu setState karena controller
          // memang sudah berupa notifier.
          ValueListenableBuilder<TextEditingValue>(
            valueListenable: widget.controller,
            builder: (context, value, _) {
              final angka = int.tryParse(value.text.trim()) ?? 0;
              return Container(
                constraints: const BoxConstraints(minWidth: 56),
                alignment: Alignment.center,
                padding: const EdgeInsets.symmetric(vertical: 10),
                child: Text(
                  '$angka',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: widget.aktif ? const Color(0xFF111827) : Colors.grey,
                  ),
                ),
              );
            },
          ),
          _tombol(
            ikon: Icons.add,
            aktif: widget.aktif,
            selisih: 1,
            warna: tealColor,
          ),
        ],
      ),
    );
  }

  Widget _tombol({
    required IconData ikon,
    required bool aktif,
    required int selisih,
    required Color warna,
  }) {
    return GestureDetector(
      onLongPressStart: aktif ? (_) => _mulaiUlang(selisih) : null,
      onLongPressEnd: aktif ? (_) => _berhenti() : null,
      onLongPressCancel: aktif ? _berhenti : null,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: aktif ? () => _ubah(selisih) : null,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Icon(
              ikon,
              size: 22,
              color: aktif ? warna : Colors.grey[400],
            ),
          ),
        ),
      ),
    );
  }
}

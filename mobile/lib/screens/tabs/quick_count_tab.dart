import 'package:flutter/material.dart';

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
  });

  @override
  Widget build(BuildContext context) {
    const tealColor = Color(0xFF0D9488);
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
                  
                  _buildCountInputField('Paslon 01 (Budi - Ami)', k1Controller, isQcLocked),
                  const SizedBox(height: 12),
                  _buildCountInputField('Paslon 02 (Candra - Dodi)', k2Controller, isQcLocked),
                  const SizedBox(height: 12),
                  _buildCountInputField('Paslon 03 (Eka - Fani)', k3Controller, isQcLocked),
                  const SizedBox(height: 12),
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
        SizedBox(
          width: 100,
          child: TextField(
            controller: controller,
            keyboardType: TextInputType.number,
            textAlign: TextAlign.center,
            enabled: !locked,
            decoration: const InputDecoration(
              contentPadding: EdgeInsets.symmetric(vertical: 8),
              border: OutlineInputBorder(),
            ),
          ),
        ),
      ],
    );
  }
}

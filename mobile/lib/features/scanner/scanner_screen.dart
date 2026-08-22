import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

import 'widgets/manual_code_entry.dart';
import 'widgets/scanner_frame.dart';

/// Pemindai QR kartu pemilih.
///
/// Menutup diri sambil mengembalikan isi QR ke layar pemanggil.
class ScannerScreen extends StatefulWidget {
  const ScannerScreen({super.key});

  @override
  State<ScannerScreen> createState() => _ScannerScreenState();
}

class _ScannerScreenState extends State<ScannerScreen> {
  final MobileScannerController _controller = MobileScannerController(
    detectionSpeed: DetectionSpeed.noDuplicates,
    facing: CameraFacing.back,
  );

  bool _handled = false;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Menerima satu kode saja; pemindaian berikutnya diabaikan agar layar tidak
  /// menutup dua kali.
  void _accept(String code) {
    if (_handled || code.isEmpty) return;
    _handled = true;
    _controller.stop();
    Navigator.pop(context, code);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Scan QR Code Pemilih',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on),
            onPressed: _controller.toggleTorch,
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_android),
            onPressed: _controller.switchCamera,
          ),
        ],
      ),
      body: Stack(
        children: [
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              final code = capture.barcodes.isEmpty
                  ? null
                  : capture.barcodes.first.rawValue;
              if (code != null) _accept(code);
            },
            errorBuilder: (context, error) =>
                ManualCodeEntry(onSubmit: _accept),
          ),
          const ScannerFrame(),
          const Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(bottom: 48),
              child: Text(
                'Tempatkan QR Code di dalam kotak',
                style: TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  backgroundColor: Colors.black45,
                  fontSize: 14,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

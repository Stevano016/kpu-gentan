import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';

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

  bool _isScanned = false;
  final TextEditingController _simController = TextEditingController();

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final tealColor = const Color(0xFF0D9488);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan QR Code Pemilih', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        backgroundColor: tealColor,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(
            icon: const Icon(Icons.flash_on, color: Colors.white),
            onPressed: () => _controller.toggleTorch(),
          ),
          IconButton(
            icon: const Icon(Icons.flip_camera_android, color: Colors.white),
            onPressed: () => _controller.switchCamera(),
          ),
        ],
      ),
      body: Stack(
        children: [
          // 1. Mobile Scanner View
          MobileScanner(
            controller: _controller,
            onDetect: (capture) {
              if (_isScanned) return;
              final List<Barcode> barcodes = capture.barcodes;
              if (barcodes.isNotEmpty) {
                final String? code = barcodes.first.rawValue;
                if (code != null && code.isNotEmpty) {
                  setState(() {
                    _isScanned = true;
                  });
                  _controller.stop();
                  Navigator.pop(context, code);
                }
              }
            },
            errorBuilder: (context, error) {
              // Return mock input when camera is unavailable (emulator or desktop)
              return Container(
                color: const Color(0xFF1F2937),
                padding: const EdgeInsets.all(24.0),
                child: Center(
                  child: Card(
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    color: Colors.white,
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.videocam_off, size: 48, color: Colors.grey[600]),
                          const SizedBox(height: 16),
                          const Text(
                            'Kamera Tidak Tersedia',
                            style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Kamera fisik tidak terdeteksi (Emulator/PC). Silakan ketik payload QR secara manual untuk simulasi scan.',
                            textAlign: TextAlign.center,
                            style: TextStyle(fontSize: 12, color: Colors.grey),
                          ),
                          const SizedBox(height: 20),
                          TextField(
                            controller: _simController,
                            decoration: const InputDecoration(
                              labelText: 'Simulasi Payload QR / ID Pemilih',
                              border: OutlineInputBorder(),
                              hintText: 'USH-GTN-0260001',
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: () {
                              final text = _simController.text.trim();
                              if (text.isNotEmpty) {
                                Navigator.pop(context, text);
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: tealColor,
                              foregroundColor: Colors.white,
                              minimumSize: const Size.fromHeight(44),
                            ),
                            child: const Text('Simulasi Scan QR', style: TextStyle(fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
          
          // 2. Camera Viewfinder Overlay (Only visible if camera is working)
          // We can show a scan frame in the center
          Center(
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.white, width: 2),
                borderRadius: BorderRadius.circular(16),
                boxShadow: const [
                  BoxShadow(
                    color: Colors.black38,
                    blurRadius: 10,
                    spreadRadius: 5,
                  )
                ],
              ),
              child: Stack(
                children: [
                  Positioned(
                    top: 10,
                    left: 10,
                    child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.greenAccent, width: 4), left: BorderSide(color: Colors.greenAccent, width: 4)))),
                  ),
                  Positioned(
                    top: 10,
                    right: 10,
                    child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(top: BorderSide(color: Colors.greenAccent, width: 4), right: BorderSide(color: Colors.greenAccent, width: 4)))),
                  ),
                  Positioned(
                    bottom: 10,
                    left: 10,
                    child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.greenAccent, width: 4), left: BorderSide(color: Colors.greenAccent, width: 4)))),
                  ),
                  Positioned(
                    bottom: 10,
                    right: 10,
                    child: Container(width: 20, height: 20, decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Colors.greenAccent, width: 4), right: BorderSide(color: Colors.greenAccent, width: 4)))),
                  ),
                ],
              ),
            ),
          ),
          
          // Instruction label
          const Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: EdgeInsets.only(bottom: 48.0),
              child: Text(
                'Tempatkan QR Code di dalam kotak',
                style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, backgroundColor: Colors.black45, fontSize: 14),
              ),
            ),
          )
        ],
      ),
    );
  }
}

import 'package:flutter/material.dart';

/// Bingkai bidik di tengah layar kamera.
class ScannerFrame extends StatelessWidget {
  const ScannerFrame({super.key, this.size = 260});

  final double size;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.white, width: 2),
          borderRadius: BorderRadius.circular(16),
          boxShadow: const [
            BoxShadow(
              color: Colors.black38,
              blurRadius: 10,
              spreadRadius: 5,
            ),
          ],
        ),
        child: const Stack(
          children: [
            Positioned(top: 10, left: 10, child: _Corner(top: true, left: true)),
            Positioned(
              top: 10,
              right: 10,
              child: _Corner(top: true, left: false),
            ),
            Positioned(
              bottom: 10,
              left: 10,
              child: _Corner(top: false, left: true),
            ),
            Positioned(
              bottom: 10,
              right: 10,
              child: _Corner(top: false, left: false),
            ),
          ],
        ),
      ),
    );
  }
}

/// Siku penanda sudut bingkai.
class _Corner extends StatelessWidget {
  const _Corner({required this.top, required this.left});

  final bool top;
  final bool left;

  static const BorderSide _side =
      BorderSide(color: Colors.greenAccent, width: 4);

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 20,
      height: 20,
      decoration: BoxDecoration(
        border: Border(
          top: top ? _side : BorderSide.none,
          bottom: top ? BorderSide.none : _side,
          left: left ? _side : BorderSide.none,
          right: left ? BorderSide.none : _side,
        ),
      ),
    );
  }
}

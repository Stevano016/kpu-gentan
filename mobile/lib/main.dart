import 'package:flutter/material.dart';

import 'app.dart';
import 'data/sources/session_store.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Sesi dibaca serentak di banyak tempat, jadi penyimpanannya dibuka sekali
  // di sini sebelum widget pertama dibangun.
  await SessionStore().init();

  runApp(const KppsApp());
}

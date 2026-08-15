import 'package:flutter/material.dart';
import 'services/local_storage_service.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Local Storage Service
  final storage = LocalStorageService();
  await storage.init();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final storage = LocalStorageService();
    final token = storage.getToken();

    return MaterialApp(
      title: 'KPPS Gentan',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0D9488),
          primary: const Color(0xFF0D9488),
          secondary: const Color(0xFF14B8A6),
        ),
        fontFamily: 'sans-serif',
      ),
      // Automatically route to HomeScreen if token exists, else show LoginScreen
      home: token != null ? const HomeScreen() : const LoginScreen(),
    );
  }
}

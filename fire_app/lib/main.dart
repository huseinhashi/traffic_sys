// lib/main.dart
import 'package:flutter/material.dart';
import 'package:fire_app/screens/auth/login_screen.dart';
import 'package:provider/provider.dart';
import 'package:fire_app/providers/auth_provider.dart';
import 'package:fire_app/providers/posts_provider.dart';
import 'package:fire_app/providers/conversations_provider.dart';
import 'package:fire_app/screens/auth/register_screen.dart';
import 'package:fire_app/screens/splash_screen.dart';
import 'package:fire_app/screens/dashboard_screen.dart';
import 'package:mapbox_maps_flutter/mapbox_maps_flutter.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Mapbox with your access token
  try {
    MapboxOptions.setAccessToken(
        "pk.eyJ1IjoiaHVzZWluaGFzaGkiLCJhIjoiY205dGZnamowMGJpcTJscjZ1d3MwbW44diJ9.rPualb13tYJzXX_1vSXBGg");
    print("Mapbox token set successfully");
  } catch (e) {
    print("Error setting Mapbox token: $e");
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PostsProvider()),
        ChangeNotifierProvider(create: (_) => ConversationsProvider()),
      ],
      child: Consumer<AuthProvider>(
        builder: (context, authProvider, _) {
          return MaterialApp(
            title: 'Traffic Jam',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.green,
                primary: Colors.green,
                secondary: const Color(0xFFFFA000),
                surface: Colors.white,
                background: const Color(0xFFF5F5F5),
                onPrimary: Colors.white,
                onSecondary: Colors.black,
                onSurface: Colors.black,
                onBackground: Colors.black,
                brightness: Brightness.light,
              ),
              useMaterial3: true,
              appBarTheme: const AppBarTheme(
                centerTitle: true,
                elevation: 0,
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8)),
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
              ),
            ),
            routes: {
              '/login': (context) => const LoginScreen(),
              '/register': (context) => const RegisterScreen(),
              '/dashboard': (context) => const DashboardScreen(),
            },
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:location/location.dart';
import 'package:shared_preferences/shared_preferences.dart';

class LocationProvider extends ChangeNotifier {
  double? _latitude;
  double? _longitude;
  bool _isLoading = false;
  String? _error;

  double? get latitude => _latitude;
  double? get longitude => _longitude;
  bool get isLoading => _isLoading;
  String? get error => _error;

  final Location _location = Location();

  Future<void> initializeLocation() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      bool serviceEnabled = await _location.serviceEnabled();
      if (!serviceEnabled) {
        serviceEnabled = await _location.requestService();
        if (!serviceEnabled) {
          throw Exception('Location service is disabled');
        }
      }
      PermissionStatus permissionGranted = await _location.hasPermission();
      if (permissionGranted == PermissionStatus.denied) {
        permissionGranted = await _location.requestPermission();
        if (permissionGranted != PermissionStatus.granted) {
          throw Exception('Location permission denied');
        }
      }
      LocationData locationData = await _location.getLocation();
      _latitude = locationData.latitude;
      _longitude = locationData.longitude;
      await _saveToPrefs();
    } catch (e) {
      _error = 'Failed to get location: $e';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refreshLocation() async {
    await initializeLocation();
  }

  Future<void> loadFromPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    _latitude = prefs.getDouble('latitude');
    _longitude = prefs.getDouble('longitude');
    notifyListeners();
  }

  Future<void> _saveToPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (_latitude != null) {
      await prefs.setDouble('latitude', _latitude!);
    }
    if (_longitude != null) {
      await prefs.setDouble('longitude', _longitude!);
    }
  }
}

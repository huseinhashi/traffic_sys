// lib/services/auth_service.dart
import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:traffic_app/services/api_client.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';

class AuthService {
  static final AuthService _instance = AuthService._internal();
  final ApiClient _apiClient = ApiClient();

  // Auth state change notifier
  final ValueNotifier<bool> authStateChanges = ValueNotifier<bool>(false);

  // Store user data directly
  Map<String, dynamic>? _userData;
  String? _token;

  // Getters
  Map<String, dynamic>? get userData => _userData;
  String? get token => _token;
  bool get isAuthenticated => _token != null;

  // Singleton factory
  factory AuthService() => _instance;

  AuthService._internal();

  // Initialize the service by loading saved data
  Future<void> initialize() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _token = prefs.getString('token');

      // Parse stored user data if available
      final userDataString = prefs.getString('userData');
      if (userDataString != null) {
        _userData = jsonDecode(userDataString) as Map<String, dynamic>;
      }

      if (_token != null) {
        _apiClient.setToken(_token!);
      }

      // Notify listeners about auth state
      authStateChanges.value = isAuthenticated;
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing auth service: $e');
      }
      rethrow;
    }
  }

  // User Registration
  Future<Map<String, dynamic>> registerUser(
    String name,
    String email,
    String password,
    File? avatarFile,
  ) async {
    try {
      FormData? formData;

      if (avatarFile != null) {
        // Get the file extension to determine MIME type
        final extension = avatarFile.path.split('.').last.toLowerCase();
        String mimeType;

        switch (extension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg'; // Default fallback
        }

        formData = FormData.fromMap({
          'name': name,
          'email': email,
          'password': password,
          'avatar': await MultipartFile.fromFile(
            avatarFile.path,
            filename: avatarFile.path.split('/').last,
            contentType: MediaType.parse(mimeType),
          ),
        });
      }

      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/register',
        formData: formData,
        data: avatarFile == null
            ? {
                'name': name,
                'email': email,
                'password': password,
              }
            : null,
      );

      // If registration is successful and data contains auth token, handle as login
      if (response['success'] &&
          response['data'] != null &&
          response['data']['admintoken'] != null) {
        await _handleLoginSuccess(response['data']);
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during registration: $e',
      };
    }
  }

  // User Login
  Future<Map<String, dynamic>> loginUser(String email, String password) async {
    try {
      final response = await _apiClient.request(
        method: 'POST',
        path: '/auth/login',
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response['success']) {
        await _handleLoginSuccess(response['data']);
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during login: $e',
      };
    }
  }

  // Handle successful login
  Future<void> _handleLoginSuccess(Map<String, dynamic> data) async {
    _token = data['admintoken'];

    // Store user data
    _userData = data['user'] as Map<String, dynamic>;

    // Set token in API client with Bearer prefix
    _apiClient.setToken(_token!);

    // Save to SharedPreferences
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', _token!);

    // Save user data as well
    if (_userData != null) {
      await prefs.setString('userData', jsonEncode(_userData));
    }

    // Notify listeners
    authStateChanges.value = true;
  }

  // Logout
  Future<Map<String, dynamic>> logout() async {
    try {
      // Clear data
      _token = null;
      _userData = null;

      // Clear token in API client
      _apiClient.clearToken();

      // Clear SharedPreferences
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('token');
      await prefs.remove('userData');

      // Notify listeners
      authStateChanges.value = false;

      return {
        'success': true,
        'message': 'Logged out successfully',
      };
    } catch (e) {
      return {
        'success': false,
        'message': 'Error during logout: $e',
      };
    }
  }

  // Update profile
  Future<Map<String, dynamic>> updateProfile({
    String? name,
    String? email,
    String? currentPassword,
    String? newPassword,
    File? avatarFile,
  }) async {
    try {
      FormData? formData;
      Map<String, dynamic>? data;

      if (avatarFile != null) {
        // Get the file extension to determine MIME type
        final extension = avatarFile.path.split('.').last.toLowerCase();
        String mimeType;

        switch (extension) {
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'webp':
            mimeType = 'image/webp';
            break;
          default:
            mimeType = 'image/jpeg'; // Default fallback
        }

        formData = FormData.fromMap({
          if (name != null) 'name': name,
          if (email != null) 'email': email,
          if (currentPassword != null) 'current_password': currentPassword,
          if (newPassword != null) 'new_password': newPassword,
          'avatar': await MultipartFile.fromFile(
            avatarFile.path,
            filename: avatarFile.path.split('/').last,
            contentType: MediaType.parse(mimeType),
          ),
        });
      } else {
        data = {};
        if (name != null) data['name'] = name;
        if (email != null) data['email'] = email;
        if (currentPassword != null) data['current_password'] = currentPassword;
        if (newPassword != null) data['new_password'] = newPassword;
      }

      final response = await _apiClient.request(
        method: 'PUT',
        path: '/users/profile',
        data: data,
        formData: formData,
      );

      // Update local user data if successful
      if (response['success'] && response['data'] != null) {
        _userData = response['data'] as Map<String, dynamic>;
        // Save updated user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userData', jsonEncode(_userData));
      }

      return response;
    } catch (e) {
      return {
        'success': false,
        'message': 'Error updating profile: $e',
      };
    }
  }
}

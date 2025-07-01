import 'package:fire_app/services/api_client.dart';

class UsersService {
  final ApiClient _apiClient = ApiClient();

  // Get all users (for creating conversations)
  Future<Map<String, dynamic>> getAllUsers() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/users/public',
    );
  }

  // Get current user profile
  Future<Map<String, dynamic>> getCurrentUser() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/users/profile',
    );
  }
}

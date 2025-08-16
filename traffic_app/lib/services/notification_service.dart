import 'package:traffic_app/services/api_client.dart';

class NotificationService {
  final ApiClient _apiClient = ApiClient();

  // Get all notifications for current user
  Future<Map<String, dynamic>> getNotifications() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/notifications',
    );
  }

  // Get notification by ID
  Future<Map<String, dynamic>> getNotificationById(String id) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/notifications/$id',
    );
  }

  // Mark notification as read
  Future<Map<String, dynamic>> markAsRead(String id) async {
    return await _apiClient.request(
      method: 'PATCH',
      path: '/notifications/$id/read',
    );
  }

  // Mark all notifications as read
  Future<Map<String, dynamic>> markAllAsRead() async {
    return await _apiClient.request(
      method: 'PATCH',
      path: '/notifications/read-all',
    );
  }

  // Delete notification
  Future<Map<String, dynamic>> deleteNotification(String id) async {
    return await _apiClient.request(
      method: 'DELETE',
      path: '/notifications/$id',
    );
  }

  // Get notifications by type
  Future<Map<String, dynamic>> getNotificationsByType(String type) async {
    return await _apiClient.request(
      method: 'GET',
      path: '/notifications/type/$type',
    );
  }

  // Get unread notifications
  Future<Map<String, dynamic>> getUnreadNotifications() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/notifications/unread',
    );
  }

  // Get unread notification count
  Future<Map<String, dynamic>> getUnreadCount() async {
    return await _apiClient.request(
      method: 'GET',
      path: '/notifications/count',
    );
  }

  // Create notification for nearby jam
  Future<Map<String, dynamic>> createNearbyJamNotification({
    required String jamPostId,
    required double userLatitude,
    required double userLongitude,
    double radius = 5000,
  }) async {
    return await _apiClient.request(
      method: 'POST',
      path: '/notifications/nearby-jam',
      data: {
        'jam_post_id': jamPostId,
        'user_latitude': userLatitude,
        'user_longitude': userLongitude,
        'radius': radius,
      },
    );
  }

  // Create general notification
  Future<Map<String, dynamic>> createNotification({
    required String message,
    required String type,
    String? jamPostId,
    double? distance,
  }) async {
    final data = <String, dynamic>{
      'message': message,
      'type': type,
    };

    if (jamPostId != null) {
      data['jam_post_id'] = jamPostId;
    }

    if (distance != null) {
      data['distance'] = distance;
    }

    return await _apiClient.request(
      method: 'POST',
      path: '/notifications',
      data: data,
    );
  }
} 
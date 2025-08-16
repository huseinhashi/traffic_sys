import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import '../services/notification_service.dart';

class NotificationProvider extends ChangeNotifier {
  final NotificationService _notificationService = NotificationService();
  
  List<Map<String, dynamic>> _notifications = [];
  bool _isLoading = false;
  String? _error;
  int _unreadCount = 0;

  List<Map<String, dynamic>> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _unreadCount;

  NotificationProvider() {
    fetchNotifications();
  }

  Future<void> fetchNotifications() async {
    try {
      _setLoading(true);
      _clearError();
      
      final response = await _notificationService.getNotifications();
      
      if (response['success']) {
        _notifications = List<Map<String, dynamic>>.from(response['data']);
        _updateUnreadCount();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to fetch notifications: $e');
    } finally {
      _setLoading(false);
    }
  }

  Future<void> refresh() async {
    await fetchNotifications();
  }

  Future<void> markAsRead(String notificationId) async {
    try {
      final response = await _notificationService.markAsRead(notificationId);
      
      if (response['success']) {
        // Update the notification in the list
        final index = _notifications.indexWhere((n) => n['id'].toString() == notificationId);
        if (index != -1) {
          _notifications[index]['is_read'] = true;
          _updateUnreadCount();
          notifyListeners();
        }
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to mark notification as read: $e');
    }
  }

  Future<void> markAllAsRead() async {
    try {
      final response = await _notificationService.markAllAsRead();
      
      if (response['success']) {
        // Mark all notifications as read in the list
        for (var notification in _notifications) {
          notification['is_read'] = true;
        }
        _updateUnreadCount();
        notifyListeners();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to mark all notifications as read: $e');
    }
  }

  Future<void> deleteNotification(String notificationId) async {
    try {
      final response = await _notificationService.deleteNotification(notificationId);
      
      if (response['success']) {
        // Remove the notification from the list
        _notifications.removeWhere((n) => n['id'].toString() == notificationId);
        _updateUnreadCount();
        notifyListeners();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to delete notification: $e');
    }
  }

  Future<void> getUnreadCount() async {
    try {
      final response = await _notificationService.getUnreadCount();
      
      if (response['success']) {
        _unreadCount = response['count'];
        notifyListeners();
      }
    } catch (e) {
      // Don't set error for count updates, just log
      if (kDebugMode) {
        print('Failed to get unread count: $e');
      }
    }
  }

  Future<void> createNearbyJamNotification({
    required String jamPostId,
    required double userLatitude,
    required double userLongitude,
    double radius = 5000,
  }) async {
    try {
      final response = await _notificationService.createNearbyJamNotification(
        jamPostId: jamPostId,
        userLatitude: userLatitude,
        userLongitude: userLongitude,
        radius: radius,
      );
      
      if (response['success']) {
        // Refresh notifications to include the new one
        await fetchNotifications();
      } else {
        _setError(response['message']);
      }
    } catch (e) {
      _setError('Failed to create nearby jam notification: $e');
    }
  }

  void _updateUnreadCount() {
    _unreadCount = _notifications.where((n) => n['is_read'] == false).length;
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String error) {
    _error = error;
    notifyListeners();
  }

  void _clearError() {
    _error = null;
    notifyListeners();
  }

  // Get notifications by type
  List<Map<String, dynamic>> getNotificationsByType(String type) {
    return _notifications.where((n) => n['type'] == type).toList();
  }

  // Get unread notifications
  List<Map<String, dynamic>> get unreadNotifications {
    return _notifications.where((n) => n['is_read'] == false).toList();
  }

  // Get nearby jam notifications
  List<Map<String, dynamic>> get nearbyJamNotifications {
    return _notifications.where((n) => n['type'] == 'nearby_jam').toList();
  }

  @override
  void dispose() {
    super.dispose();
  }
} 
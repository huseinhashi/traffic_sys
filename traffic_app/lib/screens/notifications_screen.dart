import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';
import '../widgets/notification_badge.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({Key? key}) : super(key: key);

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  @override
  void initState() {
    super.initState();
    // Refresh notifications when screen loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotificationProvider>(context, listen: false).refresh();
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: theme.colorScheme.surface,
        elevation: 0,
        actions: [
          Consumer<NotificationProvider>(
            builder: (context, notificationProvider, _) {
              if (notificationProvider.unreadCount > 0) {
                return TextButton(
                  onPressed: () async {
                    await notificationProvider.markAllAsRead();
                    if (mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('All notifications marked as read'),
                        ),
                      );
                    }
                  },
                  child: Text(
                    'Mark all read',
                    style: TextStyle(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotificationProvider>(
        builder: (context, notificationProvider, _) {
          if (notificationProvider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (notificationProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.error_outline,
                    size: 48,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    notificationProvider.error!,
                    style: const TextStyle(color: Colors.red),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => notificationProvider.refresh(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          if (notificationProvider.notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.notifications_none,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No notifications',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'You\'ll see notifications here when they arrive',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => notificationProvider.refresh(),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notificationProvider.notifications.length,
              itemBuilder: (context, index) {
                final notification = notificationProvider.notifications[index];
                final isUnread = notification['is_read'] == false;

                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  color: isUnread ? Colors.blue.withOpacity(0.05) : null,
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: _getNotificationColor(notification['type'])
                          .withOpacity(0.1),
                      child: Icon(
                        _getNotificationIcon(notification['type']),
                        color: _getNotificationColor(notification['type']),
                        size: 20,
                      ),
                    ),
                    title: Text(
                      notification['message'],
                      style: TextStyle(
                        fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                      ),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _formatDate(notification['createdAt']),
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        if (notification['distance'] != null)
                          Builder(
                            builder: (context) {
                              final distanceMeters = double.tryParse(notification['distance'].toString()) ?? 0.0;
                              return Text(
                                '${(distanceMeters / 1000).toStringAsFixed(1)}km away',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              );
                            },
                          ),
                      ],
                    ),
                    trailing: isUnread
                        ? Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              color: Colors.blue,
                              shape: BoxShape.circle,
                            ),
                          )
                        : null,
                    onTap: () {
                      if (isUnread) {
                        notificationProvider.markAsRead(notification['id'].toString());
                      }
                      
                      // If it's a nearby jam notification, navigate to nearby jams screen
                      if (notification['type'] == 'nearby_jam' && 
                          notification['jamPost'] != null) {
                        Navigator.pushNamed(context, '/nearby-jams');
                      }
                    },
                    onLongPress: () {
                      _showNotificationOptions(context, notification, notificationProvider);
                    },
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  String _formatDate(String dateStr) {
    final date = DateTime.parse(dateStr);
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inDays > 0) {
      return '${difference.inDays} day${difference.inDays > 1 ? 's' : ''} ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours} hour${difference.inHours > 1 ? 's' : ''} ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes} minute${difference.inMinutes > 1 ? 's' : ''} ago';
    } else {
      return 'Just now';
    }
  }

  IconData _getNotificationIcon(String type) {
    switch (type) {
      case 'nearby_jam':
        return Icons.traffic;
      case 'jam_update':
        return Icons.update;
      case 'jam_resolved':
        return Icons.check_circle;
      case 'general':
        return Icons.notifications;
      default:
        return Icons.notifications;
    }
  }

  Color _getNotificationColor(String type) {
    switch (type) {
      case 'nearby_jam':
        return Colors.orange;
      case 'jam_update':
        return Colors.blue;
      case 'jam_resolved':
        return Colors.green;
      case 'general':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  void _showNotificationOptions(
    BuildContext context,
    Map<String, dynamic> notification,
    NotificationProvider notificationProvider,
  ) {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Delete notification'),
              onTap: () {
                Navigator.pop(context);
                notificationProvider.deleteNotification(notification['id'].toString());
              },
            ),
            if (notification['is_read'] == false)
              ListTile(
                leading: const Icon(Icons.mark_email_read),
                title: const Text('Mark as read'),
                onTap: () {
                  Navigator.pop(context);
                  notificationProvider.markAsRead(notification['id'].toString());
                },
              ),
          ],
        ),
      ),
    );
  }
} 
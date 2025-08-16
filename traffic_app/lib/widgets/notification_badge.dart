import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/notification_provider.dart';

class NotificationBadge extends StatelessWidget {
  final Widget child;
  final double? size;
  final Color? badgeColor;
  final Color? textColor;

  const NotificationBadge({
    Key? key,
    required this.child,
    this.size,
    this.badgeColor,
    this.textColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Consumer<NotificationProvider>(
      builder: (context, notificationProvider, _) {
        final unreadCount = notificationProvider.unreadCount;
        
        if (unreadCount == 0) {
          return child;
        }

        return Stack(
          clipBehavior: Clip.none,
          children: [
            child,
            Positioned(
              right: -8,
              top: -8,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: badgeColor ?? Colors.red,
                  borderRadius: BorderRadius.circular(10),
                ),
                constraints: BoxConstraints(
                  minWidth: size ?? 20,
                  minHeight: size ?? 20,
                ),
                child: Text(
                  unreadCount > 99 ? '99+' : unreadCount.toString(),
                  style: TextStyle(
                    color: textColor ?? Colors.white,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        );
      },
    );
  }
} 
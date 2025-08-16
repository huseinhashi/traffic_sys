# Traffic System Notification System

This document describes the notification system implemented for the traffic jam application.

## Overview

The notification system provides real-time alerts for nearby traffic jams, allowing users to stay informed about traffic conditions in their area.

## Backend Implementation

### Models

#### Notification Model (`backend/models/notifications.model.js`)
- **Fields:**
  - `id`: Primary key
  - `user_id`: Foreign key to users table
  - `jam_post_id`: Foreign key to jam_posts table (optional)
  - `message`: Notification message text
  - `type`: Enum ('nearby_jam', 'jam_update', 'jam_resolved', 'general')
  - `is_read`: Boolean flag for read status
  - `distance`: Distance in meters from user to jam location
  - `createdAt`, `updatedAt`: Timestamps

### Controllers

#### Notification Controller (`backend/controllers/notificationController.js`)
Key functions:
- `createNotification`: Create a new notification
- `getNotifications`: Get all notifications for current user
- `getUnreadNotifications`: Get unread notifications
- `markNotificationAsRead`: Mark a notification as read
- `markAllNotificationsAsRead`: Mark all notifications as read
- `createNearbyJamNotification`: Create notification for nearby jam with distance calculation
- `getUnreadNotificationCount`: Get count of unread notifications

### Routes

#### Notification Routes (`backend/routes/notificationRoutes.js`)
- `POST /notifications`: Create notification
- `GET /notifications`: Get all notifications
- `GET /notifications/count`: Get unread count
- `GET /notifications/:id`: Get notification by ID
- `PATCH /notifications/:id/read`: Mark as read
- `PATCH /notifications/read-all`: Mark all as read
- `POST /notifications/nearby-jam`: Create nearby jam notification

## Frontend Implementation

### Providers

#### Notification Provider (`traffic_app/lib/providers/notification_provider.dart`)
- Manages notification state
- Handles API calls through NotificationService
- Provides methods for CRUD operations
- Tracks unread notification count

### Services

#### Notification Service (`traffic_app/lib/services/notification_service.dart`)
- Handles all API communication for notifications
- Manages authentication headers
- Provides error handling

### UI Components

#### Notification Badge (`traffic_app/lib/widgets/notification_badge.dart`)
- Displays unread notification count
- Shows red badge with count when there are unread notifications
- Integrates with NotificationProvider

#### Notifications Screen (`traffic_app/lib/screens/notifications_screen.dart`)
- Lists all notifications
- Shows notification details (message, type, distance, timestamp)
- Allows marking notifications as read
- Supports pull-to-refresh
- Navigation to nearby jams when tapping jam notifications

## Features

### Nearby Jam Notifications
- Automatically created when user views nearby jams
- Calculates distance between user and jam location
- Only creates notifications for jams within specified radius (default: 5km)
- Shows distance information in notification

### Notification Types
1. **nearby_jam**: New traffic jam detected nearby
2. **jam_update**: Update to existing jam
3. **jam_resolved**: Jam has been resolved
4. **general**: General notifications

### Distance Calculation
Uses Haversine formula to calculate distance between user location and jam location:
```javascript
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
```

## Integration Points

### Dashboard Integration
- Notification badge in app bar
- Shows unread count
- Navigates to notifications screen when tapped

### Nearby Jams Integration
- Automatically creates notifications when viewing nearby jams
- Integrates with location provider for user coordinates
- Uses posts provider for jam data

## Usage

1. **Viewing Notifications**: Tap the notification bell icon in the dashboard
2. **Marking as Read**: Tap on a notification to mark it as read
3. **Mark All as Read**: Use the "Mark all read" button in notifications screen
4. **Navigation**: Tap on nearby jam notifications to view nearby jams screen

## API Endpoints

### Authentication Required
All notification endpoints require authentication via Bearer token.

### Base URL
`http://localhost:3000/api/notifications`

### Example Usage
```bash
# Get all notifications
GET /api/notifications
Authorization: Bearer <token>

# Create nearby jam notification
POST /api/notifications/nearby-jam
Authorization: Bearer <token>
Content-Type: application/json

{
  "jam_post_id": "123",
  "user_latitude": 40.7128,
  "user_longitude": -74.0060,
  "radius": 5000
}
```

## Future Enhancements

1. **Push Notifications**: Integrate with Firebase Cloud Messaging
2. **Real-time Updates**: Use WebSocket for live notification updates
3. **Notification Preferences**: Allow users to customize notification settings
4. **Geofencing**: Implement geofence-based notifications
5. **Notification History**: Add pagination for large notification lists 
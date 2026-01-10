class AppNotification {
  final String id; // UUID
  final String type; // e.g., 'driver.created', 'truck.updated'
  final String title;
  final String message;
  final Map<String, dynamic> payload; // Additional data
  final DateTime createdAt;
  final DateTime? readAt;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.payload,
    required this.createdAt,
    this.readAt,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'unknown',
      title: json['title'] as String? ?? 'Notification',
      message: json['message'] as String? ?? '',
      payload: json['payload'] != null
          ? Map<String, dynamic>.from(json['payload'] as Map)
          : <String, dynamic>{},
      createdAt: DateTime.parse(json['created_at'] as String),
      readAt: json['read_at'] != null
          ? DateTime.parse(json['read_at'] as String)
          : null,
    );
  }

  bool get isRead => readAt != null;

  String get typeLabel {
    // Convert type key to readable label
    // e.g., 'driver.created' -> 'Driver Created'
    if (type.contains('.')) {
      final parts = type.split('.');
      return parts
          .map((part) => part[0].toUpperCase() + part.substring(1))
          .join(' ');
    }
    return type;
  }

  String get category {
    // Extract category from type (e.g., 'driver', 'truck', 'performance')
    if (type.contains('.')) {
      return type.split('.')[0];
    }
    return 'general';
  }
}

class NotificationResponse {
  final List<AppNotification> notifications;
  final int unreadCount;

  NotificationResponse({
    required this.notifications,
    required this.unreadCount,
  });

  factory NotificationResponse.fromJson(Map<String, dynamic> json) {
    return NotificationResponse(
      notifications: (json['notifications'] as List?)
              ?.map((item) => AppNotification.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      unreadCount: json['unread_count'] as int? ?? 0,
    );
  }
}


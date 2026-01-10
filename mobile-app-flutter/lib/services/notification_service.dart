import '../config/app_config.dart';
import '../models/notification.dart';
import 'api_service.dart';

class NotificationService {
  final ApiService _apiService = ApiService();

  Future<NotificationResponse> getNotifications({
    int limit = 50,
    bool unreadOnly = false,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
        if (unreadOnly) 'unread_only': 'true',
      };

      final response = await _apiService.get(
        AppConfig.notificationsEndpoint,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return NotificationResponse.fromJson(data);
      }
      return NotificationResponse(notifications: [], unreadCount: 0);
    } catch (e) {
      return NotificationResponse(notifications: [], unreadCount: 0);
    }
  }

  Future<bool> markAsRead(String notificationId) async {
    try {
      final response = await _apiService.post(
        '${AppConfig.notificationsEndpoint}/$notificationId/read',
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> markAllAsRead() async {
    try {
      final response = await _apiService.post(
        '${AppConfig.notificationsEndpoint}/read-all',
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }
}


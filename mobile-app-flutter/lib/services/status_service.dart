import '../config/app_config.dart';
import 'api_service.dart';

class StatusService {
  final ApiService _apiService = ApiService();

  Future<bool> updateStatus({
    required String statusType, // 'work', 'truck', 'trip'
    required String statusValue,
    String? notes,
  }) async {
    try {
      final response = await _apiService.post(
        AppConfig.statusEndpoint,
        data: {
          'status_type': statusType,
          'status_value': statusValue,
          'notes': notes,
        },
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<List<Map<String, dynamic>>> getStatusHistory({
    String? statusType,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (statusType != null) {
        queryParams['status_type'] = statusType;
      }

      final response = await _apiService.get(
        AppConfig.statusHistoryEndpoint,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}


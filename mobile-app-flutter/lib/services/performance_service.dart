import '../config/app_config.dart';
import '../models/performance.dart';
import 'api_service.dart';

class PerformanceService {
  final ApiService _apiService = ApiService();

  Future<DriverPerformance?> getPerformance() async {
    try {
      final response = await _apiService.get(AppConfig.performanceEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        if (data != null) {
          return DriverPerformance.fromJson(data);
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<List<PerformanceRecord>> getHistory({
    String? periodType, // 'daily', 'weekly', 'monthly'
    String? startDate,
    String? endDate,
    int limit = 10,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };
      if (periodType != null) {
        queryParams['period_type'] = periodType;
      }
      if (startDate != null) {
        queryParams['start_date'] = startDate;
      }
      if (endDate != null) {
        queryParams['end_date'] = endDate;
      }

      final response = await _apiService.get(
        '${AppConfig.performanceEndpoint}/history',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as List;
        return data.map((item) => PerformanceRecord.fromJson(item as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}


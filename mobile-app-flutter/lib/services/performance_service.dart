import '../config/app_config.dart';
import 'api_service.dart';

class PerformanceService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>?> getPerformance() async {
    try {
      final response = await _apiService.get(AppConfig.performanceEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return response.data['data'];
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}


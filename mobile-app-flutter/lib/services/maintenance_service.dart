import '../config/app_config.dart';
import '../models/maintenance.dart';
import 'api_service.dart';

class MaintenanceService {
  final ApiService _apiService = ApiService();

  Future<MaintenanceResponse> getMaintenanceAlerts() async {
    try {
      final response = await _apiService.get(AppConfig.maintenanceEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return MaintenanceResponse.fromJson(data);
      }
      return MaintenanceResponse(upcoming: [], overdue: [], recent: []);
    } catch (e) {
      return MaintenanceResponse(upcoming: [], overdue: [], recent: []);
    }
  }

  Future<MaintenanceRecord?> getMaintenanceDetails(int maintenanceId) async {
    try {
      final response = await _apiService.get('${AppConfig.maintenanceEndpoint}/$maintenanceId');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return MaintenanceRecord.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<MaintenanceRecord?> acknowledgeMaintenance(int maintenanceId) async {
    try {
      final response = await _apiService.post('${AppConfig.maintenanceEndpoint}/$maintenanceId/acknowledge');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return MaintenanceRecord.fromJson(response.data['data'] as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<MaintenanceRecord?> reportIssue(int maintenanceId, String message) async {
    try {
      final response = await _apiService.post(
        '${AppConfig.maintenanceEndpoint}/$maintenanceId/report-issue',
        data: {'message': message},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return MaintenanceRecord.fromJson(response.data['data'] as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<MaintenanceRecord?> requestService(int maintenanceId, {String? notes}) async {
    try {
      final response = await _apiService.post(
        '${AppConfig.maintenanceEndpoint}/$maintenanceId/request-service',
        data: {'notes': notes},
      );
      if (response.statusCode == 200 && response.data['success'] == true) {
        return MaintenanceRecord.fromJson(response.data['data'] as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}


import '../config/app_config.dart';
import '../models/driver.dart';
import '../models/truck.dart';
import 'api_service.dart';

class DriverService {
  final ApiService _apiService = ApiService();

  Future<Driver?> getProfile() async {
    try {
      final response = await _apiService.get(AppConfig.profileEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final userData = response.data['data']['user'];
        return Driver.fromJson(userData);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Get truck assignment for the current user
  /// Returns TruckAssignmentResponse with status and data
  /// Status can be: 'assigned', 'no_driver', 'no_assignment', 'assignment_removed'
  Future<TruckAssignmentResponse?> getTruckAssignment() async {
    try {
      final response = await _apiService.get(AppConfig.truckEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        return TruckAssignmentResponse.fromJson(response.data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  /// Legacy method - kept for backward compatibility
  /// Use getTruckAssignment() instead for better handling of all scenarios
  @Deprecated('Use getTruckAssignment() instead')
  Future<Truck?> getAssignedTruck() async {
    try {
      final response = await _apiService.get(AppConfig.truckEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final assignmentResponse = TruckAssignmentResponse.fromJson(response.data);
        if (assignmentResponse.hasActiveAssignment) {
          return assignmentResponse.truck;
        }
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}


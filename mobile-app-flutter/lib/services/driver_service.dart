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
        return Driver.fromJson(response.data['data']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Truck?> getAssignedTruck() async {
    try {
      final response = await _apiService.get(AppConfig.truckEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        if (data == null) return null;
        return Truck.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}


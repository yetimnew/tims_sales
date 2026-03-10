import '../config/app_config.dart';
import '../services/location_service.dart';
import 'api_service.dart';

class EmergencyService {
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();

  Future<Map<String, dynamic>> sendEmergencyAlert({String? message}) async {
    try {
      final location = await _locationService.getCurrentLocation();

      final payload = <String, dynamic>{
        'message': message,
      };

      if (location != null) {
        payload['latitude'] = location['latitude'];
        payload['longitude'] = location['longitude'];
      }

      final response = await _apiService.post(
        '/driver/emergency',
        data: payload,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return {
          'success': true,
          'message': response.data['message'] ?? 'Emergency alert sent successfully',
          'data': response.data['data'],
        };
      } else {
        throw Exception(response.data['message'] ?? 'Failed to send emergency alert');
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString().replaceAll('Exception: ', ''),
      };
    }
  }
}


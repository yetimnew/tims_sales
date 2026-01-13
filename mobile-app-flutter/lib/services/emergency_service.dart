import '../config/app_config.dart';
import '../services/location_service.dart';
import 'api_service.dart';

class EmergencyService {
  final ApiService _apiService = ApiService();
  final LocationService _locationService = LocationService();

  Future<Map<String, dynamic>> sendEmergencyAlert({String? message}) async {
    try {
      // Get current location
      final location = await _locationService.getCurrentLocation();
      
      if (location == null) {
        return {
          'success': false,
          'error': 'Unable to get current location. Please enable location services.',
        };
      }

      final response = await _apiService.post(
        '/driver/emergency',
        data: {
          'latitude': location['latitude'],
          'longitude': location['longitude'],
          'message': message,
        },
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


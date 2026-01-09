import '../config/app_config.dart';
import '../models/trip.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> getTrips() async {
    try {
      final response = await _apiService.get(AppConfig.tripsEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        return {
          'current': data['current'] != null
              ? Trip.fromJson(data['current'])
              : null,
          'upcoming': (data['upcoming'] as List?)
                  ?.map((item) => Trip.fromJson(item))
                  .toList() ??
              [],
        };
      }
      return {'current': null, 'upcoming': []};
    } catch (e) {
      return {'current': null, 'upcoming': []};
    }
  }

  Future<Trip?> getTripDetails(int tripId) async {
    try {
      final response = await _apiService.get('${AppConfig.tripsEndpoint}/$tripId');
      if (response.statusCode == 200 && response.data['success'] == true) {
        return Trip.fromJson(response.data['data']);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<bool> updateTripStatus(int tripId, String status, {String? comment}) async {
    try {
      final response = await _apiService.post(
        '${AppConfig.tripsEndpoint}/$tripId/update',
        data: {
          'status': status,
          'comment': comment,
        },
      );

      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }
}


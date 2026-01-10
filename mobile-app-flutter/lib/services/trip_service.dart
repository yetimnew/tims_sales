import '../config/app_config.dart';
import '../models/trip.dart';
import 'api_service.dart';

class TripService {
  final ApiService _apiService = ApiService();

  Future<TripsResponse> getTrips() async {
    try {
      final response = await _apiService.get(AppConfig.tripsEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return TripsResponse(
          current: data['current'] != null
              ? Trip.fromJson(data['current'] as Map<String, dynamic>)
              : null,
          upcoming: (data['upcoming'] as List?)
                  ?.map((item) => Trip.fromJson(item as Map<String, dynamic>))
                  .toList() ??
              [],
        );
      }
      return TripsResponse(current: null, upcoming: []);
    } catch (e) {
      return TripsResponse(current: null, upcoming: []);
    }
  }

  Future<Trip?> getTripDetails(int tripId) async {
    try {
      final response = await _apiService.get('${AppConfig.tripsEndpoint}/$tripId');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return Trip.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  Future<Trip?> updateTripStatus(int tripId, String status, {String? comment}) async {
    try {
      final response = await _apiService.post(
        '${AppConfig.tripsEndpoint}/$tripId/update',
        data: {
          'status': status,
          'comment': comment,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return Trip.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}

class TripsResponse {
  final Trip? current;
  final List<Trip> upcoming;

  TripsResponse({
    this.current,
    required this.upcoming,
  });
}


import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import '../config/app_config.dart';
import '../models/location.dart';
import 'api_service.dart';

// Import geolocator - it has web support built-in
import 'package:geolocator/geolocator.dart';

class LocationService {
  final ApiService _apiService = ApiService();
  StreamSubscription<Position>? _positionStream;
  bool _isTracking = false;

  Future<bool> checkPermission() async {
    // Location services not available on web
    if (kIsWeb) {
      return false;
    }

    try {
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return false;
      }

      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          return false;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        return false;
      }

      return permission == LocationPermission.whileInUse || permission == LocationPermission.always;
    } catch (e) {
      return false;
    }
  }

  Future<bool> sendLocation(double latitude, double longitude, {
    double? accuracy,
    double? speed,
    double? heading,
  }) async {
    try {
      final response = await _apiService.post(
        AppConfig.locationEndpoint,
        data: {
          'latitude': latitude,
          'longitude': longitude,
          'accuracy': accuracy,
          'speed': speed,
          'heading': heading,
        },
      );

      return response.statusCode == 201 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<void> startBackgroundTracking() async {
    // Background location tracking not available on web
    if (kIsWeb) {
      return;
    }

    if (_isTracking) return;

    final hasPermission = await checkPermission();
    if (!hasPermission) {
      throw Exception('Location permission not granted');
    }

    try {
      _positionStream = Geolocator.getPositionStream(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
          distanceFilter: AppConfig.locationDistanceFilter,
          timeLimit: Duration(seconds: AppConfig.locationUpdateInterval),
        ),
      ).listen((Position position) {
        sendLocation(
          position.latitude,
          position.longitude,
          accuracy: position.accuracy,
          speed: position.speed,
          heading: position.heading.isNaN ? null : position.heading,
        );
      });
      
      _isTracking = true; // Set after successful stream creation
    } catch (e) {
      _isTracking = false;
      rethrow;
    }
  }

  Future<void> stopBackgroundTracking() async {
    await _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;
  }

  bool get isTracking {
    if (kIsWeb) return false;
    return _isTracking && _positionStream != null;
  }

  Future<Map<String, double>?> getCurrentLocation() async {
    // Location services not available on web
    if (kIsWeb) {
      return null;
    }

    final hasPermission = await checkPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
      return {
        'latitude': position.latitude,
        'longitude': position.longitude,
        'accuracy': position.accuracy,
        'speed': position.speed,
        'heading': position.heading.isNaN ? 0.0 : position.heading,
      };
    } catch (e) {
      return null;
    }
  }

  Future<List<DriverLocation>> getLocationHistory({
    DateTime? startDate,
    DateTime? endDate,
    int limit = 100,
  }) async {
    try {
      final queryParams = <String, String>{
        'limit': limit.toString(),
      };
      if (startDate != null) {
        queryParams['start_date'] = startDate.toIso8601String();
      }
      if (endDate != null) {
        queryParams['end_date'] = endDate.toIso8601String();
      }

      final response = await _apiService.get(
        AppConfig.locationHistoryEndpoint,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as List;
        return data
            .map((item) => DriverLocation.fromJson(item as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  void dispose() {
    stopBackgroundTracking();
  }
}

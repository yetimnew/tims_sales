import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
// import 'package:geolocator/geolocator.dart'; // Temporarily commented - web compatibility issues. Uncomment for Android/iOS builds
import '../config/app_config.dart';
import 'api_service.dart';

class LocationService {
  final ApiService _apiService = ApiService();
  StreamSubscription? _positionStream; // Changed from StreamSubscription<Position>?
  // bool _isTracking = false; // Temporarily commented - will be used when geolocator is re-enabled

  Future<bool> checkPermission() async {
    // Location services not available on web
    if (kIsWeb) {
      return false;
    }

    // Temporarily disabled - geolocator commented out for web compatibility
    // Uncomment when adding geolocator back for mobile builds
    /*
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
    */

    return false; // Temporarily returns false until geolocator is re-enabled
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

    // Temporarily disabled - geolocator commented out for web compatibility
    // Uncomment when adding geolocator back for mobile builds
    /*
    if (_isTracking) return;

    final hasPermission = await checkPermission();
    if (!hasPermission) {
      throw Exception('Location permission not granted');
    }

    _isTracking = true;

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
        heading: position.heading,
      );
    });
    */
  }

  Future<void> stopBackgroundTracking() async {
    await _positionStream?.cancel();
    _positionStream = null;
    // _isTracking = false; // Temporarily commented - will be used when geolocator is re-enabled
  }

  Future<Map<String, double>?> getCurrentLocation() async {
    // Location services not available on web
    if (kIsWeb) {
      return null;
    }

    // Temporarily disabled - geolocator commented out for web compatibility
    // Uncomment when adding geolocator back for mobile builds
    /*
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
        'heading': position.heading,
      };
    } catch (e) {
      return null;
    }
    */

    return null; // Temporarily returns null until geolocator is re-enabled
  }

  void dispose() {
    stopBackgroundTracking();
  }
}

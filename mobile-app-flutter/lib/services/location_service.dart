import 'dart:async';
import 'package:geolocator/geolocator.dart';
import '../config/app_config.dart';
import 'api_service.dart';

class LocationService {
  final ApiService _apiService = ApiService();
  StreamSubscription<Position>? _positionStream;
  bool _isTracking = false;

  Future<bool> checkPermission() async {
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

    return true;
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
  }

  Future<void> stopBackgroundTracking() async {
    await _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;
  }

  Future<Position?> getCurrentLocation() async {
    final hasPermission = await checkPermission();
    if (!hasPermission) {
      return null;
    }

    try {
      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      return null;
    }
  }

  void dispose() {
    stopBackgroundTracking();
  }
}


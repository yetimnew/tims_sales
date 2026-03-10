import 'dart:async';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/foundation.dart' show defaultTargetPlatform, TargetPlatform;
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/location.dart';
import 'api_service.dart';
import 'background_tracking_runtime.dart';

// Import geolocator - it has web support built-in
import 'package:geolocator/geolocator.dart';

class LocationService {
  LocationService._internal();
  static final LocationService _instance = LocationService._internal();
  factory LocationService() => _instance;

  static const String _trackingEnabledKey = 'location_tracking_enabled';

  final ApiService _apiService = ApiService();
  final BackgroundTrackingRuntime _backgroundTrackingRuntime = createBackgroundTrackingRuntime();
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

  Future<void> resumeTrackingIfEnabled() async {
    if (kIsWeb || _isTracking) {
      return;
    }

    final prefs = await SharedPreferences.getInstance();
    final shouldTrack = prefs.getBool(_trackingEnabledKey) ?? false;

    if (!shouldTrack) {
      return;
    }

    try {
      if (_backgroundTrackingRuntime.supported) {
        final running = await _backgroundTrackingRuntime.isRunning();
        if (running) {
          _isTracking = true;
          return;
        }
      }

      await startBackgroundTracking(persistPreference: false);
    } catch (_) {
      // Do not block app startup if tracking cannot start
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

  Future<void> startBackgroundTracking({bool persistPreference = true}) async {
    // Background location tracking not available on web
    if (kIsWeb) {
      return;
    }

    if (_isTracking) return;

    final hasPermission = await checkPermission();
    if (!hasPermission) {
      throw Exception('Location permission not granted');
    }

    if (_backgroundTrackingRuntime.supported) {
      final started = await _backgroundTrackingRuntime.start();
      if (!started) {
        throw Exception('Unable to start Android background tracking service');
      }

      _isTracking = true;

      if (persistPreference) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_trackingEnabledKey, true);
      }

      return;
    }

    try {
      final locationSettings = _buildLocationSettings();

      _positionStream = Geolocator.getPositionStream(
        locationSettings: locationSettings,
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

      if (persistPreference) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_trackingEnabledKey, true);
      }
    } catch (e) {
      _isTracking = false;
      rethrow;
    }
  }

  Future<void> stopBackgroundTracking({bool persistPreference = true}) async {
    if (_backgroundTrackingRuntime.supported) {
      await _backgroundTrackingRuntime.stop();
      _isTracking = false;

      if (persistPreference) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool(_trackingEnabledKey, false);
      }

      return;
    }

    await _positionStream?.cancel();
    _positionStream = null;
    _isTracking = false;

    if (persistPreference) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool(_trackingEnabledKey, false);
    }
  }

  bool get isTracking {
    if (kIsWeb) return false;
    if (_backgroundTrackingRuntime.supported) {
      return _isTracking;
    }
    return _isTracking && _positionStream != null;
  }

  Future<bool> getTrackingStatus() async {
    if (kIsWeb) {
      return false;
    }

    if (_backgroundTrackingRuntime.supported) {
      _isTracking = await _backgroundTrackingRuntime.isRunning();
      return _isTracking;
    }

    _isTracking = _isTracking && _positionStream != null;
    return _isTracking;
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

  LocationSettings _buildLocationSettings() {
    if (defaultTargetPlatform == TargetPlatform.android) {
      return AndroidSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: AppConfig.locationDistanceFilter,
        intervalDuration: Duration(seconds: AppConfig.locationUpdateInterval),
        foregroundNotificationConfig: const ForegroundNotificationConfig(
          notificationTitle: 'TIMS tracking active',
          notificationText: 'Your location is being shared for dispatch visibility.',
          enableWakeLock: true,
        ),
      );
    }

    if (defaultTargetPlatform == TargetPlatform.iOS || defaultTargetPlatform == TargetPlatform.macOS) {
      return AppleSettings(
        accuracy: LocationAccuracy.bestForNavigation,
        distanceFilter: AppConfig.locationDistanceFilter,
        pauseLocationUpdatesAutomatically: false,
        showBackgroundLocationIndicator: true,
        activityType: ActivityType.automotiveNavigation,
      );
    }

    return LocationSettings(
      accuracy: LocationAccuracy.high,
      distanceFilter: AppConfig.locationDistanceFilter,
      timeLimit: Duration(seconds: AppConfig.locationUpdateInterval),
    );
  }
}

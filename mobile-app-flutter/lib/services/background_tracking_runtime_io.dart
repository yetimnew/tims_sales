import 'dart:async';
import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../config/app_config.dart';
import 'api_config_service.dart';

const String _trackingNotificationTitle = 'TIMS tracking active';
const String _trackingNotificationText = 'Background location tracking is running.';

class BackgroundTrackingRuntime {
  final FlutterBackgroundService _service = FlutterBackgroundService();
  bool _initialized = false;

  bool get supported => Platform.isAndroid;

  Future<void> initialize() async {
    if (!supported || _initialized) {
      return;
    }

    await _service.configure(
      androidConfiguration: AndroidConfiguration(
        onStart: _backgroundTrackingOnStart,
        autoStart: false,
        autoStartOnBoot: false,
        isForegroundMode: true,
        notificationChannelId: 'tims_tracking',
        initialNotificationTitle: _trackingNotificationTitle,
        initialNotificationText: _trackingNotificationText,
        foregroundServiceNotificationId: 4242,
      ),
      iosConfiguration: IosConfiguration(
        autoStart: false,
        onForeground: _backgroundTrackingOnStart,
        onBackground: _onIosBackground,
      ),
    );

    _initialized = true;
  }

  Future<bool> start() async {
    if (!supported) {
      return false;
    }

    await initialize();

    if (await _service.isRunning()) {
      return true;
    }

    return _service.startService();
  }

  Future<void> stop() async {
    if (!supported) {
      return;
    }

    if (await _service.isRunning()) {
      _service.invoke('stopService');
    }
  }

  Future<bool> isRunning() async {
    if (!supported) {
      return false;
    }

    await initialize();

    return _service.isRunning();
  }
}

BackgroundTrackingRuntime createBackgroundTrackingRuntime() => BackgroundTrackingRuntime();

@pragma('vm:entry-point')
Future<bool> _onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
Future<void> _backgroundTrackingOnStart(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();

  Timer? timer;

  service.on('stopService').listen((event) async {
    await timer?.cancel();
    service.stopSelf();
  });

  Future<void> sendLocationUpdate() async {
    try {
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        return;
      }

      final permission = await Geolocator.checkPermission();
      if (permission != LocationPermission.always && permission != LocationPermission.whileInUse) {
        return;
      }

      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.bestForNavigation,
      );

      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString('auth_token');
      if (token == null || token.isEmpty) {
        return;
      }

      final baseUrl = await ApiConfigService().getApiBaseUrl();
      final dio = Dio(BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: AppConfig.apiTimeout,
        receiveTimeout: AppConfig.apiTimeout,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ));

      await dio.post(
        AppConfig.locationEndpoint,
        data: {
          'latitude': position.latitude,
          'longitude': position.longitude,
          'accuracy': position.accuracy,
          'speed': position.speed,
          'heading': position.heading.isNaN ? null : position.heading,
          'timestamp': position.timestamp?.toIso8601String(),
        },
      );
    } catch (_) {
      // Keep the service running even if a single location push fails.
    }
  }

  await sendLocationUpdate();

  timer = Timer.periodic(
    Duration(seconds: AppConfig.locationUpdateInterval),
    (_) => sendLocationUpdate(),
  );
}

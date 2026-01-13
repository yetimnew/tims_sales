import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  // API Configuration
  // For Web (Chrome/Edge): http://localhost:8000/api
  // For Android Emulator: http://10.0.2.2:8000/api
  // For iOS Simulator: http://localhost:8000/api
  // For Physical Device: http://YOUR_COMPUTER_IP:8000/api
  
  // Note: apiBaseUrl is now managed by ApiConfigService
  // This getter is kept for backward compatibility but should use ApiConfigService instead
  @Deprecated('Use ApiConfigService().getApiBaseUrl() instead')
  static String get apiBaseUrl {
    // Override with environment variable if provided
    const envUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (envUrl.isNotEmpty) {
      return envUrl;
    }
    
    // Use localhost for web, 10.0.2.2 for Android emulator
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }
    
    // Default for Android emulator (can be overridden with environment variable)
    return 'http://10.0.2.2:8000/api';
  }

  // App Configuration
  static const String appName = 'TIMS Driver';
  static const String appVersion = '1.0.0';

  // API Endpoints
  static const String loginEndpoint = '/login';
  static const String logoutEndpoint = '/logout';
  static const String forgotPasswordEndpoint = '/forgot-password';
  static const String resetPasswordEndpoint = '/reset-password';
  static const String profileEndpoint = '/profile';
  static const String profileUpdateEndpoint = '/profile';
  static const String profilePictureEndpoint = '/profile/picture';
  static const String passwordChangeEndpoint = '/profile/password';
  static const String performanceEndpoint = '/driver/performance';
  static const String statusCurrentEndpoint = '/driver/status/current';
  static const String statusEndpoint = '/driver/status';
  static const String statusHistoryEndpoint = '/driver/status/history';
  static const String locationEndpoint = '/driver/location';
  static const String locationHistoryEndpoint = '/driver/location/history';
  static const String truckEndpoint = '/driver/truck';
  static const String tripsEndpoint = '/driver/trips';
  static const String notificationsEndpoint = '/driver/notifications';
  static const String maintenanceEndpoint = '/driver/maintenance';
  static const String fuelEndpoint = '/driver/fuel';

  // Location Tracking Configuration
  static const int locationUpdateInterval = 300; // 5 minutes in seconds
  static const double locationAccuracy = 10.0; // meters
  static const int locationDistanceFilter = 50; // meters

  // Offline Configuration
  static const int maxOfflineQueueSize = 100;
  static const int syncRetryAttempts = 3;

  // Timeouts
  static const Duration apiTimeout = Duration(seconds: 30);
  static const Duration locationTimeout = Duration(seconds: 10);
}


class AppConfig {
  // API Configuration
  // For Android Emulator use: http://10.0.2.2:8000/api
  // For iOS Simulator use: http://localhost:8000/api
  // For Physical Device use: http://YOUR_COMPUTER_IP:8000/api
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8000/api',
  );

  // App Configuration
  static const String appName = 'TIMS Driver';
  static const String appVersion = '1.0.0';

  // API Endpoints
  static const String loginEndpoint = '/driver/login';
  static const String logoutEndpoint = '/driver/logout';
  static const String profileEndpoint = '/driver/profile';
  static const String performanceEndpoint = '/driver/performance';
  static const String statusEndpoint = '/driver/status';
  static const String statusHistoryEndpoint = '/driver/status/history';
  static const String locationEndpoint = '/driver/location';
  static const String locationHistoryEndpoint = '/driver/location/history';
  static const String truckEndpoint = '/driver/truck';
  static const String tripsEndpoint = '/driver/trips';
  static const String notificationsEndpoint = '/driver/notifications';
  static const String maintenanceEndpoint = '/driver/maintenance';

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


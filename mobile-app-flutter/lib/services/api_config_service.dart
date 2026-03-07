import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kIsWeb, kDebugMode, debugPrint;
import '../config/app_config.dart';

/// Service to manage API base URL configuration
/// Allows users to set custom API URL for physical devices
class ApiConfigService {
  static const String _apiUrlKey = 'custom_api_base_url';
  static const String productionApiUrl = 'https://operation.eletderash.com/api';
  static final ApiConfigService _instance = ApiConfigService._internal();
  factory ApiConfigService() => _instance;
  ApiConfigService._internal();

  /// Get the API base URL
  /// Priority: Custom saved URL > Environment variable > Default
  Future<String> getApiBaseUrl() async {
    // Check for environment variable first
    const envUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (envUrl.isNotEmpty) {
      if (kDebugMode) {
        debugPrint('[API Config] Using environment variable: $envUrl');
      }
      return envUrl;
    }

    // Check for custom saved URL
    try {
      final prefs = await SharedPreferences.getInstance();
      final customUrl = prefs.getString(_apiUrlKey);
      if (customUrl != null && customUrl.isNotEmpty) {
        if (kDebugMode) {
          debugPrint('[API Config] Using custom saved URL: $customUrl');
        }
        return customUrl;
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[API Config] Error reading custom URL: $e');
      }
    }

    // Use default based on platform
    final defaultUrl = _getDefaultUrl();
    if (kDebugMode) {
      debugPrint('[API Config] Using default URL: $defaultUrl');
    }
    return defaultUrl;
  }

  /// Get default URL based on platform
  String _getDefaultUrl() {
    if (kIsWeb) {
      return 'http://localhost:8000/api';
    }

    // Default to production API so end users connect out of the box.
    if (!kDebugMode) {
      return productionApiUrl;
    }

    // Debug builds can still target the local backend.
    return 'http://10.0.2.2:8000/api';
  }

  /// Save custom API base URL
  Future<bool> setApiBaseUrl(String url) async {
    try {
      // Validate URL format
      if (!_isValidUrl(url)) {
        throw Exception(
            'Invalid URL format. Please use format: http://IP_ADDRESS:PORT/api');
      }

      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_apiUrlKey, url);

      if (kDebugMode) {
        debugPrint('[API Config] Saved custom API URL: $url');
      }
      return true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[API Config] Error saving URL: $e');
      }
      return false;
    }
  }

  /// Clear custom API URL (use default)
  Future<bool> clearApiBaseUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_apiUrlKey);

      if (kDebugMode) {
        debugPrint('[API Config] Cleared custom API URL');
      }
      return true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[API Config] Error clearing URL: $e');
      }
      return false;
    }
  }

  /// Get current saved URL (or null if using default)
  Future<String?> getSavedApiUrl() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_apiUrlKey);
    } catch (e) {
      return null;
    }
  }

  /// Validate URL format
  bool _isValidUrl(String url) {
    if (url.isEmpty) return false;

    // Basic validation - should start with http:// or https://
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return false;
    }

    // Should contain /api at the end
    if (!url.endsWith('/api')) {
      return false;
    }

    return true;
  }

  /// Get instructions for finding computer IP address
  static String getIpAddressInstructions() {
    return '''
To point the app at a local development server, first find your computer's IP address:

Windows:
1. Open Command Prompt
2. Type: ipconfig
3. Look for "IPv4 Address" under your active network adapter
4. Example: 192.168.1.100

Mac/Linux:
1. Open Terminal
2. Type: ifconfig (Mac) or ip addr (Linux)
3. Look for "inet" address
4. Example: 192.168.1.100

Then use: http://YOUR_IP:8000/api
Example: http://192.168.1.100:8000/api

Make sure:
- Your computer and phone are on the same Wi-Fi network
- Laravel server is running: php artisan serve --host=0.0.0.0
- Firewall allows connections on port 8000

Note: The app defaults to $productionApiUrl. Set a custom URL only when you need to target a local server.
''';
  }
}

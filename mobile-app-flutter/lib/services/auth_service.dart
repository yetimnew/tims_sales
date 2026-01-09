import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/driver.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String driverId, String password) async {
    try {
      final response = await _apiService.post(
        AppConfig.loginEndpoint,
        data: {
          'driverid': driverId,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final token = data['token'];
        final driverData = data['driver'];

        // Save token and driver data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('driver_data', jsonEncode(driverData));

        return {
          'success': true,
          'token': token,
          'driver': Driver.fromJson(driverData),
        };
      } else {
        throw Exception(response.data['message'] ?? 'Login failed');
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString(),
      };
    }
  }

  Future<bool> logout() async {
    try {
      await _apiService.post(AppConfig.logoutEndpoint);
      await _clearAuth();
      return true;
    } catch (e) {
      // Even if API call fails, clear local auth
      await _clearAuth();
      return false;
    }
  }

  Future<void> _clearAuth() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('auth_token');
    await prefs.remove('driver_data');
  }

  Future<bool> isAuthenticated() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return token != null && token.isNotEmpty;
  }

  Future<Driver?> getCurrentDriver() async {
    final prefs = await SharedPreferences.getInstance();
    final driverDataJson = prefs.getString('driver_data');
    if (driverDataJson != null) {
      try {
        final driverData = jsonDecode(driverDataJson);
        return Driver.fromJson(driverData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }
}


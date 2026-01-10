import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../config/app_config.dart';
import '../models/driver.dart';
import 'api_service.dart';

class AuthService {
  final ApiService _apiService = ApiService();

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _apiService.post(
        AppConfig.loginEndpoint,
        data: {
          'email': email,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final token = data['token'];
        final userData = data['user'];

        // Save token and user data
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('auth_token', token);
        await prefs.setString('user_data', jsonEncode(userData));

        return {
          'success': true,
          'token': token,
          'user': Driver.fromJson(userData), // Using Driver model but with User data structure
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
    await prefs.remove('user_data');
  }

  Future<bool> isAuthenticated() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('auth_token');
    return token != null && token.isNotEmpty;
  }

  Future<Driver?> getCurrentUser() async {
    final prefs = await SharedPreferences.getInstance();
    final userDataJson = prefs.getString('user_data');
    if (userDataJson != null) {
      try {
        final userData = jsonDecode(userDataJson);
        return Driver.fromJson(userData);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Keep getCurrentDriver for backward compatibility
  Future<Driver?> getCurrentDriver() async {
    return getCurrentUser();
  }

  Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString('auth_token');
  }

  Future<SharedPreferences?> getSharedPreferences() async {
    try {
      return await SharedPreferences.getInstance();
    } catch (e) {
      return null;
    }
  }
}


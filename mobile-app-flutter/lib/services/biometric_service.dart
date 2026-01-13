import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:local_auth/local_auth.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class BiometricService {
  static final LocalAuthentication _localAuth = LocalAuthentication();
  static final FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: const AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: const IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  /// Check if biometric authentication is available
  Future<bool> isAvailable() async {
    if (kIsWeb) return false; // Biometric auth not available on web
    
    try {
      final bool canCheckBiometrics = await _localAuth.canCheckBiometrics;
      final bool isDeviceSupported = await _localAuth.isDeviceSupported();
      return canCheckBiometrics || isDeviceSupported;
    } catch (e) {
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    if (kIsWeb) return [];
    
    try {
      return await _localAuth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  /// Check if biometric authentication is enabled for the user
  Future<bool> isEnabled() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getBool('biometric_enabled') ?? false;
    } catch (e) {
      return false;
    }
  }

  /// Enable biometric authentication
  Future<void> enable() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('biometric_enabled', true);
    } catch (e) {
      // Handle error
    }
  }

  /// Disable biometric authentication
  Future<void> disable() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setBool('biometric_enabled', false);
      // Optionally clear stored credentials
      await _secureStorage.delete(key: 'user_credentials');
    } catch (e) {
      // Handle error
    }
  }

  /// Authenticate using biometric
  Future<bool> authenticate({
    String reason = 'Authenticate to access your account',
    bool useErrorDialogs = true,
    bool stickyAuth = true,
  }) async {
    if (kIsWeb) return false;
    if (!await isAvailable()) return false;
    if (!await isEnabled()) return false;

    try {
      return await _localAuth.authenticate(
        localizedReason: reason,
        options: AuthenticationOptions(
          useErrorDialogs: useErrorDialogs,
          stickyAuth: stickyAuth,
          biometricOnly: false,
        ),
      );
    } catch (e) {
      return false;
    }
  }

  /// Store credentials securely (encrypted)
  Future<void> storeCredentials(String email, String password) async {
    try {
      await _secureStorage.write(key: 'user_email', value: email);
      await _secureStorage.write(key: 'user_password', value: password);
    } catch (e) {
      // Handle error - secure storage might not be available
    }
  }

  /// Retrieve stored credentials
  Future<Map<String, String?>> getStoredCredentials() async {
    try {
      final email = await _secureStorage.read(key: 'user_email');
      final password = await _secureStorage.read(key: 'user_password');
      return {
        'email': email,
        'password': password,
      };
    } catch (e) {
      return {'email': null, 'password': null};
    }
  }

  /// Clear stored credentials
  Future<void> clearCredentials() async {
    try {
      await _secureStorage.delete(key: 'user_email');
      await _secureStorage.delete(key: 'user_password');
    } catch (e) {
      // Handle error
    }
  }

  /// Get biometric type name for display
  Future<String> getBiometricTypeName() async {
    final availableBiometrics = await getAvailableBiometrics();
    if (availableBiometrics.isEmpty) return 'Biometric';
    
    if (availableBiometrics.contains(BiometricType.face)) {
      return 'Face ID';
    } else if (availableBiometrics.contains(BiometricType.fingerprint)) {
      return 'Fingerprint';
    } else if (availableBiometrics.contains(BiometricType.strong)) {
      return 'Biometric';
    } else if (availableBiometrics.contains(BiometricType.weak)) {
      return 'Biometric';
    }
    return 'Biometric';
  }

  /// Stop authentication (cancel ongoing auth)
  Future<void> stopAuthentication() async {
    try {
      await _localAuth.stopAuthentication();
    } catch (e) {
      // Handle error
    }
  }
}


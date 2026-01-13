import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart' show kDebugMode, debugPrint;

/// Service to manage app language/locale
class LanguageService {
  static const String _languageKey = 'app_language';
  static const Locale defaultLocale = Locale('en', '');
  static const List<Locale> supportedLocales = [
    Locale('en', ''), // English
    Locale('am', ''), // Amharic
  ];

  /// Get saved language locale
  static Future<Locale> getSavedLocale() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final languageCode = prefs.getString(_languageKey);
      
      if (languageCode != null) {
        final locale = Locale(languageCode);
        if (supportedLocales.contains(locale)) {
          return locale;
        }
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error getting saved locale: $e');
      }
    }
    return defaultLocale;
  }

  /// Save language locale
  static Future<void> saveLocale(Locale locale) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_languageKey, locale.languageCode);
      if (kDebugMode) {
        debugPrint('Saved language: ${locale.languageCode}');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('Error saving locale: $e');
      }
    }
  }

  /// Get language name for display
  static String getLanguageName(Locale locale) {
    switch (locale.languageCode) {
      case 'en':
        return 'English';
      case 'am':
        return 'አማርኛ';
      default:
        return locale.languageCode.toUpperCase();
    }
  }

  /// Get all supported languages with their display names
  static List<Map<String, dynamic>> getSupportedLanguages() {
    return [
      {
        'locale': const Locale('en', ''),
        'name': 'English',
        'nativeName': 'English',
      },
      {
        'locale': const Locale('am', ''),
        'name': 'Amharic',
        'nativeName': 'አማርኛ',
      },
    ];
  }
}

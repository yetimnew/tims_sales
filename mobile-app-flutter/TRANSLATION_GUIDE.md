# Translation Guide - Amharic Support

## Overview

The mobile app now supports **English** and **Amharic (አማርኛ)** translations. Users can switch between languages from the Settings screen.

## Implementation Details

### 1. Translation Files

Translation files are located in `lib/l10n/`:
- `app_en.arb` - English translations
- `app_am.arb` - Amharic translations

These files use the ARB (Application Resource Bundle) format, which is Flutter's standard for localization.

### 2. Generated Files

After running `flutter gen-l10n`, Flutter automatically generates:
- `lib/.dart_tool/flutter_gen/gen_l10n/app_localizations.dart` - Localization class
- `lib/.dart_tool/flutter_gen/gen_l10n/app_localizations_en.dart` - English implementation
- `lib/.dart_tool/flutter_gen/gen_l10n/app_localizations_am.dart` - Amharic implementation

### 3. Language Service

`lib/services/language_service.dart` manages:
- Saving/loading selected language
- Supported locales list
- Language display names

### 4. How to Use Translations

#### In Widgets:

```dart
import 'package:flutter_gen/gen_l10n/app_localizations.dart';

// Get localization instance
final l10n = AppLocalizations.of(context)!;

// Use translations
Text(l10n.welcomeBack)
Text(l10n.updateStatus)
```

#### Current Translated Strings:

- App Title
- Welcome messages
- Dashboard labels
- Quick Actions
- Navigation tabs (Home, Performance, Trips, Profile)
- Settings labels
- Common buttons (Save, Cancel, OK, Yes, No)
- Error messages

### 5. Adding New Translations

#### Step 1: Add to English ARB file (`lib/l10n/app_en.arb`):

```json
{
  "myNewString": "My New String",
  "@myNewString": {
    "description": "Description of what this string is for"
  }
}
```

#### Step 2: Add to Amharic ARB file (`lib/l10n/app_am.arb`):

```json
{
  "myNewString": "የእኔ አዲስ ሕብረቁምፊ"
}
```

#### Step 3: Regenerate localization files:

```bash
flutter gen-l10n
```

#### Step 4: Use in code:

```dart
final l10n = AppLocalizations.of(context)!;
Text(l10n.myNewString)
```

### 6. Language Switching

Users can change language from:
- **Settings Screen** → **General Section** → **Language**

The language change takes effect immediately without restarting the app.

### 7. Supported Languages

Currently supported:
- **English** (en) - Default
- **Amharic** (am) - አማርኛ

### 8. Adding More Languages

To add a new language (e.g., Oromo):

1. Create `lib/l10n/app_or.arb`:

```json
{
  "@@locale": "or",
  "appTitle": "TIMS Driver",
  "welcomeBack": "Baga nagaan dhufte!",
  ...
}
```

2. Update `lib/services/language_service.dart`:

```dart
static const List<Locale> supportedLocales = [
  Locale('en', ''),
  Locale('am', ''),
  Locale('or', ''), // Add new locale
];
```

3. Add to `getSupportedLanguages()`:

```dart
{
  'locale': const Locale('or', ''),
  'name': 'Oromo',
  'nativeName': 'Afaan Oromoo',
},
```

4. Run `flutter gen-l10n`

### 9. Testing Translations

1. Run the app
2. Go to Settings → Language
3. Select "አማርኛ" (Amharic)
4. Navigate through the app to verify translations
5. Check that all UI elements are properly translated

### 10. Best Practices

1. **Always provide descriptions** in ARB files for translators
2. **Use meaningful keys** (e.g., `updateStatus` not `str1`)
3. **Keep translations context-aware** (same English word may need different Amharic translations)
4. **Test with long text** - Amharic text may be longer/shorter than English
5. **Consider RTL support** if needed (Amharic is LTR, but some languages are RTL)

### 11. Current Translation Coverage

✅ **Fully Translated:**
- Dashboard screen
- Settings screen
- Navigation tabs
- Common buttons and actions

⏳ **Partially Translated:**
- Login screen (needs update)
- Other feature screens (can be added as needed)

### 12. Files Modified

- `pubspec.yaml` - Added `flutter_localizations`
- `l10n.yaml` - Localization configuration
- `lib/l10n/app_en.arb` - English translations
- `lib/l10n/app_am.arb` - Amharic translations
- `lib/main.dart` - Added localization support
- `lib/services/language_service.dart` - Language management
- `lib/screens/settings/settings_screen.dart` - Language selector
- `lib/screens/dashboard/dashboard_screen.dart` - Uses translations

### 13. Commands

```bash
# Generate localization files
flutter gen-l10n

# Clean and regenerate
flutter clean
flutter pub get
flutter gen-l10n
```

## Notes

- The app remembers the selected language using `SharedPreferences`
- Language changes apply immediately without app restart
- If a translation is missing, the app falls back to English
- All date/time formatting will use the selected locale's format

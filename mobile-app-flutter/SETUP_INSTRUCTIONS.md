# Flutter Mobile App Setup Instructions

## Prerequisites

1. **Install Flutter SDK**
   - Download from: https://flutter.dev/docs/get-started/install
   - Follow installation instructions for your OS (Windows/Mac/Linux)
   - Verify installation: `flutter doctor`

2. **Install Android Studio** (for Android development)
   - Download from: https://developer.android.com/studio
   - Install Android SDK and emulator

3. **Install Xcode** (for iOS development - Mac only)
   - Available on Mac App Store
   - Install Xcode Command Line Tools

4. **Backend API Running**
   - Ensure your Laravel backend is running
   - Note the API base URL (e.g., `http://localhost:8000/api`)

## Setup Steps

### 1. Navigate to Flutter App Directory

```bash
cd mobile-app-flutter
```

### 2. Initialize Flutter Project (if not already done)

```bash
flutter create .
```

This will create the necessary Flutter project structure.

### 3. Install Dependencies

```bash
flutter pub get
```

This installs all packages listed in `pubspec.yaml`.

### 4. Configure API Base URL

Edit `lib/config/app_config.dart` and update the `apiBaseUrl`:

```dart
static const String apiBaseUrl = 'http://YOUR_BACKEND_URL/api';
```

For local development:
- Android Emulator: `http://10.0.2.2:8000/api`
- iOS Simulator: `http://localhost:8000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:8000/api`

### 5. Run the App

#### For Android:
```bash
flutter run
```

#### For iOS (Mac only):
```bash
flutter run -d ios
```

#### For specific device:
```bash
flutter devices  # List available devices
flutter run -d <device-id>
```

## Building for Production

### Android APK
```bash
flutter build apk --release
```

### Android App Bundle (for Play Store)
```bash
flutter build appbundle --release
```

### iOS (Mac only)
```bash
flutter build ios --release
```

## Troubleshooting

### Common Issues

1. **"flutter: command not found"**
   - Add Flutter to your PATH
   - Restart terminal/IDE

2. **"No devices found"**
   - Start an Android emulator or connect a physical device
   - For iOS, open Xcode and start a simulator

3. **API connection errors**
   - Check backend is running
   - Verify API base URL in `app_config.dart`
   - Check network permissions in AndroidManifest.xml / Info.plist

4. **Location permission errors**
   - Add location permissions to AndroidManifest.xml and Info.plist
   - Request permissions at runtime

### Android Permissions

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION"/>
```

### iOS Permissions

Add to `ios/Runner/Info.plist`:

```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to track your trips</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track your trips in the background</string>
```

## Next Steps

1. Test login functionality
2. Implement remaining screens (Performance, Trips, Profile)
3. Add location tracking
4. Add offline support
5. Test on physical devices
6. Build and deploy to app stores

## Development Tips

- Use `flutter hot reload` (press `r` in terminal) for quick updates
- Use `flutter hot restart` (press `R` in terminal) for full restart
- Check logs: `flutter logs`
- Analyze code: `flutter analyze`
- Format code: `flutter format lib/`


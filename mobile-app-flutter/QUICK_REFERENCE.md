# Quick Reference Guide

## 🚀 Quick Commands

```bash
# Install dependencies
flutter pub get

# Run the app
flutter run

# Run on specific device
flutter run -d android
flutter run -d chrome

# Check Flutter setup
flutter doctor

# Build for release
flutter build apk          # Android APK
flutter build appbundle    # Android App Bundle
flutter build ios          # iOS (Mac only)
```

## 📱 Project Structure Quick View

```
lib/
├── main.dart              # Start here
├── config/                # API configuration
├── models/                # Data structures
├── services/              # API calls & business logic
└── screens/               # UI screens
```

## 🔧 Important Files

- `lib/config/app_config.dart` - **Configure API URL here!**
- `lib/main.dart` - App entry point
- `pubspec.yaml` - Dependencies
- `lib/services/api_service.dart` - Base API client

## 🌐 API Configuration

Edit `lib/config/app_config.dart`:

```dart
// Android Emulator
static const String apiBaseUrl = 'http://10.0.2.2:8000/api';

// iOS Simulator
static const String apiBaseUrl = 'http://localhost:8000/api';

// Physical Device
static const String apiBaseUrl = 'http://YOUR_IP:8000/api';
```

## 📝 Development Workflow

1. **Start Backend**: `php artisan serve` (in Laravel project)
2. **Configure API**: Edit `lib/config/app_config.dart`
3. **Run App**: `flutter run`
4. **Hot Reload**: Press `r` in terminal
5. **Hot Restart**: Press `R` in terminal

## 🐛 Common Issues

**Connection Error?**
- Check backend is running
- Verify API URL in `app_config.dart`
- For physical device: use computer's IP, not localhost

**Build Error?**
```bash
flutter clean
flutter pub get
flutter run
```

**Device Not Found?**
- Start Android emulator in Android Studio
- Or connect physical device via USB

## 📚 Next Steps

1. ✅ Project organized
2. ⏭️ Configure API URL
3. ⏭️ Test login
4. ⏭️ Build remaining screens
5. ⏭️ Add location tracking
6. ⏭️ Test on device



# Driver Mobile App - Flutter

This is the Flutter mobile application for drivers to interact with the TIMS (Transport Information Management System).

## Features

- Driver authentication (Driver ID + Password)
- View performance metrics (trips, distance, rating)
- Update work/truck/trip status
- Background location tracking
- View assigned truck details
- View current/upcoming trips
- Submit trip reports/updates
- View notifications
- View maintenance schedules
- Offline support with sync

## Prerequisites

- Flutter SDK (3.0 or higher)
- Dart SDK (3.0 or higher)
- Android Studio / Xcode (for building)
- Backend API running (Laravel backend)

## Setup Instructions

1. **Install Flutter** (if not already installed):
   - Download from: https://flutter.dev/docs/get-started/install
   - Add Flutter to your PATH

2. **Create Flutter Project**:
   ```bash
   cd mobile-app-flutter
   flutter create .
   ```

3. **Install Dependencies**:
   ```bash
   flutter pub get
   ```

4. **Configure API Base URL**:
   - Update `lib/config/app_config.dart` with your backend API URL
   - Default: `http://localhost:8000/api`

5. **Run the App**:
   ```bash
   flutter run
   ```

## Project Structure

```
lib/
├── main.dart                 # App entry point
├── config/                   # Configuration files
│   └── app_config.dart      # API base URL and app settings
├── models/                   # Data models
│   ├── driver.dart
│   ├── trip.dart
│   ├── truck.dart
│   └── ...
├── services/                 # API services
│   ├── api_service.dart     # Base API service
│   ├── auth_service.dart
│   ├── driver_service.dart
│   └── ...
├── screens/                  # UI screens
│   ├── auth/
│   ├── dashboard/
│   ├── performance/
│   └── ...
├── widgets/                  # Reusable widgets
├── utils/                    # Utilities
│   ├── storage.dart          # Local storage (offline support)
│   ├── location_service.dart # Location tracking
│   └── ...
└── providers/                # State management (Provider/Riverpod)
    └── auth_provider.dart
```

## API Integration

The app connects to the Laravel backend API at:
- Base URL: Configured in `lib/config/app_config.dart`
- Authentication: Token-based (Laravel Sanctum)
- Endpoints: See backend API documentation

## Building for Production

### Android
```bash
flutter build apk --release
```

### iOS
```bash
flutter build ios --release
```

## Notes

- The backend API is already implemented and ready to use
- All API endpoints are documented in the backend
- Offline support uses local storage (Hive/SharedPreferences)
- Background location tracking requires proper permissions


# Quick Start Guide - Flutter Mobile App

## Prerequisites Check

First, check if Flutter is installed:
```bash
flutter --version
```

If you see version information, Flutter is installed. If not, install it first (see FLUTTER_SETUP_GUIDE.md).

## Method 1: Using the Batch Script (Windows)

1. **Run the batch script**:
   ```bash
   create_flutter_project.bat
   ```

2. **Follow the prompts** - it will create the project for you

3. **Copy our custom files**:
   - Copy all files from `mobile-app-flutter/lib/` to `driver_mobile_app/lib/`
   - Replace `pubspec.yaml` with the one from `mobile-app-flutter/`

4. **Install dependencies**:
   ```bash
   cd driver_mobile_app
   flutter pub get
   ```

## Method 2: Manual Setup

### Step 1: Create Flutter Project

```bash
# Navigate to your desired location
cd C:\laragon\www\react-starter-kit

# Create Flutter project
flutter create driver_mobile_app

# Navigate into the project
cd driver_mobile_app
```

### Step 2: Update Dependencies

1. **Open `pubspec.yaml`** and replace it with the content from `mobile-app-flutter/pubspec.yaml`

2. **Or manually add these dependencies** to your existing `pubspec.yaml`:
   ```yaml
   dependencies:
     provider: ^6.1.1
     http: ^1.1.2
     dio: ^5.4.0
     shared_preferences: ^2.2.2
     geolocator: ^10.1.0
     # ... (see mobile-app-flutter/pubspec.yaml for full list)
   ```

### Step 3: Copy Custom Files

Copy all files from `mobile-app-flutter/lib/` to `driver_mobile_app/lib/`:

**Windows Command:**
```bash
xcopy /E /I mobile-app-flutter\lib driver_mobile_app\lib
```

**Or manually copy:**
- `lib/config/app_config.dart`
- `lib/models/*.dart`
- `lib/services/*.dart`
- `lib/screens/**/*.dart`
- `lib/main.dart`

### Step 4: Install Dependencies

```bash
flutter pub get
```

### Step 5: Configure API URL

Edit `lib/config/app_config.dart`:
```dart
static const String apiBaseUrl = 'http://10.0.2.2:8000/api'; // Android emulator
// OR
static const String apiBaseUrl = 'http://localhost:8000/api'; // iOS simulator
// OR
static const String apiBaseUrl = 'http://YOUR_IP:8000/api'; // Physical device
```

### Step 6: Run the App

```bash
# List available devices
flutter devices

# Run on specific device
flutter run

# Or run on Android
flutter run -d android

# Or run on iOS (Mac only)
flutter run -d ios
```

## Project Structure

After setup, your project should look like:

```
driver_mobile_app/
├── android/              # Android platform files
├── ios/                  # iOS platform files  
├── lib/
│   ├── main.dart        # ✅ App entry point
│   ├── config/
│   │   └── app_config.dart  # ✅ API configuration
│   ├── models/
│   │   ├── driver.dart  # ✅ Driver model
│   │   ├── trip.dart    # ✅ Trip model
│   │   └── truck.dart  # ✅ Truck model
│   ├── services/
│   │   ├── api_service.dart      # ✅ Base API
│   │   ├── auth_service.dart     # ✅ Authentication
│   │   ├── driver_service.dart   # ✅ Driver data
│   │   ├── location_service.dart # ✅ Location tracking
│   │   ├── status_service.dart  # ✅ Status updates
│   │   ├── trip_service.dart    # ✅ Trip management
│   │   └── performance_service.dart # ✅ Performance
│   └── screens/
│       ├── auth/
│       │   └── login_screen.dart    # ✅ Login UI
│       └── dashboard/
│           └── dashboard_screen.dart # ✅ Main dashboard
├── pubspec.yaml          # ✅ Dependencies
└── README.md
```

## Testing the Setup

1. **Start your Laravel backend**:
   ```bash
   php artisan serve
   ```

2. **Run Flutter app**:
   ```bash
   flutter run
   ```

3. **Test login**:
   - Use a driver ID and password from your database
   - The app should connect to the backend API

## Common Issues

### Issue: "flutter: command not found"
**Solution**: Install Flutter and add to PATH (see FLUTTER_SETUP_GUIDE.md)

### Issue: "No devices found"
**Solution**: 
- Android: Start Android Studio emulator
- iOS: Start Xcode simulator
- Or connect physical device

### Issue: "API connection failed"
**Solution**: 
- Check backend is running (`php artisan serve`)
- Verify API URL in `app_config.dart`
- Check network permissions in AndroidManifest.xml

### Issue: "Package not found"
**Solution**: 
```bash
flutter clean
flutter pub get
```

## Next Steps

1. ✅ Project created
2. ✅ Dependencies installed
3. ✅ Files copied
4. ✅ API configured
5. ⏭️ Test login functionality
6. ⏭️ Implement remaining screens
7. ⏭️ Add location tracking
8. ⏭️ Test on physical device


# Complete Flutter Project Setup Guide

## Step 1: Install Flutter (If Not Already Installed)

### For Windows:
1. Download Flutter SDK from: https://docs.flutter.dev/get-started/install/windows
2. Extract the zip file to a location (e.g., `C:\src\flutter`)
3. Add Flutter to your PATH:
   - Search for "Environment Variables" in Windows
   - Edit "Path" variable
   - Add: `C:\src\flutter\bin`
4. Verify installation:
   ```bash
   flutter doctor
   ```

### For Mac/Linux:
1. Download Flutter SDK from: https://docs.flutter.dev/get-started/install
2. Extract and add to PATH
3. Run `flutter doctor`

## Step 2: Create New Flutter Project

### Option A: Create in Current Directory (Recommended)

1. **Navigate to your project root** (where you want the Flutter app):
   ```bash
   cd C:\laragon\www\react-starter-kit
   ```

2. **Create a new Flutter project**:
   ```bash
   flutter create driver_mobile_app
   ```
   
   This will create a folder called `driver_mobile_app` with all Flutter project files.

3. **Navigate into the new project**:
   ```bash
   cd driver_mobile_app
   ```

### Option B: Create in a Different Location

1. **Navigate to where you want the project**:
   ```bash
   cd C:\Projects
   ```

2. **Create Flutter project**:
   ```bash
   flutter create driver_mobile_app
   ```

3. **Navigate into project**:
   ```bash
   cd driver_mobile_app
   ```

## Step 3: Copy Our Custom Files

After creating the Flutter project, you need to copy the files we created:

1. **Copy the `lib` folder contents** from `mobile-app-flutter/lib/` to `driver_mobile_app/lib/`
2. **Update `pubspec.yaml`** with our dependencies (or merge with existing)
3. **Copy configuration files** if any

## Step 4: Install Dependencies

```bash
flutter pub get
```

## Step 5: Configure API URL

Edit `lib/config/app_config.dart` and update:
```dart
static const String apiBaseUrl = 'http://YOUR_BACKEND_URL/api';
```

For local testing:
- Android Emulator: `http://10.0.2.2:8000/api`
- iOS Simulator: `http://localhost:8000/api`
- Physical Device: `http://YOUR_COMPUTER_IP:8000/api`

## Step 6: Run the App

```bash
flutter run
```

## Quick Setup Script (After Flutter is Installed)

Once Flutter is installed, you can run these commands:

```bash
# 1. Create Flutter project
flutter create driver_mobile_app

# 2. Navigate to project
cd driver_mobile_app

# 3. Install dependencies (after updating pubspec.yaml)
flutter pub get

# 4. Run the app
flutter run
```

## Project Structure After Setup

```
driver_mobile_app/
├── android/          # Android-specific files
├── ios/              # iOS-specific files
├── lib/              # Your Dart code
│   ├── main.dart
│   ├── config/
│   ├── models/
│   ├── services/
│   └── screens/
├── test/             # Tests
├── pubspec.yaml      # Dependencies
└── README.md
```

## Troubleshooting

### Flutter command not found
- Make sure Flutter is added to your PATH
- Restart terminal/command prompt
- Run `flutter doctor` to verify

### No devices found
- For Android: Start Android Studio and create/start an emulator
- For iOS (Mac only): Open Xcode and start a simulator
- Or connect a physical device via USB

### Dependencies errors
- Run `flutter clean`
- Delete `pubspec.lock`
- Run `flutter pub get` again


# Step-by-Step Flutter Project Setup

## Complete Setup Instructions

### Step 1: Install Flutter (If Not Installed)

1. **Download Flutter**:
   - Go to: https://docs.flutter.dev/get-started/install/windows
   - Download the Flutter SDK zip file

2. **Extract Flutter**:
   - Extract to: `C:\src\flutter` (or any location you prefer)

3. **Add to PATH**:
   - Press `Win + R`, type `sysdm.cpl`, press Enter
   - Go to "Advanced" tab → "Environment Variables"
   - Under "System Variables", find "Path" and click "Edit"
   - Click "New" and add: `C:\src\flutter\bin`
   - Click OK on all dialogs

4. **Verify Installation**:
   - Open a NEW command prompt (important: restart terminal)
   - Run: `flutter doctor`
   - You should see Flutter version information

### Step 2: Create Flutter Project

Open command prompt in your project directory:

```bash
# Navigate to your project root
cd C:\laragon\www\react-starter-kit

# Create Flutter project
flutter create driver_mobile_app

# Wait for project creation to complete...
```

This will create a folder called `driver_mobile_app` with all necessary Flutter files.

### Step 3: Copy Our Custom Files

**Option A: Using the Batch Script (Easiest)**

1. Run the copy script:
   ```bash
   copy_flutter_files.bat
   ```

2. Enter project name when prompted (or press Enter for default: `driver_mobile_app`)

**Option B: Manual Copy**

1. **Copy lib folder**:
   ```bash
   xcopy /E /I mobile-app-flutter\lib driver_mobile_app\lib
   ```

2. **Copy pubspec.yaml**:
   ```bash
   copy mobile-app-flutter\pubspec.yaml driver_mobile_app\pubspec.yaml
   ```

**Option C: Using File Explorer**

1. Open File Explorer
2. Navigate to `mobile-app-flutter\lib`
3. Copy all files and folders
4. Navigate to `driver_mobile_app\lib`
5. Paste all files (replace if asked)

### Step 4: Install Dependencies

```bash
# Navigate to Flutter project
cd driver_mobile_app

# Install all packages
flutter pub get
```

This will download all required packages listed in `pubspec.yaml`.

### Step 5: Configure API URL

1. **Open** `driver_mobile_app\lib\config\app_config.dart`

2. **Update the API base URL**:
   ```dart
   static const String apiBaseUrl = 'http://10.0.2.2:8000/api'; // For Android emulator
   ```
   
   **Different URLs for different scenarios:**
   - Android Emulator: `http://10.0.2.2:8000/api`
   - iOS Simulator: `http://localhost:8000/api`
   - Physical Device: `http://YOUR_COMPUTER_IP:8000/api` (find IP with `ipconfig`)

### Step 6: Start Backend Server

In a separate terminal:

```bash
# Navigate to Laravel project
cd C:\laragon\www\react-starter-kit

# Start Laravel server
php artisan serve
```

The server will run on `http://localhost:8000`

### Step 7: Run Flutter App

```bash
# Make sure you're in the Flutter project directory
cd driver_mobile_app

# Check available devices
flutter devices

# Run the app
flutter run
```

**Or run on specific platform:**
```bash
flutter run -d android    # Android only
flutter run -d ios        # iOS only (Mac)
```

## Visual Guide

```
1. Install Flutter
   └─> Download & Extract
   └─> Add to PATH
   └─> Verify: flutter doctor

2. Create Project
   └─> flutter create driver_mobile_app
   └─> Wait for completion

3. Copy Files
   └─> Run: copy_flutter_files.bat
   └─> OR manually copy lib/ folder

4. Install Dependencies
   └─> cd driver_mobile_app
   └─> flutter pub get

5. Configure API
   └─> Edit lib/config/app_config.dart
   └─> Set API base URL

6. Start Backend
   └─> php artisan serve

7. Run App
   └─> flutter run
```

## Quick Command Summary

```bash
# 1. Create project
flutter create driver_mobile_app

# 2. Copy files (run the batch script or manually)
copy_flutter_files.bat

# 3. Navigate to project
cd driver_mobile_app

# 4. Install dependencies
flutter pub get

# 5. Configure API URL (edit lib/config/app_config.dart)

# 6. Run app
flutter run
```

## Troubleshooting

### "flutter: command not found"
- Flutter not in PATH
- Restart terminal after adding to PATH
- Run `flutter doctor` to verify

### "No devices found"
- Start Android Studio → AVD Manager → Start emulator
- Or connect physical device via USB
- Enable USB debugging on Android device

### "Package not found" errors
```bash
flutter clean
flutter pub get
```

### API connection fails
- Check backend is running: `php artisan serve`
- Verify API URL in `app_config.dart`
- Check firewall settings
- For physical device: Use computer's IP address, not localhost

## What Gets Created

After running `flutter create driver_mobile_app`, you'll have:

```
driver_mobile_app/
├── android/          # Android platform code
├── ios/              # iOS platform code
├── lib/              # Your Dart code (we'll add our files here)
├── test/             # Test files
├── pubspec.yaml      # Dependencies (we'll update this)
└── README.md         # Project readme
```

After copying our files, `lib/` will contain:
```
lib/
├── main.dart
├── config/
├── models/
├── services/
└── screens/
```

## Next Steps After Setup

1. ✅ Project created
2. ✅ Files copied
3. ✅ Dependencies installed
4. ✅ API configured
5. ⏭️ Test login
6. ⏭️ Build remaining screens
7. ⏭️ Add location tracking
8. ⏭️ Test on device

## Need Help?

- Check `FLUTTER_SETUP_GUIDE.md` for detailed instructions
- Check `QUICK_START.md` for quick reference
- Run `flutter doctor` to check for issues
- Check Flutter documentation: https://flutter.dev/docs


# Testing on Physical Mobile Device

This guide explains how to test the TIMS Driver mobile app on your own Android or iOS device.

## Prerequisites

- Flutter SDK installed and configured
- Mobile device (Android or iOS)
- USB cable for device connection
- Android Studio / Xcode (for iOS) installed

---

## Android Testing

### Step 1: Enable Developer Options

1. **Open Settings** on your Android device
2. **Go to About Phone** (or About Device)
3. **Tap "Build Number" 7 times** until you see "You are now a developer!"
4. **Go back** to Settings
5. **Open Developer Options** (usually under System or Advanced)

### Step 2: Enable USB Debugging

1. **In Developer Options**, find **"USB Debugging"**
2. **Toggle it ON**
3. **Accept the warning** if prompted
4. (Optional) Enable **"Install via USB"** if available

### Step 3: Connect Your Device

1. **Connect your device** to your computer via USB cable
2. **On your device**, allow USB debugging when prompted (tap "Allow" or "OK")
3. **Check the "Always allow from this computer"** checkbox if desired

### Step 4: Verify Connection

Run this command to check if your device is detected:

```bash
cd mobile-app-flutter
flutter devices
```

You should see your device listed, for example:
```
Android SDK built for x86_64 (mobile) • emulator-5554 • android-x86_64 • Android 13 (API 33)
SM-G998B (mobile)                     • R58M123456789  • android-arm64  • Android 13 (API 33) (connected)
```

### Step 5: Build and Install on Device

**Option A: Debug Build (Development)**
```bash
flutter run
```
Flutter will automatically detect and install on your connected device.

**Option B: Debug Build (Specific Device)**
If multiple devices are connected:
```bash
flutter run -d <device-id>
# Example:
flutter run -d R58M123456789
```

**Option C: Release APK (For Distribution)**
```bash
flutter build apk --release
```
This creates an APK file at:
```
mobile-app-flutter/build/app/outputs/flutter-apk/app-release.apk
```

Transfer this APK to your device and install it.

### Step 6: Enable Installation from Unknown Sources (For APK)

If installing APK directly on device:
1. **Settings** → **Security** (or **Apps & Notifications**)
2. **Enable "Install Unknown Apps"** or **"Allow from this source"**
3. **Tap the APK file** and install

---

## iOS Testing (Mac Only)

### Step 1: Enable Developer Mode

1. **Settings** → **Privacy & Security** → **Developer Mode**
2. **Toggle ON** and restart your device

### Step 2: Trust Your Computer

1. **Connect your iPhone/iPad** via USB
2. **On your device**, tap **"Trust This Computer"** when prompted
3. **Enter your passcode** if requested

### Step 3: Configure Signing in Xcode

1. **Open** `mobile-app-flutter/ios/Runner.xcworkspace` in Xcode
2. **Select "Runner"** in the project navigator
3. **Go to "Signing & Capabilities" tab**
4. **Select your Apple Developer Team** (requires Apple Developer account for release)
5. **For development**, you can use your Apple ID (automatic signing)

### Step 4: Verify Connection

```bash
cd mobile-app-flutter
flutter devices
```

You should see your iOS device listed:
```
iPhone 14 Pro (mobile) • 00008030-001234567890ABCD • com.apple.CoreSimulator.SimRuntime.iOS-17-0 • iOS 17.0 (connected)
```

### Step 5: Build and Install

**Option A: Debug Build**
```bash
flutter run
```

**Option B: Release Build**
```bash
flutter build ios --release
```

Then open in Xcode and run on device, or:
```bash
flutter run --release
```

---

## Wireless Debugging (Android 11+)

### Set Up Wireless Debugging

1. **Enable Developer Options** (see Step 1 above)
2. **In Developer Options**, find **"Wireless Debugging"**
3. **Toggle it ON**
4. **Tap "Wireless Debugging"** to open settings
5. **Tap "Pair device with pairing code"**
6. **Note the IP address and port** shown (e.g., `192.168.1.100:12345`)
7. **Note the pairing code** (e.g., `123456`)

### Connect via ADB

On your computer, run:
```bash
adb pair <ip-address>:<port>
# Example: adb pair 192.168.1.100:12345
# Enter pairing code when prompted
```

Then:
```bash
adb connect <ip-address>:<port>
# Example: adb connect 192.168.1.100:12345
```

Verify connection:
```bash
flutter devices
```

---

## Troubleshooting

### Android Issues

**Issue: Device not detected**
```bash
# Check if device is connected via ADB
adb devices

# If device shows as "unauthorized", check your device and tap "Allow USB Debugging"
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

**Issue: "Installation failed" or "INSTALL_FAILED"**
- Check if USB debugging is enabled
- Try different USB cable
- Enable "Install via USB" in Developer Options
- Check available storage on device

**Issue: App crashes on launch**
```bash
# Check logs
flutter run --verbose

# Or use adb logcat
adb logcat | grep flutter
```

**Issue: Build fails**
```bash
# Clean build
flutter clean
flutter pub get
flutter run
```

### iOS Issues

**Issue: "No signing certificate found"**
- Open project in Xcode
- Go to Signing & Capabilities
- Select your Apple ID or Developer Team
- Enable "Automatically manage signing"

**Issue: "Could not launch app"**
- Trust developer certificate on device: Settings → General → VPN & Device Management → Trust

**Issue: App doesn't install**
- Check device storage
- Check provisioning profile
- Restart Xcode and device

---

## Testing Checklist

### Before Testing
- [ ] Device connected and detected (`flutter devices`)
- [ ] USB debugging enabled (Android)
- [ ] Developer mode enabled (iOS)
- [ ] App builds successfully (`flutter build apk` or `flutter build ios`)

### Basic Functionality Tests
- [ ] App launches successfully
- [ ] Login screen displays correctly
- [ ] Can login with valid credentials
- [ ] Dashboard loads after login
- [ ] Navigation works (buttons, tabs, menus)
- [ ] All screens accessible

### Feature-Specific Tests
- [ ] Settings screen works
- [ ] Biometric authentication (if enabled)
- [ ] Fuel tracking (add/view records)
- [ ] Emergency button works
- [ ] Trip navigation opens maps
- [ ] Photo capture/uploads work
- [ ] Offline mode (disable WiFi/data, test)
- [ ] Push notifications (if Firebase configured)

### Performance Tests
- [ ] App responds quickly to user input
- [ ] No crashes during normal use
- [ ] Memory usage reasonable
- [ ] Battery usage normal

---

## Building for Release (Production)

### Android Release APK
```bash
flutter build apk --release
```
APK location: `build/app/outputs/flutter-apk/app-release.apk`

### Android App Bundle (for Google Play)
```bash
flutter build appbundle --release
```
AAB location: `build/app/outputs/bundle/release/app-release.aab`

### iOS Release (requires Apple Developer account)
```bash
flutter build ios --release
```
Then archive and upload via Xcode or:
```bash
flutter build ipa
```

---

## Additional Commands

### View Connected Devices
```bash
flutter devices
```

### Run on Specific Device
```bash
flutter run -d <device-id>
```

### Hot Reload (During Development)
- Press `r` in terminal (hot reload)
- Press `R` (hot restart)
- Press `q` (quit)

### View Logs
```bash
# During flutter run, logs are shown automatically
# Or use:
adb logcat -s flutter  # Android
# Or in Xcode for iOS
```

### Install APK Directly
```bash
# Build APK first
flutter build apk

# Install via ADB
adb install build/app/outputs/flutter-apk/app-release.apk
```

---

## Quick Start Commands

### Android
```bash
cd mobile-app-flutter
flutter devices                    # Check device connection
flutter run                        # Build and install on device
```

### iOS
```bash
cd mobile-app-flutter
flutter devices                    # Check device connection
flutter run                        # Build and install on device
```

---

## Need Help?

- **Flutter Documentation**: https://docs.flutter.dev/get-started/install
- **Android Debugging**: https://developer.android.com/studio/debug
- **iOS Debugging**: https://developer.apple.com/documentation/xcode

---

**Happy Testing! 🚀**

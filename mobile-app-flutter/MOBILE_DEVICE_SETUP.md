# Mobile Device Setup Guide

## 🔧 Setup Options

You have **3 options** to run the app on mobile:

### Option 1: Physical Android Device (Recommended)
### Option 2: Physical iOS Device
### Option 3: Android Emulator

---

## 📱 Option 1: Physical Android Device

### Step 1: Connect Your Device
1. Connect your Android device to your computer via USB
2. On your phone, enable **Developer Options**:
   - Go to **Settings** → **About Phone**
   - Tap **Build Number** 7 times
3. Enable **USB Debugging**:
   - Go to **Settings** → **Developer Options**
   - Turn on **USB Debugging**
   - Turn on **Install via USB** (if available)

### Step 2: Verify Device Connection
```bash
flutter devices
```

You should see your device listed, for example:
```
Pixel 7 (mobile) • ABC123XYZ • android-arm64 • Android 13
```

### Step 3: Get Your Computer's IP Address
On Windows, run:
```bash
ipconfig
```

Look for your main network adapter's IPv4 address:
- Usually something like: `192.168.1.4` or `192.168.101.1`

**Your current IP addresses:**
- `192.168.101.1`
- `192.168.1.4` ← **Use this one** (likely your main network)

### Step 4: Update API Configuration

**Option A: Update `app_config.dart` (for permanent change)**
```dart
// Change this line in lib/config/app_config.dart:
return 'http://192.168.1.4:8000/api';  // Use your actual IP
```

**Option B: Use environment variable (recommended for testing)**
```bash
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

### Step 5: Ensure Backend is Accessible
1. Make sure your Laravel backend is running: `php artisan serve --host=0.0.0.0 --port=8000`
2. **Important**: Use `--host=0.0.0.0` so it's accessible from your network
3. Test in phone's browser: `http://192.168.1.4:8000/api/login` (should show an error, but connection works)

### Step 6: Configure Firewall
- Windows: Allow port 8000 in Windows Firewall for your network
- Make sure your phone and computer are on the **same WiFi network**

### Step 7: Run the App
```bash
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

Or if you updated `app_config.dart`:
```bash
flutter run -d <your-device-id>
```

---

## 🍎 Option 2: Physical iOS Device

### Step 1: Connect Your Device
1. Connect your iPhone/iPad to your Mac via USB
2. Trust the computer when prompted on your device

### Step 2: Verify Device Connection
```bash
flutter devices
```

You should see your device listed.

### Step 3: Get Your Mac's IP Address
On Mac/Linux, run:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### Step 4: Update API Configuration
Same as Android - update `app_config.dart` or use `--dart-define`

### Step 5: Run the App
```bash
flutter run -d <your-ios-device-id> --dart-define=API_BASE_URL=http://YOUR_MAC_IP:8000/api
```

**Note**: For iOS, you may need to:
- Sign the app with your Apple Developer account
- Configure provisioning profile in Xcode

---

## 🤖 Option 3: Android Emulator

### Step 1: List Available Emulators
```bash
flutter emulators
```

If no emulators exist:
```bash
flutter emulators --create
```

Or create via Android Studio:
1. Open **Android Studio**
2. Go to **Tools** → **Device Manager**
3. Click **Create Device**
4. Select a device (e.g., Pixel 7)
5. Download a system image (e.g., Android 13)
6. Finish setup

### Step 2: Start the Emulator
```bash
flutter emulators --launch <emulator-id>
```

Or start from Android Studio:
1. Open **Device Manager**
2. Click **Play** button next to your emulator

### Step 3: Verify Emulator is Running
```bash
flutter devices
```

You should see:
```
sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64 • Android 13
```

### Step 4: Run the App
```bash
flutter run -d emulator-5554
```

**Note**: The default `10.0.2.2` IP works for Android emulator, no changes needed!

---

## 🚀 Quick Start Commands

### For Physical Android Device:
```bash
# 1. Check connected devices
flutter devices

# 2. Start Laravel with network access
cd ..
php artisan serve --host=0.0.0.0 --port=8000

# 3. Run Flutter app with your IP (replace 192.168.1.4 with your actual IP)
cd mobile-app-flutter
flutter run -d <device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

### For Android Emulator:
```bash
# 1. Start emulator
flutter emulators --launch <emulator-id>

# 2. Run app (no IP change needed)
flutter run -d <emulator-id>
```

---

## 🔍 Troubleshooting

### Device Not Detected
- **Android**: Enable USB Debugging, install USB drivers, try different USB port
- **iOS**: Trust computer, check Xcode is installed, check device in Xcode

### Cannot Connect to Backend
- Check IP address is correct
- Check phone and computer are on same WiFi
- Check firewall allows port 8000
- Verify backend is running with `--host=0.0.0.0`
- Test in phone browser: `http://YOUR_IP:8000/api/login`

### Build Errors
- Run `flutter clean && flutter pub get`
- Check `flutter doctor` for issues
- For iOS: Check Xcode and provisioning profiles

### API Connection Errors
- Verify CORS is configured for mobile IPs in Laravel
- Check `config/cors.php` allows your network IPs
- Check `.env` has correct `APP_URL`

---

## ✅ Next Steps

1. Choose your preferred option (Physical device or Emulator)
2. Follow the steps for that option
3. Once connected, run: `flutter run -d <device-id>`
4. Test all features on the mobile device!

---

## 📝 Current Configuration

- **Your Computer IPs**: `192.168.101.1`, `192.168.1.4`
- **Recommended IP for physical device**: `192.168.1.4`
- **Backend Port**: `8000`
- **Default API URL for emulator**: `http://10.0.2.2:8000/api`
- **API URL for physical device**: `http://192.168.1.4:8000/api` (update as needed)


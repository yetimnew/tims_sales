# Run Flutter App on Android - Quick Guide

## ✅ Your Android Setup Status
- ✅ Android SDK: Installed (36.1.0)
- ✅ Android Studio: Installed
- ✅ Java: Configured (OpenJDK 21)
- ✅ Licenses: All accepted
- ✅ Emulator Tools: Available
- ⚠️  **No emulator created yet** - Need to create one first

## 🚀 Quick Steps to Run on Android

### OPTION 1: Create Emulator via Android Studio (Recommended) ⭐

#### Step 1: Open Android Studio
1. Open **Android Studio** (if not already open)
2. Wait for it to fully load

#### Step 2: Open Device Manager
- Click the **Device Manager** icon in the toolbar (phone/tablet icon)
- OR: Go to **Tools** → **Device Manager**
- OR: Go to **View** → **Tool Windows** → **Device Manager**

#### Step 3: Create Virtual Device
1. Click **Create Device** button (or **+** icon)
2. Select a device:
   - Choose **Phone** category
   - Select **Pixel 7** (or Pixel 5, Pixel 6)
   - Click **Next**

#### Step 4: Download System Image (if needed)
1. Select a system image:
   - Choose **Android 13.0 (Tiramisu)** - API 33 (recommended)
   - OR **Android 12.0** - API 31
2. If you see **Download** button:
   - Click **Download**
   - Wait for download (5-10 minutes, ~1GB)
   - Accept license agreements
3. Once downloaded, select it and click **Next**

#### Step 5: Configure AVD (Android Virtual Device)
1. **AVD Name**: Keep default or rename (e.g., "Pixel_7_API_33")
2. **Startup orientation**: Portrait
3. **Graphics**: Hardware - GLES 2.0 (recommended)
4. Click **Finish**

#### Step 6: Start the Emulator
1. You should see your emulator in Device Manager
2. Click the **Play** button (▶️) next to your emulator
3. Wait for emulator to boot (1-2 minutes first time)

#### Step 7: Verify Emulator is Running
Run this command:
```bash
flutter devices
```

You should see something like:
```
sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64 • Android 13
```

#### Step 8: Run Your App on Emulator
Once emulator is listed in `flutter devices`, run:
```bash
cd mobile-app-flutter
flutter run -d emulator-5554
```

Replace `emulator-5554` with your actual emulator ID.

---

### OPTION 2: Connect Physical Android Device

#### Step 1: Enable Developer Options
1. On your Android phone, go to **Settings** → **About Phone**
2. Find **Build Number**
3. Tap **Build Number** 7 times
4. You'll see "You are now a developer!" message

#### Step 2: Enable USB Debugging
1. Go back to **Settings**
2. Go to **Developer Options** (now visible)
3. Turn on **USB Debugging**
4. Turn on **Install via USB** (if available)
5. (Optional) Turn on **Stay awake** (keeps screen on while charging)

#### Step 3: Connect Your Phone
1. Connect your phone to computer via USB cable
2. On your phone, you'll see a prompt: **Allow USB Debugging?**
3. Check **Always allow from this computer** (optional but helpful)
4. Tap **OK**

#### Step 4: Verify Device Connection
```bash
flutter devices
```

You should see your device, for example:
```
Pixel 7 (mobile) • ABC123XYZ • android-arm64 • Android 13
```

#### Step 5: Get Your Computer's IP Address
On Windows:
```bash
ipconfig
```

Look for your main network adapter's **IPv4 Address**:
- Usually: `192.168.1.4` or `192.168.0.100`

**Your computer's IP addresses:**
- `192.168.101.1`
- `192.168.1.4` ← **Use this one** (likely your main network)

#### Step 6: Start Laravel Backend with Network Access
```bash
cd react-starter-kit
php artisan serve --host=0.0.0.0 --port=8000
```

**Important:** Use `--host=0.0.0.0` so your phone can access it!

#### Step 7: Run Flutter App on Your Phone
```bash
cd mobile-app-flutter
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

Replace `192.168.1.4` with your actual IP address.

**Important:** 
- Phone and computer must be on the **same WiFi network**
- Replace device ID with actual ID from `flutter devices`

---

## 🔍 Troubleshooting

### Emulator Won't Start?
- Check if virtualization is enabled in BIOS (Intel VT-x or AMD-V)
- Try a different system image (x86_64 vs arm64)
- Restart Android Studio
- Check emulator logs: Tools → Device Manager → Click dropdown arrow on emulator

### Device Not Detected?
- **Physical Device**: 
  - Try different USB cable
  - Try different USB port
  - Install USB drivers for your phone brand
  - Check `adb devices` in command line
- **Emulator**:
  - Make sure emulator is fully booted (wait for home screen)
  - Restart Flutter daemon: `flutter daemon --kill`

### Cannot Connect to Backend?
- Check IP address is correct
- Verify phone and computer are on same WiFi (for physical device)
- Check Windows Firewall allows port 8000
- Verify backend is running: `php artisan serve --host=0.0.0.0`
- Test in phone browser: `http://YOUR_IP:8000/api/login`

### System Image Download Fails?
- Check internet connection
- Try a different system image (Android 12, 13, etc.)
- Download manually: Tools → SDK Manager → SDK Platforms

---

## ✅ After Emulator/Device is Ready

Once you see your device/emulator in `flutter devices`, just tell me and I'll run:

```bash
flutter run -d <device-id>
```

For physical device, I'll use:
```bash
flutter run -d <device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

---

## 📱 Quick Reference Commands

```bash
# Check available devices
flutter devices

# List available emulators
flutter emulators

# Run on specific device
flutter run -d <device-id>

# For physical device with custom API URL
flutter run -d <device-id> --dart-define=API_BASE_URL=http://YOUR_IP:8000/api

# Start Laravel backend (for physical device)
php artisan serve --host=0.0.0.0 --port=8000
```

---

## 🎯 Next Steps

1. **Choose your option** (Emulator or Physical Device)
2. **Follow the steps above**
3. **Verify device is connected**: `flutter devices`
4. **Tell me when ready** - I'll run the app automatically!

The app will build and launch on your Android device/emulator! 🚀


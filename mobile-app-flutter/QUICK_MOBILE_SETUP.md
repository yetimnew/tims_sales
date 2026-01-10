# Quick Mobile Setup - Step by Step

## 🎯 Current Status
- ✅ Chrome/Web: Working
- ⚠️  Physical Device: Not connected
- ⚠️  Emulator: Not available

## 🚀 Quick Start - Choose One Option:

---

## Option 1: Create & Start Android Emulator (Easiest)

### Step 1: Open Android Studio
1. Open **Android Studio**
2. Go to **Tools** → **Device Manager** (or click the phone icon in toolbar)

### Step 2: Create an Emulator (if none exist)
1. Click **Create Device** (or **+** button)
2. Select a device (e.g., **Pixel 7**)
3. Click **Next**
4. Download a system image (e.g., **Android 13 (Tiramisu)** - API 33)
5. Click **Next** → **Finish**

### Step 3: Start the Emulator
1. Click the **Play** button (▶️) next to your emulator
2. Wait for emulator to boot (may take 1-2 minutes)

### Step 4: Verify Device is Connected
```bash
flutter devices
```

You should see:
```
sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64 • Android 13
```

### Step 5: Run the App
```bash
cd mobile-app-flutter
flutter run -d emulator-5554
```

**✅ Done!** The default `10.0.2.2` IP works for Android emulator - no changes needed!

---

## Option 2: Connect Physical Android Device

### Step 1: Enable Developer Options on Phone
1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. You'll see "You are now a developer!" message

### Step 2: Enable USB Debugging
1. Go to **Settings** → **Developer Options**
2. Turn on **USB Debugging**
3. Turn on **Install via USB** (if available)
4. (Optional) Turn on **Stay awake** (for easier testing)

### Step 3: Connect Phone to Computer
1. Connect your phone via USB cable
2. On your phone, when prompted, **Allow USB Debugging**
3. Check **Always allow from this computer** (optional)
4. Tap **OK**

### Step 4: Verify Device Connection
```bash
cd mobile-app-flutter
flutter devices
```

You should see your device, for example:
```
Pixel 7 (mobile) • ABC123XYZ • android-arm64 • Android 13
```

### Step 5: Get Your Computer's IP Address
```bash
ipconfig
```

Look for **IPv4 Address** under your WiFi adapter:
- Usually: `192.168.1.4` or `192.168.101.1`

**Your current IPs:**
- `192.168.101.1`
- `192.168.1.4` ← **Use this one** (likely your main network)

### Step 6: Start Laravel Backend with Network Access
```bash
cd ..  # Go to react-starter-kit directory
php artisan serve --host=0.0.0.0 --port=8000
```

**Important:** Use `--host=0.0.0.0` so it's accessible from your phone!

### Step 7: Run Flutter App with Your IP
```bash
cd mobile-app-flutter
flutter run -d <your-device-id> --dart-define=API_BASE_URL=http://192.168.1.4:8000/api
```

Replace `192.168.1.4` with your actual IP address.

**✅ Done!** The app should now connect to your backend!

---

## Option 3: Use Command Line to Create Emulator

If you prefer command line:

```bash
# 1. List available system images
flutter emulators --create

# Or use Android SDK tools directly:
cd %ANDROID_HOME%\cmdline-tools\latest\bin
avdmanager list targets
avdmanager create avd -n "Pixel_7_API_33" -k "system-images;android-33;google_apis;x86_64"
```

Then start it:
```bash
emulator -avd Pixel_7_API_33
```

---

## 🔍 Troubleshooting

### Device Not Showing Up?
1. **For Physical Device:**
   - Check USB cable (try different cable)
   - Check USB port (try different port)
   - Enable USB Debugging again
   - Install USB drivers for your phone brand
   - Check `adb devices` - should show your device

2. **For Emulator:**
   - Make sure emulator is fully booted (wait for home screen)
   - Restart Android Studio
   - Check if emulator is running: `flutter devices`

### Cannot Connect to Backend?
1. **Check IP Address:**
   ```bash
   ipconfig  # Windows
   ifconfig  # Mac/Linux
   ```

2. **Verify Backend is Running:**
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```

3. **Test Connection from Phone Browser:**
   - Open browser on phone
   - Go to: `http://YOUR_IP:8000/api/login`
   - Should see an error (but connection works)

4. **Check Firewall:**
   - Allow port 8000 in Windows Firewall
   - Make sure phone and computer are on same WiFi

5. **Check CORS:**
   - Laravel should allow requests from your phone's IP
   - Check `.env` file for `APP_URL`

---

## ✅ Verification Checklist

Before running, verify:

- [ ] Device/Emulator is connected (`flutter devices` shows it)
- [ ] Backend is running with `--host=0.0.0.0`
- [ ] Phone and computer are on same WiFi (for physical device)
- [ ] IP address is correct (for physical device)
- [ ] Firewall allows port 8000 (for physical device)

---

## 🎉 Success!

Once you see your device in `flutter devices`, run:

**For Emulator:**
```bash
flutter run -d <emulator-id>
```

**For Physical Device:**
```bash
flutter run -d <device-id> --dart-define=API_BASE_URL=http://YOUR_IP:8000/api
```

The app should build and launch on your device! 🚀


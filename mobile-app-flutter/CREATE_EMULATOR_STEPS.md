# Create Android Emulator - Step by Step

## ✅ Your Android Setup Status
- ✅ Android SDK: Installed (version 36.1.0)
- ✅ Android Licenses: All accepted
- ✅ Java: Configured (OpenJDK 21)
- ✅ Emulator Tools: Available (version 36.3.10.0)
- ⚠️  Emulator: Not created yet

## 🚀 Create Emulator - Choose One Method

---

## Method 1: Using Android Studio GUI (Easiest) ⭐

### Step 1: Open Android Studio
1. Open **Android Studio**
2. Wait for it to fully load and index

### Step 2: Open Device Manager
1. Look for **Device Manager** icon in the toolbar (phone/tablet icon)
   - Or go to: **Tools** → **Device Manager**
   - Or click: **View** → **Tool Windows** → **Device Manager**

### Step 3: Create Virtual Device
1. Click **Create Device** button (or **+** icon)
2. You'll see a list of device categories (Phone, Tablet, etc.)

### Step 4: Select Device
1. Choose a device (e.g., **Pixel 7** or **Pixel 5**)
2. Click **Next**

### Step 5: Download System Image
1. Select a system image (e.g., **Android 13 (Tiramisu)** - API 33)
2. If not downloaded, click **Download** next to it
3. Wait for download to complete (may take several minutes)
4. Click **Next**

### Step 6: Configure AVD (Android Virtual Device)
1. Review settings:
   - **AVD Name**: Keep default or change (e.g., "Pixel_7_API_33")
   - **Orientation**: Portrait (default)
   - **Startup orientation**: Portrait
   - **Graphics**: Hardware - GLES 2.0 (recommended)
2. Click **Finish**

### Step 7: Start Emulator
1. Find your newly created emulator in Device Manager
2. Click the **Play** button (▶️) next to it
3. Wait for emulator to boot (1-2 minutes first time)

### Step 8: Verify in Flutter
```bash
flutter devices
```

You should see:
```
sdk gphone64 arm64 (mobile) • emulator-5554 • android-arm64 • Android 13
```

### Step 9: Run Your App
```bash
flutter run -d emulator-5554
```

**✅ Done!** Your app should now launch on the emulator!

---

## Method 2: Using Command Line

### Step 1: List Available System Images
```bash
# First, we need to use Android SDK's tools
cd %ANDROID_HOME%\cmdline-tools\latest\bin
sdkmanager --list | findstr "system-images"
```

Or check what's available:
```bash
flutter emulators --create
```

### Step 2: Install System Image (if needed)
```bash
sdkmanager "system-images;android-33;google_apis;x86_64"
```

### Step 3: Create AVD
```bash
avdmanager create avd -n Pixel_7_API_33 -k "system-images;android-33;google_apis;x86_64" -d pixel_7
```

### Step 4: Start Emulator
```bash
emulator -avd Pixel_7_API_33
```

Or let Flutter handle it:
```bash
flutter emulators --launch Pixel_7_API_33
```

### Step 5: Run App
```bash
flutter run -d <emulator-id>
```

---

## 🎯 Quick Recommended Steps (Using Android Studio)

1. **Open Android Studio**
2. **Click Device Manager** (phone icon in toolbar)
3. **Click Create Device** (+ button)
4. **Select Pixel 7** → Next
5. **Select Android 13 (API 33)** → Download if needed → Next
6. **Click Finish** (keep defaults)
7. **Click Play button** (▶️) to start emulator
8. **Wait for emulator to boot** (home screen appears)
9. **Run**: `flutter devices` (should see emulator)
10. **Run**: `flutter run -d <emulator-id>`

---

## 🔍 Troubleshooting

### Cannot See Device Manager?
- Make sure Android Studio is fully loaded
- Try: **Tools** → **Device Manager**
- Try: **View** → **Tool Windows** → **Device Manager**
- Restart Android Studio

### System Image Download Fails?
- Check internet connection
- Try a different system image (Android 12, 13, etc.)
- Download manually via SDK Manager: **Tools** → **SDK Manager** → **SDK Platforms**

### Emulator Won't Start?
- Check if virtualization is enabled in BIOS (Intel VT-x or AMD-V)
- Try a different system image (x86_64 vs arm64)
- Increase emulator RAM in settings
- Restart Android Studio

### Flutter Doesn't See Emulator?
- Make sure emulator is fully booted (wait for home screen)
- Run `flutter devices` again
- Restart Flutter daemon: `flutter daemon --kill` then try again
- Check `adb devices` - should show emulator

---

## ✅ After Emulator is Running

1. **Verify Connection:**
   ```bash
   flutter devices
   ```

2. **Run Your App:**
   ```bash
   flutter run -d <emulator-id>
   ```

3. **The default API URL** (`http://10.0.2.2:8000/api`) **works for emulator** - no changes needed!

4. **Make sure Laravel backend is running:**
   ```bash
   cd ..
   php artisan serve
   ```

---

## 🎉 Success Indicators

You'll know it's working when:
- ✅ Emulator shows in `flutter devices`
- ✅ Emulator home screen is visible
- ✅ `flutter run` builds and launches app
- ✅ App connects to Laravel backend successfully

---

## 📝 Next Steps After Emulator is Running

1. Test login functionality
2. Test all dashboard tabs
3. Test navigation between screens
4. Test all features (Status, Trips, Performance, etc.)

Let me know when the emulator is created and running, and I can help you test the app!


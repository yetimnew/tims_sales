# Physical Device Setup Guide

## Problem
When testing on a physical device, you get "Connection timeout" error because the Laravel server is only accessible from localhost.

## Solution

### Step 1: Start Laravel Server with Network Access

**Stop the current server** (press `Ctrl+C` in the terminal where it's running), then start it with:

```bash
php artisan serve --host=0.0.0.0
```

The `--host=0.0.0.0` flag makes the server accessible from other devices on your network.

**Important:** You should see:
```
Server running on [http://0.0.0.0:8000]
```
or
```
Server running on [http://127.0.0.1:8000] and [http://YOUR_IP:8000]
```

### Step 2: Find Your Computer's IP Address

#### Windows:
1. Open Command Prompt
2. Type: `ipconfig`
3. Look for **"IPv4 Address"** under your active network adapter (usually "Wireless LAN adapter Wi-Fi" or "Ethernet adapter")
4. Example: `192.168.1.100`

#### Mac:
1. Open Terminal
2. Type: `ifconfig | grep "inet "`
3. Look for the IP address (usually starts with `192.168.` or `10.`)
4. Example: `192.168.1.100`

#### Linux:
1. Open Terminal
2. Type: `ip addr` or `ifconfig`
3. Look for "inet" address
4. Example: `192.168.1.100`

### Step 3: Configure API URL in Mobile App

1. **Open the mobile app** on your physical device
2. **Go to Settings** → **API Configuration**
3. **Enter your API URL:**
   - Format: `http://YOUR_IP:8000/api`
   - Example: `http://192.168.1.100:8000/api`
4. **Tap "Save API URL"**

### Step 4: Verify Connection

1. **Ensure same Wi-Fi network:**
   - Your phone and computer must be on the **same Wi-Fi network**
   - Mobile data won't work - must use Wi-Fi

2. **Check firewall:**
   - Windows Firewall might block port 8000
   - You may need to allow Laravel through the firewall
   - Or temporarily disable firewall for testing

3. **Test the connection:**
   - Try logging in again
   - The connection timeout should be resolved

## Quick Reference

### Start Server (for physical devices):
```bash
php artisan serve --host=0.0.0.0
```

### Find IP (Windows):
```bash
ipconfig
```

### API URL Format:
```
http://YOUR_IP:8000/api
```

### Example:
If your IP is `192.168.1.100`, use:
```
http://192.168.1.100:8000/api
```

## Troubleshooting

### Still getting timeout?
1. ✅ Verify server is running with `--host=0.0.0.0`
2. ✅ Check IP address is correct (run `ipconfig` again)
3. ✅ Ensure phone and computer are on same Wi-Fi
4. ✅ Check Windows Firewall isn't blocking port 8000
5. ✅ Try pinging your computer's IP from the phone (if possible)
6. ✅ Restart the Laravel server
7. ✅ Restart the mobile app

### Firewall Issue?
If Windows Firewall is blocking:
1. Open Windows Defender Firewall
2. Click "Allow an app through firewall"
3. Add Laravel/PHP or allow port 8000

### Alternative: Use ngrok (for testing)
If you can't use local network:
```bash
# Install ngrok
# Then run:
ngrok http 8000
# Use the ngrok URL in the app
```

## Notes

- **Emulator:** Use `http://10.0.2.2:8000/api` (default)
- **Physical Device:** Use `http://YOUR_IP:8000/api`
- **Web Browser:** Use `http://localhost:8000/api`

The app will remember your API URL setting, so you only need to configure it once per device.

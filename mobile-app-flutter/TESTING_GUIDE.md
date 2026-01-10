# Mobile App Testing Guide

## 🚀 Quick Start - Browser Testing

### 1. Start the App
```bash
cd mobile-app-flutter
flutter run -d chrome
```

The app will open in Chrome at `http://localhost:8080` (or similar port)

### 2. Login
- **Test User**: `driver1@test.com`
- **Password**: `password123`
- Or use any driver user linked to a driver record

### 3. Test All Features

## 📋 Feature Testing Checklist

### ✅ Authentication
- [ ] Login with valid credentials
- [ ] Login with invalid credentials (should show error)
- [ ] Auto-login on app restart (if token exists)
- [ ] Logout button works

### ✅ Dashboard - Home Tab
- [ ] Welcome section displays
- [ ] Truck Assignment Card shows assigned truck (if assigned)
- [ ] Truck Assignment Card shows empty state (if not assigned)
- [ ] Status Update button navigates correctly
- [ ] Location Tracking button navigates correctly
- [ ] Maintenance Alerts button navigates correctly
- [ ] Notifications bell icon shows badge (if unread notifications)
- [ ] Pull-to-refresh works

### ✅ Dashboard - Performance Tab
- [ ] Latest performance record displays
- [ ] Score breakdown shows (Fuel, Safety, Customer Rating, Productivity)
- [ ] Overall summary displays (trips, distance, cargo, fuel, rating)
- [ ] Safety metrics display (violations, accidents)
- [ ] Performance History section expands/collapses
- [ ] Filter chips work (All, Daily, Weekly, Monthly)
- [ ] Performance history list displays
- [ ] Skeleton loading appears while loading
- [ ] Pull-to-refresh works
- [ ] Empty state shows if no data

### ✅ Dashboard - Trips Tab
- [ ] Current trip card displays (if active trip exists)
- [ ] No current trip message shows (if no active trip)
- [ ] Upcoming trips list displays
- [ ] No upcoming trips message shows (if no upcoming trips)
- [ ] Tap on trip navigates to details
- [ ] Skeleton loading appears while loading
- [ ] Pull-to-refresh works

### ✅ Dashboard - Profile Tab
- [ ] Profile picture displays
- [ ] User information displays (name, email, phone)
- [ ] Driver information displays (if driver is linked)
- [ ] Account statistics display
- [ ] Edit profile button works
- [ ] Change password button works
- [ ] Profile picture upload works (gallery & camera)
- [ ] Profile completion indicator shows
- [ ] Skeleton loading appears while loading
- [ ] Pull-to-refresh works

### ✅ Status Update
- [ ] Current status displays
- [ ] Status selection works (Available, On Trip, Off Duty, etc.)
- [ ] Notes field accepts text
- [ ] Update status button works
- [ ] Success message shows after update
- [ ] Status history button navigates correctly
- [ ] Status updates immediately

### ✅ Status History
- [ ] Status history list displays
- [ ] Filter by status type works
- [ ] Filter by date range works
- [ ] Status details show correctly
- [ ] Pull-to-refresh works
- [ ] Empty state shows if no history

### ✅ Trip Details
- [ ] Trip details screen displays
- [ ] Route information shows (origin → destination)
- [ ] Trip information displays
- [ ] Cargo information displays (if available)
- [ ] Fuel information displays (if available)
- [ ] Distance information displays (if available)
- [ ] Update status section shows (for active/open trips)
- [ ] Update trip status works
- [ ] Add/update comment works
- [ ] Pull-to-refresh works
- [ ] Navigate back works

### ✅ Location Tracking
- [ ] Location Tracking screen displays
- [ ] Permission check works (shows message if no permission)
- [ ] Get Current Location button works (if permission granted)
- [ ] Current location displays (latitude, longitude, accuracy)
- [ ] Speed and heading display (if available)
- [ ] Background tracking toggle works
- [ ] Location history list displays
- [ ] Location history details show correctly
- [ ] Pull-to-refresh works
- [ ] Empty state shows if no location history

### ✅ Maintenance Alerts
- [ ] Maintenance Alerts screen displays
- [ ] Summary card shows (overdue, upcoming, recent counts)
- [ ] Overdue section displays (if overdue maintenance exists)
- [ ] Upcoming section displays (if upcoming maintenance exists)
- [ ] Recent completed section displays (if completed maintenance exists)
- [ ] Tap on maintenance navigates to details
- [ ] Pull-to-refresh works
- [ ] Skeleton loading appears while loading
- [ ] Empty state shows if no maintenance alerts

### ✅ Maintenance Details
- [ ] Maintenance Details screen displays
- [ ] Status card shows with badge
- [ ] Schedule information displays
- [ ] Details section displays (if available)
- [ ] Work performed shows (if available)
- [ ] Parts replaced shows (if available)
- [ ] Pull-to-refresh works
- [ ] Navigate back works

### ✅ Notifications
- [ ] Notifications screen displays
- [ ] Filter tabs work (All / Unread)
- [ ] Unread badge shows on Unread tab
- [ ] Notification list displays
- [ ] Notification icons and colors show correctly
- [ ] Tap notification marks as read (if unread)
- [ ] Mark all as read button works
- [ ] Pull-to-refresh works
- [ ] Skeleton loading appears while loading
- [ ] Empty state shows if no notifications
- [ ] Relative time formatting works ("Just now", "5 minutes ago", etc.)

## 🐛 Common Issues & Fixes

### Issue: CORS Error
**Fix**: Ensure backend CORS is configured for `http://localhost:8080` (or your web port)

### Issue: Login Fails
**Fix**: 
- Check API URL in `app_config.dart` (should be `http://localhost:8000/api` for web)
- Ensure backend is running
- Check that user is linked to a driver record

### Issue: No Data Shows
**Fix**:
- Check that driver user has active truck assignment
- Check that driver has linked driver record
- Check backend API responses in browser DevTools

### Issue: Location Not Working
**Fix**:
- Location only works on Android/iOS, not on web
- Check permissions on mobile devices

## ✅ Consistency Checks

### Visual Consistency:
- [ ] All cards have same border radius (12px)
- [ ] All cards have same elevation (2 for standard, 4 for highlighted)
- [ ] All screens have same padding (16px)
- [ ] All buttons have consistent styling
- [ ] All text styles are consistent
- [ ] All icons have consistent sizes
- [ ] All colors are theme-based

### Functional Consistency:
- [ ] All screens have pull-to-refresh
- [ ] All screens have skeleton loading (where applicable)
- [ ] All screens have error handling
- [ ] All screens have empty states
- [ ] All navigation works correctly
- [ ] All data refreshes after navigation

## 📱 Mobile Device Testing

### Android:
```bash
flutter run -d <android-device-id>
# Use `flutter devices` to see available devices
```

### iOS:
```bash
flutter run -d <ios-device-id>
# Use `flutter devices` to see available devices
```

### Physical Device:
1. Ensure device and computer are on same network
2. Update API URL in `app_config.dart` to your computer's IP:
   ```dart
   return 'http://YOUR_COMPUTER_IP:8000/api';
   ```
3. Run: `flutter run -d <device-id>`

## 🔗 API Testing with Postman

### Test Login:
```
POST http://localhost:8000/api/login
Content-Type: application/json

{
  "email": "driver1@test.com",
  "password": "password123"
}
```

### Test Profile:
```
GET http://localhost:8000/api/profile
Authorization: Bearer <token>
```

### Test Trips:
```
GET http://localhost:8000/api/driver/trips
Authorization: Bearer <token>
```

Use the returned token for all authenticated requests.


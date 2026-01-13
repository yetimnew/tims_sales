# Firebase Cloud Messaging (FCM) Setup Guide

This guide explains how to set up Firebase Cloud Messaging for push notifications in the TIMS Driver mobile app.

## Prerequisites

1. Firebase account (https://firebase.google.com/)
2. FlutterFire CLI installed: `dart pub global activate flutterfire_cli`
3. Android/iOS app registered in Firebase Console

## Setup Steps

### 1. Install FlutterFire CLI

```bash
dart pub global activate flutterfire_cli
```

### 2. Configure Firebase for Your Project

Run the following command from the `mobile-app-flutter` directory:

```bash
flutterfire configure
```

This will:
- Detect your Firebase projects
- Let you select a project
- Configure Firebase for Android, iOS, and Web
- Generate `firebase_options.dart` file

### 3. Android Setup

1. Download `google-services.json` from Firebase Console
2. Place it in `android/app/google-services.json`
3. Add the Google Services plugin to `android/build.gradle`:
   ```gradle
   dependencies {
       classpath 'com.google.gms:google-services:4.4.0'
   }
   ```
4. Apply the plugin in `android/app/build.gradle`:
   ```gradle
   apply plugin: 'com.google.gms.google-services'
   ```

### 4. iOS Setup

1. Download `GoogleService-Info.plist` from Firebase Console
2. Place it in `ios/Runner/GoogleService-Info.plist`
3. Open `ios/Runner.xcworkspace` in Xcode
4. Ensure the file is added to the Runner target

### 5. Backend Setup

The backend needs to store FCM tokens and send notifications. The API endpoints are already set up:

- `POST /api/driver/fcm-token` - Update FCM token
- `DELETE /api/driver/fcm-token` - Delete FCM token

**TODO**: Implement FCM token storage in the database:
- Create `driver_fcm_tokens` table or add `fcm_token` column to `drivers` table
- Update `DriverFCMController` to store/retrieve tokens

### 6. Sending Notifications from Backend

Use Laravel's Firebase Cloud Messaging package:

```bash
composer require kreait/firebase-php
```

Example code to send notification:

```php
use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;

$factory = (new Factory)->withServiceAccount('/path/to/service-account-key.json');
$messaging = $factory->createMessaging();

$notification = Notification::create('Title', 'Body');
$message = CloudMessage::withTarget('token', $fcmToken)
    ->withNotification($notification)
    ->withData(['type' => 'trip', 'trip_id' => '123']);

$messaging->send($message);
```

## Notification Types

The app supports different notification types with navigation:

- `trip` - Navigate to trip details
- `maintenance` - Navigate to maintenance alerts
- `emergency` - Navigate to emergency screen
- Default - Navigate to notifications screen

## Testing

1. Run the app: `flutter run`
2. Check logs for FCM token
3. Use Firebase Console to send test notifications
4. Verify notifications appear in foreground, background, and terminated states

## Troubleshooting

- **Token not received**: Check Firebase configuration files
- **Notifications not appearing**: Verify notification permissions
- **Background notifications not working**: Ensure background handler is properly registered in `main.dart`

## Notes

- The app will work without Firebase configured, but push notifications won't function
- FCM tokens are automatically refreshed and updated on the server
- Local notifications are shown when app is in foreground


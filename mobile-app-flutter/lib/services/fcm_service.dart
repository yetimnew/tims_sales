import 'dart:async';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter/foundation.dart' show kDebugMode, kIsWeb, debugPrint;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../config/app_config.dart';
import 'api_service.dart';
import 'shared_preferences_service.dart';

/// Top-level function to handle background messages
/// Note: This must be a top-level function and is registered in main.dart
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Firebase should already be initialized in main()
  if (kDebugMode) {
    debugPrint('[FCM Background] Message received: ${message.messageId}');
  }
  // Handle background notification - can save to local storage or process data
}

class FCMService {
  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  final ApiService _apiService = ApiService();
  final SharedPreferencesService _prefs = SharedPreferencesService();

  String? _fcmToken;
  StreamSubscription<RemoteMessage>? _messageSubscription;

  bool _isInitialized = false;

  // Stream controller for incoming messages
  final _messageController = StreamController<RemoteMessage>.broadcast();
  Stream<RemoteMessage> get messageStream => _messageController.stream;

  // Get current FCM token
  String? get fcmToken => _fcmToken;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Check if Firebase is initialized
      try {
        Firebase.app(); // This will throw if Firebase is not initialized
      } catch (e) {
        if (kDebugMode) {
          debugPrint('[FCM] Firebase not initialized. Push notifications will not be available.');
          debugPrint('[FCM] To enable: Run "flutterfire configure" and uncomment firebase_options in main.dart');
        }
        return;
      }

      // Request permission for notifications
      if (!kIsWeb) {
        final settings = await _firebaseMessaging.requestPermission(
          alert: true,
          badge: true,
          sound: true,
          provisional: false,
        );

        if (settings.authorizationStatus != AuthorizationStatus.authorized &&
            settings.authorizationStatus != AuthorizationStatus.provisional) {
          if (kDebugMode) {
            debugPrint('[FCM] User declined notification permissions');
          }
          return;
        }
      }

      // Initialize local notifications
      await _initializeLocalNotifications();

      // Get FCM token
      await _getFCMToken();

      // Setup message handlers
      await _setupMessageHandlers();

      // Setup token refresh listener
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        _updateTokenOnServer(newToken);
      });

      _isInitialized = true;
      if (kDebugMode) {
        debugPrint('[FCM] Service initialized successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to initialize FCM Service: $e');
      }
      // App can still work without push notifications
    }
  }

  Future<void> _initializeLocalNotifications() async {
    if (kIsWeb) return; // Local notifications not fully supported on web

    const AndroidInitializationSettings androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        // Handle notification tap
        if (kDebugMode) {
          debugPrint('[FCM] Notification tapped: ${response.payload}');
        }
      },
    );

    // Create notification channel for Android
    if (!kIsWeb) {
      const AndroidNotificationChannel channel = AndroidNotificationChannel(
        'tims_driver_channel',
        'TIMS Driver Notifications',
        description: 'Notifications for TIMS Driver app',
        importance: Importance.high,
      );

      await _localNotifications
          .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      if (_fcmToken != null) {
        await _prefs.setString('fcm_token', _fcmToken!);
        await _updateTokenOnServer(_fcmToken!);
        if (kDebugMode) {
          debugPrint('[FCM] Token obtained: ${_fcmToken!.substring(0, 20)}...');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to get FCM token: $e');
      }
    }
  }

  Future<void> _updateTokenOnServer(String token) async {
    try {
      // Determine device type
      String deviceType = 'unknown';
      if (kIsWeb) {
        deviceType = 'web';
      } else {
        // For mobile, detect platform if needed
        deviceType = 'mobile';
      }

      // Save token to server so backend can send notifications
      final response = await _apiService.post(
        '/driver/fcm-token',
        data: {
          'fcm_token': token,
          'device_type': deviceType,
        },
      );

      if (response.statusCode == 200) {
        if (kDebugMode) {
          debugPrint('[FCM] Token updated on server successfully');
        }
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to update FCM token on server: $e');
      }
      // Don't throw - token update can be retried later
    }
  }

  Future<void> _setupMessageHandlers() async {
    // Handle foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      if (kDebugMode) {
        debugPrint('[FCM] Foreground message received: ${message.messageId}');
      }
      _handleForegroundMessage(message);
      _messageController.add(message);
    });

    // Handle background message opened (when app is in background)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      if (kDebugMode) {
        debugPrint('[FCM] Background message opened app: ${message.messageId}');
      }
      _handleMessageTap(message);
      _messageController.add(message);
    });

    // Check if app was opened from terminated state via notification
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      if (kDebugMode) {
        debugPrint('[FCM] App opened from terminated state via notification');
      }
      _handleMessageTap(initialMessage);
      _messageController.add(initialMessage);
    }

    // Note: Background message handler is registered in main.dart
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    // Show local notification when app is in foreground
    if (kIsWeb) return;

    final notification = message.notification;
    if (notification == null) return;

    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'tims_driver_channel',
      'TIMS Driver Notifications',
      channelDescription: 'Notifications for TIMS Driver app',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const DarwinNotificationDetails iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const NotificationDetails details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      message.hashCode,
      notification.title,
      notification.body,
      details,
      payload: message.data.toString(),
    );
  }

  void _handleMessageTap(RemoteMessage message) {
    // Handle notification tap - navigation will be handled by the app
    // This method can be overridden or extended by the app
    final data = message.data;
    if (kDebugMode) {
      debugPrint('[FCM] Notification tapped: $data');
    }
    // Navigation logic can be added here or passed to a callback
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      if (kDebugMode) {
        debugPrint('[FCM] Subscribed to topic: $topic');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to subscribe to topic $topic: $e');
      }
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      if (kDebugMode) {
        debugPrint('[FCM] Unsubscribed from topic: $topic');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to unsubscribe from topic $topic: $e');
      }
    }
  }

  Future<void> deleteToken() async {
    try {
      await _firebaseMessaging.deleteToken();
      _fcmToken = null;
      await _prefs.remove('fcm_token');
      if (kDebugMode) {
        debugPrint('[FCM] Token deleted successfully');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('[FCM] Failed to delete FCM token: $e');
      }
    }
  }

  void dispose() {
    _messageSubscription?.cancel();
    _messageController.close();
  }
}

// Using Flutter's built-in debugPrint directly (imported from foundation.dart)
// All debugPrint calls in this file use Flutter's built-in function

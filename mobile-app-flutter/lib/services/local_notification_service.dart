import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../models/maintenance.dart';

class LocalNotificationService {
  LocalNotificationService._internal();
  static final LocalNotificationService _instance = LocalNotificationService._internal();
  factory LocalNotificationService() => _instance;

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings();

    await _plugin.initialize(
      const InitializationSettings(
        android: androidSettings,
        iOS: iosSettings,
      ),
    );

    _initialized = true;
  }

  Future<void> showMaintenanceSummaryIfNeeded(MaintenanceResponse data) async {
    await initialize();

    final overdueIds = data.overdue.map((item) => item.id).toList()..sort();
    final dueSoonIds = data.upcoming
        .where((item) => item.daysUntilScheduled != null && item.daysUntilScheduled! <= 7)
        .map((item) => item.id)
        .toList()
      ..sort();

    final signature = 'overdue:${overdueIds.join(",")}|dueSoon:${dueSoonIds.join(",")}';
    final prefs = await SharedPreferences.getInstance();
    final previousSignature = prefs.getString('maintenance_alert_signature');

    if (signature == 'overdue:|dueSoon:') {
      await prefs.remove('maintenance_alert_signature');
      return;
    }

    if (previousSignature == signature) {
      return;
    }

    final overdueCount = overdueIds.length;
    final dueSoonCount = dueSoonIds.length;

    await _plugin.show(
      2001,
      overdueCount > 0 ? 'Overdue maintenance alert' : 'Maintenance due soon',
      overdueCount > 0
          ? 'You have $overdueCount overdue maintenance item(s) and $dueSoonCount due soon.'
          : 'You have $dueSoonCount maintenance item(s) due within 7 days.',
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'maintenance_alerts',
          'Maintenance Alerts',
          channelDescription: 'Alerts for overdue and upcoming truck maintenance.',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(),
      ),
    );

    await prefs.setString('maintenance_alert_signature', signature);
  }
}

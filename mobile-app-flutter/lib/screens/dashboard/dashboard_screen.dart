import 'package:flutter/material.dart';
import 'package:driver_mobile_app/l10n/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../services/driver_service.dart';
import '../../models/truck.dart';
import '../../widgets/truck_assignment_card.dart';
import '../../widgets/glass_card.dart';
import '../../theme/app_theme.dart';
import '../auth/login_screen.dart';
import '../status/status_update_screen.dart';
import '../location/location_tracking_screen.dart';
import '../maintenance/maintenance_alerts_screen.dart';
import '../notifications/notifications_screen.dart';
import '../fuel/fuel_tracking_screen.dart';
import '../emergency/emergency_screen.dart';
import '../../services/notification_service.dart';
import 'profile_tab.dart';
import 'performance_tab.dart';
import 'trips_tab.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  final AuthService _authService = AuthService();
  final NotificationService _notificationService = NotificationService();
  int _currentIndex = 0;
  int _unreadNotificationCount = 0;

  @override
  void initState() {
    super.initState();
    _loadUnreadNotificationCount();
  }

  Future<void> _loadUnreadNotificationCount() async {
    try {
      final response = await _notificationService.getNotifications(limit: 1);
      setState(() {
        _unreadNotificationCount = response.unreadCount;
      });
    } catch (e) {
      // Silently fail - notifications are not critical
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.darkGradient,
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(l10n.appTitle),
          backgroundColor: AppTheme.darkSurface.withAlpha((255 * 0.9).round()),
          elevation: 0,
          actions: [
            // Notifications Icon with Badge
            Stack(
              children: [
                IconButton(
                  icon: const Icon(Icons.notifications),
                  onPressed: () async {
                    await Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const NotificationsScreen(),
                      ),
                    );
                    // Refresh unread count after returning
                    _loadUnreadNotificationCount();
                  },
                ),
                if (_unreadNotificationCount > 0)
                  Positioned(
                    right: 8,
                    top: 8,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(
                        color: AppTheme.errorColor,
                        shape: BoxShape.circle,
                      ),
                      constraints: const BoxConstraints(
                        minWidth: 16,
                        minHeight: 16,
                      ),
                      child: Text(
                        _unreadNotificationCount > 99 ? '99+' : _unreadNotificationCount.toString(),
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ),
              ],
            ),
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: () async {
                final navigator = Navigator.of(context);
                await _authService.logout();
                if (mounted) {
                  navigator.pushReplacement(
                    MaterialPageRoute(builder: (_) => const LoginScreen()),
                  );
                }
              },
            ),
          ],
        ),
        body: IndexedStack(
          index: _currentIndex,
          children: const [
            HomeTab(),
            PerformanceTab(),
            TripsTab(),
            ProfileTab(),
          ],
        ),
        bottomNavigationBar: Container(
          decoration: BoxDecoration(
            color: AppTheme.darkSurface.withAlpha((255 * 0.9).round()),
            border: Border(
              top: BorderSide(
                color: AppTheme.slate700.withAlpha(128),
                width: 1.0,
              ),
            ),
          ),
          child: BottomNavigationBar(
            backgroundColor: Colors.transparent,
            elevation: 0,
            selectedItemColor: AppTheme.sky400,
            unselectedItemColor: AppTheme.textSecondary,
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
            type: BottomNavigationBarType.fixed,
            items: [
              BottomNavigationBarItem(
                icon: const Icon(Icons.home),
                label: l10n.home,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.analytics),
                label: l10n.performance,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.route),
                label: l10n.trips,
              ),
              BottomNavigationBarItem(
                icon: const Icon(Icons.person),
                label: l10n.profile,
              ),
            ],
          ),
        ),
        floatingActionButton: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(AppTheme.radiusMD),
            gradient: const LinearGradient(
              colors: [AppTheme.errorColor, Color(0xFFDC2626)],
            ),
            boxShadow: [
              BoxShadow(
                color: AppTheme.errorColor.withAlpha(76),
                blurRadius: 12,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: FloatingActionButton.extended(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const EmergencyScreen(),
                ),
              );
            },
            backgroundColor: Colors.transparent,
            elevation: 0,
            foregroundColor: Colors.white,
            icon: const Icon(Icons.warning),
            label: Text(l10n.emergency),
          ),
        ),
        floatingActionButtonLocation: FloatingActionButtonLocation.endFloat,
      ),
    );
  }
}

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final DriverService _driverService = DriverService();
  TruckAssignmentResponse? _truckAssignment;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadTruckAssignment();
  }

  Future<void> _loadTruckAssignment() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _driverService.getTruckAssignment();
      setState(() {
        _truckAssignment = response;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load truck assignment: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      decoration: const BoxDecoration(
        gradient: AppTheme.darkGradient,
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        body: RefreshIndicator(
          onRefresh: _loadTruckAssignment,
          backgroundColor: AppTheme.darkCard,
          color: AppTheme.sky400,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                // Welcome Section
                Text(
                  l10n.welcomeBack,
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.dashboardOverview,
                  style: TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                  ),
                ),
              const SizedBox(height: 24),

              // Truck Assignment Card
              TruckAssignmentCard(
                assignmentResponse: _truckAssignment,
                isLoading: _isLoading,
                onRefresh: _loadTruckAssignment,
              ),
              const SizedBox(height: 16),

                // Quick Actions
                Text(
                  l10n.quickActions,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.textPrimary,
                      ),
                ),
                const SizedBox(height: 12),
                
                // Status Update Button
                GlassCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const StatusUpdateScreen(),
                      ),
                    );
                  },
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.sky500.withAlpha((255 * 0.2).round()),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.update, color: AppTheme.sky400),
                    ),
                    title: Text(
                      l10n.updateStatus,
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    subtitle: Text(
                      l10n.changeWorkStatus,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Location Tracking Button
                GlassCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const LocationTrackingScreen(),
                      ),
                    );
                  },
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.successColor.withAlpha((255 * 0.2).round()),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.location_on, color: AppTheme.successColor),
                    ),
                    title: Text(
                      l10n.locationTracking,
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    subtitle: Text(
                      l10n.sendLocationTrackHistory,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
                  ),
                ),
                const SizedBox(height: 12),
                
                // Maintenance Alerts Button
                GlassCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const MaintenanceAlertsScreen(),
                      ),
                    );
                  },
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.warningColor.withAlpha((255 * 0.2).round()),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.build, color: AppTheme.warningColor),
                    ),
                    title: Text(
                      l10n.maintenanceAlerts,
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    subtitle: Text(
                      l10n.viewScheduledOverdueMaintenance,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
                  ),
                ),
                const SizedBox(height: 12),

                // Fuel Tracking Button
                GlassCard(
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const FuelTrackingScreen(),
                      ),
                    );
                  },
                  child: ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: AppTheme.sky500.withAlpha((255 * 0.2).round()),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.local_gas_station, color: AppTheme.sky400),
                    ),
                    title: Text(
                      l10n.fuelTracking,
                      style: const TextStyle(color: AppTheme.textPrimary),
                    ),
                    subtitle: Text(
                      l10n.recordViewFuelPurchases,
                      style: const TextStyle(color: AppTheme.textSecondary),
                    ),
                    trailing: const Icon(Icons.chevron_right, color: AppTheme.textSecondary),
                  ),
                ),

                if (_error != null && _truckAssignment == null) ...[
                  const SizedBox(height: 16),
                  Text(
                    _error!,
                    style: const TextStyle(color: AppTheme.errorColor),
                    textAlign: TextAlign.center,
                  ),
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}


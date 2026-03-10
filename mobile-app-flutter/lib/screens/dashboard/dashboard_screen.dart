import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:driver_mobile_app/l10n/app_localizations.dart';
import '../../services/auth_service.dart';
import '../../services/driver_service.dart';
import '../../services/status_service.dart';
import '../../models/truck.dart';
import '../../models/status.dart';
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
import '../../services/maintenance_service.dart';
import '../../services/local_notification_service.dart';
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
  final StatusService _statusService = StatusService();
  final MaintenanceService _maintenanceService = MaintenanceService();
  final LocalNotificationService _localNotificationService = LocalNotificationService();
  TruckAssignmentResponse? _truckAssignment;
  DriverStatus? _currentStatus;
  int _maintenanceAlertCount = 0;
  bool _isLoading = true;
  bool _isStatusLoading = true;
  String? _error;
  String? _statusError;

  @override
  void initState() {
    super.initState();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    await Future.wait([
      _loadTruckAssignment(),
      _loadCurrentStatus(),
      _loadMaintenanceAlerts(),
    ]);
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

  Future<void> _loadCurrentStatus() async {
    setState(() {
      _isStatusLoading = true;
      _statusError = null;
    });

    try {
      final status = await _statusService.getCurrentStatus();
      setState(() {
        _currentStatus = status;
        _isStatusLoading = false;
      });
    } catch (e) {
      setState(() {
        _statusError = e.toString();
        _isStatusLoading = false;
      });
    }
  }

  Future<void> _loadMaintenanceAlerts() async {
    try {
      final response = await _maintenanceService.getMaintenanceAlerts();
      final dueSoonCount = response.upcoming.where((item) => item.isDueSoon).length;

      if (mounted) {
        setState(() {
          _maintenanceAlertCount = response.overdue.length + dueSoonCount;
        });
      }

      await _localNotificationService.showMaintenanceSummaryIfNeeded(response);
    } catch (_) {
      // Maintenance alerts are secondary on home load.
    }
  }

  Future<void> _openStatusScreen() async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const StatusUpdateScreen(),
      ),
    );

    if (!mounted) return;
    await _loadCurrentStatus();
  }

  WorkStatus? get _workStatus => WorkStatus.fromString(_currentStatus?.statusValue);

  Color _getStatusColor(WorkStatus? status) {
    switch (status) {
      case WorkStatus.available:
        return AppTheme.successColor;
      case WorkStatus.onTrip:
        return AppTheme.sky400;
      case WorkStatus.onBreak:
        return AppTheme.warningColor;
      case WorkStatus.offDuty:
        return AppTheme.textSecondary;
      case null:
        return AppTheme.textSecondary;
    }
  }

  IconData _getStatusIcon(WorkStatus? status) {
    switch (status) {
      case WorkStatus.available:
        return Icons.check_circle;
      case WorkStatus.onTrip:
        return Icons.local_shipping;
      case WorkStatus.onBreak:
        return Icons.free_breakfast;
      case WorkStatus.offDuty:
        return Icons.pause_circle;
      case null:
        return Icons.help_outline;
    }
  }

  String _formatStatusTime(String? value) {
    if (value == null || value.isEmpty) return 'Just now';

    try {
      return DateFormat('dd MMM, hh:mm a').format(DateTime.parse(value).toLocal());
    } catch (_) {
      return value;
    }
  }

  String _formatAssignmentDate(String? value) {
    if (value == null || value.isEmpty) return 'Not available';

    try {
      return DateFormat('dd MMM yyyy').format(DateTime.parse(value).toLocal());
    } catch (_) {
      return value;
    }
  }

  Widget _buildSectionHeader(String title, String subtitle) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 18,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context) {
    final today = DateFormat('EEEE, dd MMM').format(DateTime.now());
    final workStatus = _workStatus;
    final statusLabel = workStatus?.label ?? 'Unknown';

    return GlassCard(
      useGradient: true,
      color: AppTheme.darkCard,
      borderColor: AppTheme.sky400,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Welcome Back',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
          ),
          const SizedBox(height: 6),
          Text(
            'Monitor your work status, truck assignment, and daily actions in one place.',
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 14,
              height: 1.45,
            ),
          ),
          const SizedBox(height: 16),
          Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              _buildInfoChip(Icons.today, today, AppTheme.sky400),
              _buildInfoChip(
                _getStatusIcon(workStatus),
                statusLabel,
                _getStatusColor(workStatus),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: color.withAlpha(26),
        borderRadius: BorderRadius.circular(AppTheme.radiusFull),
        border: Border.all(color: color.withAlpha(80)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final workStatus = _workStatus;
    final color = _getStatusColor(workStatus);
    final statusLabel = workStatus?.label ?? 'Unknown';
    final notes = _currentStatus?.notes;

    return GlassCard(
      onTap: _openStatusScreen,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withAlpha(38),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(_getStatusIcon(workStatus), color: color),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Work Status',
                      style: TextStyle(
                        color: AppTheme.textSecondary,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      statusLabel,
                      style: const TextStyle(
                        color: AppTheme.textPrimary,
                        fontSize: 18,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              TextButton.icon(
                onPressed: _openStatusScreen,
                icon: const Icon(Icons.edit, size: 16),
                label: const Text('Update'),
              ),
            ],
          ),
          const SizedBox(height: 12),
          if (_isStatusLoading)
            const LinearProgressIndicator()
          else if (_statusError != null)
            Text(
              _statusError!,
              style: const TextStyle(color: AppTheme.errorColor, fontSize: 12),
            )
          else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: color.withAlpha(26),
                borderRadius: BorderRadius.circular(999),
                border: Border.all(color: color.withAlpha(90)),
              ),
              child: Text(
                statusLabel,
                style: TextStyle(
                  color: color,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (notes != null && notes.isNotEmpty) ...[
              const SizedBox(height: 10),
              Text(
                notes,
                style: const TextStyle(
                  color: AppTheme.textSecondary,
                  fontSize: 13,
                ),
              ),
            ],
            const SizedBox(height: 10),
            Row(
              children: [
                const Icon(Icons.schedule, size: 14, color: AppTheme.textSecondary),
                const SizedBox(width: 6),
                Text(
                  'Last updated ${_formatStatusTime(_currentStatus?.createdAt)}',
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildTruckAssignmentCard() {
    if (_isLoading) {
      return const GlassCard(
        child: SizedBox(
          height: 92,
          child: Center(
            child: CircularProgressIndicator(color: AppTheme.sky400),
          ),
        ),
      );
    }

    final response = _truckAssignment;

    if (response == null) {
      return _buildTruckMessageCard(
        title: 'Truck Assignment',
        message: _error ?? 'Unable to load truck assignment right now.',
        icon: Icons.error_outline,
        accent: AppTheme.errorColor,
      );
    }

    if (response.hasActiveAssignment) {
      final truck = response.truck!;
      final assignment = response.assignment!;

      return GlassCard(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppTheme.successColor.withAlpha(26),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.local_shipping,
                    color: AppTheme.successColor,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Assigned Truck',
                        style: TextStyle(
                          color: AppTheme.textSecondary,
                          fontSize: 12,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        truck.plate,
                        style: const TextStyle(
                          color: AppTheme.textPrimary,
                          fontSize: 22,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ],
                  ),
                ),
                _buildInfoChip(
                  Icons.check_circle,
                  'Assigned',
                  AppTheme.successColor,
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppTheme.slate800.withAlpha(150),
                borderRadius: BorderRadius.circular(AppTheme.radiusMD),
                border: Border.all(color: AppTheme.slate700),
              ),
              child: Column(
                children: [
                  _buildAssignmentRow(
                    'Vehicle type',
                    truck.vehicleType?.name ?? 'Not set',
                  ),
                  const SizedBox(height: 10),
                  _buildAssignmentRow(
                    'Assigned date',
                    _formatAssignmentDate(assignment.dateReceived),
                  ),
                  if (truck.engineNumber != null) ...[
                    const SizedBox(height: 10),
                    _buildAssignmentRow('Engine', truck.engineNumber!),
                  ],
                  if (truck.chasisNumber != null) ...[
                    const SizedBox(height: 10),
                    _buildAssignmentRow('Chassis', truck.chasisNumber!),
                  ],
                ],
              ),
            ),
          ],
        ),
      );
    }

    if (response.isAssignmentRemoved && response.lastAssignment != null) {
      return _buildTruckMessageCard(
        title: 'Previous Assignment',
        message:
            'Your last truck was ${response.lastAssignment!.truck.plate}. It is no longer attached to your account.',
        icon: Icons.assignment_returned_outlined,
        accent: AppTheme.warningColor,
      );
    }

    if (response.isNoDriver) {
      return _buildTruckMessageCard(
        title: 'Driver Link Required',
        message: response.message ??
            'This account is not linked to a driver record yet. Please contact the administrator.',
        icon: Icons.person_off_outlined,
        accent: AppTheme.warningColor,
      );
    }

    return _buildTruckMessageCard(
      title: 'No Active Truck',
      message: response.message ??
          'You do not have an active truck assignment right now.',
      icon: Icons.local_shipping_outlined,
      accent: AppTheme.sky400,
    );
  }

  Widget _buildTruckMessageCard({
    required String title,
    required String message,
    required IconData icon,
    required Color accent,
  }) {
    return GlassCard(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: accent.withAlpha(22),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: accent),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppTheme.textPrimary,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const SizedBox(height: 6),
                Text(
                  message,
                  style: const TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 13,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignmentRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 92,
          child: Text(
            label,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
            ),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 13,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickActionsGrid(BuildContext context, AppLocalizations l10n) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      childAspectRatio: 1.08,
      children: [
        _buildQuickActionTile(
          title: l10n.updateStatus,
          subtitle: 'Set your work availability',
          icon: Icons.update,
          accent: AppTheme.sky400,
          onTap: _openStatusScreen,
        ),
        _buildQuickActionTile(
          title: l10n.locationTracking,
          subtitle: 'Track and share live location',
          icon: Icons.location_on,
          accent: AppTheme.successColor,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const LocationTrackingScreen(),
              ),
            );
          },
        ),
        _buildQuickActionTile(
          title: l10n.maintenanceAlerts,
          subtitle: _maintenanceAlertCount > 0
              ? '$_maintenanceAlertCount urgent maintenance alert(s)'
              : 'See scheduled and overdue issues',
          icon: Icons.build,
          accent: AppTheme.warningColor,
          badgeCount: _maintenanceAlertCount,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const MaintenanceAlertsScreen(),
              ),
            );
          },
        ),
        _buildQuickActionTile(
          title: l10n.fuelTracking,
          subtitle: 'Record fuel purchases and usage',
          icon: Icons.local_gas_station,
          accent: AppTheme.sky400,
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => const FuelTrackingScreen(),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildQuickActionTile({
    required String title,
    required String subtitle,
    required IconData icon,
    required Color accent,
    required VoidCallback onTap,
    int badgeCount = 0,
  }) {
    return GlassCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                width: 44,
                height: 44,
                decoration: BoxDecoration(
                  color: accent.withAlpha(24),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Icon(icon, color: accent),
              ),
              if (badgeCount > 0)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.errorColor,
                    borderRadius: BorderRadius.circular(999),
                  ),
                  child: Text(
                    badgeCount > 99 ? '99+' : badgeCount.toString(),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
            ],
          ),
          const Spacer(),
          Text(
            title,
            style: const TextStyle(
              color: AppTheme.textPrimary,
              fontSize: 15,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            subtitle,
            style: const TextStyle(
              color: AppTheme.textSecondary,
              fontSize: 12,
              height: 1.35,
            ),
          ),
        ],
      ),
    );
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
          onRefresh: _loadHomeData,
          backgroundColor: AppTheme.darkCard,
          color: AppTheme.sky400,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 8),
                _buildHeroCard(context),
                const SizedBox(height: 20),
                _buildSectionHeader(
                  'Current Status',
                  'Keep your dispatcher updated with your latest work state.',
                ),
                _buildStatusCard(context),
                const SizedBox(height: 20),
                _buildSectionHeader(
                  'Truck Assignment',
                  'Review your active truck details and assignment information.',
                ),
                _buildTruckAssignmentCard(),
                const SizedBox(height: 20),
                _buildSectionHeader(
                  l10n.quickActions,
                  'Fast access to the most important driver tools.',
                ),
                _buildQuickActionsGrid(context, l10n),

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

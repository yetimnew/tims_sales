import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:shimmer/shimmer.dart';
import '../../models/maintenance.dart';
import '../../services/maintenance_service.dart';
import 'maintenance_details_screen.dart';

class MaintenanceAlertsScreen extends StatefulWidget {
  const MaintenanceAlertsScreen({super.key});

  @override
  State<MaintenanceAlertsScreen> createState() => _MaintenanceAlertsScreenState();
}

class _MaintenanceAlertsScreenState extends State<MaintenanceAlertsScreen> {
  final MaintenanceService _maintenanceService = MaintenanceService();
  MaintenanceResponse? _maintenanceData;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMaintenanceAlerts();
  }

  Future<void> _loadMaintenanceAlerts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final data = await _maintenanceService.getMaintenanceAlerts();
      setState(() {
        _maintenanceData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load maintenance alerts: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final dueSoonRecords = _maintenanceData?.upcoming.where((record) => record.isDueSoon).toList() ?? [];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance Alerts'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadMaintenanceAlerts,
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadMaintenanceAlerts,
        child: _isLoading
            ? _buildLoadingState(context)
            : _error != null
                ? _buildErrorState(context, _error!)
                : SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 8),
                        // Summary Card
                        if (_maintenanceData != null) ...[
                          _buildSummaryCard(context, _maintenanceData!),
                          const SizedBox(height: 24),
                        ],

                        // Overdue Section (Critical)
                        if (_maintenanceData!.overdue.isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Overdue Maintenance',
                            _maintenanceData!.overdue.length,
                            Colors.red,
                            Icons.warning,
                          ),
                          const SizedBox(height: 12),
                          ..._maintenanceData!.overdue.map((record) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildMaintenanceCard(context, record, isOverdue: true),
                              )),
                          const SizedBox(height: 24),
                        ],

                        // Upcoming Section
                        if (dueSoonRecords.isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Due Soon',
                            dueSoonRecords.length,
                            Colors.orange,
                            Icons.calendar_today,
                          ),
                          const SizedBox(height: 12),
                          ...dueSoonRecords.map((record) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildMaintenanceCard(context, record),
                              )),
                          const SizedBox(height: 24),
                        ],

                        // Recent Completed Section
                        if (_maintenanceData!.recent.isNotEmpty) ...[
                          _buildSectionHeader(
                            context,
                            'Recent Completed',
                            _maintenanceData!.recent.length,
                            Colors.blueGrey,
                            Icons.check_circle,
                          ),
                          const SizedBox(height: 12),
                          ..._maintenanceData!.recent.map((record) => Padding(
                                padding: const EdgeInsets.only(bottom: 12),
                                child: _buildMaintenanceCard(context, record),
                              )),
                        ],

                        // Empty State
                        if (_maintenanceData!.overdue.isEmpty &&
                            dueSoonRecords.isEmpty &&
                            _maintenanceData!.recent.isEmpty)
                          _buildEmptyState(context),
                      ],
                    ),
                  ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        _buildShimmerCard(context),
        const SizedBox(height: 16),
        _buildShimmerCard(context),
        const SizedBox(height: 16),
        _buildShimmerCard(context),
      ],
    );
  }

  Widget _buildShimmerCard(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: Colors.grey[300]!,
      highlightColor: Colors.grey[100]!,
      child: Card(
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        child: Container(
          height: 120,
          padding: const EdgeInsets.all(16),
        ),
      ),
    );
  }

  Widget _buildErrorState(BuildContext context, String error) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Error Loading Maintenance Alerts',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.red[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.red[600]),
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _loadMaintenanceAlerts,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          children: [
            Icon(Icons.build_circle_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Maintenance Alerts',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'You currently have no maintenance alerts. Scheduled maintenance will appear here.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard(BuildContext context, MaintenanceResponse data) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Maintenance Summary',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildSummaryItem(
                    context,
                    'Overdue',
                    data.overdue.length.toString(),
                    Colors.red,
                    Icons.warning,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildSummaryItem(
                    context,
                    'Upcoming',
                    data.upcoming.length.toString(),
                    Colors.orange,
                    Icons.calendar_today,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: _buildSummaryItem(
                    context,
                    'Recent',
                    data.recent.length.toString(),
                    Colors.green,
                    Icons.check_circle,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryItem(
    BuildContext context,
    String label,
    String value,
    Color color,
    IconData icon,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        children: [
          Icon(icon, size: 24, color: color),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(
    BuildContext context,
    String title,
    int count,
    Color color,
    IconData icon,
  ) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: color.withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Text(
          title,
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            count.toString(),
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDecisionBanner(BuildContext context, MaintenanceRecord record) {
    if (!record.hasManagerDecision) {
      return const SizedBox.shrink();
    }

    final isApproved = record.mobileRequestStatus == 'approved';
    final color = isApproved ? Colors.green : Colors.red;
    final title = isApproved ? 'Manager approved your request' : 'Manager rejected your request';

    return Container(
      width: double.infinity,
      margin: const EdgeInsets.only(top: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(20),
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: color.withAlpha(76)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                isApproved ? Icons.verified_outlined : Icons.cancel_outlined,
                color: color,
                size: 18,
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(color: color, fontWeight: FontWeight.w700),
                ),
              ),
            ],
          ),
          if (record.mobileRequestReviewNote != null && record.mobileRequestReviewNote!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(record.mobileRequestReviewNote!),
          ],
          if (record.mobileRequestReviewedAt != null) ...[
            const SizedBox(height: 8),
            Text(
              DateFormat.yMMMd().add_jm().format(record.mobileRequestReviewedAt!),
              style: TextStyle(fontSize: 12, color: Colors.grey[700]),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildMaintenanceCard(
    BuildContext context,
    MaintenanceRecord record, {
    bool isOverdue = false,
  }) {
    final cardColor = isOverdue
        ? Colors.red[50]
        : record.isUrgent
            ? Colors.orange[50]
            : Colors.white;

    final borderColor = isOverdue
        ? Colors.red
        : record.isUrgent
            ? Colors.orange
            : Colors.grey[300]!;

    return Card(
      elevation: isOverdue ? 4 : 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: borderColor, width: isOverdue || record.isUrgent ? 2 : 1),
      ),
      color: cardColor,
      child: InkWell(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => MaintenanceDetailsScreen(maintenanceId: record.id),
            ),
          ).then((_) => _loadMaintenanceAlerts()); // Refresh after returning
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (record.maintenanceType != null) ...[
                          Text(
                            record.maintenanceType!.name,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                        ],
                        Text(
                          record.statusLabel,
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: isOverdue
                          ? Colors.red
                          : record.isUrgent
                              ? Colors.orange
                              : Colors.blue,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      record.urgencyText,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 11,
                      ),
                    ),
                  ),
                ],
              ),
              if (record.scheduledDate != null) ...[
                const Divider(height: 20),
                Row(
                  children: [
                    Icon(Icons.calendar_today, size: 16, color: Colors.grey[600]),
                    const SizedBox(width: 8),
                    Text(
                      'Scheduled: ${DateFormat.yMMMd().format(record.scheduledDate!)}',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey[700],
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
              if (record.daysUntilScheduled != null || isOverdue) ...[
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(
                      isOverdue ? Icons.warning : Icons.access_time,
                      size: 16,
                      color: isOverdue ? Colors.red : Colors.orange,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      isOverdue
                          ? 'Overdue by ${-record.daysUntilScheduled!} days'
                          : record.daysUntilScheduled! <= 0
                              ? 'Due today'
                              : 'In ${record.daysUntilScheduled} days',
                      style: TextStyle(
                        fontSize: 13,
                        color: isOverdue ? Colors.red[700] : Colors.orange[700],
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ],
              _buildDecisionBanner(context, record),
              const SizedBox(height: 12),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => MaintenanceDetailsScreen(maintenanceId: record.id),
                      ),
                    ).then((_) => _loadMaintenanceAlerts());
                  },
                  icon: const Icon(Icons.arrow_forward, size: 16),
                  label: const Text('View Details'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}


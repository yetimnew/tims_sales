import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/maintenance.dart';
import '../../services/maintenance_service.dart';

class MaintenanceDetailsScreen extends StatefulWidget {
  final int maintenanceId;

  const MaintenanceDetailsScreen({super.key, required this.maintenanceId});

  @override
  State<MaintenanceDetailsScreen> createState() => _MaintenanceDetailsScreenState();
}

class _MaintenanceDetailsScreenState extends State<MaintenanceDetailsScreen> {
  final MaintenanceService _maintenanceService = MaintenanceService();
  MaintenanceRecord? _maintenance;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadMaintenanceDetails();
  }

  Future<void> _loadMaintenanceDetails() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final maintenance = await _maintenanceService.getMaintenanceDetails(widget.maintenanceId);
      setState(() {
        _maintenance = maintenance;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to load maintenance details: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Maintenance Details'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadMaintenanceDetails,
        child: _isLoading
            ? _buildLoadingState(context)
            : _error != null
                ? _buildErrorState(context, _error!)
                : _maintenance == null
                    ? _buildEmptyState(context)
                    : SingleChildScrollView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Status Card
                            _buildStatusCard(context, _maintenance!),
                            const SizedBox(height: 16),

                            // Basic Information
                            _buildBasicInfoCard(context, _maintenance!),
                            const SizedBox(height: 16),

                            // Detailed Information (if available)
                            if (_maintenance!.description != null ||
                                _maintenance!.workPerformed != null ||
                                _maintenance!.partsReplaced != null ||
                                _maintenance!.odometerReading != null ||
                                _maintenance!.cost != null ||
                                _maintenance!.serviceProvider != null) ...[
                              _buildDetailsCard(context, _maintenance!),
                              const SizedBox(height: 16),
                            ],
                          ],
                        ),
                      ),
      ),
    );
  }

  Widget _buildLoadingState(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(),
          const SizedBox(height: 16),
          Text(
            'Loading maintenance details...',
            style: TextStyle(color: Colors.grey[600]),
          ),
        ],
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
              'Error Loading Details',
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
              onPressed: _loadMaintenanceDetails,
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
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.build_circle_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'Maintenance Not Found',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.grey[700],
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'The requested maintenance record could not be found.',
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey[600]),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context, MaintenanceRecord maintenance) {
    final statusColor = maintenance.isOverdue
        ? Colors.red
        : maintenance.isUrgent
            ? Colors.orange
            : Colors.blue;

    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Status',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Theme.of(context).colorScheme.primary,
                      ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(
                    color: statusColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    maintenance.urgencyText,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                ),
              ],
            ),
            if (maintenance.maintenanceType != null) ...[
              const Divider(height: 24),
              _buildDetailRow(
                context,
                'Maintenance Type',
                maintenance.maintenanceType!.name,
                Icons.build,
              ),
            ],
            const SizedBox(height: 12),
            _buildDetailRow(
              context,
              'Status',
              maintenance.statusLabel,
              Icons.info,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfoCard(BuildContext context, MaintenanceRecord maintenance) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Schedule Information',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (maintenance.scheduledDate != null)
              _buildDetailRow(
                context,
                'Scheduled Date',
                DateFormat.yMMMd().format(maintenance.scheduledDate!),
                Icons.calendar_today,
              ),
            if (maintenance.completedDate != null) ...[
              const SizedBox(height: 12),
              _buildDetailRow(
                context,
                'Completed Date',
                DateFormat.yMMMd().format(maintenance.completedDate!),
                Icons.event_available,
              ),
            ],
            if (maintenance.daysUntilScheduled != null || maintenance.isOverdue) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: maintenance.isOverdue
                      ? Colors.red[50]
                      : maintenance.isUrgent
                          ? Colors.orange[50]
                          : Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: maintenance.isOverdue
                        ? Colors.red[200]!
                        : maintenance.isUrgent
                            ? Colors.orange[200]!
                            : Colors.blue[200]!,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      maintenance.isOverdue ? Icons.warning : Icons.access_time,
                      color: maintenance.isOverdue
                          ? Colors.red[700]
                          : maintenance.isUrgent
                              ? Colors.orange[700]
                              : Colors.blue[700],
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            maintenance.isOverdue ? 'Overdue' : 'Days Until Scheduled',
                            style: TextStyle(
                              fontSize: 12,
                              color: maintenance.isOverdue
                                  ? Colors.red[700]
                                  : maintenance.isUrgent
                                      ? Colors.orange[700]
                                      : Colors.blue[700],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            maintenance.isOverdue
                                ? '${-maintenance.daysUntilScheduled!} days overdue'
                                : maintenance.daysUntilScheduled! <= 0
                                    ? 'Due today'
                                    : '${maintenance.daysUntilScheduled} days',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                              color: maintenance.isOverdue
                                  ? Colors.red[700]
                                  : maintenance.isUrgent
                                      ? Colors.orange[700]
                                      : Colors.blue[700],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsCard(BuildContext context, MaintenanceRecord maintenance) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Details',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const Divider(height: 24),
            if (maintenance.description != null) ...[
              _buildDetailRow(
                context,
                'Description',
                maintenance.description!,
                Icons.description,
              ),
              const SizedBox(height: 12),
            ],
            if (maintenance.odometerReading != null) ...[
              _buildDetailRow(
                context,
                'Odometer Reading',
                '${maintenance.odometerReading!.toStringAsFixed(0)} km',
                Icons.straighten,
              ),
              const SizedBox(height: 12),
            ],
            if (maintenance.cost != null) ...[
              _buildDetailRow(
                context,
                'Cost',
                'ETB ${maintenance.cost!.toStringAsFixed(2)}',
                Icons.attach_money,
              ),
              const SizedBox(height: 12),
            ],
            if (maintenance.serviceProvider != null) ...[
              _buildDetailRow(
                context,
                'Service Provider',
                maintenance.serviceProvider!,
                Icons.business,
              ),
              const SizedBox(height: 12),
            ],
            if (maintenance.workPerformed != null) ...[
              const SizedBox(height: 8),
              Text(
                'Work Performed',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Text(
                  maintenance.workPerformed!,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
              const SizedBox(height: 12),
            ],
            if (maintenance.partsReplaced != null) ...[
              Text(
                'Parts Replaced',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.grey[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Text(
                  maintenance.partsReplaced!,
                  style: const TextStyle(fontSize: 14),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDetailRow(
    BuildContext context,
    String label,
    String value,
    IconData icon,
  ) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: Colors.grey[600]),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}


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

  Future<void> _acknowledgeMaintenance() async {
    final updated = await _maintenanceService.acknowledgeMaintenance(widget.maintenanceId);
    if (updated == null) {
      _showMessage('Failed to acknowledge maintenance.', isError: true);
      return;
    }

    setState(() {
      _maintenance = updated;
    });

    _showMessage('Maintenance acknowledged.');
  }

  Future<void> _reportIssue() async {
    final controller = TextEditingController();
    final message = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Report Issue'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Describe the issue'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim()),
            child: const Text('Send'),
          ),
        ],
      ),
    );

    if (message == null || message.isEmpty) {
      return;
    }

    final updated = await _maintenanceService.reportIssue(widget.maintenanceId, message);
    if (updated == null) {
      _showMessage('Failed to report issue.', isError: true);
      return;
    }

    setState(() {
      _maintenance = updated;
    });

    _showMessage('Issue reported successfully.');
  }

  Future<void> _requestService() async {
    final controller = TextEditingController();
    final notes = await showDialog<String>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Request Service'),
        content: TextField(
          controller: controller,
          maxLines: 4,
          decoration: const InputDecoration(labelText: 'Optional notes'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.of(context).pop(controller.text.trim()),
            child: const Text('Request'),
          ),
        ],
      ),
    );

    if (notes == null) {
      return;
    }

    final updated = await _maintenanceService.requestService(
      widget.maintenanceId,
      notes: notes.isEmpty ? null : notes,
    );
    if (updated == null) {
      _showMessage('Failed to request service.', isError: true);
      return;
    }

    setState(() {
      _maintenance = updated;
    });

    _showMessage('Service request sent.');
  }

  void _showMessage(String message, {bool isError = false}) {
    if (!mounted) {
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? Colors.red : Colors.green,
      ),
    );
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

                            _buildActionCard(context, _maintenance!),
                            const SizedBox(height: 16),

                            if (_maintenance!.hasManagerDecision) ...[
                              _buildManagerDecisionCard(context, _maintenance!),
                              const SizedBox(height: 16),
                            ],

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

  Widget _buildActionCard(BuildContext context, MaintenanceRecord maintenance) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Driver Actions',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.primary,
                  ),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 12,
              runSpacing: 12,
              children: [
                if (maintenance.driverAcknowledgedAt == null)
                  FilledButton.icon(
                    onPressed: _acknowledgeMaintenance,
                    icon: const Icon(Icons.check_circle),
                    label: const Text('Acknowledge'),
                  ),
                OutlinedButton.icon(
                  onPressed: _reportIssue,
                  icon: const Icon(Icons.report_problem_outlined),
                  label: const Text('Report Issue'),
                ),
                OutlinedButton.icon(
                  onPressed: _requestService,
                  icon: const Icon(Icons.build_circle_outlined),
                  label: const Text('Request Service'),
                ),
              ],
            ),
            if (maintenance.driverAcknowledgedAt != null) ...[
              const SizedBox(height: 16),
              Text(
                'Acknowledged on ${DateFormat.yMMMd().add_jm().format(maintenance.driverAcknowledgedAt!)}',
                style: TextStyle(color: Colors.green[700], fontWeight: FontWeight.w600),
              ),
            ],
            if (maintenance.driverIssueReport != null && maintenance.driverIssueReport!.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildActionNote(
                context,
                'Reported Issue',
                maintenance.driverIssueReport!,
                maintenance.driverIssueReportedAt,
              ),
            ],
            if (maintenance.driverServiceRequestedAt != null) ...[
              const SizedBox(height: 16),
              _buildActionNote(
                context,
                'Service Request',
                maintenance.driverServiceRequestNotes ?? 'Service requested from mobile app.',
                maintenance.driverServiceRequestedAt,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildManagerDecisionCard(BuildContext context, MaintenanceRecord maintenance) {
    final isApproved = maintenance.mobileRequestStatus == 'approved';
    final color = isApproved ? Colors.green : Colors.red;
    final title = isApproved ? 'Manager Decision: Approved' : 'Manager Decision: Rejected';
    final message = isApproved
        ? 'Your mobile maintenance request was approved.'
        : 'Your mobile maintenance request was rejected.';

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  isApproved ? Icons.verified_outlined : Icons.cancel_outlined,
                  color: color,
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    title,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(message),
            if (maintenance.mobileRequestReviewNote != null &&
                maintenance.mobileRequestReviewNote!.isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildActionNote(
                context,
                'Review Note',
                maintenance.mobileRequestReviewNote!,
                maintenance.mobileRequestReviewedAt,
              ),
            ] else if (maintenance.mobileRequestReviewedAt != null) ...[
              const SizedBox(height: 12),
              Text(
                'Reviewed on ${DateFormat.yMMMd().add_jm().format(maintenance.mobileRequestReviewedAt!)}',
                style: TextStyle(color: Colors.grey[700], fontWeight: FontWeight.w600),
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

  Widget _buildActionNote(
    BuildContext context,
    String label,
    String note,
    DateTime? timestamp,
  ) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 8),
          Text(note),
          if (timestamp != null) ...[
            const SizedBox(height: 8),
            Text(
              DateFormat.yMMMd().add_jm().format(timestamp),
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ],
      ),
    );
  }
}


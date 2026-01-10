import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_config.dart';
import '../../models/status.dart';
import '../../services/api_service.dart';
import 'status_history_screen.dart';

class StatusUpdateScreen extends StatefulWidget {
  const StatusUpdateScreen({super.key});

  @override
  State<StatusUpdateScreen> createState() => _StatusUpdateScreenState();
}

class _StatusUpdateScreenState extends State<StatusUpdateScreen> {
  final ApiService _apiService = ApiService();
  final TextEditingController _notesController = TextEditingController();
  
  DriverStatus? _currentStatus;
  bool _isLoading = true;
  bool _isUpdating = false;
  String? _error;
  WorkStatus? _selectedStatus;

  @override
  void initState() {
    super.initState();
    _loadCurrentStatus();
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _loadCurrentStatus() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await _apiService.get(AppConfig.statusCurrentEndpoint);
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final statusData = response.data['data'];
        setState(() {
          if (statusData != null) {
            _currentStatus = DriverStatus.fromJson(statusData);
            _selectedStatus = WorkStatus.fromString(_currentStatus!.statusValue);
          } else {
            _currentStatus = null;
            _selectedStatus = WorkStatus.available; // Default
          }
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load current status');
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load status: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _updateStatus() async {
    if (_selectedStatus == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select a status')),
      );
      return;
    }

    setState(() {
      _isUpdating = true;
      _error = null;
    });

    try {
      final response = await _apiService.post(
        AppConfig.statusEndpoint,
        data: {
          'status_type': 'work',
          'status_value': _selectedStatus!.value,
          'notes': _notesController.text.trim().isEmpty 
              ? null 
              : _notesController.text.trim(),
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final updatedStatus = DriverStatus.fromJson(response.data['data']);
        setState(() {
          _currentStatus = updatedStatus;
          _selectedStatus = WorkStatus.fromString(updatedStatus.statusValue);
          _notesController.clear();
        });

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Row(
                children: [
                  const Icon(Icons.check_circle, color: Colors.white),
                  const SizedBox(width: 8),
                  Expanded(child: Text('Status updated to ${_selectedStatus!.label}')),
                ],
              ),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
          );
        }

        // Reload status after a short delay
        Future.delayed(const Duration(milliseconds: 500), () {
          _loadCurrentStatus();
        });
      } else {
        throw Exception(response.data['message'] ?? 'Failed to update status');
      }
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white),
                const SizedBox(width: 8),
                Expanded(child: Text('Error: ${e.toString()}')),
              ],
            ),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        );
      }
    } finally {
      setState(() {
        _isUpdating = false;
      });
    }
  }

  Color _getStatusColor(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return Colors.green;
      case WorkStatus.onTrip:
        return Colors.blue;
      case WorkStatus.onBreak:
        return Colors.orange;
      case WorkStatus.offDuty:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return Icons.check_circle;
      case WorkStatus.onTrip:
        return Icons.directions_car;
      case WorkStatus.onBreak:
        return Icons.coffee;
      case WorkStatus.offDuty:
        return Icons.home;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Update Status'),
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const StatusHistoryScreen(),
                ),
              );
            },
            tooltip: 'View History',
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _currentStatus == null
              ? _buildErrorState()
              : RefreshIndicator(
                  onRefresh: _loadCurrentStatus,
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Current Status Card
                        if (_currentStatus != null) _buildCurrentStatusCard(),
                        if (_currentStatus != null) const SizedBox(height: 24),
                        
                        // Status Selection
                        _buildStatusSelection(),
                        const SizedBox(height: 24),
                        
                        // Notes Field
                        _buildNotesField(),
                        const SizedBox(height: 32),
                        
                        // Update Button
                        _buildUpdateButton(),
                        
                        if (_error != null && _currentStatus != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 16),
                            child: Text(
                              _error!,
                              style: TextStyle(color: Colors.red[300]),
                              textAlign: TextAlign.center,
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
    );
  }

  Widget _buildErrorState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text(
              'Something went wrong',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Unknown error',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _loadCurrentStatus,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCurrentStatusCard() {
    final status = _currentStatus!;
    final workStatus = WorkStatus.fromString(status.statusValue);
    
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.info_outline,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(width: 8),
                Text(
                  'Current Status',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: workStatus != null 
                    ? _getStatusColor(workStatus).withOpacity(0.1)
                    : Colors.grey[100],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: workStatus != null 
                      ? _getStatusColor(workStatus)
                      : Colors.grey,
                  width: 2,
                ),
              ),
              child: Row(
                children: [
                  if (workStatus != null) ...[
                    Icon(
                      _getStatusIcon(workStatus),
                      size: 32,
                      color: _getStatusColor(workStatus),
                    ),
                    const SizedBox(width: 16),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          workStatus?.label ?? status.statusValue.toUpperCase(),
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: workStatus != null 
                                ? _getStatusColor(workStatus)
                                : Colors.grey[700],
                          ),
                        ),
                        if (status.notes != null && status.notes!.isNotEmpty) ...[
                          const SizedBox(height: 4),
                          Text(
                            status.notes!,
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
            if (status.createdAt.isNotEmpty) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.access_time, size: 14, color: Colors.grey[600]),
                  const SizedBox(width: 4),
                  Text(
                    'Updated ${_formatDateTime(status.createdAt)}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusSelection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Select New Status',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 16),
        ...WorkStatus.values.map((status) => _buildStatusOption(status)),
      ],
    );
  }

  Widget _buildStatusOption(WorkStatus status) {
    final isSelected = _selectedStatus == status;
    final color = _getStatusColor(status);
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: _isUpdating ? null : () {
          setState(() {
            _selectedStatus = status;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelected 
                ? color.withOpacity(0.1)
                : Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? color : Colors.grey[300]!,
              width: isSelected ? 2 : 1,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _getStatusIcon(status),
                  color: color,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      status.label,
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: isSelected ? color : Colors.grey[800],
                      ),
                    ),
                    Text(
                      _getStatusDescription(status),
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Icon(Icons.check_circle, color: color, size: 24),
            ],
          ),
        ),
      ),
    );
  }

  String _getStatusDescription(WorkStatus status) {
    switch (status) {
      case WorkStatus.available:
        return 'Ready to accept assignments';
      case WorkStatus.onTrip:
        return 'Currently on a trip';
      case WorkStatus.onBreak:
        return 'Taking a break';
      case WorkStatus.offDuty:
        return 'Not available for work';
    }
  }

  Widget _buildNotesField() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Notes (Optional)',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: _notesController,
          maxLines: 4,
          decoration: InputDecoration(
            hintText: 'Add any additional notes about this status change...',
            border: OutlineInputBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            filled: true,
            fillColor: Colors.grey[50],
          ),
          enabled: !_isUpdating,
        ),
      ],
    );
  }

  Widget _buildUpdateButton() {
    return FilledButton(
      onPressed: _isUpdating || _selectedStatus == null
          ? null
          : _updateStatus,
      style: FilledButton.styleFrom(
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
        ),
      ),
      child: _isUpdating
          ? const SizedBox(
              height: 20,
              width: 20,
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.white,
              ),
            )
          : Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.update),
                const SizedBox(width: 8),
                Text(
                  'Update Status to ${_selectedStatus?.label ?? "..."}',
                  style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
              ],
            ),
    );
  }

  String _formatDateTime(String dateString) {
    try {
      final date = DateTime.parse(dateString);
      final now = DateTime.now();
      final difference = now.difference(date);

      if (difference.inMinutes < 1) {
        return 'just now';
      } else if (difference.inMinutes < 60) {
        return '${difference.inMinutes} minute${difference.inMinutes == 1 ? '' : 's'} ago';
      } else if (difference.inHours < 24) {
        return '${difference.inHours} hour${difference.inHours == 1 ? '' : 's'} ago';
      } else if (difference.inDays < 7) {
        return '${difference.inDays} day${difference.inDays == 1 ? '' : 's'} ago';
      } else {
        return DateFormat('MMM dd, yyyy HH:mm').format(date);
      }
    } catch (e) {
      return dateString;
    }
  }
}


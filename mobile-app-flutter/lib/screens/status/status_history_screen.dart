import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../config/app_config.dart';
import '../../models/status.dart';
import '../../services/api_service.dart';

class StatusHistoryScreen extends StatefulWidget {
  const StatusHistoryScreen({super.key});

  @override
  State<StatusHistoryScreen> createState() => _StatusHistoryScreenState();
}

class _StatusHistoryScreenState extends State<StatusHistoryScreen> {
  final ApiService _apiService = ApiService();
  
  List<DriverStatus> _statusHistory = [];
  bool _isLoading = true;
  String? _error;
  String? _filterType; // 'work', 'truck', 'trip', or null for all

  @override
  void initState() {
    super.initState();
    _loadStatusHistory();
  }

  Future<void> _loadStatusHistory({String? statusType}) async {
    setState(() {
      _isLoading = true;
      _error = null;
      _filterType = statusType;
    });

    try {
      String endpoint = AppConfig.statusHistoryEndpoint;
      if (statusType != null) {
        endpoint += '?status_type=$statusType';
      }

      final response = await _apiService.get(endpoint);
      
      if (response.statusCode == 200 && response.data['success'] == true) {
        final List<dynamic> data = response.data['data'] ?? [];
        setState(() {
          _statusHistory = data.map((json) => DriverStatus.fromJson(json)).toList();
          _isLoading = false;
        });
      } else {
        throw Exception('Failed to load status history');
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to load history: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Color _getStatusColor(String statusValue) {
    final status = WorkStatus.fromString(statusValue);
    if (status == null) return Colors.grey;
    
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

  IconData _getStatusIcon(String statusValue) {
    final status = WorkStatus.fromString(statusValue);
    if (status == null) return Icons.info;
    
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

  String _getStatusLabel(String statusValue) {
    final status = WorkStatus.fromString(statusValue);
    return status?.label ?? statusValue.replaceAll('_', ' ').toUpperCase();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Status History'),
        actions: [
          PopupMenuButton<String>(
            icon: const Icon(Icons.filter_list),
            tooltip: 'Filter',
            onSelected: (value) {
              if (value == 'all') {
                _loadStatusHistory();
              } else {
                _loadStatusHistory(statusType: value);
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'all',
                child: Row(
                  children: [
                    Icon(Icons.list, size: 20),
                    SizedBox(width: 8),
                    Text('All Statuses'),
                  ],
                ),
              ),
              const PopupMenuDivider(),
              const PopupMenuItem(
                value: 'work',
                child: Row(
                  children: [
                    Icon(Icons.work, size: 20),
                    SizedBox(width: 8),
                    Text('Work Status Only'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'truck',
                child: Row(
                  children: [
                    Icon(Icons.local_shipping, size: 20),
                    SizedBox(width: 8),
                    Text('Truck Status Only'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'trip',
                child: Row(
                  children: [
                    Icon(Icons.route, size: 20),
                    SizedBox(width: 8),
                    Text('Trip Status Only'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null && _statusHistory.isEmpty
              ? _buildErrorState()
              : _statusHistory.isEmpty
                  ? _buildEmptyState()
                  : RefreshIndicator(
                      onRefresh: () => _loadStatusHistory(statusType: _filterType),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: _statusHistory.length,
                        itemBuilder: (context, index) {
                          final status = _statusHistory[index];
                          final isWorkStatus = status.statusType == 'work';
                          final statusColor = isWorkStatus 
                              ? _getStatusColor(status.statusValue)
                              : Colors.grey;

                          return _buildStatusItem(status, statusColor, index);
                        },
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
              onPressed: () => _loadStatusHistory(statusType: _filterType),
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              'No Status History',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Your status history will appear here once you update your status',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: () => Navigator.pop(context),
              icon: const Icon(Icons.add),
              label: const Text('Update Status'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusItem(DriverStatus status, Color statusColor, int index) {
    final isLast = index == _statusHistory.length - 1;
    final dateTime = _parseDateTime(status.createdAt);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Timeline indicator
          Column(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(color: statusColor, width: 2),
                ),
                child: Icon(
                  _getStatusIcon(status.statusValue),
                  color: statusColor,
                  size: 20,
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    color: Colors.grey[300],
                    margin: const EdgeInsets.symmetric(vertical: 4),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 16),
          // Status content
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
              child: Card(
                elevation: 1,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 10,
                                    vertical: 4,
                                  ),
                                  decoration: BoxDecoration(
                                    color: statusColor.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(color: statusColor),
                                  ),
                                  child: Text(
                                    _getStatusLabel(status.statusValue),
                                    style: TextStyle(
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                      color: statusColor,
                                    ),
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  status.statusType.toUpperCase(),
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: Colors.grey[600],
                                    fontWeight: FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                          ),
                          Text(
                            _formatDateTime(dateTime),
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                            ),
                          ),
                        ],
                      ),
                      if (status.notes != null && status.notes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(
                                Icons.note_outlined,
                                size: 16,
                                color: Colors.grey[600],
                              ),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  status.notes!,
                                  style: TextStyle(
                                    fontSize: 13,
                                    color: Colors.grey[700],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                      const SizedBox(height: 8),
                      Text(
                        DateFormat('MMM dd, yyyy • HH:mm').format(dateTime),
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[500],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  DateTime _parseDateTime(String dateString) {
    try {
      return DateTime.parse(dateString);
    } catch (e) {
      return DateTime.now();
    }
  }

  String _formatDateTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);

    if (difference.inMinutes < 1) {
      return 'just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return DateFormat('MMM dd').format(dateTime);
    }
  }
}


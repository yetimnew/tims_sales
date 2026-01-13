import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/sync_queue_item.dart';
import '../../services/sync_service.dart';
import '../../services/offline_storage_service.dart';
import '../../services/connectivity_service.dart';

class OfflineSyncScreen extends StatefulWidget {
  const OfflineSyncScreen({super.key});

  @override
  State<OfflineSyncScreen> createState() => _OfflineSyncScreenState();
}

class _OfflineSyncScreenState extends State<OfflineSyncScreen> {
  final SyncService _syncService = SyncService();
  final OfflineStorageService _offlineStorage = OfflineStorageService();
  final ConnectivityService _connectivityService = ConnectivityService();

  List<SyncQueueItem> _syncItems = [];
  bool _isLoading = true;
  bool _isConnected = false;
  SyncProgress? _currentProgress;

  @override
  void initState() {
    super.initState();
    _initializeServices();
    _loadSyncItems();
    _setupListeners();
  }

  Future<void> _initializeServices() async {
    await _connectivityService.initialize();
    setState(() {
      _isConnected = _connectivityService.isConnected;
    });
  }

  void _setupListeners() {
    _connectivityService.connectivityStream.listen((isConnected) {
      setState(() {
        _isConnected = isConnected;
      });
    });

    _syncService.progressStream.listen((progress) {
      setState(() {
        _currentProgress = progress;
      });
    });
  }

  Future<void> _loadSyncItems() async {
    setState(() {
      _isLoading = true;
    });

    try {
      final items = await _offlineStorage.getAllSyncItems(includeSynced: false);
      setState(() {
        _syncItems = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _syncNow() async {
    if (!_isConnected) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('No internet connection. Please check your network.'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    await _syncService.syncPendingItems();
    _loadSyncItems();
  }

  Future<void> _clearSyncedItems() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Synced Items'),
        content: const Text('This will remove all successfully synced items from the queue. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      await _offlineStorage.clearSyncedItems();
      _loadSyncItems();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Offline Sync'),
        actions: [
          if (_isConnected && _syncItems.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.sync),
              onPressed: _syncNow,
              tooltip: 'Sync Now',
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadSyncItems,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Connection Status
                  Container(
                    padding: const EdgeInsets.all(16),
                    color: _isConnected ? Colors.green[100] : Colors.orange[100],
                    child: Row(
                      children: [
                        Icon(
                          _isConnected ? Icons.cloud_done : Icons.cloud_off,
                          color: _isConnected ? Colors.green : Colors.orange,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            _isConnected
                                ? 'Connected - Ready to sync'
                                : 'Offline - Items will sync when connection is restored',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: _isConnected ? Colors.green[900] : Colors.orange[900],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Sync Progress
                  if (_currentProgress != null && _currentProgress!.total > 0) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: Colors.blue[50],
                      child: Column(
                        children: [
                          Row(
                            children: [
                              const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Text(
                                  _currentProgress!.message,
                                  style: TextStyle(fontWeight: FontWeight.w500, color: Colors.blue[900]),
                                ),
                              ),
                              Text(
                                '${_currentProgress!.completed}/${_currentProgress!.total}',
                                style: TextStyle(color: Colors.blue[900], fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          LinearProgressIndicator(
                            value: _currentProgress!.progress,
                            backgroundColor: Colors.blue[200],
                            valueColor: AlwaysStoppedAnimation<Color>(Colors.blue[700]!),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Sync Items List
                  Expanded(
                    child: _syncItems.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.check_circle_outline, size: 64, color: Colors.grey[400]),
                                const SizedBox(height: 16),
                                Text(
                                  'No Pending Items',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.grey[700]),
                                ),
                                const SizedBox(height: 8),
                                Text(
                                  'All items have been synced',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          )
                        : ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: _syncItems.length,
                            itemBuilder: (context, index) {
                              final item = _syncItems[index];
                              return _buildSyncItemCard(item);
                            },
                          ),
                  ),
                ],
              ),
      ),
      floatingActionButton: _syncItems.isNotEmpty && _isConnected
          ? FloatingActionButton.extended(
              onPressed: _syncNow,
              icon: const Icon(Icons.sync),
              label: const Text('Sync Now'),
            )
          : null,
    );
  }

  Widget _buildSyncItemCard(SyncQueueItem item) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: _getStatusColor(item.status).withAlpha(25),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(
            _getStatusIcon(item.status),
            color: _getStatusColor(item.status),
          ),
        ),
        title: Text(
          _getOperationTypeLabel(item.type),
          style: const TextStyle(fontWeight: FontWeight.bold),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              DateFormat('MMM d, y • h:mm a').format(item.createdAt),
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
            if (item.retryCount > 0)
              Text(
                'Retry count: ${item.retryCount}',
                style: TextStyle(fontSize: 12, color: Colors.orange[700], fontWeight: FontWeight.w500),
              ),
            if (item.errorMessage != null)
              Text(
                item.errorMessage!,
                style: TextStyle(fontSize: 12, color: Colors.red[700]),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
          ],
        ),
        trailing: _getStatusBadge(item.status),
        isThreeLine: item.errorMessage != null || item.retryCount > 0,
      ),
    );
  }

  Widget _getStatusBadge(SyncStatus status) {
    final color = _getStatusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(25),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toString().split('.').last.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }

  Color _getStatusColor(SyncStatus status) {
    switch (status) {
      case SyncStatus.pending:
        return Colors.orange;
      case SyncStatus.syncing:
        return Colors.blue;
      case SyncStatus.synced:
        return Colors.green;
      case SyncStatus.failed:
        return Colors.red;
    }
  }

  IconData _getStatusIcon(SyncStatus status) {
    switch (status) {
      case SyncStatus.pending:
        return Icons.pending;
      case SyncStatus.syncing:
        return Icons.sync;
      case SyncStatus.synced:
        return Icons.check_circle;
      case SyncStatus.failed:
        return Icons.error;
    }
  }

  String _getOperationTypeLabel(SyncOperationType type) {
    switch (type) {
      case SyncOperationType.tripStatusUpdate:
        return 'Trip Status Update';
      case SyncOperationType.fuelRecordCreate:
        return 'Fuel Record';
      case SyncOperationType.locationSend:
        return 'Location Update';
      case SyncOperationType.emergencyAlert:
        return 'Emergency Alert';
      case SyncOperationType.tripDocumentUpload:
        return 'Trip Document';
      case SyncOperationType.statusUpdate:
        return 'Status Update';
    }
  }
}


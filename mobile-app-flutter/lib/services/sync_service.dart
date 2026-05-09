import 'dart:async';
import 'package:image_picker/image_picker.dart';
import '../models/sync_queue_item.dart';
import 'connectivity_service.dart';
import 'offline_storage_service.dart';
import 'trip_service.dart';
import 'fuel_service.dart';
import 'emergency_service.dart';
import 'location_service.dart';
import 'status_service.dart';

class SyncService {
  final ConnectivityService _connectivityService = ConnectivityService();
  final OfflineStorageService _offlineStorage = OfflineStorageService();
  final TripService _tripService = TripService();
  final FuelService _fuelService = FuelService();
  final EmergencyService _emergencyService = EmergencyService();
  final LocationService _locationService = LocationService();
  final StatusService _statusService = StatusService();

  Timer? _syncTimer;
  bool _isSyncing = false;
  StreamController<SyncProgress>? _progressController;
  Stream<SyncProgress>? _progressStream;

  static const int maxRetries = 3;
  static const Duration retryDelay = Duration(seconds: 30);
  static const Duration syncInterval = Duration(minutes: 5);

  Future<void> initialize() async {
    await _connectivityService.initialize();
    await _offlineStorage.initialize();

    // Listen to connectivity changes
    _connectivityService.connectivityStream.listen((isConnected) {
      if (isConnected) {
        // Start syncing when connection is restored
        syncPendingItems();
      }
    });

    // Start periodic sync
    _startPeriodicSync();
  }

  void _startPeriodicSync() {
    _syncTimer?.cancel();
    _syncTimer = Timer.periodic(syncInterval, (_) {
      if (_connectivityService.isConnected) {
        syncPendingItems();
      }
    });
  }

  Stream<SyncProgress> get progressStream {
    _progressController ??= StreamController<SyncProgress>.broadcast();
    _progressStream ??= _progressController!.stream;
    return _progressStream!;
  }

  Future<void> syncPendingItems() async {
    if (_isSyncing) return;
    if (!_connectivityService.isConnected) return;

    _isSyncing = true;

    try {
      final pendingItems = await _offlineStorage.getPendingSyncItems();
      if (pendingItems.isEmpty) {
        _emitProgress(SyncProgress(completed: 0, total: 0, message: 'No items to sync'));
        _isSyncing = false;
        return;
      }

      _emitProgress(SyncProgress(completed: 0, total: pendingItems.length, message: 'Starting sync...'));

      int completed = 0;
      for (var item in pendingItems) {
        if (item.retryCount >= maxRetries) {
          // Mark as failed permanently
          await _offlineStorage.updateSyncItem(
            item.copyWith(
              status: SyncStatus.failed,
              errorMessage: 'Max retries exceeded',
            ),
          );
          completed++;
          _emitProgress(SyncProgress(
            completed: completed,
            total: pendingItems.length,
            message: 'Skipping ${item.type} (max retries exceeded)',
          ));
          continue;
        }

        // Mark as syncing
        await _offlineStorage.updateSyncItem(
          item.copyWith(status: SyncStatus.syncing),
        );

        try {
          final success = await _syncItem(item);
          if (success) {
            // Mark as synced
            await _offlineStorage.updateSyncItem(
              item.copyWith(
                status: SyncStatus.synced,
                syncedAt: DateTime.now(),
              ),
            );
            _emitProgress(SyncProgress(
              completed: completed + 1,
              total: pendingItems.length,
              message: 'Synced ${item.type}',
            ));
          } else {
            // Mark as failed, increment retry count
            await _offlineStorage.updateSyncItem(
              item.copyWith(
                status: SyncStatus.failed,
                retryCount: item.retryCount + 1,
                errorMessage: 'Sync failed',
              ),
            );
            _emitProgress(SyncProgress(
              completed: completed + 1,
              total: pendingItems.length,
              message: 'Failed to sync ${item.type}',
            ));
          }
        } catch (e) {
          // Mark as failed, increment retry count
          await _offlineStorage.updateSyncItem(
            item.copyWith(
              status: SyncStatus.failed,
              retryCount: item.retryCount + 1,
              errorMessage: e.toString(),
            ),
          );
          _emitProgress(SyncProgress(
            completed: completed + 1,
            total: pendingItems.length,
            message: 'Error syncing ${item.type}: ${e.toString()}',
          ));
        }

        completed++;
      }

      // Clean up old synced items
      await _offlineStorage.clearSyncedItems();
    } catch (e) {
      _emitProgress(SyncProgress(
        completed: 0,
        total: 0,
        message: 'Sync error: ${e.toString()}',
      ));
    } finally {
      _isSyncing = false;
    }
  }

  Future<bool> _syncItem(SyncQueueItem item) async {
    try {
      switch (item.type) {
        case SyncOperationType.tripStatusUpdate:
          return await _syncTripStatusUpdate(item);
        case SyncOperationType.fuelRecordCreate:
          return await _syncFuelRecordCreate(item);
        case SyncOperationType.locationSend:
          return await _syncLocationSend(item);
        case SyncOperationType.emergencyAlert:
          return await _syncEmergencyAlert(item);
        case SyncOperationType.tripDocumentUpload:
          return await _syncTripDocumentUpload(item);
        case SyncOperationType.statusUpdate:
          return await _syncStatusUpdate(item);
        default:
          return false;
      }
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncTripStatusUpdate(SyncQueueItem item) async {
    try {
      final tripId = item.data['tripId'] as int;
      final status = item.data['status'] as String;
      final comment = item.data['comment'] as String?;

      final result = await _tripService.updateTripStatus(tripId, status, comment: comment);
      return result != null;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncFuelRecordCreate(SyncQueueItem item) async {
    try {
      final result = await _fuelService.createFuelRecord(
        fuelDate: item.data['fuelDate'] as String,
        fuelQuantityLiters: (item.data['fuelQuantityLiters'] as num).toDouble(),
        fuelPricePerLiter: (item.data['fuelPricePerLiter'] as num).toDouble(),
        totalCost: (item.data['totalCost'] as num).toDouble(),
        fuelStation: item.data['fuelStation'] as String,
        fuelType: item.data['fuelType'] as String,
        odometerReading: item.data['odometerReading'] as int?,
        receiptNumber: item.data['receiptNumber'] as String?,
        notes: item.data['notes'] as String?,
        receiptImage: (item.data['imagePath'] as String?) != null
            ? XFile(item.data['imagePath'] as String)
            : null,
        latitude: (item.data['latitude'] as num?)?.toDouble(),
        longitude: (item.data['longitude'] as num?)?.toDouble(),
        locationAccuracyM: (item.data['locationAccuracyM'] as num?)?.toDouble(),
        locationTimestamp: item.data['locationTimestamp'] as String?,
      );

      return result != null;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncLocationSend(SyncQueueItem item) async {
    try {
      final result = await _locationService.sendLocation(
        item.data['latitude'] as double,
        item.data['longitude'] as double,
        accuracy: item.data['accuracy'] as double?,
        speed: item.data['speed'] as double?,
        heading: item.data['heading'] as double?,
      );
      return result;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncEmergencyAlert(SyncQueueItem item) async {
    try {
      final result = await _emergencyService.sendEmergencyAlert(
        message: item.data['message'] as String?,
      );
      return result['success'] == true;
    } catch (e) {
      return false;
    }
  }

  Future<bool> _syncTripDocumentUpload(SyncQueueItem item) async {
    // File uploads require the file to still be accessible
    // This is complex for offline mode - would need to store file path
    // For now, return false to indicate it needs online upload
    return false;
  }

  Future<bool> _syncStatusUpdate(SyncQueueItem item) async {
    try {
      final statusType = item.data['statusType'] as String? ?? 'work';
      final statusValue = item.data['statusValue'] as String;
      final notes = item.data['notes'] as String?;

      final result = await _statusService.updateStatus(
        statusType: statusType,
        statusValue: statusValue,
        notes: notes,
      );
      return result;
    } catch (e) {
      return false;
    }
  }

  void _emitProgress(SyncProgress progress) {
    _progressController?.add(progress);
  }

  Future<void> queueSyncItem(SyncQueueItem item) async {
    await _offlineStorage.addToSyncQueue(item);

    // Try to sync immediately if connected
    if (_connectivityService.isConnected && !_isSyncing) {
      syncPendingItems();
    }
  }

  bool get isSyncing => _isSyncing;
  bool get isConnected => _connectivityService.isConnected;

  void dispose() {
    _syncTimer?.cancel();
    _progressController?.close();
    _connectivityService.dispose();
  }
}

class SyncProgress {
  final int completed;
  final int total;
  final String message;

  SyncProgress({
    required this.completed,
    required this.total,
    required this.message,
  });

  double get progress => total > 0 ? completed / total : 0.0;
  bool get isComplete => completed >= total;
}


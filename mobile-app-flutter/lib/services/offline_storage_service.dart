import 'dart:convert';
import 'package:hive_flutter/hive_flutter.dart';
import '../models/sync_queue_item.dart';
import '../models/trip.dart';
import '../models/fuel_record.dart';

class OfflineStorageService {
  static const String _syncQueueBoxName = 'sync_queue';
  static const String _tripsBoxName = 'trips_cache';
  static const String _fuelRecordsBoxName = 'fuel_records_cache';
  static const String _performanceBoxName = 'performance_cache';

  Box<dynamic>? _syncQueueBox;
  Box<dynamic>? _tripsBox;
  Box<dynamic>? _fuelRecordsBox;
  Box<dynamic>? _performanceBox;

  bool _isInitialized = false;

  Future<void> initialize() async {
    if (_isInitialized) return;

    await Hive.initFlutter();

    // Register adapters if needed (for custom types)
    // For now, we'll store as JSON strings

    // Open boxes
    _syncQueueBox = await Hive.openBox(_syncQueueBoxName);
    _tripsBox = await Hive.openBox(_tripsBoxName);
    _fuelRecordsBox = await Hive.openBox(_fuelRecordsBoxName);
    _performanceBox = await Hive.openBox(_performanceBoxName);

    _isInitialized = true;
  }

  // Sync Queue Operations
  Future<void> addToSyncQueue(SyncQueueItem item) async {
    if (!_isInitialized) await initialize();
    await _syncQueueBox!.put(item.id, jsonEncode(item.toJson()));
  }

  Future<List<SyncQueueItem>> getPendingSyncItems() async {
    if (!_isInitialized) await initialize();

    final items = <SyncQueueItem>[];
    for (var key in _syncQueueBox!.keys) {
      final jsonString = _syncQueueBox!.get(key) as String?;
      if (jsonString != null) {
        try {
          final item = SyncQueueItem.fromJson(jsonDecode(jsonString));
          if (item.status == SyncStatus.pending || item.status == SyncStatus.failed) {
            items.add(item);
          }
        } catch (e) {
          // Skip invalid items
        }
      }
    }

    // Sort by creation date (oldest first)
    items.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return items;
  }

  Future<void> updateSyncItem(SyncQueueItem item) async {
    if (!_isInitialized) await initialize();
    await _syncQueueBox!.put(item.id, jsonEncode(item.toJson()));
  }

  Future<List<SyncQueueItem>> getAllSyncItems({bool includeSynced = false}) async {
    if (!_isInitialized) await initialize();

    final items = <SyncQueueItem>[];
    for (var key in _syncQueueBox!.keys) {
      final jsonString = _syncQueueBox!.get(key) as String?;
      if (jsonString != null) {
        try {
          final item = SyncQueueItem.fromJson(jsonDecode(jsonString));
          if (includeSynced || item.status != SyncStatus.synced) {
            items.add(item);
          }
        } catch (e) {
          // Skip invalid items
        }
      }
    }

    // Sort by creation date (oldest first)
    items.sort((a, b) => a.createdAt.compareTo(b.createdAt));
    return items;
  }

  Future<void> removeSyncItem(String id) async {
    if (!_isInitialized) await initialize();
    await _syncQueueBox!.delete(id);
  }

  Future<void> clearSyncedItems() async {
    if (!_isInitialized) await initialize();

    final keysToDelete = <String>[];
    for (var key in _syncQueueBox!.keys) {
      final jsonString = _syncQueueBox!.get(key) as String?;
      if (jsonString != null) {
        try {
          final item = SyncQueueItem.fromJson(jsonDecode(jsonString));
          if (item.status == SyncStatus.synced) {
            // Keep synced items for 7 days for reference
            final daysSinceSync = DateTime.now().difference(item.syncedAt ?? item.createdAt).inDays;
            if (daysSinceSync > 7) {
              keysToDelete.add(key.toString());
            }
          }
        } catch (e) {
          // Skip invalid items
        }
      }
    }

    for (var key in keysToDelete) {
      await _syncQueueBox!.delete(key);
    }
  }

  // Cache Operations - Trips
  Future<void> cacheTrips(List<Trip> trips) async {
    if (!_isInitialized) await initialize();
    await _tripsBox!.put('trips', jsonEncode(trips.map((t) => _tripToJson(t)).toList()));
    await _tripsBox!.put('cached_at', DateTime.now().toIso8601String());
  }

  Future<List<Trip>?> getCachedTrips() async {
    if (!_isInitialized) await initialize();

    final tripsJson = _tripsBox!.get('trips') as String?;
    if (tripsJson == null) return null;

    try {
      final List<dynamic> tripsList = jsonDecode(tripsJson);
      return tripsList.map((json) => Trip.fromJson(json as Map<String, dynamic>)).toList();
    } catch (e) {
      return null;
    }
  }

  DateTime? getTripsCacheTime() {
    final cachedAt = _tripsBox?.get('cached_at') as String?;
    return cachedAt != null ? DateTime.parse(cachedAt) : null;
  }

  // Cache Operations - Fuel Records
  Future<void> cacheFuelRecords(List<FuelRecord> records) async {
    if (!_isInitialized) await initialize();
    await _fuelRecordsBox!.put('records', jsonEncode(records.map((r) => _fuelRecordToJson(r)).toList()));
    await _fuelRecordsBox!.put('cached_at', DateTime.now().toIso8601String());
  }

  Future<List<FuelRecord>?> getCachedFuelRecords() async {
    if (!_isInitialized) await initialize();

    final recordsJson = _fuelRecordsBox!.get('records') as String?;
    if (recordsJson == null) return null;

    try {
      final List<dynamic> recordsList = jsonDecode(recordsJson);
      final records = <FuelRecord>[];
      for (var json in recordsList) {
        try {
          records.add(FuelRecord.fromJson(json as Map<String, dynamic>));
        } catch (e) {
          // Skip invalid fuel record entries
        }
      }
      return records;
    } catch (e) {
      return null;
    }
  }

  // Helper methods to convert models to JSON
  // Note: This uses the model's built-in serialization where possible
  Map<String, dynamic> _tripToJson(Trip trip) {
    // Use the model's serialization by converting to JSON via API format
    return {
      'id': trip.id,
      'FOnumber': trip.foNumber,
      'status': trip.status,
      'is_returned': trip.isReturned,
      'dispatch_date': trip.dispatchDate?.toIso8601String(),
      'returned_date': trip.returnedDate?.toIso8601String(),
      'origin': trip.origin != null
          ? {'id': trip.origin!.id, 'name': trip.origin!.name}
          : null,
      'destination': trip.destination != null
          ? {'id': trip.destination!.id, 'name': trip.destination!.name}
          : null,
      'distance_with_cargo': trip.distanceWithCargo,
      'distance_without_cargo': trip.distanceWithoutCargo,
      'cargo_weight_kg': trip.cargoWeightKg,
      'cargo_volume_mt': trip.cargoVolumeMt,
      'cargo_volume_cubic_meters': trip.cargoVolumeCubicMeters,
      'fuel_liters': trip.fuelLiters,
      'fuel_birr': trip.fuelBirr,
      'comment': trip.comment,
      'cargo_type': trip.cargoType != null
          ? {'id': trip.cargoType!.id, 'name': trip.cargoType!.name}
          : null,
      'operation': trip.operation != null
          ? {'id': trip.operation!.id, 'operationid': trip.operation!.operationid, 'name': trip.operation!.name}
          : null,
    };
  }

  Map<String, dynamic> _fuelRecordToJson(FuelRecord record) {
    return {
      'id': record.id,
      'fuel_date': record.fuelDate,
      'fuel_quantity_liters': record.fuelQuantityLiters,
      'fuel_price_per_liter': record.fuelPricePerLiter,
      'total_cost': record.totalCost,
      'fuel_station': record.fuelStation,
      'fuel_type': record.fuelType,
      'odometer_reading': record.odometerReading,
      'receipt_number': record.receiptNumber,
      'notes': record.notes,
      'receipt_image': record.receiptImage,
      'truck': record.truck != null
          ? {'id': record.truck!.id, 'plate': record.truck!.plate}
          : null,
      'created_at': record.createdAt,
      'updated_at': record.updatedAt,
    };
  }

  // Clear all cached data
  Future<void> clearAllCache() async {
    if (!_isInitialized) await initialize();
    await _tripsBox!.clear();
    await _fuelRecordsBox!.clear();
    await _performanceBox!.clear();
  }

  // Get storage size info (for debugging)
  Future<Map<String, int>> getStorageInfo() async {
    if (!_isInitialized) await initialize();

    return {
      'sync_queue_size': _syncQueueBox!.length,
      'trips_cache_size': _tripsBox!.length,
      'fuel_records_cache_size': _fuelRecordsBox!.length,
      'performance_cache_size': _performanceBox!.length,
    };
  }
}


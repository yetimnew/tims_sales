import '../config/app_config.dart';
import '../models/fuel_record.dart';
import '../models/sync_queue_item.dart';
import 'api_service.dart';
import 'connectivity_service.dart';
import 'offline_storage_service.dart';
import 'sync_service.dart';

class FuelService {
  final ApiService _apiService = ApiService();
  final ConnectivityService _connectivityService = ConnectivityService();
  final OfflineStorageService _offlineStorage = OfflineStorageService();
  SyncService? _syncService;

  Future<FuelRecordsResponse> getFuelRecords({
    String? startDate,
    String? endDate,
    int limit = 50,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'limit': limit,
      };

      if (startDate != null) {
        queryParams['start_date'] = startDate;
      }

      if (endDate != null) {
        queryParams['end_date'] = endDate;
      }

      final response = await _apiService.get(
        '/driver/fuel',
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return FuelRecordsResponse.fromJson(response.data);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to fetch fuel records');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<FuelRecord> getFuelRecord(int id) async {
    try {
      final response = await _apiService.get('/driver/fuel/$id');

      if (response.statusCode == 200 && response.data['success'] == true) {
        return FuelRecord.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to fetch fuel record');
      }
    } catch (e) {
      rethrow;
    }
  }

  void setSyncService(SyncService syncService) {
    _syncService = syncService;
  }

  Future<FuelRecord> createFuelRecord({
    required String fuelDate,
    required double fuelQuantityLiters,
    required double fuelPricePerLiter,
    required double totalCost,
    required String fuelStation,
    required String fuelType,
    int? odometerReading,
    String? receiptNumber,
    String? notes,
    String? receiptImagePath, // Local file path for image
  }) async {
    final isConnected = _connectivityService.isConnected;

    // If offline or has image, queue for sync (file uploads need online)
    if (!isConnected || receiptImagePath != null) {
      await _queueFuelRecordCreate(
        fuelDate: fuelDate,
        fuelQuantityLiters: fuelQuantityLiters,
        fuelPricePerLiter: fuelPricePerLiter,
        totalCost: totalCost,
        fuelStation: fuelStation,
        fuelType: fuelType,
        odometerReading: odometerReading,
        receiptNumber: receiptNumber,
        notes: notes,
        receiptImagePath: receiptImagePath,
      );

      // Return a placeholder record for offline mode
      // The actual record will be created when synced
      throw Exception('Fuel record queued for offline sync');
    }

    try {
      final formData = {
        'fuel_date': fuelDate,
        'fuel_quantity_liters': fuelQuantityLiters,
        'fuel_price_per_liter': fuelPricePerLiter,
        'total_cost': totalCost,
        'fuel_station': fuelStation,
        'fuel_type': fuelType,
        if (odometerReading != null) 'odometer_reading': odometerReading,
        if (receiptNumber != null && receiptNumber.isNotEmpty) 'receipt_number': receiptNumber,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
      };

      final response = await _apiService.post(
        '/driver/fuel',
        data: formData,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        return FuelRecord.fromJson(response.data['data']);
      } else {
        throw Exception(response.data['message'] ?? 'Failed to create fuel record');
      }
    } catch (e) {
      // If online request fails, queue for offline sync
      await _queueFuelRecordCreate(
        fuelDate: fuelDate,
        fuelQuantityLiters: fuelQuantityLiters,
        fuelPricePerLiter: fuelPricePerLiter,
        totalCost: totalCost,
        fuelStation: fuelStation,
        fuelType: fuelType,
        odometerReading: odometerReading,
        receiptNumber: receiptNumber,
        notes: notes,
        receiptImagePath: receiptImagePath,
      );
      rethrow;
    }
  }

  Future<void> _queueFuelRecordCreate({
    required String fuelDate,
    required double fuelQuantityLiters,
    required double fuelPricePerLiter,
    required double totalCost,
    required String fuelStation,
    required String fuelType,
    int? odometerReading,
    String? receiptNumber,
    String? notes,
    String? receiptImagePath,
  }) async {
    final item = SyncQueueItem(
      id: 'fuel_${DateTime.now().millisecondsSinceEpoch}',
      type: SyncOperationType.fuelRecordCreate,
      data: {
        'fuelDate': fuelDate,
        'fuelQuantityLiters': fuelQuantityLiters,
        'fuelPricePerLiter': fuelPricePerLiter,
        'totalCost': totalCost,
        'fuelStation': fuelStation,
        'fuelType': fuelType,
        'odometerReading': odometerReading,
        'receiptNumber': receiptNumber,
        'notes': notes,
        'imagePath': receiptImagePath, // Note: File path storage would need special handling
      },
      createdAt: DateTime.now(),
    );

    await _offlineStorage.addToSyncQueue(item);

    // Try to sync if service is available and connected
    if (_syncService != null && _connectivityService.isConnected) {
      await _syncService!.queueSyncItem(item);
    }
  }
}


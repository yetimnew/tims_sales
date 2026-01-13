import 'dart:io';
import 'package:image_picker/image_picker.dart';
import '../config/app_config.dart';
import '../models/trip.dart';
import '../models/sync_queue_item.dart';
import 'api_service.dart';
import 'connectivity_service.dart';
import 'offline_storage_service.dart';
import 'sync_service.dart';

class TripService {
  final ApiService _apiService = ApiService();
  final ConnectivityService _connectivityService = ConnectivityService();
  final OfflineStorageService _offlineStorage = OfflineStorageService();
  SyncService? _syncService;

  Future<TripsResponse> getTrips() async {
    try {
      final response = await _apiService.get(AppConfig.tripsEndpoint);
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return TripsResponse(
          current: data['current'] != null
              ? Trip.fromJson(data['current'] as Map<String, dynamic>)
              : null,
          upcoming: (data['upcoming'] as List?)
                  ?.map((item) => Trip.fromJson(item as Map<String, dynamic>))
                  .toList() ??
              [],
        );
      }
      return TripsResponse(current: null, upcoming: []);
    } catch (e) {
      return TripsResponse(current: null, upcoming: []);
    }
  }

  Future<Trip?> getTripDetails(int tripId) async {
    try {
      final response = await _apiService.get('${AppConfig.tripsEndpoint}/$tripId');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as Map<String, dynamic>;
        return Trip.fromJson(data);
      }
      return null;
    } catch (e) {
      return null;
    }
  }

  void setSyncService(SyncService syncService) {
    _syncService = syncService;
  }

  Future<Trip?> updateTripStatus(int tripId, String status, {String? comment}) async {
    // Check if we're online
    final isConnected = _connectivityService.isConnected;

    if (isConnected) {
      try {
        final response = await _apiService.post(
          '${AppConfig.tripsEndpoint}/$tripId/update',
          data: {
            'status': status,
            'comment': comment,
          },
        );

        if (response.statusCode == 200 && response.data['success'] == true) {
          final data = response.data['data'] as Map<String, dynamic>;
          return Trip.fromJson(data);
        }
        return null;
      } catch (e) {
        // If online request fails, queue for offline sync
        await _queueTripStatusUpdate(tripId, status, comment);
        return null;
      }
    } else {
      // Queue for offline sync
      await _queueTripStatusUpdate(tripId, status, comment);
      return null;
    }
  }

  Future<void> _queueTripStatusUpdate(int tripId, String status, String? comment) async {
    final item = SyncQueueItem(
      id: 'trip_${tripId}_${DateTime.now().millisecondsSinceEpoch}',
      type: SyncOperationType.tripStatusUpdate,
      data: {
        'tripId': tripId,
        'status': status,
        'comment': comment,
      },
      createdAt: DateTime.now(),
    );

    await _offlineStorage.addToSyncQueue(item);

    // Try to sync if service is available
    if (_syncService != null && _connectivityService.isConnected) {
      await _syncService!.queueSyncItem(item);
    }
  }

  Future<Map<String, dynamic>> uploadTripDocument({
    required int tripId,
    required XFile image,
    String? type,
    String? description,
  }) async {
    try {
      final additionalData = <String, dynamic>{};
      if (type != null) additionalData['type'] = type;
      if (description != null) additionalData['description'] = description;

      final response = await _apiService.uploadFile(
        '${AppConfig.tripsEndpoint}/$tripId/documents',
        image,
        'image',
        additionalData: additionalData.isNotEmpty ? additionalData : null,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        return {
          'success': true,
          'data': response.data['data'],
          'message': response.data['message'] ?? 'Document uploaded successfully',
        };
      } else {
        throw Exception(response.data['message'] ?? 'Failed to upload document');
      }
    } catch (e) {
      return {
        'success': false,
        'error': e.toString().replaceAll('Exception: ', ''),
      };
    }
  }

  Future<List<Map<String, dynamic>>> getTripDocuments(int tripId) async {
    try {
      final response = await _apiService.get('${AppConfig.tripsEndpoint}/$tripId/documents');
      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'] as List<dynamic>?;
        return data?.map((item) => item as Map<String, dynamic>).toList() ?? [];
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}

class TripsResponse {
  final Trip? current;
  final List<Trip> upcoming;

  TripsResponse({
    this.current,
    required this.upcoming,
  });
}


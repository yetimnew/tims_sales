enum SyncOperationType {
  tripStatusUpdate,
  fuelRecordCreate,
  locationSend,
  emergencyAlert,
  tripDocumentUpload,
  statusUpdate,
}

enum SyncStatus {
  pending,
  syncing,
  synced,
  failed,
}

class SyncQueueItem {
  final String id;
  final SyncOperationType type;
  final Map<String, dynamic> data;
  final SyncStatus status;
  final DateTime createdAt;
  final DateTime? syncedAt;
  final int retryCount;
  final String? errorMessage;
  final String? serverId; // ID returned from server after sync

  SyncQueueItem({
    required this.id,
    required this.type,
    required this.data,
    this.status = SyncStatus.pending,
    required this.createdAt,
    this.syncedAt,
    this.retryCount = 0,
    this.errorMessage,
    this.serverId,
  });

  factory SyncQueueItem.fromJson(Map<String, dynamic> json) {
    return SyncQueueItem(
      id: json['id'] as String,
      type: SyncOperationType.values.firstWhere(
        (e) => e.toString() == json['type'],
        orElse: () => SyncOperationType.statusUpdate,
      ),
      data: json['data'] as Map<String, dynamic>,
      status: SyncStatus.values.firstWhere(
        (e) => e.toString() == json['status'],
        orElse: () => SyncStatus.pending,
      ),
      createdAt: DateTime.parse(json['createdAt'] as String),
      syncedAt: json['syncedAt'] != null ? DateTime.parse(json['syncedAt'] as String) : null,
      retryCount: json['retryCount'] as int? ?? 0,
      errorMessage: json['errorMessage'] as String?,
      serverId: json['serverId'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type.toString(),
      'data': data,
      'status': status.toString(),
      'createdAt': createdAt.toIso8601String(),
      'syncedAt': syncedAt?.toIso8601String(),
      'retryCount': retryCount,
      'errorMessage': errorMessage,
      'serverId': serverId,
    };
  }

  SyncQueueItem copyWith({
    String? id,
    SyncOperationType? type,
    Map<String, dynamic>? data,
    SyncStatus? status,
    DateTime? createdAt,
    DateTime? syncedAt,
    int? retryCount,
    String? errorMessage,
    String? serverId,
  }) {
    return SyncQueueItem(
      id: id ?? this.id,
      type: type ?? this.type,
      data: data ?? this.data,
      status: status ?? this.status,
      createdAt: createdAt ?? this.createdAt,
      syncedAt: syncedAt ?? this.syncedAt,
      retryCount: retryCount ?? this.retryCount,
      errorMessage: errorMessage ?? this.errorMessage,
      serverId: serverId ?? this.serverId,
    );
  }
}


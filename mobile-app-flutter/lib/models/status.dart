class DriverStatus {
  final int? id;
  final String statusType; // 'work', 'truck', 'trip'
  final String statusValue; // e.g., 'available', 'on_trip', 'on_break', 'off_duty'
  final String? notes;
  final String createdAt;
  final StatusLocationSnapshot? location;

  DriverStatus({
    this.id,
    required this.statusType,
    required this.statusValue,
    this.notes,
    required this.createdAt,
    this.location,
  });

  factory DriverStatus.fromJson(Map<String, dynamic> json) {
    return DriverStatus(
      id: _asInt(json['id']),
      statusType: json['status_type'] as String,
      statusValue: json['status_value'] as String,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String,
      location: json['location'] is Map<String, dynamic>
          ? StatusLocationSnapshot.fromJson(json['location'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'status_type': statusType,
      'status_value': statusValue,
      if (notes != null) 'notes': notes,
      'created_at': createdAt,
      if (location != null) 'location': location!.toJson(),
    };
  }
}

class StatusLocationSnapshot {
  final double latitude;
  final double longitude;
  final double? accuracy;
  final double? speed;
  final double? heading;
  final String? timestamp;

  StatusLocationSnapshot({
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    this.timestamp,
  });

  factory StatusLocationSnapshot.fromJson(Map<String, dynamic> json) {
    return StatusLocationSnapshot(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: (json['accuracy'] as num?)?.toDouble(),
      speed: (json['speed'] as num?)?.toDouble(),
      heading: (json['heading'] as num?)?.toDouble(),
      timestamp: json['timestamp'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'latitude': latitude,
      'longitude': longitude,
      if (accuracy != null) 'accuracy': accuracy,
      if (speed != null) 'speed': speed,
      if (heading != null) 'heading': heading,
      if (timestamp != null) 'timestamp': timestamp,
    };
  }
}

class StatusOption {
  final int? id;
  final String value;
  final String label;
  final String? description;

  StatusOption({
    this.id,
    required this.value,
    required this.label,
    this.description,
  });

  factory StatusOption.fromJson(Map<String, dynamic> json) {
    return StatusOption(
      id: _asInt(json['id']),
      value: json['value'] as String,
      label: json['label'] as String,
      description: json['description'] as String?,
    );
  }
}

int? _asInt(dynamic value) {
  if (value == null) {
    return null;
  }

  if (value is int) {
    return value;
  }

  if (value is num) {
    return value.toInt();
  }

  if (value is String) {
    return int.tryParse(value);
  }

  return null;
}

// Work status values for drivers
enum WorkStatus {
  available('available', 'Available'),
  onTrip('on_trip', 'On Trip'),
  onBreak('on_break', 'On Break'),
  offDuty('off_duty', 'Off Duty');

  final String value;
  final String label;

  const WorkStatus(this.value, this.label);

  static WorkStatus? fromString(String? value) {
    if (value == null) return null;

    final normalized = switch (value.toLowerCase()) {
      'active' => 'available',
      'inactive' => 'off_duty',
      _ => value.toLowerCase(),
    };

    try {
      return WorkStatus.values.firstWhere(
        (status) => status.value == normalized,
      );
    } catch (e) {
      return null;
    }
  }
}


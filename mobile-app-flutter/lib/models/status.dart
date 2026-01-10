class DriverStatus {
  final int? id;
  final String statusType; // 'work', 'truck', 'trip'
  final String statusValue; // e.g., 'available', 'on_trip', 'on_break', 'off_duty'
  final String? notes;
  final String createdAt;

  DriverStatus({
    this.id,
    required this.statusType,
    required this.statusValue,
    this.notes,
    required this.createdAt,
  });

  factory DriverStatus.fromJson(Map<String, dynamic> json) {
    return DriverStatus(
      id: json['id'] as int?,
      statusType: json['status_type'] as String,
      statusValue: json['status_value'] as String,
      notes: json['notes'] as String?,
      createdAt: json['created_at'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      if (id != null) 'id': id,
      'status_type': statusType,
      'status_value': statusValue,
      if (notes != null) 'notes': notes,
      'created_at': createdAt,
    };
  }
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
    try {
      return WorkStatus.values.firstWhere(
        (status) => status.value == value.toLowerCase(),
      );
    } catch (e) {
      return null;
    }
  }
}


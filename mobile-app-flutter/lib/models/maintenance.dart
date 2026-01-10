class MaintenanceRecord {
  final int id;
  final String status; // 'scheduled', 'in_progress', 'completed', 'overdue'
  final DateTime? scheduledDate;
  final DateTime? completedDate;
  final MaintenanceType? maintenanceType;
  final bool isOverdue;
  final int? daysUntilScheduled;
  
  // Detailed fields (only when detailed=true)
  final int? odometerReading;
  final double? cost;
  final String? description;
  final String? workPerformed;
  final String? partsReplaced;
  final String? serviceProvider;

  MaintenanceRecord({
    required this.id,
    required this.status,
    this.scheduledDate,
    this.completedDate,
    this.maintenanceType,
    required this.isOverdue,
    this.daysUntilScheduled,
    this.odometerReading,
    this.cost,
    this.description,
    this.workPerformed,
    this.partsReplaced,
    this.serviceProvider,
  });

  factory MaintenanceRecord.fromJson(Map<String, dynamic> json) {
    return MaintenanceRecord(
      id: json['id'] as int,
      status: json['status'] as String? ?? 'scheduled',
      scheduledDate: json['scheduled_date'] != null
          ? DateTime.parse(json['scheduled_date'])
          : null,
      completedDate: json['completed_date'] != null
          ? DateTime.parse(json['completed_date'])
          : null,
      maintenanceType: json['maintenance_type'] != null
          ? MaintenanceType.fromJson(json['maintenance_type'] as Map<String, dynamic>)
          : null,
      isOverdue: json['is_overdue'] as bool? ?? false,
      daysUntilScheduled: json['days_until_scheduled'] != null
          ? json['days_until_scheduled'] as int
          : null,
      odometerReading: json['odometer_reading'] != null
          ? json['odometer_reading'] as int
          : null,
      cost: json['cost'] != null ? (json['cost'] as num).toDouble() : null,
      description: json['description'] as String?,
      workPerformed: json['work_performed'] as String?,
      partsReplaced: json['parts_replaced'] as String?,
      serviceProvider: json['service_provider'] as String?,
    );
  }

  String get statusLabel {
    switch (status.toLowerCase()) {
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  }

  String get urgencyText {
    if (isOverdue) {
      return 'Overdue';
    } else if (daysUntilScheduled != null && daysUntilScheduled! <= 7) {
      return 'Due Soon';
    } else if (daysUntilScheduled != null && daysUntilScheduled! <= 30) {
      return 'Upcoming';
    }
    return 'Scheduled';
  }

  bool get isUrgent => isOverdue || (daysUntilScheduled != null && daysUntilScheduled! <= 7);
}

class MaintenanceType {
  final int id;
  final String name;

  MaintenanceType({required this.id, required this.name});

  factory MaintenanceType.fromJson(Map<String, dynamic> json) {
    return MaintenanceType(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class MaintenanceResponse {
  final List<MaintenanceRecord> upcoming;
  final List<MaintenanceRecord> overdue;
  final List<MaintenanceRecord> recent;

  MaintenanceResponse({
    required this.upcoming,
    required this.overdue,
    required this.recent,
  });

  factory MaintenanceResponse.fromJson(Map<String, dynamic> json) {
    return MaintenanceResponse(
      upcoming: (json['upcoming'] as List?)
              ?.map((item) => MaintenanceRecord.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      overdue: (json['overdue'] as List?)
              ?.map((item) => MaintenanceRecord.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
      recent: (json['recent'] as List?)
              ?.map((item) => MaintenanceRecord.fromJson(item as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }

  int get totalAlerts => overdue.length + upcoming.length;
  bool get hasAlerts => totalAlerts > 0;
}


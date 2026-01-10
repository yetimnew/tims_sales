class Truck {
  final int id;
  final String plate;
  final String? chasisNumber;
  final String? engineNumber;
  final String? tyreSize;
  final int? serviceIntervalKM;
  final double? purchasePrice;
  final DateTime? productionDate;
  final DateTime? serviceStartDate;
  final String status;
  final VehicleType? vehicleType;

  Truck({
    required this.id,
    required this.plate,
    this.chasisNumber,
    this.engineNumber,
    this.tyreSize,
    this.serviceIntervalKM,
    this.purchasePrice,
    this.productionDate,
    this.serviceStartDate,
    required this.status,
    this.vehicleType,
  });

  factory Truck.fromJson(Map<String, dynamic> json) {
    return Truck(
      id: json['id'] as int,
      plate: json['plate'] as String,
      chasisNumber: json['chasis_number'] as String?,
      engineNumber: json['engine_number'] as String?,
      tyreSize: json['tyre_syze'] as String? ?? json['tyre_size'] as String?,
      serviceIntervalKM: json['service_interval_km'] as int? ?? json['serviceIntervalKM'] as int?,
      purchasePrice: json['purchase_price'] != null
          ? (json['purchase_price'] as num).toDouble()
          : json['purchasePrice'] != null
              ? (json['purchasePrice'] as num).toDouble()
              : null,
      productionDate: json['production_date'] != null
          ? DateTime.parse(json['production_date'])
          : null,
      serviceStartDate: json['service_start_date'] != null
          ? DateTime.parse(json['service_start_date'])
          : null,
      status: json['status'] as String? ?? 'active',
      vehicleType: json['vehicle_type'] != null
          ? VehicleType.fromJson(json['vehicle_type'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plate': plate,
      if (chasisNumber != null) 'chasis_number': chasisNumber,
      if (engineNumber != null) 'engine_number': engineNumber,
      if (tyreSize != null) 'tyre_size': tyreSize,
      if (serviceIntervalKM != null) 'service_interval_km': serviceIntervalKM,
      if (purchasePrice != null) 'purchase_price': purchasePrice,
      if (productionDate != null) 'production_date': productionDate!.toIso8601String(),
      if (serviceStartDate != null) 'service_start_date': serviceStartDate!.toIso8601String(),
      'status': status,
      if (vehicleType != null) 'vehicle_type': vehicleType!.toJson(),
    };
  }
}

class VehicleType {
  final int id;
  final String name;

  VehicleType({required this.id, required this.name});

  factory VehicleType.fromJson(Map<String, dynamic> json) {
    return VehicleType(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
    };
  }
}

class TruckAssignment {
  final int id;
  final String? dateReceived;
  final String? dateDetach;
  final bool isAttached;
  final String status;

  TruckAssignment({
    required this.id,
    this.dateReceived,
    this.dateDetach,
    required this.isAttached,
    required this.status,
  });

  factory TruckAssignment.fromJson(Map<String, dynamic> json) {
    return TruckAssignment(
      id: json['id'] as int,
      dateReceived: json['date_recived'] as String?,
      dateDetach: json['date_detach'] as String?,
      isAttached: json['is_attached'] as bool? ?? false,
      status: json['status'] as String? ?? 'active',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      if (dateReceived != null) 'date_recived': dateReceived,
      if (dateDetach != null) 'date_detach': dateDetach,
      'is_attached': isAttached,
      'status': status,
    };
  }
}

class LastTruckAssignment {
  final int id;
  final Truck truck;
  final String? dateReceived;
  final String? dateDetach;
  final String? reason;
  final bool isAttached;
  final String status;

  LastTruckAssignment({
    required this.id,
    required this.truck,
    this.dateReceived,
    this.dateDetach,
    this.reason,
    required this.isAttached,
    required this.status,
  });

  factory LastTruckAssignment.fromJson(Map<String, dynamic> json) {
    return LastTruckAssignment(
      id: json['id'] as int,
      truck: Truck.fromJson(json['truck'] as Map<String, dynamic>),
      dateReceived: json['date_recived'] as String?,
      dateDetach: json['date_detach'] as String?,
      reason: json['reason'] as String?,
      isAttached: json['is_attached'] as bool? ?? false,
      status: json['status'] as String? ?? 'inactive',
    );
  }
}

// Truck Assignment Response Model - matches the API response structure
class TruckAssignmentResponse {
  final String status; // 'assigned', 'no_driver', 'no_assignment', 'assignment_removed'
  final Truck? truck;
  final TruckAssignment? assignment;
  final LastTruckAssignment? lastAssignment;
  final DriverInfo? driver;
  final String? message;

  TruckAssignmentResponse({
    required this.status,
    this.truck,
    this.assignment,
    this.lastAssignment,
    this.driver,
    this.message,
  });

  factory TruckAssignmentResponse.fromJson(Map<String, dynamic> json) {
    final data = json['data'] as Map<String, dynamic>?;
    final status = json['status'] as String? ?? 'no_assignment';

    if (data == null) {
      return TruckAssignmentResponse(
        status: status,
        message: json['message'] as String?,
      );
    }

    return TruckAssignmentResponse(
      status: status,
      truck: data['truck'] != null
          ? Truck.fromJson(data['truck'] as Map<String, dynamic>)
          : null,
      assignment: data['assignment'] != null
          ? TruckAssignment.fromJson(data['assignment'] as Map<String, dynamic>)
          : null,
      lastAssignment: data['last_assignment'] != null
          ? LastTruckAssignment.fromJson(data['last_assignment'] as Map<String, dynamic>)
          : null,
      driver: data['driver'] != null
          ? DriverInfo.fromJson(data['driver'] as Map<String, dynamic>)
          : null,
      message: json['message'] as String?,
    );
  }

  bool get hasActiveAssignment => status == 'assigned' && truck != null && assignment != null;
  bool get isNoDriver => status == 'no_driver';
  bool get isNoAssignment => status == 'no_assignment';
  bool get isAssignmentRemoved => status == 'assignment_removed';
}

class DriverInfo {
  final int id;
  final String? driverid;
  final String name;

  DriverInfo({
    required this.id,
    this.driverid,
    required this.name,
  });

  factory DriverInfo.fromJson(Map<String, dynamic> json) {
    return DriverInfo(
      id: json['id'] as int,
      driverid: json['driverid'] as String?,
      name: json['name'] as String,
    );
  }
}

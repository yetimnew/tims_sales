class Trip {
  final int id;
  final String? foNumber;
  final String? loadPhase;
  final String? loadCompletion;
  final String status; // 'active', 'open', 'completed', 'cancelled'
  final bool isReturned;
  final DateTime? dispatchDate;
  final DateTime? returnedDate;
  final Location? origin;
  final Location? destination;
  final double? distanceWithCargo;
  final double? distanceWithoutCargo;
  final double? cargoVolumeMt;
  final double? cargoWeightKg;
  final double? cargoVolumeCubicMeters;
  final double? fuelLiters;
  final double? fuelBirr;
  final String? comment;
  final CargoType? cargoType;
  final Operation? operation;

  Trip({
    required this.id,
    this.foNumber,
    this.loadPhase,
    this.loadCompletion,
    required this.status,
    required this.isReturned,
    this.dispatchDate,
    this.returnedDate,
    this.origin,
    this.destination,
    this.distanceWithCargo,
    this.distanceWithoutCargo,
    this.cargoVolumeMt,
    this.cargoWeightKg,
    this.cargoVolumeCubicMeters,
    this.fuelLiters,
    this.fuelBirr,
    this.comment,
    this.cargoType,
    this.operation,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'] as int,
      foNumber: json['FOnumber'] as String?,
      loadPhase: json['load_phase'] as String?,
      loadCompletion: json['load_completion'] as String?,
      status: json['status'] as String? ?? 'open',
      isReturned: json['is_returned'] as bool? ?? false,
      dispatchDate: json['dispatch_date'] != null
          ? DateTime.parse(json['dispatch_date'])
          : null,
      returnedDate: json['returned_date'] != null
          ? DateTime.parse(json['returned_date'])
          : null,
      origin: json['origin'] != null
          ? Location.fromJson(json['origin'] as Map<String, dynamic>)
          : null,
      destination: json['destination'] != null
          ? Location.fromJson(json['destination'] as Map<String, dynamic>)
          : null,
      distanceWithCargo: json['distance_with_cargo'] != null
          ? (json['distance_with_cargo'] as num).toDouble()
          : null,
      distanceWithoutCargo: json['distance_without_cargo'] != null
          ? (json['distance_without_cargo'] as num).toDouble()
          : null,
      cargoVolumeMt: json['cargo_volume_mt'] != null
          ? (json['cargo_volume_mt'] as num).toDouble()
          : null,
      cargoWeightKg: json['cargo_weight_kg'] != null
          ? (json['cargo_weight_kg'] as num).toDouble()
          : null,
      cargoVolumeCubicMeters: json['cargo_volume_cubic_meters'] != null
          ? (json['cargo_volume_cubic_meters'] as num).toDouble()
          : null,
      fuelLiters: json['fuel_liters'] != null
          ? (json['fuel_liters'] as num).toDouble()
          : null,
      fuelBirr: json['fuel_birr'] != null
          ? (json['fuel_birr'] as num).toDouble()
          : null,
      comment: json['comment'] as String?,
      cargoType: json['cargo_type'] != null
          ? CargoType.fromJson(json['cargo_type'] as Map<String, dynamic>)
          : null,
      operation: json['operation'] != null
          ? Operation.fromJson(json['operation'] as Map<String, dynamic>)
          : null,
    );
  }

  String get statusLabel {
    switch (status.toLowerCase()) {
      case 'active':
        return 'Active';
      case 'open':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  }

  double? get totalDistance {
    if (distanceWithCargo != null && distanceWithoutCargo != null) {
      return distanceWithCargo! + distanceWithoutCargo!;
    }
    return distanceWithCargo ?? distanceWithoutCargo;
  }
}

class Location {
  final int id;
  final String name;

  Location({required this.id, required this.name});

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class CargoType {
  final int id;
  final String name;

  CargoType({required this.id, required this.name});

  factory CargoType.fromJson(Map<String, dynamic> json) {
    return CargoType(
      id: json['id'] as int,
      name: json['name'] as String,
    );
  }
}

class Operation {
  final int id;
  final String? operationid;
  final String? name; // Will be set from operationid if name is not provided

  Operation({required this.id, this.operationid, this.name});

  factory Operation.fromJson(Map<String, dynamic> json) {
    return Operation(
      id: json['id'] as int,
      operationid: json['operationid'] as String?,
      name: json['name'] as String? ?? json['operationid'] as String?, // Fallback to operationid
    );
  }

  String get displayName => name ?? operationid ?? 'Operation #$id';
}

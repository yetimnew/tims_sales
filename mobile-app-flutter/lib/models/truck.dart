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
  final TruckAssignment? assignment;

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
    this.assignment,
  });

  factory Truck.fromJson(Map<String, dynamic> json) {
    return Truck(
      id: json['id'] as int,
      plate: json['plate'] as String,
      chasisNumber: json['chasisNumber'] as String?,
      engineNumber: json['engineNumber'] as String?,
      tyreSize: json['tyreSyze'] as String?,
      serviceIntervalKM: json['serviceIntervalKM'] as int?,
      purchasePrice: json['purchasePrice'] != null
          ? (json['purchasePrice'] as num).toDouble()
          : null,
      productionDate: json['productionDate'] != null
          ? DateTime.parse(json['productionDate'])
          : null,
      serviceStartDate: json['serviceStartDate'] != null
          ? DateTime.parse(json['serviceStartDate'])
          : null,
      status: json['status'] as String,
      vehicleType: json['vehicleType'] != null
          ? VehicleType.fromJson(json['vehicleType'])
          : null,
      assignment: json['assignment'] != null
          ? TruckAssignment.fromJson(json['assignment'])
          : null,
    );
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
}

class TruckAssignment {
  final int id;
  final DateTime? assignedDate;
  final DateTime? dateReceived;

  TruckAssignment({
    required this.id,
    this.assignedDate,
    this.dateReceived,
  });

  factory TruckAssignment.fromJson(Map<String, dynamic> json) {
    return TruckAssignment(
      id: json['id'] as int,
      assignedDate: json['assigned_date'] != null
          ? DateTime.parse(json['assigned_date'])
          : null,
      dateReceived: json['date_recived'] != null
          ? DateTime.parse(json['date_recived'])
          : null,
    );
  }
}


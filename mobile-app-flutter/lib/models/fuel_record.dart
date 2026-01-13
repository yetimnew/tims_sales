class FuelRecord {
  final int id;
  final String fuelDate;
  final double fuelQuantityLiters;
  final double fuelPricePerLiter;
  final double totalCost;
  final String fuelStation;
  final String fuelType; // diesel, petrol, gas
  final int? odometerReading;
  final String? receiptNumber;
  final String? notes;
  final String? receiptImage;
  final TruckInfo? truck;
  final String createdAt;
  final String updatedAt;

  FuelRecord({
    required this.id,
    required this.fuelDate,
    required this.fuelQuantityLiters,
    required this.fuelPricePerLiter,
    required this.totalCost,
    required this.fuelStation,
    required this.fuelType,
    this.odometerReading,
    this.receiptNumber,
    this.notes,
    this.receiptImage,
    this.truck,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FuelRecord.fromJson(Map<String, dynamic> json) {
    return FuelRecord(
      id: json['id'] as int,
      fuelDate: json['fuel_date'] as String,
      fuelQuantityLiters: (json['fuel_quantity_liters'] as num).toDouble(),
      fuelPricePerLiter: (json['fuel_price_per_liter'] as num).toDouble(),
      totalCost: (json['total_cost'] as num).toDouble(),
      fuelStation: json['fuel_station'] as String,
      fuelType: json['fuel_type'] as String,
      odometerReading: json['odometer_reading'] as int?,
      receiptNumber: json['receipt_number'] as String?,
      notes: json['notes'] as String?,
      receiptImage: json['receipt_image'] as String?,
      truck: json['truck'] != null ? TruckInfo.fromJson(json['truck']) : null,
      createdAt: json['created_at'] as String,
      updatedAt: json['updated_at'] as String,
    );
  }

  String get fuelTypeLabel {
    switch (fuelType.toLowerCase()) {
      case 'diesel':
        return 'Diesel';
      case 'petrol':
        return 'Petrol';
      case 'gas':
        return 'Gas';
      default:
        return fuelType;
    }
  }
}

class TruckInfo {
  final int id;
  final String plate;

  TruckInfo({
    required this.id,
    required this.plate,
  });

  factory TruckInfo.fromJson(Map<String, dynamic> json) {
    return TruckInfo(
      id: json['id'] as int,
      plate: json['plate'] as String,
    );
  }
}

class FuelRecordsResponse {
  final bool success;
  final List<FuelRecord> records;
  final int count;
  final String? message;

  FuelRecordsResponse({
    required this.success,
    required this.records,
    required this.count,
    this.message,
  });

  factory FuelRecordsResponse.fromJson(Map<String, dynamic> json) {
    return FuelRecordsResponse(
      success: json['success'] as bool,
      records: (json['data'] as List<dynamic>)
          .map((item) => FuelRecord.fromJson(item as Map<String, dynamic>))
          .toList(),
      count: json['count'] as int,
      message: json['message'] as String?,
    );
  }
}


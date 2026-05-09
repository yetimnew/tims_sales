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
  final double? latitude;
  final double? longitude;
  final double? locationAccuracyM;
  final String? locationTimestamp;
  final bool submittedViaMobile;
  final String? reviewedAt;
  final String? reviewNote;
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
    this.latitude,
    this.longitude,
    this.locationAccuracyM,
    this.locationTimestamp,
    this.submittedViaMobile = false,
    this.reviewedAt,
    this.reviewNote,
    required this.createdAt,
    required this.updatedAt,
  });

  factory FuelRecord.fromJson(Map<String, dynamic> json) {
    return FuelRecord(
      id: _asInt(json['id']) ?? 0,
      fuelDate: json['fuel_date'] as String,
      fuelQuantityLiters: (json['fuel_quantity_liters'] as num).toDouble(),
      fuelPricePerLiter: (json['fuel_price_per_liter'] as num).toDouble(),
      totalCost: (json['total_cost'] as num).toDouble(),
      fuelStation: json['fuel_station'] as String,
      fuelType: json['fuel_type'] as String,
      odometerReading: _asInt(json['odometer_reading']),
      receiptNumber: json['receipt_number'] as String?,
      notes: json['notes'] as String?,
      receiptImage: json['receipt_image'] as String?,
      truck: json['truck'] != null ? TruckInfo.fromJson(json['truck']) : null,
      latitude: json['latitude'] != null ? (json['latitude'] as num).toDouble() : null,
      longitude: json['longitude'] != null ? (json['longitude'] as num).toDouble() : null,
      locationAccuracyM: json['location_accuracy_m'] != null ? (json['location_accuracy_m'] as num).toDouble() : null,
      locationTimestamp: json['location_timestamp'] as String?,
      submittedViaMobile: json['submitted_via_mobile'] as bool? ?? false,
      reviewedAt: json['reviewed_at'] as String?,
      reviewNote: json['review_note'] as String?,
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
      id: _asInt(json['id']) ?? 0,
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
      count: _asInt(json['count']) ?? 0,
      message: json['message'] as String?,
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


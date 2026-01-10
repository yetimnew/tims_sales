class DriverPerformance {
  final PerformanceSummary summary;
  final PerformanceRecord? latestRecord;

  DriverPerformance({
    required this.summary,
    this.latestRecord,
  });

  factory DriverPerformance.fromJson(Map<String, dynamic> json) {
    return DriverPerformance(
      summary: PerformanceSummary.fromJson(json['summary'] as Map<String, dynamic>),
      latestRecord: json['latest_record'] != null
          ? PerformanceRecord.fromJson(json['latest_record'] as Map<String, dynamic>)
          : null,
    );
  }
}

class PerformanceSummary {
  final int totalRecords;
  final int totalTrips;
  final double totalDistanceKm;
  final double totalCargoTonnage;
  final double? avgFuelEfficiency;
  final double? avgCustomerRating;
  final int totalSafetyViolations;
  final int totalAccidents;

  PerformanceSummary({
    required this.totalRecords,
    required this.totalTrips,
    required this.totalDistanceKm,
    required this.totalCargoTonnage,
    this.avgFuelEfficiency,
    this.avgCustomerRating,
    required this.totalSafetyViolations,
    required this.totalAccidents,
  });

  factory PerformanceSummary.fromJson(Map<String, dynamic> json) {
    return PerformanceSummary(
      totalRecords: (json['total_records'] as num?)?.toInt() ?? 0,
      totalTrips: (json['total_trips'] as num?)?.toInt() ?? 0,
      totalDistanceKm: (json['total_distance_km'] as num?)?.toDouble() ?? 0.0,
      totalCargoTonnage: (json['total_cargo_tonnage'] as num?)?.toDouble() ?? 0.0,
      avgFuelEfficiency: json['avg_fuel_efficiency'] != null
          ? (json['avg_fuel_efficiency'] as num).toDouble()
          : null,
      avgCustomerRating: json['avg_customer_rating'] != null
          ? (json['avg_customer_rating'] as num).toDouble()
          : null,
      totalSafetyViolations: (json['total_safety_violations'] as num?)?.toInt() ?? 0,
      totalAccidents: (json['total_accidents'] as num?)?.toInt() ?? 0,
    );
  }
}

class PerformanceRecord {
  final int id;
  final DateTime recordDate;
  final String periodType; // 'daily', 'weekly', 'monthly'
  final int totalTrips;
  final double totalDistanceKm;
  final double totalCargoTonnage;
  final double? fuelEfficiency;
  final double? customerRating;
  final int safetyViolations;
  final int accidents;
  final String? performanceNotes;
  final double performanceScore;
  final String performanceGrade;
  final ScoreBreakdown? scoreBreakdown;
  final TruckInfo? truck;

  PerformanceRecord({
    required this.id,
    required this.recordDate,
    required this.periodType,
    required this.totalTrips,
    required this.totalDistanceKm,
    required this.totalCargoTonnage,
    this.fuelEfficiency,
    this.customerRating,
    required this.safetyViolations,
    required this.accidents,
    this.performanceNotes,
    required this.performanceScore,
    required this.performanceGrade,
    this.scoreBreakdown,
    this.truck,
  });

  factory PerformanceRecord.fromJson(Map<String, dynamic> json) {
    return PerformanceRecord(
      id: json['id'] as int,
      recordDate: DateTime.parse(json['record_date'] as String),
      periodType: json['period_type'] as String? ?? 'monthly',
      totalTrips: (json['total_trips'] as num?)?.toInt() ?? 0,
      totalDistanceKm: (json['total_distance_km'] as num?)?.toDouble() ?? 0.0,
      totalCargoTonnage: (json['total_cargo_tonnage'] as num?)?.toDouble() ?? 0.0,
      fuelEfficiency: json['fuel_efficiency'] != null
          ? (json['fuel_efficiency'] as num).toDouble()
          : null,
      customerRating: json['customer_rating'] != null
          ? (json['customer_rating'] as num).toDouble()
          : null,
      safetyViolations: (json['safety_violations'] as num?)?.toInt() ?? 0,
      accidents: (json['accidents'] as num?)?.toInt() ?? 0,
      performanceNotes: json['performance_notes'] as String?,
      performanceScore: (json['performance_score'] as num?)?.toDouble() ?? 0.0,
      performanceGrade: json['performance_grade'] as String? ?? 'N/A',
      scoreBreakdown: json['score_breakdown'] != null
          ? ScoreBreakdown.fromJson(json['score_breakdown'] as Map<String, dynamic>)
          : null,
      truck: json['truck'] != null
          ? TruckInfo.fromJson(json['truck'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ScoreBreakdown {
  final CategoryScore fuelEfficiency;
  final CategoryScore safety;
  final CategoryScore customerRating;
  final CategoryScore productivity;

  ScoreBreakdown({
    required this.fuelEfficiency,
    required this.safety,
    required this.customerRating,
    required this.productivity,
  });

  factory ScoreBreakdown.fromJson(Map<String, dynamic> json) {
    return ScoreBreakdown(
      fuelEfficiency: CategoryScore.fromJson(json['fuel_efficiency'] as Map<String, dynamic>),
      safety: CategoryScore.fromJson(json['safety'] as Map<String, dynamic>),
      customerRating: CategoryScore.fromJson(json['customer_rating'] as Map<String, dynamic>),
      productivity: CategoryScore.fromJson(json['productivity'] as Map<String, dynamic>),
    );
  }

  int get totalScore {
    return fuelEfficiency.score + safety.score + customerRating.score + productivity.score;
  }
}

class CategoryScore {
  final int score;
  final int max;
  final double points;

  CategoryScore({
    required this.score,
    required this.max,
    required this.points,
  });

  factory CategoryScore.fromJson(Map<String, dynamic> json) {
    return CategoryScore(
      score: (json['score'] as num?)?.toInt() ?? 0,
      max: (json['max'] as num?)?.toInt() ?? 0,
      points: (json['points'] as num?)?.toDouble() ?? 0.0,
    );
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


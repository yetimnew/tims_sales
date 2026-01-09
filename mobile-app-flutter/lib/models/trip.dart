class Trip {
  final int id;
  final String? foNumber;
  final String? loadPhase;
  final String? loadCompletion;
  final String status;
  final bool isReturned;
  final DateTime? dispatchDate;
  final DateTime? returnedDate;
  final Location? origin;
  final Location? destination;
  final double? distanceWithCargo;
  final double? distanceWithoutCargo;
  final double? cargoVolumeMt;
  final String? comment;

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
    this.comment,
  });

  factory Trip.fromJson(Map<String, dynamic> json) {
    return Trip(
      id: json['id'] as int,
      foNumber: json['FOnumber'] as String?,
      loadPhase: json['load_phase'] as String?,
      loadCompletion: json['load_completion'] as String?,
      status: json['status'] as String,
      isReturned: json['is_returned'] as bool? ?? false,
      dispatchDate: json['dispatch_date'] != null
          ? DateTime.parse(json['dispatch_date'])
          : null,
      returnedDate: json['returned_date'] != null
          ? DateTime.parse(json['returned_date'])
          : null,
      origin: json['origin'] != null
          ? Location.fromJson(json['origin'])
          : null,
      destination: json['destination'] != null
          ? Location.fromJson(json['destination'])
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
      comment: json['comment'] as String?,
    );
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


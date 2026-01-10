class DriverLocation {
  final int id;
  final double latitude;
  final double longitude;
  final double? accuracy;
  final double? speed; // in m/s
  final double? heading; // in degrees (0-360)
  final DateTime timestamp;

  DriverLocation({
    required this.id,
    required this.latitude,
    required this.longitude,
    this.accuracy,
    this.speed,
    this.heading,
    required this.timestamp,
  });

  factory DriverLocation.fromJson(Map<String, dynamic> json) {
    return DriverLocation(
      id: json['id'] as int,
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
      accuracy: json['accuracy'] != null ? (json['accuracy'] as num).toDouble() : null,
      speed: json['speed'] != null ? (json['speed'] as num).toDouble() : null,
      heading: json['heading'] != null ? (json['heading'] as num).toDouble() : null,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  /// Get speed in km/h
  double? get speedKmh => speed != null ? (speed! * 3.6) : null;

  /// Get formatted speed string
  String get speedFormatted {
    if (speedKmh == null) return 'N/A';
    return '${speedKmh!.toStringAsFixed(1)} km/h';
  }

  /// Get formatted heading string (cardinal direction)
  String get headingFormatted {
    if (heading == null) return 'N/A';
    final directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    final index = ((heading! + 22.5) / 45.0).floor() % 8;
    return '${directions[index]} (${heading!.toStringAsFixed(0)}°)';
  }

  /// Get formatted accuracy string
  String get accuracyFormatted {
    if (accuracy == null) return 'N/A';
    if (accuracy! < 1000) {
      return '${accuracy!.toStringAsFixed(0)} m';
    }
    return '${(accuracy! / 1000).toStringAsFixed(2)} km';
  }
}


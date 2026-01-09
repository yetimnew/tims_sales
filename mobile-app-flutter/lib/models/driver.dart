class Driver {
  final int id;
  final String driverid;
  final String name;
  final String? mobile;
  final String status;

  Driver({
    required this.id,
    required this.driverid,
    required this.name,
    this.mobile,
    required this.status,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as int,
      driverid: json['driverid'] as String,
      name: json['name'] as String,
      mobile: json['mobile'] as String?,
      status: json['status'] as String,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'driverid': driverid,
      'name': name,
      'mobile': mobile,
      'status': status,
    };
  }
}


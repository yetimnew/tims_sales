class Driver {
  final int id;
  final String name;
  final String email;
  final String? avatar; // Profile picture URL
  final String? driverid; // Optional - for driver-specific features
  final String? mobile; // Optional
  final String? status; // Optional
  final String? emailVerifiedAt; // Email verification timestamp
  final String? createdAt; // Account creation timestamp

  Driver({
    required this.id,
    required this.name,
    required this.email,
    this.avatar,
    this.driverid,
    this.mobile,
    this.status,
    this.emailVerifiedAt,
    this.createdAt,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as int,
      name: json['name'] as String,
      email: json['email'] as String,
      avatar: json['avatar'] as String?,
      driverid: json['driverid'] as String?,
      mobile: json['mobile'] as String?,
      status: json['status'] as String?,
      emailVerifiedAt: json['email_verified_at'] as String?,
      createdAt: json['created_at'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'email': email,
      if (avatar != null) 'avatar': avatar,
      if (driverid != null) 'driverid': driverid,
      if (mobile != null) 'mobile': mobile,
      if (status != null) 'status': status,
      if (emailVerifiedAt != null) 'email_verified_at': emailVerifiedAt,
      if (createdAt != null) 'created_at': createdAt,
    };
  }

  bool get isEmailVerified => emailVerifiedAt != null;
}


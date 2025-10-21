# Database Documentation - TIMS

This document provides comprehensive documentation for the TIMS database schema, relationships, and data management.

## 🗄️ Database Overview

### Technology Stack
- **MySQL 8.0+**: Primary database with full ACID compliance
- **Laravel Eloquent ORM**: Object-relational mapping
- **Laravel Migrations**: Database version control
- **Laravel Seeders**: Database seeding and testing data
- **Laravel Factories**: Model factories for testing

### Database Configuration
```env
# .env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=tims_database
DB_USERNAME=your_username
DB_PASSWORD=your_password
```

## 📊 Schema Overview

### Core Tables
The TIMS database consists of 34+ tables organized into logical groups:

#### Fleet Management
- `vehicletypes` - Vehicle type definitions
- `trucks` - Fleet vehicle information
- `drivers` - Driver profiles and information
- `driver_truck` - Driver-truck assignments (pivot table)

#### Operations Management
- `customers` - Client information
- `operations` - Transport operations
- `performances` - Trip performance records
- `cargo_types` - Cargo categorization

#### Maintenance & Service
- `maintenance_types` - Maintenance category definitions
- `vehicle_maintenance_records` - Maintenance history
- `fuel_records` - Fuel consumption tracking
- `insurance_records` - Insurance management

#### Performance & Analytics
- `driver_performance_records` - Driver performance metrics
- `driver_safety_records` - Safety incident tracking
- `fuel_consumption_analysis` - Fuel efficiency analysis
- `truck_financial_records` - Financial tracking

#### Geographic Management
- `regions` - Regional divisions
- `zones` - Zone subdivisions
- `woredas` - Woreda divisions
- `places` - Specific locations
- `distances` - Inter-location distances

#### User Management
- `users` - System users
- `roles` - User roles
- `permissions` - System permissions
- `model_has_permissions` - User-permission relationships
- `model_has_roles` - User-role relationships
- `role_has_permissions` - Role-permission relationships

#### System Tables
- `migrations` - Laravel migration tracking
- `activity_log` - Spatie activity logging
- `password_reset_tokens` - Password reset tokens
- `personal_access_tokens` - API tokens
- `sessions` - User sessions
- `cache` - Application cache
- `jobs` - Queue jobs
- `failed_jobs` - Failed queue jobs

## 🏗️ Table Structures

### Fleet Management Tables

#### `vehicletypes` Table
```sql
CREATE TABLE `vehicletypes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `vehicletypes_name_index` (`name`),
  KEY `vehicletypes_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `id` - Primary key
- `name` - Vehicle type name (e.g., "Heavy Truck", "Light Truck")
- `description` - Vehicle type description
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

#### `trucks` Table
```sql
CREATE TABLE `trucks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `plate` varchar(255) NOT NULL,
  `vehicletype_id` bigint unsigned NOT NULL,
  `chasisNumber` varchar(255) NOT NULL,
  `engineNumber` varchar(255) NOT NULL,
  `tyreSyze` varchar(255) NOT NULL,
  `serviceIntervalKM` int NOT NULL,
  `purchasePrice` decimal(15,2) NOT NULL,
  `productionDate` date NOT NULL,
  `serviceStartDate` date NOT NULL,
  `status` enum('active','inactive','maintenance','retired') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `trucks_plate_unique` (`plate`),
  UNIQUE KEY `trucks_chasisnumber_unique` (`chasisNumber`),
  UNIQUE KEY `trucks_enginenumber_unique` (`engineNumber`),
  KEY `trucks_vehicletype_id_foreign` (`vehicletype_id`),
  KEY `trucks_status_index` (`status`),
  KEY `trucks_deleted_at_index` (`deleted_at`),
  CONSTRAINT `trucks_vehicletype_id_foreign` FOREIGN KEY (`vehicletype_id`) REFERENCES `vehicletypes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `id` - Primary key
- `plate` - License plate number (Ethiopian format: AA1234BB)
- `vehicletype_id` - Foreign key to vehicletypes table
- `chasisNumber` - Chassis number (unique)
- `engineNumber` - Engine number (unique)
- `tyreSyze` - Tyre size specification
- `serviceIntervalKM` - Service interval in kilometers
- `purchasePrice` - Purchase price in ETB
- `productionDate` - Vehicle production date
- `serviceStartDate` - Service start date
- `status` - Truck status (active, inactive, maintenance, retired)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

#### `drivers` Table
```sql
CREATE TABLE `drivers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driverid` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `sex` enum('male','female') NOT NULL,
  `birthdate` date NOT NULL,
  `zone` varchar(255) NOT NULL,
  `woreda` varchar(255) NOT NULL,
  `kebele` varchar(255) NOT NULL,
  `housenumber` varchar(255) NOT NULL,
  `mobile` varchar(255) NOT NULL,
  `hireddate` date NOT NULL,
  `status` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `drivers_driverid_unique` (`driverid`),
  KEY `drivers_status_index` (`status`),
  KEY `drivers_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Fields:**
- `id` - Primary key
- `driverid` - Driver ID (unique)
- `name` - Driver full name
- `sex` - Driver gender (male, female)
- `birthdate` - Driver birth date
- `zone` - Driver zone
- `woreda` - Driver woreda
- `kebele` - Driver kebele
- `housenumber` - House number
- `mobile` - Mobile phone number
- `hireddate` - Hire date
- `status` - Driver status (active, inactive, suspended)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp
- `deleted_at` - Soft delete timestamp

#### `driver_truck` Table (Pivot)
```sql
CREATE TABLE `driver_truck` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `driver_id` bigint unsigned NOT NULL,
  `truck_id` bigint unsigned NOT NULL,
  `assigned_date` timestamp NOT NULL,
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `assigned_by` bigint unsigned NOT NULL,
  `unassigned_date` timestamp NULL DEFAULT NULL,
  `unassigned_by` bigint unsigned NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `driver_truck_driver_id_foreign` (`driver_id`),
  KEY `driver_truck_truck_id_foreign` (`truck_id`),
  KEY `driver_truck_assigned_by_foreign` (`assigned_by`),
  KEY `driver_truck_unassigned_by_foreign` (`unassigned_by`),
  KEY `driver_truck_status_index` (`status`),
  CONSTRAINT `driver_truck_driver_id_foreign` FOREIGN KEY (`driver_id`) REFERENCES `drivers` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_truck_truck_id_foreign` FOREIGN KEY (`truck_id`) REFERENCES `trucks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_truck_assigned_by_foreign` FOREIGN KEY (`assigned_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `driver_truck_unassigned_by_foreign` FOREIGN KEY (`unassigned_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Operations Management Tables

#### `customers` Table
```sql
CREATE TABLE `customers` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `contact_person` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(255) NOT NULL,
  `address` text NOT NULL,
  `city` varchar(255) NOT NULL,
  `country` varchar(255) NOT NULL DEFAULT 'Ethiopia',
  `status` enum('active','inactive') NOT NULL DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `customers_email_unique` (`email`),
  KEY `customers_status_index` (`status`),
  KEY `customers_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `operations` Table
```sql
CREATE TABLE `operations` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `operation` varchar(255) NOT NULL,
  `customer_id` bigint unsigned NOT NULL,
  `startdate` date NOT NULL,
  `enddate` date NOT NULL,
  `volume` decimal(10,2) NOT NULL,
  `km` int NOT NULL,
  `tariff` decimal(15,2) NOT NULL,
  `closed` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `operations_customer_id_foreign` (`customer_id`),
  KEY `operations_deleted_at_index` (`deleted_at`),
  CONSTRAINT `operations_customer_id_foreign` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `performances` Table
```sql
CREATE TABLE `performances` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `trip` int NOT NULL,
  `LoadType` enum('Full Load','Half Load','Empty') NOT NULL,
  `FOnumber` varchar(255) NOT NULL,
  `operation_id` bigint unsigned NOT NULL,
  `driver_truck_id` bigint unsigned NOT NULL,
  `DateDispach` timestamp NOT NULL,
  `orgion_id` bigint unsigned NOT NULL,
  `destination_id` bigint unsigned NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `DistanceWCargo` int NOT NULL,
  `tonkm` int NOT NULL,
  `DistanceWOCargo` int NOT NULL,
  `CargoVolumMT` decimal(10,2) NOT NULL,
  `fuelInLitter` decimal(10,2) NOT NULL,
  `fuelInBirr` decimal(15,2) NOT NULL,
  `perdiem` decimal(15,2) NOT NULL,
  `workOnGoing` tinyint(1) NOT NULL DEFAULT '0',
  `other` decimal(15,2) NOT NULL DEFAULT '0',
  `comment` text,
  `satus` enum('completed','ongoing','cancelled') NOT NULL DEFAULT 'ongoing',
  `is_returned` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `performances_operation_id_foreign` (`operation_id`),
  KEY `performances_driver_truck_id_foreign` (`driver_truck_id`),
  KEY `performances_orgion_id_foreign` (`orgion_id`),
  KEY `performances_destination_id_foreign` (`destination_id`),
  KEY `performances_user_id_foreign` (`user_id`),
  KEY `performances_deleted_at_index` (`deleted_at`),
  CONSTRAINT `performances_operation_id_foreign` FOREIGN KEY (`operation_id`) REFERENCES `operations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performances_driver_truck_id_foreign` FOREIGN KEY (`driver_truck_id`) REFERENCES `driver_truck` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performances_orgion_id_foreign` FOREIGN KEY (`orgion_id`) REFERENCES `places` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performances_destination_id_foreign` FOREIGN KEY (`destination_id`) REFERENCES `places` (`id`) ON DELETE CASCADE,
  CONSTRAINT `performances_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Geographic Management Tables

#### `regions` Table
```sql
CREATE TABLE `regions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `regions_code_unique` (`code`),
  KEY `regions_deleted_at_index` (`deleted_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `zones` Table
```sql
CREATE TABLE `zones` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `region_id` bigint unsigned NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `zones_code_unique` (`code`),
  KEY `zones_region_id_foreign` (`region_id`),
  KEY `zones_deleted_at_index` (`deleted_at`),
  CONSTRAINT `zones_region_id_foreign` FOREIGN KEY (`region_id`) REFERENCES `regions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `woredas` Table
```sql
CREATE TABLE `woredas` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `zone_id` bigint unsigned NOT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `woredas_code_unique` (`code`),
  KEY `woredas_zone_id_foreign` (`zone_id`),
  KEY `woredas_deleted_at_index` (`deleted_at`),
  CONSTRAINT `woredas_zone_id_foreign` FOREIGN KEY (`zone_id`) REFERENCES `zones` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `places` Table
```sql
CREATE TABLE `places` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `code` varchar(255) NOT NULL,
  `woreda_id` bigint unsigned NOT NULL,
  `latitude` decimal(10,8) DEFAULT NULL,
  `longitude` decimal(11,8) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `places_code_unique` (`code`),
  KEY `places_woreda_id_foreign` (`woreda_id`),
  KEY `places_deleted_at_index` (`deleted_at`),
  CONSTRAINT `places_woreda_id_foreign` FOREIGN KEY (`woreda_id`) REFERENCES `woredas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### User Management Tables

#### `users` Table
```sql
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `two_factor_secret` text,
  `two_factor_recovery_codes` text,
  `two_factor_confirmed_at` timestamp NULL DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `roles` Table
```sql
CREATE TABLE `roles` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### `permissions` Table
```sql
CREATE TABLE `permissions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `guard_name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_guard_name_unique` (`name`,`guard_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

## 🔗 Relationships

### Fleet Management Relationships

#### Truck Relationships
```php
// Truck belongs to VehicleType
public function vehicletype()
{
    return $this->belongsTo(VehicleType::class, 'vehicletype_id');
}

// Truck has many Performances
public function performances()
{
    return $this->hasMany(Performance::class);
}

// Truck has many Maintenance Records
public function maintenanceRecords()
{
    return $this->hasMany(VehicleMaintenanceRecord::class);
}

// Truck belongs to many Drivers (through pivot)
public function drivers()
{
    return $this->belongsToMany(Driver::class, 'driver_truck')
        ->withPivot(['assigned_date', 'status', 'assigned_by', 'unassigned_date', 'unassigned_by'])
        ->withTimestamps();
}
```

#### Driver Relationships
```php
// Driver belongs to many Trucks (through pivot)
public function trucks()
{
    return $this->belongsToMany(Truck::class, 'driver_truck')
        ->withPivot(['assigned_date', 'status', 'assigned_by', 'unassigned_date', 'unassigned_by'])
        ->withTimestamps();
}

// Driver has many Performances
public function performances()
{
    return $this->hasManyThrough(Performance::class, DriverTruck::class, 'driver_id', 'driver_truck_id');
}

// Driver has many Performance Records
public function performanceRecords()
{
    return $this->hasMany(DriverPerformanceRecord::class);
}

// Driver has many Safety Records
public function safetyRecords()
{
    return $this->hasMany(DriverSafetyRecord::class);
}
```

### Geographic Relationships

#### Region Relationships
```php
// Region has many Zones
public function zones()
{
    return $this->hasMany(Zone::class);
}

// Region has many Woredas (through zones)
public function woredas()
{
    return $this->hasManyThrough(Woreda::class, Zone::class);
}

// Region has many Places (through woredas)
public function places()
{
    return $this->hasManyThrough(Place::class, Woreda::class, 'zone_id', 'woreda_id');
}
```

#### Zone Relationships
```php
// Zone belongs to Region
public function region()
{
    return $this->belongsTo(Region::class);
}

// Zone has many Woredas
public function woredas()
{
    return $this->hasMany(Woreda::class);
}

// Zone has many Places (through woredas)
public function places()
{
    return $this->hasManyThrough(Place::class, Woreda::class);
}
```

#### Woreda Relationships
```php
// Woreda belongs to Zone
public function zone()
{
    return $this->belongsTo(Zone::class);
}

// Woreda has many Places
public function places()
{
    return $this->hasMany(Place::class);
}

// Woreda belongs to Region (through zone)
public function region()
{
    return $this->belongsTo(Region::class, 'zone_id');
}
```

#### Place Relationships
```php
// Place belongs to Woreda
public function woreda()
{
    return $this->belongsTo(Woreda::class);
}

// Place belongs to Zone (through woreda)
public function zone()
{
    return $this->belongsTo(Zone::class, 'woreda_id');
}

// Place belongs to Region (through zone)
public function region()
{
    return $this->belongsTo(Region::class, 'zone_id');
}

// Place has many Performances (as origin)
public function originPerformances()
{
    return $this->hasMany(Performance::class, 'orgion_id');
}

// Place has many Performances (as destination)
public function destinationPerformances()
{
    return $this->hasMany(Performance::class, 'destination_id');
}
```

### Operations Relationships

#### Operation Relationships
```php
// Operation belongs to Customer
public function customer()
{
    return $this->belongsTo(Customer::class);
}

// Operation has many Performances
public function performances()
{
    return $this->hasMany(Performance::class);
}
```

#### Performance Relationships
```php
// Performance belongs to Operation
public function operation()
{
    return $this->belongsTo(Operation::class);
}

// Performance belongs to DriverTruck (pivot)
public function driverTruck()
{
    return $this->belongsTo(DriverTruck::class);
}

// Performance belongs to Place (as origin)
public function origin()
{
    return $this->belongsTo(Place::class, 'orgion_id');
}

// Performance belongs to Place (as destination)
public function destination()
{
    return $this->belongsTo(Place::class, 'destination_id');
}

// Performance belongs to User
public function user()
{
    return $this->belongsTo(User::class);
}
```

## 📈 Indexes and Performance

### Primary Indexes
All tables have primary key indexes on `id` fields:

```sql
-- Primary key indexes
PRIMARY KEY (`id`)
```

### Foreign Key Indexes
All foreign key relationships have indexes for performance:

```sql
-- Foreign key indexes
KEY `trucks_vehicletype_id_foreign` (`vehicletype_id`)
KEY `performances_operation_id_foreign` (`operation_id`)
KEY `performances_driver_truck_id_foreign` (`driver_truck_id`)
KEY `zones_region_id_foreign` (`region_id`)
KEY `woredas_zone_id_foreign` (`woreda_id`)
KEY `places_woreda_id_foreign` (`woreda_id`)
```

### Unique Indexes
Unique constraints ensure data integrity:

```sql
-- Unique indexes
UNIQUE KEY `trucks_plate_unique` (`plate`)
UNIQUE KEY `trucks_chasisnumber_unique` (`chasisNumber`)
UNIQUE KEY `trucks_enginenumber_unique` (`engineNumber`)
UNIQUE KEY `drivers_driverid_unique` (`driverid`)
UNIQUE KEY `users_email_unique` (`email`)
UNIQUE KEY `regions_code_unique` (`code`)
UNIQUE KEY `zones_code_unique` (`code`)
UNIQUE KEY `woredas_code_unique` (`code`)
UNIQUE KEY `places_code_unique` (`code`)
```

### Status Indexes
Status fields are indexed for filtering:

```sql
-- Status indexes
KEY `trucks_status_index` (`status`)
KEY `drivers_status_index` (`status`)
KEY `driver_truck_status_index` (`status`)
KEY `customers_status_index` (`status`)
```

### Soft Delete Indexes
Soft delete fields are indexed for efficient queries:

```sql
-- Soft delete indexes
KEY `trucks_deleted_at_index` (`deleted_at`)
KEY `drivers_deleted_at_index` (`deleted_at`)
KEY `customers_deleted_at_index` (`deleted_at`)
KEY `regions_deleted_at_index` (`deleted_at`)
KEY `zones_deleted_at_index` (`deleted_at`)
KEY `woredas_deleted_at_index` (`deleted_at`)
KEY `places_deleted_at_index` (`deleted_at`)
```

### Search Indexes
Searchable fields are indexed for performance:

```sql
-- Search indexes
KEY `vehicletypes_name_index` (`name`)
KEY `trucks_plate_index` (`plate`)
KEY `drivers_name_index` (`name`)
KEY `customers_name_index` (`name`)
```

## 🔄 Migrations

### Migration Structure
All migrations follow Laravel conventions:

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('trucks', function (Blueprint $table) {
            $table->id();
            $table->string('plate')->unique();
            $table->foreignId('vehicletype_id')->constrained()->onDelete('cascade');
            $table->string('chasisNumber')->unique();
            $table->string('engineNumber')->unique();
            $table->string('tyreSyze');
            $table->integer('serviceIntervalKM');
            $table->decimal('purchasePrice', 15, 2);
            $table->date('productionDate');
            $table->date('serviceStartDate');
            $table->enum('status', ['active', 'inactive', 'maintenance', 'retired'])->default('active');
            $table->timestamps();
            $table->softDeletes();
            
            // Indexes
            $table->index('status');
            $table->index('deleted_at');
        });
    }

    public function down()
    {
        Schema::dropIfExists('trucks');
    }
};
```

### Migration Naming Convention
Migrations follow Laravel naming conventions:

```
2025_01_01_000001_create_users_table.php
2025_01_01_000002_create_vehicletypes_table.php
2025_01_01_000003_create_trucks_table.php
2025_01_01_000004_create_drivers_table.php
2025_01_01_000005_create_driver_truck_table.php
2025_01_01_000006_create_customers_table.php
2025_01_01_000007_create_operations_table.php
2025_01_01_000008_create_performances_table.php
2025_01_01_000009_create_regions_table.php
2025_01_01_000010_create_zones_table.php
2025_01_01_000011_create_woredas_table.php
2025_01_01_000012_create_places_table.php
2025_01_01_000013_create_distances_table.php
2025_01_01_000014_create_maintenance_types_table.php
2025_01_01_000015_create_vehicle_maintenance_records_table.php
2025_01_01_000016_create_fuel_records_table.php
2025_01_01_000017_create_fuel_consumption_analysis_table.php
2025_01_01_000018_create_driver_performance_records_table.php
2025_01_01_000019_create_driver_safety_records_table.php
2025_01_01_000020_create_cargo_types_table.php
2025_01_01_000021_create_truck_financial_records_table.php
2025_01_01_000022_create_insurance_records_table.php
2025_01_01_000023_create_route_plans_table.php
2025_01_01_000024_create_status_types_table.php
2025_01_01_000025_create_statuses_table.php
2025_01_01_000026_create_outsources_table.php
2025_01_01_000027_create_outsource_performances_table.php
2025_01_01_000028_create_profiles_table.php
2025_01_01_000029_create_activity_log_table.php
2025_01_01_000030_create_permission_tables.php
```

## 🌱 Seeders

### Database Seeder
Main database seeder coordinates all seeders:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            CheckPermissionSeeder::class,
            TimsSeeder::class,
        ]);
    }
}
```

### Permission Seeder
Seeds all permissions and roles:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class CheckPermissionSeeder extends Seeder
{
    public function run()
    {
        $modules = [
            'trucks', 'drivers', 'maintenance', 'vehicletypes', 'fuel',
            'financial', 'customers', 'users', 'regions', 'zones',
            'woredas', 'places', 'statustypes', 'statuses', 'cargotypes',
            'operations', 'performances', 'roles', 'permissions'
        ];

        $actions = ['view', 'show', 'create', 'store', 'edit', 'update', 'destroy', 'export'];

        foreach ($modules as $module) {
            foreach ($actions as $action) {
                Permission::firstOrCreate([
                    'name' => "{$module}.{$action}",
                    'guard_name' => 'web'
                ]);
            }
        }

        // Create roles
        $admin = Role::firstOrCreate(['name' => 'admin', 'guard_name' => 'web']);
        $manager = Role::firstOrCreate(['name' => 'manager', 'guard_name' => 'web']);
        $user = Role::firstOrCreate(['name' => 'user', 'guard_name' => 'web']);

        // Assign permissions
        $admin->givePermissionTo(Permission::all());
        
        $manager->givePermissionTo(Permission::where('name', 'not like', '%.destroy')->get());
        
        $user->givePermissionTo(Permission::whereIn('name', [
            'trucks.view', 'trucks.show', 'trucks.export',
            'drivers.view', 'drivers.show', 'drivers.export',
            // ... other view permissions
        ])->get());
    }
}
```

### TIMS Seeder
Seeds sample data for development:

```php
<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\VehicleType;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Customer;
use App\Models\Region;
use App\Models\Zone;
use App\Models\Woreda;
use App\Models\Place;

class TimsSeeder extends Seeder
{
    public function run()
    {
        // Create vehicle types
        $vehicleTypes = [
            ['name' => 'Heavy Truck', 'description' => 'Heavy duty transport vehicle'],
            ['name' => 'Light Truck', 'description' => 'Light duty transport vehicle'],
            ['name' => 'Pickup', 'description' => 'Small pickup truck'],
            ['name' => 'Bus', 'description' => 'Passenger transport vehicle'],
            ['name' => 'Van', 'description' => 'Small van vehicle'],
        ];

        foreach ($vehicleTypes as $type) {
            VehicleType::create($type);
        }

        // Create regions
        $regions = [
            ['name' => 'Addis Ababa', 'code' => 'AA', 'description' => 'Capital city'],
            ['name' => 'Oromia', 'code' => 'OR', 'description' => 'Oromia region'],
            ['name' => 'Amhara', 'code' => 'AM', 'description' => 'Amhara region'],
            ['name' => 'SNNP', 'code' => 'SN', 'description' => 'Southern Nations region'],
        ];

        foreach ($regions as $region) {
            Region::create($region);
        }

        // Create zones for Addis Ababa
        $zones = [
            ['name' => 'Central Zone', 'code' => 'CZ', 'region_id' => 1],
            ['name' => 'East Zone', 'code' => 'EZ', 'region_id' => 1],
            ['name' => 'West Zone', 'code' => 'WZ', 'region_id' => 1],
        ];

        foreach ($zones as $zone) {
            Zone::create($zone);
        }

        // Create woredas
        $woredas = [
            ['name' => 'Bole', 'code' => 'BO', 'zone_id' => 1],
            ['name' => 'Kirkos', 'code' => 'KI', 'zone_id' => 1],
            ['name' => 'Nifas Silk', 'code' => 'NS', 'zone_id' => 2],
        ];

        foreach ($woredas as $woreda) {
            Woreda::create($woreda);
        }

        // Create places
        $places = [
            ['name' => 'Bole Airport', 'code' => 'BA', 'woreda_id' => 1],
            ['name' => 'Meskel Square', 'code' => 'MS', 'woreda_id' => 2],
            ['name' => 'Merkato', 'code' => 'MK', 'woreda_id' => 2],
        ];

        foreach ($places as $place) {
            Place::create($place);
        }

        // Create customers
        $customers = [
            [
                'name' => 'Ethiopian Airlines',
                'contact_person' => 'John Doe',
                'email' => 'john@ethiopianairlines.com',
                'phone' => '+251911234567',
                'address' => 'Bole Airport',
                'city' => 'Addis Ababa',
                'country' => 'Ethiopia'
            ],
            [
                'name' => 'DHL Ethiopia',
                'contact_person' => 'Jane Smith',
                'email' => 'jane@dhl.com',
                'phone' => '+251922345678',
                'address' => 'Meskel Square',
                'city' => 'Addis Ababa',
                'country' => 'Ethiopia'
            ],
        ];

        foreach ($customers as $customer) {
            Customer::create($customer);
        }

        // Create trucks
        $trucks = [
            [
                'plate' => 'AA1234BB',
                'vehicletype_id' => 1,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-01-01',
                'status' => 'active'
            ],
            [
                'plate' => 'BB5678CC',
                'vehicletype_id' => 2,
                'chasisNumber' => 'CHASIS789012',
                'engineNumber' => 'ENGINE789012',
                'tyreSyze' => '235/75R15',
                'serviceIntervalKM' => 15000,
                'purchasePrice' => 750000,
                'productionDate' => '2021-01-01',
                'serviceStartDate' => '2021-01-01',
                'status' => 'active'
            ],
        ];

        foreach ($trucks as $truck) {
            Truck::create($truck);
        }

        // Create drivers
        $drivers = [
            [
                'driverid' => 'DRV0001',
                'name' => 'Alemayehu Bekele',
                'sex' => 'male',
                'birthdate' => '1985-01-01',
                'zone' => 'Addis Ababa',
                'woreda' => 'Bole',
                'kebele' => '01',
                'housenumber' => '123',
                'mobile' => '+251911234567',
                'hireddate' => '2020-01-01',
                'status' => 'active'
            ],
            [
                'driverid' => 'DRV0002',
                'name' => 'Tigist Hailu',
                'sex' => 'female',
                'birthdate' => '1990-01-01',
                'zone' => 'Addis Ababa',
                'woreda' => 'Kirkos',
                'kebele' => '02',
                'housenumber' => '456',
                'mobile' => '+251922345678',
                'hireddate' => '2021-01-01',
                'status' => 'active'
            ],
        ];

        foreach ($drivers as $driver) {
            Driver::create($driver);
        }
    }
}
```

## 🏭 Factories

### Model Factories
Factories create test data for development and testing:

```php
<?php

namespace Database\Factories;

use App\Models\Truck;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Factory;

class TruckFactory extends Factory
{
    protected $model = Truck::class;

    public function definition(): array
    {
        return [
            'plate' => $this->faker->unique()->regexify('[A-Z]{2}[0-9]{4}[A-Z]{2}'),
            'vehicletype_id' => VehicleType::factory(),
            'chasisNumber' => $this->faker->unique()->numerify('CHASIS########'),
            'engineNumber' => $this->faker->unique()->numerify('ENGINE########'),
            'tyreSyze' => $this->faker->randomElement(['225/75R16', '235/75R15', '245/70R16']),
            'serviceIntervalKM' => $this->faker->numberBetween(10000, 50000),
            'purchasePrice' => $this->faker->randomFloat(2, 500000, 2000000),
            'productionDate' => $this->faker->dateTimeBetween('-10 years', '-1 year'),
            'serviceStartDate' => $this->faker->dateTimeBetween('-5 years', 'now'),
            'status' => $this->faker->randomElement(['active', 'inactive', 'maintenance', 'retired']),
        ];
    }

    public function active(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'active',
        ]);
    }

    public function inactive(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'inactive',
        ]);
    }

    public function maintenance(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'maintenance',
        ]);
    }

    public function retired(): static
    {
        return $this->state(fn (array $attributes) => [
            'status' => 'retired',
        ]);
    }
}
```

## 🔍 Query Optimization

### Eager Loading
Prevent N+1 queries with eager loading:

```php
// Eager load relationships
$trucks = Truck::with(['vehicletype', 'performances', 'maintenanceRecords'])
    ->paginate(15);

// Selective eager loading
$trucks = Truck::with(['vehicletype:id,name'])
    ->select(['id', 'plate', 'status', 'vehicletype_id'])
    ->get();
```

### Query Scopes
Use query scopes for common filters:

```php
// Model scopes
public function scopeActive($query)
{
    return $query->where('status', 'active');
}

public function scopeInactive($query)
{
    return $query->where('status', 'inactive');
}

// Usage
$activeTrucks = Truck::active()->get();
$inactiveTrucks = Truck::inactive()->get();
```

### Database Indexes
Strategic indexes for performance:

```sql
-- Composite indexes for common queries
CREATE INDEX idx_trucks_status_created ON trucks (status, created_at);
CREATE INDEX idx_performances_date_status ON performances (DateDispach, satus);
CREATE INDEX idx_drivers_status_hired ON drivers (status, hireddate);

-- Partial indexes for soft deletes
CREATE INDEX idx_trucks_active ON trucks (status) WHERE deleted_at IS NULL;
CREATE INDEX idx_drivers_active ON drivers (status) WHERE deleted_at IS NULL;
```

## 🔒 Security Considerations

### Data Encryption
Sensitive data encryption:

```php
// Encrypt sensitive fields
protected $casts = [
    'password' => 'encrypted',
    'two_factor_secret' => 'encrypted',
];
```

### Access Control
Row-level security with policies:

```php
// Model policies
public function viewAny(User $user)
{
    return $user->can('trucks.view');
}

public function view(User $user, Truck $truck)
{
    return $user->can('trucks.show');
}

public function create(User $user)
{
    return $user->can('trucks.create');
}
```

### Audit Logging
Comprehensive audit trails:

```php
// Activity logging
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->withProperties(['old' => $oldData, 'new' => $newData])
    ->log('updated');
```

## 📊 Backup and Recovery

### Backup Strategy
Regular database backups:

```bash
# MySQL backup
mysqldump -u username -p tims_database > backup_$(date +%Y%m%d_%H%M%S).sql

# Automated backup script
#!/bin/bash
BACKUP_DIR="/backups/tims"
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u username -p tims_database > $BACKUP_DIR/tims_backup_$DATE.sql
```

### Recovery Procedures
Database recovery process:

```bash
# Restore from backup
mysql -u username -p tims_database < backup_20250101_120000.sql

# Point-in-time recovery
mysqlbinlog --start-datetime="2025-01-01 12:00:00" mysql-bin.000001 | mysql -u username -p
```

## 🚀 Performance Monitoring

### Query Performance
Monitor slow queries:

```php
// Log slow queries
DB::listen(function ($query) {
    if ($query->time > 1000) {
        Log::warning('Slow query detected', [
            'sql' => $query->sql,
            'time' => $query->time,
            'bindings' => $query->bindings
        ]);
    }
});
```

### Database Metrics
Track database performance:

```sql
-- Slow query log
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';

-- Query cache
SHOW VARIABLES LIKE 'query_cache%';

-- Connection status
SHOW STATUS LIKE 'Connections';
SHOW STATUS LIKE 'Threads_connected';
```

## 📚 Additional Resources

### Documentation Links
- [Laravel Database Documentation](https://laravel.com/docs/database)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [Eloquent ORM Documentation](https://laravel.com/docs/eloquent)
- [Database Migrations](https://laravel.com/docs/migrations)
- [Model Factories](https://laravel.com/docs/factories)

### Best Practices
- [Database Design Best Practices](https://www.lucidchart.com/pages/database-diagram/database-design)
- [MySQL Performance Tuning](https://dev.mysql.com/doc/refman/8.0/en/optimization.html)
- [Laravel Database Best Practices](https://github.com/alexeymezenin/laravel-best-practices)

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

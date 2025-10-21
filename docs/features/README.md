# Features Documentation - TIMS

This document provides comprehensive documentation for all features in the Transport Information Management System (TIMS).

## 📋 Features Overview

### Core Features
- **Fleet Management**: Complete truck and driver lifecycle management
- **Performance Tracking**: Trip performance monitoring and analytics
- **Financial Management**: Revenue tracking and cost analysis
- **Maintenance Management**: Vehicle maintenance system
- **User Management**: Role-based access control with permissions
- **Reporting System**: Comprehensive analytics and reporting
- **Geographic Management**: Regional hierarchy and distance tracking

### Advanced Features
- **Activity Logging**: Comprehensive audit trails
- **CSV Export**: Data export functionality
- **Search & Filtering**: Advanced search capabilities
- **Sorting & Pagination**: Data organization and navigation
- **Permission System**: Granular access control
- **Validation**: Frontend and backend validation
- **Toast Notifications**: User feedback system
- **Responsive Design**: Mobile-first approach

## 🚛 Fleet Management

### Truck Management

#### Overview
The truck management system provides complete lifecycle management for fleet vehicles, including registration, maintenance tracking, performance monitoring, and retirement.

#### Features
- **Truck Registration**: Add new trucks with complete specifications
- **Truck Information**: Detailed truck profiles with specifications
- **Status Management**: Track truck status (active, inactive, maintenance, retired)
- **Maintenance Tracking**: Link to maintenance records and schedules
- **Performance Monitoring**: Track trip performance and utilization
- **Driver Assignments**: Manage driver-truck assignments
- **Financial Tracking**: Monitor costs and revenue per truck

#### Data Fields
```typescript
interface Truck {
  id: number
  plate: string                    // License plate (Ethiopian format: AA1234BB)
  vehicletype_id: number          // Vehicle type reference
  chasisNumber: string            // Chassis number (unique)
  engineNumber: string            // Engine number (unique)
  tyreSyze: string               // Tyre size specification
  serviceIntervalKM: number       // Service interval in kilometers
  purchasePrice: number          // Purchase price in ETB
  productionDate: Date           // Vehicle production date
  serviceStartDate: Date         // Service start date
  status: 'active' | 'inactive' | 'maintenance' | 'retired'
  created_at: Date
  updated_at: Date
  deleted_at?: Date              // Soft delete timestamp
}
```

#### Validation Rules
```php
// Backend Validation
'plate' => 'required|string|max:255|regex:/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/|unique:trucks,plate'
'chasisNumber' => 'required|string|max:255|unique:trucks,chasisNumber'
'engineNumber' => 'required|string|max:255|unique:trucks,engineNumber'
'serviceIntervalKM' => 'required|integer|min:1000|max:100000'
'purchasePrice' => 'required|numeric|min:0'
'productionDate' => 'required|date|before:today'
'serviceStartDate' => 'required|date|after_or_equal:productionDate'
'status' => 'required|string|in:active,inactive,maintenance,retired'
```

```typescript
// Frontend Validation
export function validateTruck(data: TruckFormData): ValidationErrors {
  const errors: ValidationErrors = {}
  
  if (!data.plate) {
    errors.plate = 'Plate number is required'
  } else if (!/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/.test(data.plate)) {
    errors.plate = 'Invalid Ethiopian plate format (e.g., AA1234BB)'
  }
  
  if (!data.chasisNumber) {
    errors.chasisNumber = 'Chassis number is required'
  } else if (data.chasisNumber.length < 10) {
    errors.chasisNumber = 'Chassis number must be at least 10 characters'
  }
  
  if (!data.engineNumber) {
    errors.engineNumber = 'Engine number is required'
  } else if (data.engineNumber.length < 10) {
    errors.engineNumber = 'Engine number must be at least 10 characters'
  }
  
  if (!data.serviceIntervalKM || data.serviceIntervalKM < 1000) {
    errors.serviceIntervalKM = 'Service interval must be at least 1,000 KM'
  } else if (data.serviceIntervalKM > 100000) {
    errors.serviceIntervalKM = 'Service interval cannot exceed 100,000 KM'
  }
  
  if (!data.purchasePrice || data.purchasePrice <= 0) {
    errors.purchasePrice = 'Purchase price must be positive'
  }
  
  if (!data.productionDate) {
    errors.productionDate = 'Production date is required'
  } else if (new Date(data.productionDate) >= new Date()) {
    errors.productionDate = 'Production date must be in the past'
  }
  
  if (!data.serviceStartDate) {
    errors.serviceStartDate = 'Service start date is required'
  } else if (new Date(data.serviceStartDate) < new Date(data.productionDate)) {
    errors.serviceStartDate = 'Service start date must be on or after production date'
  }
  
  return errors
}
```

#### Permissions
- `trucks.view` - View trucks list
- `trucks.show` - View truck details
- `trucks.create` - Create new trucks
- `trucks.store` - Store new trucks
- `trucks.edit` - Edit existing trucks
- `trucks.update` - Update existing trucks
- `trucks.destroy` - Delete trucks
- `trucks.export` - Export trucks to CSV

#### API Endpoints
```http
GET    /trucks              # List trucks with search and pagination
GET    /trucks/create       # Show create form
POST   /trucks              # Store new truck
GET    /trucks/{id}         # Show truck details
GET    /trucks/{id}/edit    # Show edit form
PUT    /trucks/{id}         # Update truck
DELETE /trucks/{id}         # Delete truck
GET    /trucks/export       # Export trucks to CSV
```

### Driver Management

#### Overview
The driver management system handles driver profiles, assignments, performance tracking, and safety records.

#### Features
- **Driver Registration**: Add new drivers with complete profiles
- **Driver Information**: Detailed driver profiles and contact information
- **Status Management**: Track driver status (active, inactive, suspended)
- **Assignment Tracking**: Manage driver-truck assignments
- **Performance Monitoring**: Track driver performance metrics
- **Safety Records**: Monitor safety incidents and violations
- **Performance Records**: Detailed performance analytics

#### Data Fields
```typescript
interface Driver {
  id: number
  driverid: string              // Driver ID (unique)
  name: string                 // Driver full name
  sex: 'male' | 'female'       // Driver gender
  birthdate: Date              // Driver birth date
  zone: string                 // Driver zone
  woreda: string               // Driver woreda
  kebele: string               // Driver kebele
  housenumber: string          // House number
  mobile: string               // Mobile phone number
  hireddate: Date              // Hire date
  status: 'active' | 'inactive' | 'suspended'
  created_at: Date
  updated_at: Date
  deleted_at?: Date            // Soft delete timestamp
}
```

#### Validation Rules
```php
// Backend Validation
'driverid' => 'required|string|max:255|unique:drivers,driverid'
'name' => 'required|string|max:255'
'sex' => 'required|string|in:male,female'
'birthdate' => 'required|date|before:today'
'zone' => 'required|string|max:255'
'woreda' => 'required|string|max:255'
'kebele' => 'required|string|max:255'
'housenumber' => 'required|string|max:255'
'mobile' => 'required|string|max:255'
'hireddate' => 'required|date|before:today'
'status' => 'required|string|in:active,inactive,suspended'
```

#### Permissions
- `drivers.view` - View drivers list
- `drivers.show` - View driver details
- `drivers.create` - Create new drivers
- `drivers.store` - Store new drivers
- `drivers.edit` - Edit existing drivers
- `drivers.update` - Update existing drivers
- `drivers.destroy` - Delete drivers
- `drivers.export` - Export drivers to CSV

### Vehicle Type Management

#### Overview
The vehicle type management system categorizes different types of vehicles in the fleet.

#### Features
- **Type Registration**: Add new vehicle types
- **Type Information**: Detailed type specifications
- **Categorization**: Organize vehicles by type
- **Specifications**: Define type-specific requirements

#### Data Fields
```typescript
interface VehicleType {
  id: number
  name: string                 // Vehicle type name
  description: string          // Vehicle type description
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

## 📊 Performance Tracking

### Trip Performance

#### Overview
The trip performance system tracks detailed information about each trip, including cargo, distance, fuel consumption, and costs.

#### Features
- **Trip Recording**: Record detailed trip information
- **Cargo Tracking**: Monitor cargo volume and type
- **Distance Monitoring**: Track distance with and without cargo
- **Fuel Consumption**: Monitor fuel usage and costs
- **Cost Tracking**: Track all trip-related costs
- **Performance Analytics**: Analyze trip performance metrics
- **Status Tracking**: Monitor trip status (completed, ongoing, cancelled)

#### Data Fields
```typescript
interface Performance {
  id: number
  trip: number                 // Trip number
  LoadType: 'Full Load' | 'Half Load' | 'Empty'
  FOnumber: string            // FO number
  operation_id: number        // Operation reference
  driver_truck_id: number     // Driver-truck assignment reference
  DateDispach: Date          // Dispatch date
  orgion_id: number           // Origin place reference
  destination_id: number      // Destination place reference
  user_id: number             // User reference
  DistanceWCargo: number      // Distance with cargo
  tonkm: number              // Ton-kilometer
  DistanceWOCargo: number     // Distance without cargo
  CargoVolumMT: number        // Cargo volume in metric tons
  fuelInLitter: number        // Fuel consumption in liters
  fuelInBirr: number          // Fuel cost in birr
  perdiem: number             // Per diem amount
  workOnGoing: boolean        // Work ongoing flag
  other: number               // Other costs
  comment: string             // Trip comments
  satus: 'completed' | 'ongoing' | 'cancelled'
  is_returned: boolean        // Return trip flag
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

#### Validation Rules
```php
// Backend Validation
'trip' => 'required|integer|min:1'
'LoadType' => 'required|string|in:Full Load,Half Load,Empty'
'FOnumber' => 'required|string|max:255'
'operation_id' => 'required|exists:operations,id'
'driver_truck_id' => 'required|exists:driver_truck,id'
'DateDispach' => 'required|date'
'orgion_id' => 'required|exists:places,id'
'destination_id' => 'required|exists:places,id'
'user_id' => 'required|exists:users,id'
'DistanceWCargo' => 'required|integer|min:0'
'tonkm' => 'required|integer|min:0'
'DistanceWOCargo' => 'required|integer|min:0'
'CargoVolumMT' => 'required|numeric|min:0'
'fuelInLitter' => 'required|numeric|min:0'
'fuelInBirr' => 'required|numeric|min:0'
'perdiem' => 'required|numeric|min:0'
'other' => 'required|numeric|min:0'
'satus' => 'required|string|in:completed,ongoing,cancelled'
```

### Driver Performance Records

#### Overview
The driver performance records system tracks comprehensive performance metrics for drivers over time.

#### Features
- **Performance Scoring**: Calculate performance scores
- **Safety Tracking**: Monitor safety violations and accidents
- **Customer Ratings**: Track customer satisfaction ratings
- **Efficiency Metrics**: Monitor fuel efficiency and performance
- **Period Tracking**: Track performance over different periods
- **Analytics**: Analyze performance trends and patterns

#### Data Fields
```typescript
interface DriverPerformanceRecord {
  id: number
  driver_id: number            // Driver reference
  truck_id: number             // Truck reference
  record_date: Date           // Record date
  total_trips: number         // Total trips
  total_distance_km: number   // Total distance in kilometers
  total_cargo_tonnage: number // Total cargo tonnage
  fuel_efficiency: number     // Fuel efficiency metric
  safety_violations: number   // Safety violations count
  accidents: number           // Accidents count
  customer_rating: number      // Customer rating (1-5)
  performance_notes: string    // Performance notes
  period_type: 'daily' | 'weekly' | 'monthly'
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

### Driver Safety Records

#### Overview
The driver safety records system tracks safety incidents, violations, and accidents.

#### Features
- **Incident Tracking**: Record safety incidents
- **Violation Monitoring**: Track safety violations
- **Accident Management**: Manage accident records
- **Severity Assessment**: Assess incident severity
- **Resolution Tracking**: Track incident resolution
- **Cost Analysis**: Analyze damage costs

#### Data Fields
```typescript
interface DriverSafetyRecord {
  id: number
  driver_id: number            // Driver reference
  reported_by: number          // User who reported
  incident_date: Date         // Incident date
  incident_type: 'accident' | 'violation' | 'near_miss' | 'equipment_failure'
  description: string          // Incident description
  severity: 'low' | 'medium' | 'high' | 'critical'
  damage_cost: number          // Damage cost
  location: string             // Incident location
  resolution: string           // Resolution details
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

## 💰 Financial Management

### Financial Records

#### Overview
The financial records system tracks revenue, costs, and profitability for each truck.

#### Features
- **Revenue Tracking**: Monitor revenue per truck
- **Cost Analysis**: Track all costs associated with trucks
- **Profit Calculation**: Calculate profit margins
- **Financial Analytics**: Analyze financial performance
- **Reporting**: Generate financial reports
- **Trend Analysis**: Track financial trends over time

#### Data Fields
```typescript
interface TruckFinancialRecord {
  id: number
  truck_id: number             // Truck reference
  record_date: Date           // Record date
  revenue: number             // Revenue amount
  fuel_cost: number           // Fuel cost
  maintenance_cost: number    // Maintenance cost
  driver_cost: number         // Driver cost
  other_costs: number         // Other costs
  total_costs: number         // Total costs
  net_profit: number          // Net profit
  profit_margin: number       // Profit margin percentage
  period_type: 'daily' | 'weekly' | 'monthly' | 'yearly'
  notes: string               // Financial notes
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

### Insurance Records

#### Overview
The insurance records system manages vehicle insurance policies and expiration tracking.

#### Features
- **Policy Management**: Track insurance policies
- **Expiration Alerts**: Monitor policy expiration dates
- **Coverage Tracking**: Track coverage details
- **Cost Management**: Monitor insurance costs
- **Renewal Tracking**: Track policy renewals

#### Data Fields
```typescript
interface InsuranceRecord {
  id: number
  truck_id: number             // Truck reference
  policy_number: string        // Policy number
  insurance_company: string     // Insurance company
  coverage_type: string        // Coverage type
  coverage_amount: number      // Coverage amount
  premium_amount: number       // Premium amount
  start_date: Date            // Policy start date
  end_date: Date              // Policy end date
  renewal_date: Date          // Renewal date
  status: 'active' | 'expired' | 'cancelled'
  notes: string               // Insurance notes
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

## 🔧 Maintenance Management

### Maintenance Types

#### Overview
The maintenance types system categorizes different types of maintenance activities.

#### Features
- **Type Registration**: Add new maintenance types
- **Category Management**: Organize maintenance by category
- **Interval Tracking**: Define maintenance intervals
- **Cost Estimation**: Estimate maintenance costs

#### Data Fields
```typescript
interface MaintenanceType {
  id: number
  name: string                 // Maintenance type name
  description: string          // Maintenance type description
  category: string             // Maintenance category
  interval_km: number         // Interval in kilometers
  interval_months: number     // Interval in months
  estimated_cost: number       // Estimated cost
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

### Vehicle Maintenance Records

#### Overview
The vehicle maintenance records system tracks all maintenance activities for vehicles.

#### Features
- **Maintenance Scheduling**: Schedule maintenance activities
- **Completion Tracking**: Track maintenance completion
- **Cost Monitoring**: Monitor maintenance costs
- **Service History**: Maintain service history
- **Alert System**: Alert for overdue maintenance

#### Data Fields
```typescript
interface VehicleMaintenanceRecord {
  id: number
  truck_id: number             // Truck reference
  maintenance_type_id: number  // Maintenance type reference
  scheduled_date: Date        // Scheduled date
  completed_date?: Date        // Completed date
  cost: number                // Maintenance cost
  description: string         // Maintenance description
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  notes: string               // Maintenance notes
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

## 🌍 Geographic Management

### Regional Hierarchy

#### Overview
The regional hierarchy system manages the geographic structure of regions, zones, woredas, and places.

#### Features
- **Region Management**: Manage regional divisions
- **Zone Management**: Manage zone subdivisions
- **Woreda Management**: Manage woreda divisions
- **Place Management**: Manage specific locations
- **Hierarchy Navigation**: Navigate through geographic hierarchy
- **Distance Tracking**: Track distances between locations

#### Data Structure
```typescript
interface Region {
  id: number
  name: string                 // Region name
  code: string                 // Region code
  description: string          // Region description
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}

interface Zone {
  id: number
  name: string                 // Zone name
  code: string                 // Zone code
  region_id: number            // Region reference
  description: string          // Zone description
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}

interface Woreda {
  id: number
  name: string                 // Woreda name
  code: string                 // Woreda code
  zone_id: number              // Zone reference
  description: string          // Woreda description
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}

interface Place {
  id: number
  name: string                 // Place name
  code: string                 // Place code
  woreda_id: number            // Woreda reference
  latitude: number             // Latitude coordinate
  longitude: number            // Longitude coordinate
  description: string          // Place description
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

### Distance Management

#### Overview
The distance management system tracks distances between different locations.

#### Features
- **Distance Recording**: Record distances between places
- **Route Optimization**: Optimize routes based on distances
- **Cost Calculation**: Calculate costs based on distances
- **Travel Time Estimation**: Estimate travel times

#### Data Fields
```typescript
interface Distance {
  id: number
  from_place_id: number        // Origin place reference
  to_place_id: number         // Destination place reference
  distance_km: number         // Distance in kilometers
  travel_time_hours: number   // Travel time in hours
  road_condition: string      // Road condition
  notes: string               // Distance notes
  created_at: Date
  updated_at: Date
  deleted_at?: Date           // Soft delete timestamp
}
```

## 👥 User Management

### User Management

#### Overview
The user management system handles system users, authentication, and basic user information.

#### Features
- **User Registration**: Register new users
- **User Profiles**: Manage user profiles
- **Authentication**: Handle user authentication
- **Two-Factor Authentication**: Enhanced security
- **Password Management**: Password reset and updates
- **Email Verification**: Email verification system

#### Data Fields
```typescript
interface User {
  id: number
  name: string                 // User full name
  email: string                // User email (unique)
  email_verified_at?: Date     // Email verification timestamp
  password: string             // Encrypted password
  two_factor_secret?: string   // Two-factor secret
  two_factor_recovery_codes?: string // Recovery codes
  two_factor_confirmed_at?: Date // Two-factor confirmation
  remember_token?: string      // Remember token
  created_at: Date
  updated_at: Date
}
```

### Role Management

#### Overview
The role management system handles user roles and their associated permissions.

#### Features
- **Role Creation**: Create new roles
- **Permission Assignment**: Assign permissions to roles
- **Role Hierarchy**: Manage role hierarchy
- **User Assignment**: Assign roles to users

#### Data Fields
```typescript
interface Role {
  id: number
  name: string                 // Role name
  guard_name: string           // Guard name
  created_at: Date
  updated_at: Date
}
```

### Permission Management

#### Overview
The permission management system handles granular permissions for different actions.

#### Features
- **Permission Creation**: Create new permissions
- **Permission Assignment**: Assign permissions to roles/users
- **Permission Checking**: Check user permissions
- **Permission Hierarchy**: Manage permission hierarchy

#### Data Fields
```typescript
interface Permission {
  id: number
  name: string                 // Permission name
  guard_name: string           // Guard name
  created_at: Date
  updated_at: Date
}
```

## 📊 Reporting System

### Dashboard Analytics

#### Overview
The dashboard analytics system provides key performance indicators and system overview.

#### Features
- **Key Metrics**: Display key performance indicators
- **Performance Status**: Show performance status overview
- **Daily Performance**: Track daily performance metrics
- **Operations Report**: Generate operations reports
- **Recent Activity**: Show recent system activity
- **Trend Analysis**: Analyze performance trends

#### Key Metrics
```typescript
interface DashboardMetrics {
  totalTrucks: number          // Total number of trucks
  activeTrucks: number         // Number of active trucks
  totalDrivers: number         // Total number of drivers
  activeDrivers: number        // Number of active drivers
  totalOperations: number      // Total number of operations
  activeOperations: number     // Number of active operations
  totalPerformances: number    // Total number of performances
  completedPerformances: number // Number of completed performances
}
```

### Performance Reports

#### Overview
The performance reports system generates detailed performance analytics and reports.

#### Features
- **Trip Performance**: Analyze trip performance metrics
- **Driver Performance**: Analyze driver performance
- **Fleet Utilization**: Analyze fleet utilization
- **Cost Analysis**: Analyze operational costs
- **Revenue Analysis**: Analyze revenue trends
- **Efficiency Metrics**: Calculate efficiency metrics

### Financial Reports

#### Overview
The financial reports system generates comprehensive financial reports and analytics.

#### Features
- **Revenue Reports**: Generate revenue reports
- **Cost Reports**: Generate cost analysis reports
- **Profit Reports**: Generate profit/loss reports
- **Budget Reports**: Generate budget comparison reports
- **Trend Analysis**: Analyze financial trends
- **Forecasting**: Financial forecasting and projections

## 🔍 Search and Filtering

### Search Functionality

#### Overview
The search functionality provides advanced search capabilities across all modules.

#### Features
- **Text Search**: Search across multiple text fields
- **Field-Specific Search**: Search specific fields
- **Fuzzy Search**: Approximate matching
- **Search Suggestions**: Provide search suggestions
- **Search History**: Track search history
- **Advanced Filters**: Apply multiple filters

#### Search Implementation
```php
// Backend Search Implementation
public function index(Request $request)
{
    $query = Truck::with(['vehicletype'])
        ->when($request->search, function ($q, $search) {
            $q->where(function ($query) use ($search) {
                $query->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });
        });

    $trucks = $query->paginate(15);

    return Inertia::render('Trucks/Index', [
        'trucks' => $trucks,
        'filters' => $request->only(['search'])
    ]);
}
```

### Filtering System

#### Overview
The filtering system provides advanced filtering capabilities for data organization.

#### Features
- **Status Filtering**: Filter by status
- **Date Range Filtering**: Filter by date ranges
- **Numeric Range Filtering**: Filter by numeric ranges
- **Multiple Filters**: Apply multiple filters simultaneously
- **Filter Persistence**: Persist filters across sessions
- **Filter Reset**: Reset all filters

### Sorting System

#### Overview
The sorting system provides data organization and navigation capabilities.

#### Features
- **Column Sorting**: Sort by any column
- **Multi-Column Sorting**: Sort by multiple columns
- **Sort Direction**: Ascending and descending sort
- **Sort Persistence**: Persist sort preferences
- **Default Sorting**: Set default sort order

#### Sorting Implementation
```php
// Backend Sorting Implementation
public function index(Request $request)
{
    $query = Truck::with(['vehicletype'])
        ->when($request->sort, function ($q, $sort) use ($request) {
            $allowedSorts = ['plate', 'chasisNumber', 'engineNumber', 'status'];
            if (in_array($sort, $allowedSorts)) {
                $q->orderBy($sort, $request->direction ?? 'asc');
            }
        }, function ($q) {
            $q->orderBy('created_at', 'desc');
        });

    $trucks = $query->paginate(15);

    return Inertia::render('Trucks/Index', [
        'trucks' => $trucks,
        'sort' => $request->only(['sort', 'direction'])
    ]);
}
```

## 📤 Export Functionality

### CSV Export

#### Overview
The CSV export functionality allows users to export data to CSV format for analysis and reporting.

#### Features
- **Filtered Export**: Export filtered data
- **Column Selection**: Select specific columns for export
- **UTF-8 Encoding**: Proper UTF-8 encoding for international characters
- **Excel Compatibility**: Excel-compatible CSV format
- **Large Dataset Support**: Handle large datasets efficiently
- **Export Logging**: Log export activities

#### Export Implementation
```php
// Backend Export Implementation
public function export(Request $request)
{
    try {
        $query = Truck::with(['vehicletype'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('plate', 'like', "%{$search}%")
                        ->orWhere('chasisNumber', 'like', "%{$search}%")
                        ->orWhere('engineNumber', 'like', "%{$search}%");
                });
            });

        $trucks = $query->get();

        $filename = 'trucks_' . now()->format('Y-m-d_H-i-s') . '.csv';
        
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        $callback = function () use ($trucks) {
            $file = fopen('php://output', 'w');
            
            // Add UTF-8 BOM for Excel compatibility
            fwrite($file, "\xEF\xBB\xBF");
            
            // Headers
            fputcsv($file, [
                'Plate', 'Vehicle Type', 'Chassis Number', 'Engine Number',
                'Tyre Size', 'Service Interval (KM)', 'Purchase Price',
                'Production Date', 'Service Start Date', 'Status', 'Created At'
            ]);

            // Data
            foreach ($trucks as $truck) {
                fputcsv($file, [
                    $truck->plate,
                    $truck->vehicletype?->name,
                    $truck->chasisNumber,
                    $truck->engineNumber,
                    $truck->tyreSyze,
                    $truck->serviceIntervalKM,
                    $truck->purchasePrice,
                    $truck->productionDate?->format('Y-m-d'),
                    $truck->serviceStartDate?->format('Y-m-d'),
                    $truck->status,
                    $truck->created_at->format('Y-m-d H:i:s')
                ]);
            }

            fclose($file);
        };

        Activity::log('Exported trucks CSV with ' . $trucks->count() . ' records');

        return response()->stream($callback, 200, $headers);
    } catch (\Exception $e) {
        return redirect()->back()
            ->withErrors(['error' => 'Failed to export trucks. Please try again.']);
    }
}
```

## 🔐 Security Features

### Permission System

#### Overview
The permission system provides granular access control for all system features.

#### Features
- **Role-Based Access**: Assign permissions to roles
- **User Permissions**: Assign permissions directly to users
- **Permission Checking**: Check permissions before actions
- **Permission Inheritance**: Inherit permissions from roles
- **Dynamic Permissions**: Dynamic permission assignment
- **Permission Auditing**: Audit permission changes

#### Permission Structure
```php
// Permission naming convention
{module}.{action}

// Examples
trucks.view
trucks.show
trucks.create
trucks.store
trucks.edit
trucks.update
trucks.destroy
trucks.export
```

#### Permission Implementation
```php
// Middleware Protection
Route::middleware(['permission:trucks.create'])->group(function () {
    Route::get('/trucks/create', [TruckController::class, 'create']);
    Route::post('/trucks', [TruckController::class, 'store']);
});

// Frontend Permission Checks
function TruckIndex() {
  const { can } = usePermissions()
  
  return (
    <div>
      {can('trucks.create') && (
        <Button onClick={() => router.visit(route('trucks.create'))}>
          Add Truck
        </Button>
      )}
    </div>
  )
}
```

### Activity Logging

#### Overview
The activity logging system provides comprehensive audit trails for all system activities.

#### Features
- **CRUD Logging**: Log all create, read, update, delete operations
- **User Tracking**: Track which user performed each action
- **Change Tracking**: Track what changed in each operation
- **Export Logging**: Log data exports
- **Login Logging**: Log user login activities
- **Permission Logging**: Log permission changes

#### Activity Log Implementation
```php
// Activity Logging Implementation
use Spatie\ActivityLog\Facades\Activity;

// Log creation
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->log('created');

// Log update with changes
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->withProperties([
        'old' => $oldData,
        'new' => $truck->toArray()
    ])
    ->log('updated');

// Log deletion
Activity::performedOn($truck)
    ->causedBy(auth()->user())
    ->withProperties(['deleted_data' => $truckData])
    ->log('deleted');
```

## 🎨 User Interface Features

### Responsive Design

#### Overview
The responsive design system ensures optimal user experience across all devices.

#### Features
- **Mobile-First**: Mobile-first design approach
- **Breakpoint System**: Consistent breakpoint system
- **Flexible Layouts**: Flexible and adaptive layouts
- **Touch-Friendly**: Touch-friendly interface elements
- **Performance Optimized**: Optimized for mobile performance

#### Breakpoint System
```css
/* Tailwind CSS Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

### Toast Notifications

#### Overview
The toast notification system provides user feedback for all system actions.

#### Features
- **Success Notifications**: Success action feedback
- **Error Notifications**: Error action feedback
- **Warning Notifications**: Warning action feedback
- **Info Notifications**: Information feedback
- **Auto-Dismiss**: Automatic dismissal
- **Manual Dismiss**: Manual dismissal option

#### Toast Implementation
```typescript
// Toast Hook Implementation
import { useToast } from '@/hooks/useToast'

function TruckCreate() {
  const { toast } = useToast()
  
  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Truck created successfully',
      variant: 'default'
    })
  }

  const handleError = () => {
    toast({
      title: 'Error',
      description: 'Failed to create truck',
      variant: 'destructive'
    })
  }
}
```

### Confirmation Dialogs

#### Overview
The confirmation dialog system provides user confirmation for destructive actions.

#### Features
- **Delete Confirmation**: Confirm deletion actions
- **Custom Messages**: Custom confirmation messages
- **Action Buttons**: Confirm and cancel buttons
- **Keyboard Support**: Keyboard navigation support
- **Accessibility**: Full accessibility support

#### Confirmation Dialog Implementation
```typescript
// Confirmation Dialog Component
import { DeleteConfirmationDialog } from '@/components/DeleteConfirmationDialog'

function TruckIndex() {
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [truckToDelete, setTruckToDelete] = useState(null)

  const handleDelete = (truck) => {
    setTruckToDelete(truck)
    setDeleteDialog(true)
  }

  const confirmDelete = () => {
    if (truckToDelete) {
      // Perform deletion
      deleteTruck(truckToDelete.id)
      setDeleteDialog(false)
      setTruckToDelete(null)
    }
  }

  return (
    <div>
      {/* Truck list */}
      
      <DeleteConfirmationDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        onConfirm={confirmDelete}
        title="Delete Truck"
        description={`Are you sure you want to delete truck ${truckToDelete?.plate}? This action cannot be undone.`}
      />
    </div>
  )
}
```

## 📱 Mobile Features

### Mobile Navigation

#### Overview
The mobile navigation system provides optimized navigation for mobile devices.

#### Features
- **Collapsible Menu**: Collapsible navigation menu
- **Touch Gestures**: Touch gesture support
- **Swipe Navigation**: Swipe navigation support
- **Mobile-Optimized**: Mobile-optimized interface
- **Performance**: Optimized mobile performance

### Mobile Forms

#### Overview
The mobile forms system provides optimized form experiences for mobile devices.

#### Features
- **Touch-Friendly**: Touch-friendly form elements
- **Mobile Validation**: Mobile-optimized validation
- **Keyboard Support**: Mobile keyboard support
- **Auto-Complete**: Mobile auto-complete support
- **Performance**: Optimized mobile form performance

## 🔧 Configuration Features

### System Configuration

#### Overview
The system configuration system manages application settings and preferences.

#### Features
- **Environment Configuration**: Environment-specific settings
- **Feature Flags**: Feature flag management
- **System Preferences**: System-wide preferences
- **User Preferences**: User-specific preferences
- **Configuration Validation**: Configuration validation
- **Configuration Backup**: Configuration backup and restore

### Localization

#### Overview
The localization system provides multi-language support for the application.

#### Features
- **Language Selection**: Language selection interface
- **Translation Management**: Translation management system
- **RTL Support**: Right-to-left language support
- **Date/Time Formatting**: Localized date/time formatting
- **Number Formatting**: Localized number formatting
- **Currency Formatting**: Localized currency formatting

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

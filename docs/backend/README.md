# Backend Documentation - TIMS

This directory contains comprehensive documentation for the TIMS backend, built with Laravel 12 and modern PHP technologies.

## 📚 Files in This Directory

- **[README.md](./README.md)** - This file: Complete backend architecture and implementation guide

## 📖 Overview

This document provides comprehensive documentation for the TIMS backend, built with Laravel 12 and modern PHP technologies.

## 🏗️ Architecture Overview

### Technology Stack
- **Laravel 12**: Latest Laravel framework with modern features
- **PHP 8.3+**: Latest PHP with modern language features
- **MySQL 8.0+**: Primary database with full ACID compliance
- **Inertia.js**: Seamless SPA experience with React frontend
- **Spatie Laravel Permission**: Role and permission management
- **Spatie Laravel Activitylog**: Comprehensive activity logging
- **Laravel Fortify**: Authentication and security features
- **Laravel Wayfinder**: Automatic route generation

### Project Structure
```
app/
├── Http/
│   ├── Controllers/         # API Controllers
│   │   ├── TruckController.php
│   │   ├── DriverController.php
│   │   ├── MaintenanceController.php
│   │   └── ...              # Other controllers
│   ├── Middleware/          # Custom middleware
│   │   ├── EnsureTruckPermission.php
│   │   └── HandleInertiaRequests.php
│   └── Requests/            # Form request validation
│       ├── StoreTruckRequest.php
│       ├── UpdateTruckRequest.php
│       └── ...              # Other requests
├── Models/                  # Eloquent models
│   ├── Truck.php
│   ├── Driver.php
│   ├── Maintenance.php
│   └── ...                  # Other models
├── Services/                # Business logic services
│   ├── TruckAssignmentService.php
│   └── MaintenanceService.php
├── Exceptions/              # Custom exceptions
│   ├── TruckAssignmentException.php
│   └── MaintenanceException.php
└── Providers/               # Service providers
    ├── AppServiceProvider.php
    └── FortifyServiceProvider.php
```

## 🗄️ Database Architecture

### Core Tables
- **`vehicletypes`**: Vehicle type definitions
- **`trucks`**: Fleet vehicle information
- **`drivers`**: Driver profiles and information
- **`customers`**: Client information
- **`operations`**: Transport operations
- **`performances`**: Trip performance records

### Advanced Features
- **`maintenance_types`**: Maintenance category definitions
- **`vehicle_maintenance_records`**: Maintenance history
- **`fuel_records`**: Fuel consumption tracking
- **`driver_performance_records`**: Driver performance metrics
- **`cargo_types`**: Cargo categorization
- **`truck_financial_records`**: Financial tracking
- **`route_plans`**: Route planning and optimization

### Geographic Hierarchy
- **`regions`**: Regional divisions
- **`zones`**: Zone subdivisions
- **`woredas`**: Woreda divisions
- **`places`**: Specific locations
- **`distances`**: Inter-location distances

### User Management
- **`users`**: System users
- **`roles`**: User roles
- **`permissions`**: System permissions
- **`model_has_permissions`**: User-permission relationships
- **`model_has_roles`**: User-role relationships
- **`role_has_permissions`**: Role-permission relationships

## 🎯 Controllers

### Controller Pattern
All controllers follow the same pattern for consistency:

```php
<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\ActivityLog\Facades\Activity;

class TruckController extends Controller
{
    public function index(Request $request)
    {
        $query = Truck::with(['vehicletype'])
            ->when($request->search, function ($q, $search) {
                $q->where(function ($query) use ($search) {
                    $query->where('plate', 'like', "%{$search}%")
                        ->orWhere('chasisNumber', 'like', "%{$search}%")
                        ->orWhere('engineNumber', 'like', "%{$search}%");
                });
            })
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
            'filters' => $request->only(['search']),
            'sort' => $request->only(['sort', 'direction'])
        ]);
    }

    public function create()
    {
        $vehicleTypes = \App\Models\VehicleType::all();
        
        return Inertia::render('Trucks/Create', [
            'vehicleTypes' => $vehicleTypes
        ]);
    }

    public function store(StoreTruckRequest $request)
    {
        try {
            $truck = Truck::create($request->validated());

            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->log('created');

            return redirect()->route('trucks.index')
                ->with('success', 'Truck created successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to create truck. Please try again.'])
                ->withInput();
        }
    }

    public function show(Truck $truck)
    {
        $truck->load(['vehicletype', 'performances', 'maintenanceRecords']);
        
        $activityLogs = Activity::forSubject($truck)
            ->with('causer')
            ->latest()
            ->get();

        return Inertia::render('Trucks/Show', [
            'truck' => $truck,
            'activityLogs' => $activityLogs
        ]);
    }

    public function edit(Truck $truck)
    {
        $vehicleTypes = \App\Models\VehicleType::all();
        
        return Inertia::render('Trucks/Edit', [
            'truck' => $truck,
            'vehicleTypes' => $vehicleTypes
        ]);
    }

    public function update(UpdateTruckRequest $request, Truck $truck)
    {
        try {
            $oldData = $truck->toArray();
            $truck->update($request->validated());

            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->withProperties([
                    'old' => $oldData,
                    'new' => $truck->toArray()
                ])
                ->log('updated');

            return redirect()->route('trucks.index')
                ->with('success', 'Truck updated successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to update truck. Please try again.'])
                ->withInput();
        }
    }

    public function destroy(Truck $truck)
    {
        try {
            $truckData = $truck->toArray();
            $truck->delete();

            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->withProperties(['deleted_data' => $truckData])
                ->log('deleted');

            return redirect()->route('trucks.index')
                ->with('success', 'Truck deleted successfully.');
        } catch (\Exception $e) {
            return redirect()->back()
                ->withErrors(['error' => 'Failed to delete truck. Please try again.']);
        }
    }

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
                })
                ->when($request->sort, function ($q, $sort) use ($request) {
                    $allowedSorts = ['plate', 'chasisNumber', 'engineNumber', 'status'];
                    if (in_array($sort, $allowedSorts)) {
                        $q->orderBy($sort, $request->direction ?? 'asc');
                    }
                }, function ($q) {
                    $q->orderBy('created_at', 'desc');
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
}
```

### Key Controller Features
1. **Search Functionality**: Server-side search with multiple fields
2. **Sorting**: Validated column sorting with direction
3. **Pagination**: Efficient pagination for large datasets
4. **Activity Logging**: Comprehensive audit trails
5. **Error Handling**: Try-catch blocks with user feedback
6. **CSV Export**: Filtered data export with UTF-8 BOM
7. **Relationships**: Eager loading to prevent N+1 queries

## 📝 Form Requests

### Validation Pattern
All form requests follow the same validation pattern:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTruckRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        return [
            'plate' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/',
                'unique:trucks,plate'
            ],
            'vehicletype_id' => [
                'required',
                'exists:vehicletypes,id'
            ],
            'chasisNumber' => [
                'required',
                'string',
                'max:255',
                'unique:trucks,chasisNumber'
            ],
            'engineNumber' => [
                'required',
                'string',
                'max:255',
                'unique:trucks,engineNumber'
            ],
            'tyreSyze' => [
                'required',
                'string',
                'max:255'
            ],
            'serviceIntervalKM' => [
                'required',
                'integer',
                'min:1000',
                'max:100000'
            ],
            'purchasePrice' => [
                'required',
                'numeric',
                'min:0'
            ],
            'productionDate' => [
                'required',
                'date',
                'before:today'
            ],
            'serviceStartDate' => [
                'required',
                'date',
                'after_or_equal:productionDate'
            ],
            'status' => [
                'required',
                'string',
                Rule::in(['active', 'inactive', 'maintenance', 'retired'])
            ]
        ];
    }

    public function messages()
    {
        return [
            'plate.regex' => 'The plate number must be in Ethiopian format (e.g., AA1234BB).',
            'plate.unique' => 'This plate number is already registered.',
            'chasisNumber.unique' => 'This chassis number is already registered.',
            'engineNumber.unique' => 'This engine number is already registered.',
            'serviceIntervalKM.min' => 'Service interval must be at least 1,000 KM.',
            'serviceIntervalKM.max' => 'Service interval cannot exceed 100,000 KM.',
            'purchasePrice.min' => 'Purchase price must be positive.',
            'productionDate.before' => 'Production date must be in the past.',
            'serviceStartDate.after_or_equal' => 'Service start date must be on or after production date.',
            'status.in' => 'Status must be one of: active, inactive, maintenance, retired.'
        ];
    }

    public function attributes()
    {
        return [
            'plate' => 'plate number',
            'vehicletype_id' => 'vehicle type',
            'chasisNumber' => 'chassis number',
            'engineNumber' => 'engine number',
            'tyreSyze' => 'tyre size',
            'serviceIntervalKM' => 'service interval',
            'purchasePrice' => 'purchase price',
            'productionDate' => 'production date',
            'serviceStartDate' => 'service start date'
        ];
    }
}
```

### Update Request Pattern
Update requests include unique validation with ignore rules:

```php
<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTruckRequest extends FormRequest
{
    public function authorize()
    {
        return true;
    }

    public function rules()
    {
        $truckId = $this->route('truck')->id;
        
        return [
            'plate' => [
                'required',
                'string',
                'max:255',
                'regex:/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/',
                Rule::unique('trucks', 'plate')->ignore($truckId)
            ],
            'chasisNumber' => [
                'required',
                'string',
                'max:255',
                Rule::unique('trucks', 'chasisNumber')->ignore($truckId)
            ],
            'engineNumber' => [
                'required',
                'string',
                'max:255',
                Rule::unique('trucks', 'engineNumber')->ignore($truckId)
            ],
            // ... other rules
        ];
    }
}
```

## 🗄️ Models

### Model Pattern
All models follow the same pattern with relationships and scopes:

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Spatie\ActivityLog\Traits\LogsActivity;
use Spatie\ActivityLog\LogOptions;

class Truck extends Model
{
    use HasFactory, SoftDeletes, LogsActivity;

    protected $fillable = [
        'plate',
        'vehicletype_id',
        'chasisNumber',
        'engineNumber',
        'tyreSyze',
        'serviceIntervalKM',
        'purchasePrice',
        'productionDate',
        'serviceStartDate',
        'status'
    ];

    protected $casts = [
        'productionDate' => 'date',
        'serviceStartDate' => 'date',
        'purchasePrice' => 'decimal:2',
        'serviceIntervalKM' => 'integer'
    ];

    // Relationships
    public function vehicletype()
    {
        return $this->belongsTo(VehicleType::class, 'vehicletype_id');
    }

    public function performances()
    {
        return $this->hasMany(Performance::class);
    }

    public function maintenanceRecords()
    {
        return $this->hasMany(VehicleMaintenanceRecord::class);
    }

    public function drivers()
    {
        return $this->belongsToMany(Driver::class, 'driver_truck')
            ->withPivot(['assigned_date', 'status'])
            ->withTimestamps();
    }

    // Scopes
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function scopeInactive($query)
    {
        return $query->where('status', 'inactive');
    }

    public function scopeMaintenance($query)
    {
        return $query->where('status', 'maintenance');
    }

    public function scopeRetired($query)
    {
        return $query->where('status', 'retired');
    }

    // Accessors
    public function getFormattedPriceAttribute()
    {
        return number_format($this->purchasePrice, 2) . ' ETB';
    }

    public function getAgeInYearsAttribute()
    {
        return $this->productionDate->diffInYears(now());
    }

    // Mutators
    public function setPlateAttribute($value)
    {
        $this->attributes['plate'] = strtoupper($value);
    }

    // Activity Log Configuration
    public function getActivitylogOptions(): LogOptions
    {
        return LogOptions::defaults()
            ->logOnly(['plate', 'vehicletype_id', 'chasisNumber', 'engineNumber', 'status'])
            ->logOnlyDirty()
            ->dontSubmitEmptyLogs();
    }
}
```

### Key Model Features
1. **Soft Deletes**: Safe deletion with recovery capability
2. **Activity Logging**: Automatic change tracking
3. **Relationships**: Proper Eloquent relationships
4. **Scopes**: Query scopes for common filters
5. **Accessors/Mutators**: Data transformation
6. **Casting**: Automatic type conversion
7. **Fillable**: Mass assignment protection

## 🔐 Permission System

### Spatie Laravel Permission Integration
The system uses Spatie Laravel Permission for role-based access control:

```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class EnsureTruckPermission
{
    public function handle(Request $request, Closure $next, string $permission)
    {
        if (!auth()->user()->can($permission)) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
```

### Permission Seeder
All permissions are seeded automatically:

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

### Route Protection
Routes are protected with middleware:

```php
// routes/web.php
Route::middleware(['auth', 'verified'])->group(function () {
    Route::middleware(['permission:trucks.view'])->group(function () {
        Route::get('/trucks', [TruckController::class, 'index'])->name('trucks.index');
        Route::get('/trucks/{truck}', [TruckController::class, 'show'])->name('trucks.show');
    });
    
    Route::middleware(['permission:trucks.create'])->group(function () {
        Route::get('/trucks/create', [TruckController::class, 'create'])->name('trucks.create');
        Route::post('/trucks', [TruckController::class, 'store'])->name('trucks.store');
    });
    
    Route::middleware(['permission:trucks.edit'])->group(function () {
        Route::get('/trucks/{truck}/edit', [TruckController::class, 'edit'])->name('trucks.edit');
        Route::put('/trucks/{truck}', [TruckController::class, 'update'])->name('trucks.update');
    });
    
    Route::middleware(['permission:trucks.destroy'])->group(function () {
        Route::delete('/trucks/{truck}', [TruckController::class, 'destroy'])->name('trucks.destroy');
    });
    
    Route::middleware(['permission:trucks.export'])->group(function () {
        Route::get('/trucks/export', [TruckController::class, 'export'])->name('trucks.export');
    });
});
```

## 📊 Activity Logging

### Spatie Laravel Activitylog Integration
All CRUD operations are logged using Spatie Laravel Activitylog:

```php
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

// Log export
Activity::log('Exported trucks CSV with ' . $trucks->count() . ' records');
```

### Activity Log Configuration
Models can configure what gets logged:

```php
public function getActivitylogOptions(): LogOptions
{
    return LogOptions::defaults()
        ->logOnly(['plate', 'vehicletype_id', 'chasisNumber', 'engineNumber', 'status'])
        ->logOnlyDirty()
        ->dontSubmitEmptyLogs();
}
```

### Activity Log Display
Activity logs are displayed in show pages:

```php
public function show(Truck $truck)
{
    $activityLogs = Activity::forSubject($truck)
        ->with('causer')
        ->latest()
        ->get();

    return Inertia::render('Trucks/Show', [
        'truck' => $truck,
        'activityLogs' => $activityLogs
    ]);
}
```

## 🔧 Services

### Business Logic Services
Complex business logic is encapsulated in service classes:

```php
<?php

namespace App\Services;

use App\Models\Truck;
use App\Models\Driver;
use App\Exceptions\TruckAssignmentException;

class TruckAssignmentService
{
    public function assignDriverToTruck(Driver $driver, Truck $truck, array $data = [])
    {
        // Check if driver is already assigned to another truck
        $existingAssignment = $driver->trucks()
            ->wherePivot('status', 'active')
            ->first();

        if ($existingAssignment) {
            throw new TruckAssignmentException(
                "Driver {$driver->name} is already assigned to truck {$existingAssignment->plate}"
            );
        }

        // Check if truck is already assigned to another driver
        $existingDriver = $truck->drivers()
            ->wherePivot('status', 'active')
            ->first();

        if ($existingDriver) {
            throw new TruckAssignmentException(
                "Truck {$truck->plate} is already assigned to driver {$existingDriver->name}"
            );
        }

        // Create assignment
        $assignment = $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active',
            'assigned_by' => auth()->id(),
            ...$data
        ]);

        return $assignment;
    }

    public function unassignDriverFromTruck(Driver $driver, Truck $truck)
    {
        $assignment = $driver->trucks()
            ->wherePivot('status', 'active')
            ->where('truck_id', $truck->id)
            ->first();

        if (!$assignment) {
            throw new TruckAssignmentException(
                "No active assignment found for driver {$driver->name} and truck {$truck->plate}"
            );
        }

        $driver->trucks()->updateExistingPivot($truck->id, [
            'status' => 'inactive',
            'unassigned_date' => now(),
            'unassigned_by' => auth()->id()
        ]);

        return true;
    }

    public function getDriverAssignments(Driver $driver)
    {
        return $driver->trucks()
            ->withPivot(['assigned_date', 'status', 'assigned_by', 'unassigned_date', 'unassigned_by'])
            ->orderBy('pivot_created_at', 'desc')
            ->get();
    }

    public function getTruckAssignments(Truck $truck)
    {
        return $truck->drivers()
            ->withPivot(['assigned_date', 'status', 'assigned_by', 'unassigned_date', 'unassigned_by'])
            ->orderBy('pivot_created_at', 'desc')
            ->get();
    }
}
```

### Service Usage in Controllers
Services are injected into controllers:

```php
public function assignDriver(Request $request, TruckAssignmentService $assignmentService)
{
    try {
        $driver = Driver::findOrFail($request->driver_id);
        $truck = Truck::findOrFail($request->truck_id);

        $assignmentService->assignDriverToTruck($driver, $truck, $request->only([
            'notes', 'expected_duration'
        ]));

        return redirect()->back()
            ->with('success', 'Driver assigned successfully.');
    } catch (TruckAssignmentException $e) {
        return redirect()->back()
            ->withErrors(['error' => $e->getMessage()]);
    }
}
```

## 🚨 Exception Handling

### Custom Exceptions
Custom exceptions provide specific error handling:

```php
<?php

namespace App\Exceptions;

use Exception;

class TruckAssignmentException extends Exception
{
    public function __construct(string $message = 'Truck assignment failed', int $code = 0, Exception $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }
}
```

### Exception Handling in Controllers
Controllers use try-catch blocks for error handling:

```php
public function store(StoreTruckRequest $request)
{
    try {
        $truck = Truck::create($request->validated());

        Activity::performedOn($truck)
            ->causedBy(auth()->user())
            ->log('created');

        return redirect()->route('trucks.index')
            ->with('success', 'Truck created successfully.');
    } catch (\Exception $e) {
        \Log::error('Truck creation failed', [
            'error' => $e->getMessage(),
            'user_id' => auth()->id(),
            'data' => $request->validated()
        ]);

        return redirect()->back()
            ->withErrors(['error' => 'Failed to create truck. Please try again.'])
            ->withInput();
    }
}
```

## 🔒 Security Features

### CSRF Protection
All forms are protected with CSRF tokens:

```php
// In Blade templates
@csrf

// In Inertia forms
<Head title="Create Truck" />
```

### Input Validation
All inputs are validated using Form Requests:

```php
public function rules()
{
    return [
        'plate' => [
            'required',
            'string',
            'max:255',
            'regex:/^[A-Z]{2}[0-9]{4}[A-Z]{2}$/',
            'unique:trucks,plate'
        ],
        // ... other rules
    ];
}
```

### Rate Limiting
Sensitive routes are protected with rate limiting:

```php
Route::middleware(['throttle:60,1'])->group(function () {
    Route::post('/trucks', [TruckController::class, 'store']);
    Route::put('/trucks/{truck}', [TruckController::class, 'update']);
    Route::delete('/trucks/{truck}', [TruckController::class, 'destroy']);
});
```

### SQL Injection Prevention
Eloquent ORM prevents SQL injection:

```php
// Safe - Eloquent ORM
$trucks = Truck::where('status', 'active')->get();

// Safe - Query Builder with bindings
$trucks = DB::table('trucks')
    ->where('status', '?', 'active')
    ->get();
```

## 📈 Performance Optimization

### Database Optimization
- **Indexes**: Strategic database indexes for fast queries
- **Eager Loading**: Prevent N+1 queries with `with()`
- **Query Optimization**: Efficient Eloquent relationships
- **Pagination**: Efficient pagination for large datasets

### Caching Strategy
Laravel caching for frequently accessed data:

```php
// Cache expensive queries
$trucks = Cache::remember('trucks.active', 3600, function () {
    return Truck::active()->with('vehicletype')->get();
});

// Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Query Optimization
Efficient database queries:

```php
// Eager loading to prevent N+1 queries
$trucks = Truck::with(['vehicletype', 'performances', 'maintenanceRecords'])
    ->paginate(15);

// Selective loading
$trucks = Truck::select(['id', 'plate', 'status', 'vehicletype_id'])
    ->with('vehicletype:id,name')
    ->get();
```

## 🧪 Testing

### Feature Tests
Feature tests cover end-to-end functionality:

```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_trucks_index()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.view');

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Trucks/Index')
                ->has('trucks')
        );
    }

    public function test_user_can_create_truck()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.create');

        $truckData = [
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
        ];

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'AA1234BB']);
    }

    public function test_user_can_update_truck()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.edit');

        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'BB5678CC',
                'status' => 'inactive'
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'plate' => 'BB5678CC',
            'status' => 'inactive'
        ]);
    }

    public function test_user_can_delete_truck()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.destroy');

        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);
    }

    public function test_user_can_export_trucks()
    {
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.export');

        Truck::factory()->count(5)->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv');
    }
}
```

### Unit Tests
Unit tests cover individual components:

```php
<?php

namespace Tests\Unit;

use App\Models\Truck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    public function test_truck_has_fillable_attributes()
    {
        $fillable = [
            'plate',
            'vehicletype_id',
            'chasisNumber',
            'engineNumber',
            'tyreSyze',
            'serviceIntervalKM',
            'purchasePrice',
            'productionDate',
            'serviceStartDate',
            'status'
        ];

        $this->assertEquals($fillable, (new Truck())->getFillable());
    }

    public function test_truck_casts_dates_correctly()
    {
        $truck = Truck::factory()->create([
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-01-01'
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->productionDate);
        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->serviceStartDate);
    }

    public function test_truck_belongs_to_vehicle_type()
    {
        $truck = Truck::factory()->create();

        $this->assertInstanceOf(\App\Models\VehicleType::class, $truck->vehicletype);
    }

    public function test_truck_has_many_performances()
    {
        $truck = Truck::factory()->create();
        $performance = \App\Models\Performance::factory()->create();

        $this->assertTrue($truck->performances()->exists());
    }

    public function test_truck_scope_active()
    {
        Truck::factory()->create(['status' => 'active']);
        Truck::factory()->create(['status' => 'inactive']);

        $activeTrucks = Truck::active()->get();

        $this->assertCount(1, $activeTrucks);
        $this->assertEquals('active', $activeTrucks->first()->status);
    }
}
```

## 🚀 Deployment

### Production Configuration
Production environment configuration:

```env
# .env.production
APP_NAME="TIMS"
APP_ENV=production
APP_KEY=base64:your-app-key
APP_DEBUG=false
APP_URL=https://your-domain.com

DB_CONNECTION=mysql
DB_HOST=your-db-host
DB_PORT=3306
DB_DATABASE=tims_production
DB_USERNAME=your-db-user
DB_PASSWORD=your-db-password

CACHE_DRIVER=redis
SESSION_DRIVER=redis
QUEUE_CONNECTION=redis

REDIS_HOST=your-redis-host
REDIS_PASSWORD=your-redis-password
REDIS_PORT=6379
```

### Deployment Steps
Production deployment process:

```bash
# Install dependencies
composer install --optimize-autoloader --no-dev
npm ci && npm run build

# Configure environment
cp .env.example .env
# Edit .env with production values

# Run migrations
php artisan migrate --force

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Set permissions
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache
```

### Performance Monitoring
Production performance monitoring:

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

## 📚 Additional Resources

### Documentation Links
- [Laravel Documentation](https://laravel.com/docs)
- [Spatie Laravel Permission](https://spatie.be/docs/laravel-permission)
- [Spatie Laravel Activitylog](https://spatie.be/docs/laravel-activitylog)
- [Inertia.js Documentation](https://inertiajs.com/)
- [Laravel Fortify](https://laravel.com/docs/fortify)

### Best Practices
- [Laravel Best Practices](https://github.com/alexeymezenin/laravel-best-practices)
- [PHP Best Practices](https://phpbestpractices.org/)
- [Database Design Best Practices](https://www.lucidchart.com/pages/database-diagram/database-design)

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready

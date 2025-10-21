# Testing Documentation - TIMS

This document provides comprehensive testing guidelines and documentation for the Transport Information Management System (TIMS).

## 📋 Table of Contents

1. [Testing Overview](#1-testing-overview)
2. [Testing Strategy](#2-testing-strategy)
3. [Unit Testing](#3-unit-testing)
4. [Feature Testing](#4-feature-testing)
5. [Integration Testing](#5-integration-testing)
6. [Performance Testing](#6-performance-testing)
7. [Security Testing](#7-security-testing)
8. [Frontend Testing](#8-frontend-testing)
9. [API Testing](#9-api-testing)
10. [Test Data Management](#10-test-data-management)
11. [Continuous Integration](#11-continuous-integration)
12. [Test Coverage](#12-test-coverage)

---

## 1. Testing Overview

### 1.1 Testing Philosophy

TIMS follows a comprehensive testing strategy that ensures:
- **Quality Assurance**: All features work as expected
- **Regression Prevention**: New changes don't break existing functionality
- **Documentation**: Tests serve as living documentation
- **Confidence**: Developers can make changes with confidence
- **Maintainability**: Tests help maintain code quality over time

### 1.2 Testing Pyramid

```
                    ┌─────────────────┐
                    │   E2E Tests     │ ← Few, Slow, Expensive
                    │   (Manual)      │
                    └─────────────────┘
                  ┌─────────────────────┐
                  │  Integration Tests  │ ← Some, Medium Speed
                  │   (Feature Tests)  │
                  └─────────────────────┘
                ┌─────────────────────────┐
                │     Unit Tests         │ ← Many, Fast, Cheap
                │   (Model, Service)     │
                └─────────────────────────┘
```

### 1.3 Testing Tools

#### Backend Testing
- **PHPUnit**: Primary testing framework
- **Laravel Testing**: Built-in testing utilities
- **Database Testing**: In-memory SQLite for fast tests
- **Mocking**: PHPUnit mocking capabilities

#### Frontend Testing
- **Jest**: JavaScript testing framework (future)
- **React Testing Library**: Component testing (future)
- **Cypress**: E2E testing (future)

#### API Testing
- **Postman**: API testing and documentation
- **Insomnia**: Alternative API client
- **Laravel HTTP Testing**: Built-in API testing

## 2. Testing Strategy

### 2.1 Test Categories

#### Unit Tests
- **Models**: Test model relationships, attributes, and methods
- **Services**: Test business logic and service methods
- **Utilities**: Test helper functions and utilities
- **Validation**: Test form request validation rules

#### Feature Tests
- **Controllers**: Test HTTP requests and responses
- **Routes**: Test route definitions and middleware
- **Authentication**: Test login, logout, and permissions
- **Database**: Test database operations and migrations

#### Integration Tests
- **Workflows**: Test complete user workflows
- **API Endpoints**: Test API functionality
- **External Services**: Test third-party integrations
- **Performance**: Test system performance under load

### 2.2 Test Environment

#### Test Database
```php
// phpunit.xml
<php>
    <env name="APP_ENV" value="testing"/>
    <env name="DB_CONNECTION" value="sqlite"/>
    <env name="DB_DATABASE" value=":memory:"/>
    <env name="CACHE_DRIVER" value="array"/>
    <env name="SESSION_DRIVER" value="array"/>
    <env name="QUEUE_CONNECTION" value="sync"/>
    <env name="MAIL_MAILER" value="array"/>
    <env name="TELESCOPE_ENABLED" value="false"/>
</php>
```

#### Test Configuration
```php
// config/testing.php
<?php

return [
    'database' => [
        'default' => 'sqlite',
        'connections' => [
            'sqlite' => [
                'driver' => 'sqlite',
                'database' => ':memory:',
                'prefix' => '',
            ],
        ],
    ],
    'cache' => [
        'default' => 'array',
    ],
    'session' => [
        'driver' => 'array',
    ],
    'queue' => [
        'default' => 'sync',
    ],
    'mail' => [
        'driver' => 'array',
    ],
];
```

## 3. Unit Testing

### 3.1 Model Testing

#### Truck Model Tests
```php
<?php

namespace Tests\Unit\Models;

use App\Models\Truck;
use App\Models\VehicleType;
use App\Models\VehicleMaintenanceRecord;
use App\Models\FuelRecord;
use App\Models\TruckFinancialRecord;
use App\Models\Driver;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckTest extends TestCase
{
    use RefreshDatabase;

    public function test_truck_can_be_created()
    {
        $vehicleType = VehicleType::factory()->create();
        
        $truck = Truck::factory()->create([
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active'
        ]);
    }

    public function test_truck_belongs_to_vehicle_type()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create([
            'vehicletype_id' => $vehicleType->id
        ]);

        $this->assertInstanceOf(VehicleType::class, $truck->vehicletype);
        $this->assertEquals($vehicleType->id, $truck->vehicletype->id);
    }

    public function test_truck_has_many_maintenance_records()
    {
        $truck = Truck::factory()->create();
        $maintenanceRecord = VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id
        ]);

        $this->assertTrue($truck->maintenanceRecords->contains($maintenanceRecord));
        $this->assertInstanceOf(VehicleMaintenanceRecord::class, $truck->maintenanceRecords->first());
    }

    public function test_truck_has_many_fuel_records()
    {
        $truck = Truck::factory()->create();
        $fuelRecord = FuelRecord::factory()->create([
            'truck_id' => $truck->id
        ]);

        $this->assertTrue($truck->fuelRecords->contains($fuelRecord));
        $this->assertInstanceOf(FuelRecord::class, $truck->fuelRecords->first());
    }

    public function test_truck_has_many_financial_records()
    {
        $truck = Truck::factory()->create();
        $financialRecord = TruckFinancialRecord::factory()->create([
            'truck_id' => $truck->id
        ]);

        $this->assertTrue($truck->financialRecords->contains($financialRecord));
        $this->assertInstanceOf(TruckFinancialRecord::class, $truck->financialRecords->first());
    }

    public function test_truck_belongs_to_many_drivers()
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        $truck->drivers()->attach($driver->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        $this->assertTrue($truck->drivers->contains($driver));
        $this->assertInstanceOf(Driver::class, $truck->drivers->first());
    }

    public function test_truck_has_soft_deletes()
    {
        $truck = Truck::factory()->create();
        
        $truck->delete();
        
        $this->assertSoftDeleted('trucks', [
            'id' => $truck->id
        ]);
    }

    public function test_truck_can_be_restored()
    {
        $truck = Truck::factory()->create();
        
        $truck->delete();
        $truck->restore();
        
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'deleted_at' => null
        ]);
    }

    public function test_truck_casts_dates_correctly()
    {
        $truck = Truck::factory()->create([
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-02-01'
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->productionDate);
        $this->assertInstanceOf(\Carbon\Carbon::class, $truck->serviceStartDate);
    }

    public function test_truck_fillable_attributes()
    {
        $truck = new Truck();
        $fillable = $truck->getFillable();

        $expectedFillable = [
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

        $this->assertEquals($expectedFillable, $fillable);
    }
}
```

#### Driver Model Tests
```php
<?php

namespace Tests\Unit\Models;

use App\Models\Driver;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use App\Models\Truck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DriverTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_can_be_created()
    {
        $driver = Driver::factory()->create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'status' => 'active'
        ]);

        $this->assertDatabaseHas('drivers', [
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'status' => 'active'
        ]);
    }

    public function test_driver_has_many_performance_records()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();
        
        // Create driver-truck relationship
        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        $performanceRecord = DriverPerformanceRecord::factory()->create([
            'driver_id' => $driver->id,
            'truck_id' => $truck->id
        ]);

        $this->assertTrue($driver->performanceRecords->contains($performanceRecord));
        $this->assertInstanceOf(DriverPerformanceRecord::class, $driver->performanceRecords->first());
    }

    public function test_driver_has_many_safety_records()
    {
        $driver = Driver::factory()->create();
        $safetyRecord = DriverSafetyRecord::factory()->create([
            'driver_id' => $driver->id
        ]);

        $this->assertTrue($driver->safetyRecords->contains($safetyRecord));
        $this->assertInstanceOf(DriverSafetyRecord::class, $driver->safetyRecords->first());
    }

    public function test_driver_belongs_to_many_trucks()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        $this->assertTrue($driver->trucks->contains($truck));
        $this->assertInstanceOf(Truck::class, $driver->trucks->first());
    }

    public function test_driver_has_soft_deletes()
    {
        $driver = Driver::factory()->create();
        
        $driver->delete();
        
        $this->assertSoftDeleted('drivers', [
            'id' => $driver->id
        ]);
    }

    public function test_driver_casts_dates_correctly()
    {
        $driver = Driver::factory()->create([
            'birthdate' => '1990-01-01',
            'hireddate' => '2020-01-01'
        ]);

        $this->assertInstanceOf(\Carbon\Carbon::class, $driver->birthdate);
        $this->assertInstanceOf(\Carbon\Carbon::class, $driver->hireddate);
    }

    public function test_driver_fillable_attributes()
    {
        $driver = new Driver();
        $fillable = $driver->getFillable();

        $expectedFillable = [
            'driverid',
            'name',
            'sex',
            'birthdate',
            'zone',
            'woreda',
            'kebele',
            'housenumber',
            'mobile',
            'hireddate',
            'status'
        ];

        $this->assertEquals($expectedFillable, $fillable);
    }
}
```

### 3.2 Service Testing

#### TruckAssignmentService Tests
```php
<?php

namespace Tests\Unit\Services;

use App\Models\Truck;
use App\Models\Driver;
use App\Services\TruckAssignmentService;
use App\Exceptions\TruckAssignmentException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckAssignmentServiceTest extends TestCase
{
    use RefreshDatabase;

    protected TruckAssignmentService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new TruckAssignmentService();
    }

    public function test_can_assign_driver_to_truck()
    {
        $truck = Truck::factory()->create(['status' => 'active']);
        $driver = Driver::factory()->create(['status' => 'active']);

        $assignment = $this->service->assignDriverToTruck($driver, $truck);

        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active'
        ]);

        $this->assertEquals($driver->id, $assignment->driver_id);
        $this->assertEquals($truck->id, $assignment->truck_id);
    }

    public function test_cannot_assign_driver_to_inactive_truck()
    {
        $truck = Truck::factory()->create(['status' => 'inactive']);
        $driver = Driver::factory()->create(['status' => 'active']);

        $this->expectException(TruckAssignmentException::class);
        $this->expectExceptionMessage('Cannot assign driver to inactive truck');

        $this->service->assignDriverToTruck($driver, $truck);
    }

    public function test_cannot_assign_inactive_driver_to_truck()
    {
        $truck = Truck::factory()->create(['status' => 'active']);
        $driver = Driver::factory()->create(['status' => 'inactive']);

        $this->expectException(TruckAssignmentException::class);
        $this->expectExceptionMessage('Cannot assign inactive driver');

        $this->service->assignDriverToTruck($driver, $truck);
    }

    public function test_cannot_assign_driver_already_assigned_to_another_truck()
    {
        $truck1 = Truck::factory()->create(['status' => 'active']);
        $truck2 = Truck::factory()->create(['status' => 'active']);
        $driver = Driver::factory()->create(['status' => 'active']);

        // Assign driver to first truck
        $this->service->assignDriverToTruck($driver, $truck1);

        $this->expectException(TruckAssignmentException::class);
        $this->expectExceptionMessage('Driver is already assigned to another truck');

        $this->service->assignDriverToTruck($driver, $truck2);
    }

    public function test_can_unassign_driver_from_truck()
    {
        $truck = Truck::factory()->create(['status' => 'active']);
        $driver = Driver::factory()->create(['status' => 'active']);

        // Assign driver first
        $this->service->assignDriverToTruck($driver, $truck);

        // Unassign driver
        $this->service->unassignDriverFromTruck($driver, $truck);

        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'inactive'
        ]);
    }

    public function test_can_get_active_assignments()
    {
        $truck1 = Truck::factory()->create(['status' => 'active']);
        $truck2 = Truck::factory()->create(['status' => 'active']);
        $driver1 = Driver::factory()->create(['status' => 'active']);
        $driver2 = Driver::factory()->create(['status' => 'active']);

        // Assign drivers
        $this->service->assignDriverToTruck($driver1, $truck1);
        $this->service->assignDriverToTruck($driver2, $truck2);

        $assignments = $this->service->getActiveAssignments();

        $this->assertCount(2, $assignments);
        $this->assertTrue($assignments->contains('driver_id', $driver1->id));
        $this->assertTrue($assignments->contains('driver_id', $driver2->id));
    }
}
```

### 3.3 Validation Testing

#### Form Request Tests
```php
<?php

namespace Tests\Unit\Http\Requests;

use App\Http\Requests\StoreTruckRequest;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class StoreTruckRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_truck_data_passes_validation()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 1500000,
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-02-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertTrue($validator->passes());
    }

    public function test_plate_is_required()
    {
        $data = [
            'vehicletype_id' => 1,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 1500000,
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-02-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('plate', $validator->errors()->toArray());
    }

    public function test_plate_must_be_unique()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create([
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id
        ]);

        $data = [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 1500000,
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-02-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('plate', $validator->errors()->toArray());
    }

    public function test_service_interval_must_be_positive()
    {
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => -1000,
            'purchasePrice' => 1500000,
            'productionDate' => '2020-01-01',
            'serviceStartDate' => '2020-02-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('serviceIntervalKM', $validator->errors()->toArray());
    }

    public function test_production_date_must_be_before_today()
    {
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 1500000,
            'productionDate' => '2030-01-01',
            'serviceStartDate' => '2030-02-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('productionDate', $validator->errors()->toArray());
    }

    public function test_service_start_date_must_be_after_production_date()
    {
        $vehicleType = VehicleType::factory()->create();

        $data = [
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CHASIS123456',
            'engineNumber' => 'ENGINE123456',
            'tyreSyze' => '225/75R16',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 1500000,
            'productionDate' => '2020-02-01',
            'serviceStartDate' => '2020-01-01',
            'status' => 'active'
        ];

        $request = new StoreTruckRequest();
        $validator = Validator::make($data, $request->rules());

        $this->assertFalse($validator->passes());
        $this->assertArrayHasKey('serviceStartDate', $validator->errors()->toArray());
    }
}
```

## 4. Feature Testing

### 4.1 Controller Testing

#### TruckController Tests
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_view_trucks_index()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Index')
                    ->has('trucks.data', 1)
            );
    }

    public function test_user_can_view_truck_create_form()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.create'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Create')
                    ->has('vehicleTypes', 1)
            );
    }

    public function test_user_can_create_truck()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB'
        ]);
    }

    public function test_user_can_view_truck_details()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Show')
                    ->has('truck')
                    ->has('activityLogs')
            );
    }

    public function test_user_can_view_truck_edit_form()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.edit', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Edit')
                    ->has('truck')
                    ->has('vehicleTypes', 1)
            );
    }

    public function test_user_can_update_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->put(route('trucks.update', $truck), [
                'plate' => $truck->plate,
                'vehicletype_id' => $truck->vehicletype_id,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => 15000,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate,
                'serviceStartDate' => $truck->serviceStartDate,
                'status' => $truck->status
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'serviceIntervalKM' => 15000
        ]);
    }

    public function test_user_can_delete_truck()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', [
            'id' => $truck->id
        ]);
    }

    public function test_user_can_export_trucks()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="trucks_' . now()->format('Y-m-d_H-i-s') . '.csv"');
    }

    public function test_trucks_index_shows_search_results()
    {
        $user = User::factory()->create();
        $truck1 = Truck::factory()->create(['plate' => 'AA1234BB']);
        $truck2 = Truck::factory()->create(['plate' => 'BB5678CC']);

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => 'AA1234']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Index')
                    ->has('trucks.data', 1)
                    ->where('trucks.data.0.plate', 'AA1234BB')
            );
    }

    public function test_trucks_index_sorts_by_plate()
    {
        $user = User::factory()->create();
        $truck1 = Truck::factory()->create(['plate' => 'BB5678CC']);
        $truck2 = Truck::factory()->create(['plate' => 'AA1234BB']);

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['sort' => 'plate', 'direction' => 'asc']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Index')
                    ->has('trucks.data', 2)
                    ->where('trucks.data.0.plate', 'AA1234BB')
                    ->where('trucks.data.1.plate', 'BB5678CC')
            );
    }
}
```

### 4.2 Authentication Testing

#### Authentication Tests
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_login_with_valid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password')
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'password'
        ]);

        $response->assertRedirect('/dashboard');
        $this->assertAuthenticatedAs($user);
    }

    public function test_user_cannot_login_with_invalid_credentials()
    {
        $user = User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password')
        ]);

        $response = $this->post('/login', [
            'email' => 'test@example.com',
            'password' => 'wrong-password'
        ]);

        $response->assertSessionHasErrors('email');
        $this->assertGuest();
    }

    public function test_user_can_logout()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post('/logout');

        $response->assertRedirect('/');
        $this->assertGuest();
    }

    public function test_authenticated_user_can_access_protected_routes()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
    }

    public function test_guest_cannot_access_protected_routes()
    {
        $response = $this->get(route('trucks.index'));

        $response->assertRedirect('/login');
    }
}
```

### 4.3 Permission Testing

#### Permission Tests
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PermissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_with_permission_can_access_trucks_index()
    {
        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'trucks.view']);
        $user->givePermissionTo($permission);

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
    }

    public function test_user_without_permission_cannot_access_trucks_index()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(403);
    }

    public function test_user_with_role_can_access_trucks_index()
    {
        $user = User::factory()->create();
        $role = Role::create(['name' => 'admin']);
        $permission = Permission::create(['name' => 'trucks.view']);
        $role->givePermissionTo($permission);
        $user->assignRole($role);

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
    }

    public function test_user_can_create_truck_with_permission()
    {
        $user = User::factory()->create();
        $permission = Permission::create(['name' => 'trucks.create']);
        $user->givePermissionTo($permission);

        $response = $this->actingAs($user)
            ->get(route('trucks.create'));

        $response->assertStatus(200);
    }

    public function test_user_cannot_create_truck_without_permission()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.create'));

        $response->assertStatus(403);
    }
}
```

## 5. Integration Testing

### 5.1 Workflow Testing

#### Complete Truck Workflow Test
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TruckWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_complete_truck_workflow()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        // Step 1: Create truck
        $response = $this->actingAs($user)
            ->post(route('trucks.store'), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertRedirect(route('trucks.index'));

        // Step 2: View truck
        $truck = Truck::where('plate', 'AA1234BB')->first();
        $response = $this->actingAs($user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => 
                $page->component('Trucks/Show')
                    ->has('truck')
            );

        // Step 3: Update truck
        $response = $this->actingAs($user)
            ->put(route('trucks.update', $truck), [
                'plate' => $truck->plate,
                'vehicletype_id' => $truck->vehicletype_id,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => 15000,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate,
                'serviceStartDate' => $truck->serviceStartDate,
                'status' => $truck->status
            ]);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'plate' => 'AA1234BB',
            'serviceIntervalKM' => 15000
        ]);

        // Step 4: Export trucks
        $response = $this->actingAs($user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        // Step 5: Delete truck
        $response = $this->actingAs($user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', [
            'plate' => 'AA1234BB'
        ]);
    }
}
```

### 5.2 Database Integration Tests

#### Database Integration Tests
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\VehicleType;
use App\Models\Performance;
use App\Models\Operation;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DatabaseIntegrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_truck_driver_performance_integration()
    {
        // Create related models
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);
        $driver = Driver::factory()->create();
        $operation = Operation::factory()->create();
        $origin = Place::factory()->create();
        $destination = Place::factory()->create();

        // Create driver-truck relationship
        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        $driverTruck = $driver->trucks()->wherePivot('status', 'active')->first();

        // Create performance record
        $performance = Performance::factory()->create([
            'operation_id' => $operation->id,
            'driver_truck_id' => $driverTruck->pivot->id,
            'orgion_id' => $origin->id,
            'destination_id' => $destination->id,
            'user_id' => $user->id
        ]);

        // Test relationships
        $this->assertInstanceOf(Truck::class, $performance->driverTruck->truck);
        $this->assertInstanceOf(Driver::class, $performance->driverTruck->driver);
        $this->assertInstanceOf(Operation::class, $performance->operation);
        $this->assertInstanceOf(Place::class, $performance->origin);
        $this->assertInstanceOf(Place::class, $performance->destination);
        $this->assertInstanceOf(User::class, $performance->user);

        // Test data integrity
        $this->assertEquals($truck->id, $performance->driverTruck->truck->id);
        $this->assertEquals($driver->id, $performance->driverTruck->driver->id);
        $this->assertEquals($operation->id, $performance->operation->id);
        $this->assertEquals($origin->id, $performance->origin->id);
        $this->assertEquals($destination->id, $performance->destination->id);
        $this->assertEquals($user->id, $performance->user->id);
    }

    public function test_cascade_delete_behavior()
    {
        $vehicleType = VehicleType::factory()->create();
        $truck = Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);

        // Soft delete truck
        $truck->delete();

        // Verify truck is soft deleted
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);

        // Verify vehicle type still exists
        $this->assertDatabaseHas('vehicle_types', ['id' => $vehicleType->id]);

        // Restore truck
        $truck->restore();

        // Verify truck is restored
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'deleted_at' => null
        ]);
    }

    public function test_foreign_key_constraints()
    {
        $this->expectException(\Illuminate\Database\QueryException::class);

        // Try to create truck with non-existent vehicle type
        Truck::factory()->create(['vehicletype_id' => 99999]);
    }

    public function test_unique_constraints()
    {
        $vehicleType = VehicleType::factory()->create();

        // Create first truck
        Truck::factory()->create([
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id
        ]);

        $this->expectException(\Illuminate\Database\QueryException::class);

        // Try to create second truck with same plate
        Truck::factory()->create([
            'plate' => 'AA1234BB',
            'vehicletype_id' => $vehicleType->id
        ]);
    }
}
```

## 6. Performance Testing

### 6.1 Load Testing

#### Load Testing Script
```bash
#!/bin/bash
# load-test.sh

# Configuration
BASE_URL="http://localhost:8000"
CONCURRENT_USERS=10
REQUESTS_PER_USER=100

# Test endpoints
ENDPOINTS=(
    "/trucks"
    "/drivers"
    "/dashboard"
    "/trucks/export"
)

# Run load tests
for endpoint in "${ENDPOINTS[@]}"; do
    echo "Testing endpoint: $endpoint"
    
    # Apache Bench
    ab -n $REQUESTS_PER_USER -c $CONCURRENT_USERS "$BASE_URL$endpoint"
    
    # Artillery (if installed)
    # artillery quick --count $REQUESTS_PER_USER --num $CONCURRENT_USERS "$BASE_URL$endpoint"
    
    echo "---"
done
```

#### Performance Test Cases
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerformanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_trucks_index_performance()
    {
        $user = User::factory()->create();
        
        // Create 1000 trucks
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        $response->assertStatus(200);
        
        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $executionTime);
    }

    public function test_trucks_search_performance()
    {
        $user = User::factory()->create();
        
        // Create 1000 trucks
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => 'AA']));

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        $response->assertStatus(200);
        
        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $executionTime);
    }

    public function test_trucks_export_performance()
    {
        $user = User::factory()->create();
        
        // Create 1000 trucks
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($user)
            ->get(route('trucks.export'));

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        $response->assertStatus(200);
        
        // Assert response time is under 5 seconds
        $this->assertLessThan(5.0, $executionTime);
    }
}
```

### 6.2 Memory Usage Testing

#### Memory Usage Tests
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemoryUsageTest extends TestCase
{
    use RefreshDatabase;

    public function test_trucks_index_memory_usage()
    {
        $user = User::factory()->create();
        
        // Create 1000 trucks
        Truck::factory()->count(1000)->create();

        $memoryBefore = memory_get_usage();

        $response = $this->actingAs($user)
            ->get(route('trucks.index'));

        $memoryAfter = memory_get_usage();
        $memoryUsed = $memoryAfter - $memoryBefore;

        $response->assertStatus(200);
        
        // Assert memory usage is under 50MB
        $this->assertLessThan(50 * 1024 * 1024, $memoryUsed);
    }

    public function test_trucks_export_memory_usage()
    {
        $user = User::factory()->create();
        
        // Create 1000 trucks
        Truck::factory()->count(1000)->create();

        $memoryBefore = memory_get_usage();

        $response = $this->actingAs($user)
            ->get(route('trucks.export'));

        $memoryAfter = memory_get_usage();
        $memoryUsed = $memoryAfter - $memoryBefore;

        $response->assertStatus(200);
        
        // Assert memory usage is under 100MB
        $this->assertLessThan(100 * 1024 * 1024, $memoryUsed);
    }
}
```

## 7. Security Testing

### 7.1 Input Validation Testing

#### Security Test Cases
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_sql_injection_protection()
    {
        $user = User::factory()->create();

        $maliciousInput = "'; DROP TABLE trucks; --";

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => $maliciousInput]));

        $response->assertStatus(200);
        
        // Verify trucks table still exists
        $this->assertDatabaseHas('trucks', []);
    }

    public function test_xss_protection()
    {
        $user = User::factory()->create();

        $maliciousInput = "<script>alert('XSS')</script>";

        $response = $this->actingAs($user)
            ->get(route('trucks.index', ['search' => $maliciousInput]));

        $response->assertStatus(200);
        
        // Verify script tags are not present in response
        $this->assertStringNotContainsString('<script>', $response->getContent());
    }

    public function test_csrf_protection()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->post(route('trucks.store'), [
                'plate' => 'AA1234BB',
                'vehicletype_id' => 1,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertStatus(419); // CSRF token mismatch
    }

    public function test_authentication_required()
    {
        $response = $this->get(route('trucks.index'));

        $response->assertRedirect('/login');
    }

    public function test_permission_required()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->get(route('trucks.create'));

        $response->assertStatus(403);
    }
}
```

### 7.2 Authorization Testing

#### Authorization Test Cases
```php
<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_only_access_authorized_resources()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();
        
        $permission = Permission::create(['name' => 'trucks.view']);
        $user1->givePermissionTo($permission);

        // User 1 can access trucks
        $response = $this->actingAs($user1)
            ->get(route('trucks.index'));
        $response->assertStatus(200);

        // User 2 cannot access trucks
        $response = $this->actingAs($user2)
            ->get(route('trucks.index'));
        $response->assertStatus(403);
    }

    public function test_role_based_access_control()
    {
        $admin = User::factory()->create();
        $user = User::factory()->create();
        
        $adminRole = Role::create(['name' => 'admin']);
        $userRole = Role::create(['name' => 'user']);
        
        $trucksViewPermission = Permission::create(['name' => 'trucks.view']);
        $trucksCreatePermission = Permission::create(['name' => 'trucks.create']);
        
        $adminRole->givePermissionTo([$trucksViewPermission, $trucksCreatePermission]);
        $userRole->givePermissionTo($trucksViewPermission);
        
        $admin->assignRole($adminRole);
        $user->assignRole($userRole);

        // Admin can create trucks
        $response = $this->actingAs($admin)
            ->get(route('trucks.create'));
        $response->assertStatus(200);

        // User cannot create trucks
        $response = $this->actingAs($user)
            ->get(route('trucks.create'));
        $response->assertStatus(403);
    }
}
```

## 8. Frontend Testing

### 8.1 Component Testing (Future)

#### React Component Tests
```typescript
// TruckIndex.test.tsx (Future implementation)
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TruckIndex from './TruckIndex'

// Mock Inertia.js
jest.mock('@inertiajs/react', () => ({
  Head: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
  useForm: () => ({
    data: {},
    setData: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    processing: false,
    errors: {},
    reset: jest.fn(),
  }),
}))

// Mock hooks
jest.mock('@/hooks/use-permissions', () => ({
  usePermissions: () => ({
    hasPermission: jest.fn(() => true),
  }),
}))

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}))

const mockTrucks = {
  data: [
    {
      id: 1,
      plate: 'AA1234BB',
      vehicletype: { name: 'Heavy Truck' },
      status: 'active',
      created_at: '2024-01-01T00:00:00Z',
    },
  ],
  total: 1,
  current_page: 1,
  last_page: 1,
  per_page: 15,
}

const mockProps = {
  auth: { user: { id: 1, name: 'Test User' } },
  trucks: mockTrucks,
  search: '',
  sort: 'plate',
  direction: 'asc' as const,
  success: '',
  error: '',
}

describe('TruckIndex', () => {
  it('renders truck list', () => {
    render(
      <BrowserRouter>
        <TruckIndex {...mockProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('AA1234BB')).toBeInTheDocument()
    expect(screen.getByText('Heavy Truck')).toBeInTheDocument()
    expect(screen.getByText('active')).toBeInTheDocument()
  })

  it('shows add truck button when user has permission', () => {
    render(
      <BrowserRouter>
        <TruckIndex {...mockProps} />
      </BrowserRouter>
    )

    expect(screen.getByText('Add New Truck')).toBeInTheDocument()
  })

  it('handles search input', async () => {
    render(
      <BrowserRouter>
        <TruckIndex {...mockProps} />
      </BrowserRouter>
    )

    const searchInput = screen.getByPlaceholderText('Search trucks...')
    fireEvent.change(searchInput, { target: { value: 'AA1234' } })

    await waitFor(() => {
      expect(searchInput).toHaveValue('AA1234')
    })
  })

  it('handles delete confirmation', async () => {
    render(
      <BrowserRouter>
        <TruckIndex {...mockProps} />
      </BrowserRouter>
    )

    const deleteButton = screen.getByText('Delete')
    fireEvent.click(deleteButton)

    await waitFor(() => {
      expect(screen.getByText('Delete Truck')).toBeInTheDocument()
      expect(screen.getByText('Are you sure you want to delete the truck with plate AA1234BB?')).toBeInTheDocument()
    })
  })
})
```

### 8.2 E2E Testing (Future)

#### Cypress E2E Tests
```typescript
// cypress/e2e/truck-management.cy.ts (Future implementation)
describe('Truck Management', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password')
  })

  it('should display trucks list', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="trucks-table"]').should('be.visible')
    cy.get('[data-testid="truck-row"]').should('have.length.at.least', 1)
  })

  it('should create a new truck', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="add-truck-button"]').click()
    
    cy.get('[data-testid="plate-input"]').type('AA1234BB')
    cy.get('[data-testid="chasis-number-input"]').type('CHASIS123456')
    cy.get('[data-testid="engine-number-input"]').type('ENGINE123456')
    cy.get('[data-testid="tyre-size-input"]').type('225/75R16')
    cy.get('[data-testid="service-interval-input"]').type('10000')
    cy.get('[data-testid="purchase-price-input"]').type('1500000')
    cy.get('[data-testid="production-date-input"]').type('2020-01-01')
    cy.get('[data-testid="service-start-date-input"]').type('2020-02-01')
    cy.get('[data-testid="status-select"]').select('active')
    
    cy.get('[data-testid="submit-button"]').click()
    
    cy.url().should('include', '/trucks')
    cy.get('[data-testid="success-message"]').should('contain', 'Truck created successfully')
  })

  it('should edit an existing truck', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="edit-button"]').first().click()
    
    cy.get('[data-testid="service-interval-input"]').clear().type('15000')
    cy.get('[data-testid="submit-button"]').click()
    
    cy.url().should('include', '/trucks')
    cy.get('[data-testid="success-message"]').should('contain', 'Truck updated successfully')
  })

  it('should delete a truck', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="delete-button"]').first().click()
    cy.get('[data-testid="confirm-delete-button"]').click()
    
    cy.get('[data-testid="success-message"]').should('contain', 'Truck deleted successfully')
  })

  it('should export trucks to CSV', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="export-button"]').click()
    
    // Verify file download
    cy.readFile('cypress/downloads/trucks_*.csv').should('exist')
  })

  it('should search trucks', () => {
    cy.visit('/trucks')
    cy.get('[data-testid="search-input"]').type('AA1234')
    cy.get('[data-testid="search-button"]').click()
    
    cy.get('[data-testid="truck-row"]').should('contain', 'AA1234')
  })
})
```

## 9. API Testing

### 9.1 API Endpoint Tests

#### API Test Cases
```php
<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_trucks_api_endpoint()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/trucks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'plate',
                        'vehicletype_id',
                        'chasisNumber',
                        'engineNumber',
                        'tyreSyze',
                        'serviceIntervalKM',
                        'purchasePrice',
                        'productionDate',
                        'serviceStartDate',
                        'status',
                        'created_at',
                        'updated_at'
                    ]
                ],
                'links',
                'meta'
            ]);
    }

    public function test_trucks_api_create()
    {
        $user = User::factory()->create();
        $vehicleType = VehicleType::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/trucks', [
                'plate' => 'AA1234BB',
                'vehicletype_id' => $vehicleType->id,
                'chasisNumber' => 'CHASIS123456',
                'engineNumber' => 'ENGINE123456',
                'tyreSyze' => '225/75R16',
                'serviceIntervalKM' => 10000,
                'purchasePrice' => 1500000,
                'productionDate' => '2020-01-01',
                'serviceStartDate' => '2020-02-01',
                'status' => 'active'
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'vehicletype_id',
                    'chasisNumber',
                    'engineNumber',
                    'tyreSyze',
                    'serviceIntervalKM',
                    'purchasePrice',
                    'productionDate',
                    'serviceStartDate',
                    'status',
                    'created_at',
                    'updated_at'
                ]
            ]);
    }

    public function test_trucks_api_validation()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/api/trucks', [
                'plate' => '',
                'vehicletype_id' => 99999,
                'chasisNumber' => '',
                'engineNumber' => '',
                'tyreSyze' => '',
                'serviceIntervalKM' => -1000,
                'purchasePrice' => -1000,
                'productionDate' => '2030-01-01',
                'serviceStartDate' => '2020-01-01',
                'status' => 'invalid'
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors([
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
            ]);
    }

    public function test_trucks_api_show()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->getJson("/api/trucks/{$truck->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'vehicletype_id',
                    'chasisNumber',
                    'engineNumber',
                    'tyreSyze',
                    'serviceIntervalKM',
                    'purchasePrice',
                    'productionDate',
                    'serviceStartDate',
                    'status',
                    'created_at',
                    'updated_at'
                ]
            ]);
    }

    public function test_trucks_api_update()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->putJson("/api/trucks/{$truck->id}", [
                'plate' => $truck->plate,
                'vehicletype_id' => $truck->vehicletype_id,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => 15000,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate,
                'serviceStartDate' => $truck->serviceStartDate,
                'status' => $truck->status
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.serviceIntervalKM', 15000);
    }

    public function test_trucks_api_delete()
    {
        $user = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($user)
            ->deleteJson("/api/trucks/{$truck->id}");

        $response->assertStatus(204);
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);
    }
}
```

## 10. Test Data Management

### 10.1 Factories

#### Model Factories
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

### 10.2 Seeders

#### Test Seeders
```php
<?php

namespace Database\Seeders;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\VehicleType;
use App\Models\User;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Database\Seeder;

class TestSeeder extends Seeder
{
    public function run(): void
    {
        // Create test users
        $admin = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);

        $user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@test.com',
        ]);

        // Create roles
        $adminRole = Role::create(['name' => 'admin']);
        $userRole = Role::create(['name' => 'user']);

        // Create permissions
        $permissions = [
            'trucks.view',
            'trucks.show',
            'trucks.create',
            'trucks.store',
            'trucks.edit',
            'trucks.update',
            'trucks.destroy',
            'trucks.export',
            'drivers.view',
            'drivers.show',
            'drivers.create',
            'drivers.store',
            'drivers.edit',
            'drivers.update',
            'drivers.destroy',
            'drivers.export',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission]);
        }

        // Assign permissions to roles
        $adminRole->givePermissionTo(Permission::all());
        $userRole->givePermissionTo(Permission::whereIn('name', [
            'trucks.view',
            'trucks.show',
            'drivers.view',
            'drivers.show',
        ])->get());

        // Assign roles to users
        $admin->assignRole($adminRole);
        $user->assignRole($userRole);

        // Create vehicle types
        $vehicleTypes = [
            ['name' => 'Heavy Truck', 'description' => 'Large cargo truck'],
            ['name' => 'Light Truck', 'description' => 'Small delivery truck'],
            ['name' => 'Pickup', 'description' => 'Pickup truck'],
        ];

        foreach ($vehicleTypes as $vehicleType) {
            VehicleType::create($vehicleType);
        }

        // Create test trucks
        Truck::factory()->count(50)->create();

        // Create test drivers
        Driver::factory()->count(30)->create();
    }
}
```

## 11. Continuous Integration

### 11.1 GitHub Actions

#### CI Workflow
```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: password
          MYSQL_DATABASE: tims_test
        ports:
          - 3306:3306
        options: --health-cmd="mysqladmin ping" --health-interval=10s --health-timeout=5s --health-retries=3

    steps:
    - uses: actions/checkout@v3

    - name: Setup PHP
      uses: shivammathur/setup-php@v2
      with:
        php-version: '8.2'
        extensions: mbstring, xml, ctype, iconv, intl, pdo_mysql, dom, filter, gd, iconv, json, mbstring, pdo

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install Composer dependencies
      run: composer install --no-progress --prefer-dist --optimize-autoloader

    - name: Install NPM dependencies
      run: npm ci

    - name: Build assets
      run: npm run build

    - name: Copy .env
      run: php -r "file_exists('.env') || copy('.env.example', '.env');"

    - name: Generate key
      run: php artisan key:generate

    - name: Directory Permissions
      run: chmod -R 777 storage bootstrap/cache

    - name: Create Database
      run: |
        mkdir -p database
        touch database/database.sqlite

    - name: Execute tests (Unit and Feature tests) via PHPUnit
      env:
        DB_CONNECTION: sqlite
        DB_DATABASE: database/database.sqlite
      run: php artisan test --coverage

    - name: Upload coverage reports to Codecov
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
```

### 11.2 Test Coverage

#### Coverage Configuration
```xml
<!-- phpunit.xml -->
<phpunit xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:noNamespaceSchemaLocation="./vendor/phpunit/phpunit/phpunit.xsd"
         bootstrap="vendor/autoload.php"
         colors="true">
    <testsuites>
        <testsuite name="Unit">
            <directory suffix="Test.php">./tests/Unit</directory>
        </testsuite>
        <testsuite name="Feature">
            <directory suffix="Test.php">./tests/Feature</directory>
        </testsuite>
    </testsuites>
    <source>
        <include>
            <directory suffix=".php">./app</directory>
        </include>
    </source>
    <coverage>
        <report>
            <html outputDirectory="coverage"/>
            <text outputFile="coverage.txt"/>
            <clover outputFile="coverage.xml"/>
        </report>
    </coverage>
    <php>
        <env name="APP_ENV" value="testing"/>
        <env name="BCRYPT_ROUNDS" value="4"/>
        <env name="CACHE_DRIVER" value="array"/>
        <env name="DB_CONNECTION" value="sqlite"/>
        <env name="DB_DATABASE" value=":memory:"/>
        <env name="MAIL_MAILER" value="array"/>
        <env name="QUEUE_CONNECTION" value="sync"/>
        <env name="SESSION_DRIVER" value="array"/>
        <env name="TELESCOPE_ENABLED" value="false"/>
    </php>
</phpunit>
```

## 12. Test Coverage

### 12.1 Coverage Goals

#### Coverage Targets
- **Unit Tests**: 90%+ coverage
- **Feature Tests**: 80%+ coverage
- **Integration Tests**: 70%+ coverage
- **Overall Coverage**: 85%+ coverage

#### Coverage Reports
```bash
# Generate coverage report
php artisan test --coverage

# Generate HTML coverage report
php artisan test --coverage-html coverage

# Generate XML coverage report
php artisan test --coverage-clover coverage.xml
```

### 12.2 Coverage Analysis

#### Coverage Metrics
```bash
# Check coverage percentage
php artisan test --coverage-text

# Generate detailed coverage report
php artisan test --coverage-html coverage --coverage-text
```

#### Coverage Monitoring
```bash
# Set coverage threshold
php artisan test --coverage --min=85

# Fail if coverage is below threshold
php artisan test --coverage --min=85 --fail-on-warning
```

---

**Last Updated**: October 21, 2025  
**Version**: 1.0.0  
**Status**: Production Ready  
**Maintainer**: QA Team

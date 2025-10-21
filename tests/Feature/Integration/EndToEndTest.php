<?php

namespace Tests\Feature\Integration;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\VehicleType;
use App\Models\Zone;
use App\Models\Woreda;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EndToEndTest extends TestCase
{
    use RefreshDatabase;

    protected $user;
    protected $vehicleType;
    protected $zone;
    protected $woreda;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
            'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.destroy',
            'trucks.show', 'trucks.store', 'trucks.update', 'trucks.export',
            'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.destroy',
            'drivers.show', 'drivers.store', 'drivers.update', 'drivers.export',
            'maintenance.view', 'maintenance.create', 'maintenance.edit', 'maintenance.destroy',
            'maintenance.show', 'maintenance.store', 'maintenance.update', 'maintenance.export',
            'fuel.view', 'fuel.create', 'fuel.edit', 'fuel.destroy',
            'fuel.show', 'fuel.store', 'fuel.update', 'fuel.export',
            'financial.view', 'financial.create', 'financial.edit', 'financial.destroy',
            'financial.show', 'financial.store', 'financial.update', 'financial.export'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);

        // Create related models
        $this->vehicleType = VehicleType::factory()->create();
        $this->zone = Zone::factory()->create();
        $this->woreda = Woreda::factory()->create(['zone_id' => $this->zone->id]);
    }

    /** @test */
    public function complete_fleet_management_workflow()
    {
        // 1. Create a truck
        $truckData = [
            'plate' => 'E2E-001',
            'vehicletype_id' => $this->vehicleType->id,
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'tyreSyze' => '12R22.5',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 500000,
            'productionDate' => '2023-01-01',
            'serviceStartDate' => '2023-02-01',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'E2E-001']);

        $truck = Truck::where('plate', 'E2E-001')->first();

        // 2. Create a driver
        $driverData = [
            'name' => 'John Doe',
            'driver_id' => 'DRV001',
            'mobile' => '+251911234567',
            'sex' => 'Male',
            'birthdate' => '1990-05-15',
            'hired_date' => '2020-01-01',
            'zone_id' => $this->zone->id,
            'woreda_id' => $this->woreda->id,
            'kebele' => '01',
            'house_number' => '123',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['name' => 'John Doe']);

        $driver = Driver::where('name', 'John Doe')->first();

        // 3. Assign driver to truck
        $response = $this->actingAs($this->user)
            ->post(route('drivers.assign-truck', $driver), [
                'truck_id' => $truck->id,
                'assigned_date' => now()->format('Y-m-d')
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active'
        ]);

        // 4. Create maintenance record
        $maintenanceData = [
            'truck_id' => $truck->id,
            'maintenance_type_id' => \App\Models\MaintenanceType::factory()->create()->id,
            'scheduled_date' => '2023-12-01',
            'status' => 'scheduled',
            'description' => 'Regular maintenance',
            'cost' => 1500.00
        ];

        $response = $this->actingAs($this->user)
            ->post(route('maintenance.store'), $maintenanceData);

        $response->assertRedirect(route('maintenance.index'));
        $this->assertDatabaseHas('vehicle_maintenance_records', ['truck_id' => $truck->id]);

        $maintenance = \App\Models\VehicleMaintenanceRecord::where('truck_id', $truck->id)->first();

        // 5. Complete maintenance
        $response = $this->actingAs($this->user)
            ->put(route('maintenance.update', $maintenance), [
                'truck_id' => $truck->id,
                'maintenance_type_id' => $maintenance->maintenance_type_id,
                'scheduled_date' => '2023-12-01',
                'completed_date' => '2023-12-02',
                'status' => 'completed',
                'description' => 'Regular maintenance completed',
                'cost' => 1500.00
            ]);

        $response->assertRedirect(route('maintenance.show', $maintenance));
        $this->assertDatabaseHas('vehicle_maintenance_records', [
            'id' => $maintenance->id,
            'status' => 'completed'
        ]);

        // 6. Create fuel record
        $fuelData = [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'fuel_date' => '2023-12-01',
            'fuel_quantity_liters' => 50.0,
            'fuel_price_per_liter' => 45.0,
            'total_cost' => 2250.0,
            'fuel_type' => 'Diesel',
            'fuel_station' => 'Shell Station',
            'receipt_number' => 'RCP001',
            'odometer_reading' => 100000,
            'notes' => 'Regular fuel fill'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('fuel.store'), $fuelData);

        $response->assertRedirect(route('fuel.index'));
        $this->assertDatabaseHas('fuel_records', ['truck_id' => $truck->id]);

        $fuel = \App\Models\FuelRecord::where('truck_id', $truck->id)->first();

        // 7. Create financial record
        $financialData = [
            'truck_id' => $truck->id,
            'record_date' => '2023-12-01',
            'period_type' => 'monthly',
            'revenue' => 50000.00,
            'fuel_cost' => 15000.00,
            'maintenance_cost' => 5000.00,
            'driver_salary' => 8000.00,
            'insurance_cost' => 2000.00,
            'depreciation' => 3000.00,
            'other_costs' => 1000.00,
            'notes' => 'Monthly financial record'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('financial.store'), $financialData);

        $response->assertRedirect(route('financial.index'));
        $this->assertDatabaseHas('truck_financial_records', ['truck_id' => $truck->id]);

        $financial = \App\Models\TruckFinancialRecord::where('truck_id', $truck->id)->first();

        // 8. Verify all data is accessible
        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Show')
                ->where('truck.id', $truck->id)
            );

        $response = $this->actingAs($this->user)
            ->get(route('drivers.show', $driver));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Show')
                ->where('driver.id', $driver->id)
            );

        // 9. Test search functionality
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['search' => 'E2E']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 1)
                ->where('trucks.data.0.plate', 'E2E-001')
            );

        // 10. Test export functionality
        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        // 11. Test dashboard
        $response = $this->actingAs($this->user)
            ->get(route('dashboard'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('stats')
            );

        // 12. Verify activity logs
        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id
        ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\Driver',
            'subject_id' => $driver->id
        ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\VehicleMaintenanceRecord',
            'subject_id' => $maintenance->id
        ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\FuelRecord',
            'subject_id' => $fuel->id
        ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\TruckFinancialRecord',
            'subject_id' => $financial->id
        ]);
    }

    /** @test */
    public function complete_user_management_workflow()
    {
        // 1. Create a new user
        $userData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('users.store'), $userData);

        $response->assertRedirect(route('users.index'));
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);

        $newUser = User::where('email', 'newuser@example.com')->first();

        // 2. Create a role
        $roleData = [
            'name' => 'manager',
            'guard_name' => 'web'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('roles.store'), $roleData);

        $response->assertRedirect(route('roles.index'));
        $this->assertDatabaseHas('roles', ['name' => 'manager']);

        $role = \App\Models\Role::where('name', 'manager')->first();

        // 3. Create permissions
        $permissions = ['trucks.view', 'drivers.view'];
        foreach ($permissions as $permission) {
            $permissionData = [
                'name' => $permission,
                'guard_name' => 'web'
            ];

            $response = $this->actingAs($this->user)
                ->post(route('permissions.store'), $permissionData);

            $response->assertRedirect(route('permissions.index'));
            $this->assertDatabaseHas('permissions', ['name' => $permission]);
        }

        // 4. Assign permissions to role
        $role->givePermissionTo($permissions);

        // 5. Assign role to user
        $newUser->assignRole($role);

        // 6. Verify permissions
        $this->assertTrue($newUser->hasRole('manager'));
        $this->assertTrue($newUser->hasPermissionTo('trucks.view'));
        $this->assertTrue($newUser->hasPermissionTo('drivers.view'));

        // 7. Test access with new user
        $response = $this->actingAs($newUser)
            ->get(route('trucks.index'));

        $response->assertStatus(200);

        $response = $this->actingAs($newUser)
            ->get(route('drivers.index'));

        $response->assertStatus(200);

        // 8. Test restricted access
        $response = $this->actingAs($newUser)
            ->get(route('trucks.create'));

        $response->assertStatus(403);
    }

    /** @test */
    public function complete_geographic_management_workflow()
    {
        // 1. Create a region
        $regionData = [
            'name' => 'Test Region'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('regions.store'), $regionData);

        $response->assertRedirect(route('regions.index'));
        $this->assertDatabaseHas('regions', ['name' => 'Test Region']);

        $region = \App\Models\Region::where('name', 'Test Region')->first();

        // 2. Create a zone in the region
        $zoneData = [
            'name' => 'Test Zone',
            'region_id' => $region->id
        ];

        $response = $this->actingAs($this->user)
            ->post(route('zones.store'), $zoneData);

        $response->assertRedirect(route('zones.index'));
        $this->assertDatabaseHas('zones', ['name' => 'Test Zone']);

        $zone = \App\Models\Zone::where('name', 'Test Zone')->first();

        // 3. Create a woreda in the zone
        $woredaData = [
            'name' => 'Test Woreda',
            'zone_id' => $zone->id
        ];

        $response = $this->actingAs($this->user)
            ->post(route('woredas.store'), $woredaData);

        $response->assertRedirect(route('woredas.index'));
        $this->assertDatabaseHas('woredas', ['name' => 'Test Woreda']);

        $woreda = \App\Models\Woreda::where('name', 'Test Woreda')->first();

        // 4. Create a place in the woreda
        $placeData = [
            'name' => 'Test Place',
            'woreda_id' => $woreda->id
        ];

        $response = $this->actingAs($this->user)
            ->post(route('places.store'), $placeData);

        $response->assertRedirect(route('places.index'));
        $this->assertDatabaseHas('places', ['name' => 'Test Place']);

        $place = \App\Models\Place::where('name', 'Test Place')->first();

        // 5. Verify relationships
        $this->assertEquals($region->id, $zone->region_id);
        $this->assertEquals($zone->id, $woreda->zone_id);
        $this->assertEquals($woreda->id, $place->woreda_id);

        // 6. Test hierarchical display
        $response = $this->actingAs($this->user)
            ->get(route('regions.show', $region));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Regions/Show')
                ->where('region.id', $region->id)
            );

        // 7. Test search across hierarchy
        $response = $this->actingAs($this->user)
            ->get(route('places.index', ['search' => 'Test']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Places/Index')
                ->has('places.data', 1)
                ->where('places.data.0.name', 'Test Place')
            );
    }

    /** @test */
    public function complete_cargo_management_workflow()
    {
        // 1. Create a cargo type
        $cargoData = [
            'name' => 'Test Cargo',
            'category' => 'Construction',
            'weight_per_cubic_meter' => 2.5,
            'handling_requirements' => 'Handle with care',
            'safety_requirements' => 'Wear safety equipment'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('cargo-types.store'), $cargoData);

        $response->assertRedirect(route('cargo-types.index'));
        $this->assertDatabaseHas('cargo_types', ['name' => 'Test Cargo']);

        $cargoType = \App\Models\CargoType::where('name', 'Test Cargo')->first();

        // 2. Create a customer
        $customerData = [
            'name' => 'Test Customer',
            'contact_person' => 'John Smith',
            'phone' => '+251911234567',
            'email' => 'customer@example.com',
            'address' => 'Test Address',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('customers.store'), $customerData);

        $response->assertRedirect(route('customers.index'));
        $this->assertDatabaseHas('customers', ['name' => 'Test Customer']);

        $customer = \App\Models\Customer::where('name', 'Test Customer')->first();

        // 3. Create an operation
        $operationData = [
            'operationid' => 'OP001',
            'customer_id' => $customer->id,
            'startdate' => '2023-12-01',
            'region_id' => $this->zone->region_id,
            'volume' => 100.0,
            'cargotype' => 'Test Cargo',
            'km' => 500.0,
            'tariff' => 50.0,
            'status' => 'open',
            'closed' => false,
            'user_id' => $this->user->id
        ];

        $response = $this->actingAs($this->user)
            ->post(route('operations.store'), $operationData);

        $response->assertRedirect(route('operations.index'));
        $this->assertDatabaseHas('operations', ['operationid' => 'OP001']);

        $operation = \App\Models\Operation::where('operationid', 'OP001')->first();

        // 4. Verify relationships
        $this->assertEquals($customer->id, $operation->customer_id);
        $this->assertEquals('Test Cargo', $operation->cargotype);

        // 5. Test search functionality
        $response = $this->actingAs($this->user)
            ->get(route('cargo-types.index', ['search' => 'Test']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('CargoTypes/Index')
                ->has('cargoTypes.data', 1)
                ->where('cargoTypes.data.0.name', 'Test Cargo')
            );

        // 6. Test category filtering
        $response = $this->actingAs($this->user)
            ->get(route('cargo-types.index', ['category' => 'Construction']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('CargoTypes/Index')
                ->has('cargoTypes.data', 1)
                ->where('cargoTypes.data.0.category', 'Construction')
            );
    }

    /** @test */
    public function complete_status_management_workflow()
    {
        // 1. Create a status type
        $statusTypeData = [
            'name' => 'Test Status Type',
            'description' => 'Test description'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statustypes.store'), $statusTypeData);

        $response->assertRedirect(route('statustypes.index'));
        $this->assertDatabaseHas('statustypes', ['name' => 'Test Status Type']);

        $statusType = \App\Models\StatusType::where('name', 'Test Status Type')->first();

        // 2. Create a status
        $statusData = [
            'name' => 'Test Status',
            'statustype_id' => $statusType->id,
            'description' => 'Test status description'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statuses.store'), $statusData);

        $response->assertRedirect(route('statuses.index'));
        $this->assertDatabaseHas('statuses', ['name' => 'Test Status']);

        $status = \App\Models\Status::where('name', 'Test Status')->first();

        // 3. Verify relationship
        $this->assertEquals($statusType->id, $status->statustype_id);

        // 4. Test search functionality
        $response = $this->actingAs($this->user)
            ->get(route('statuses.index', ['search' => 'Test']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Statuses/Index')
                ->has('statuses.data', 1)
                ->where('statuses.data.0.name', 'Test Status')
            );

        // 5. Test filtering by status type
        $response = $this->actingAs($this->user)
            ->get(route('statuses.index', ['statustype_id' => $statusType->id]));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Statuses/Index')
                ->has('statuses.data', 1)
                ->where('statuses.data.0.statustype_id', $statusType->id)
            );
    }

    /** @test */
    public function complete_reporting_workflow()
    {
        // Create test data
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        // Assign driver to truck
        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        // Create maintenance record
        \App\Models\VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truck->id,
            'cost' => 1000.00
        ]);

        // Create fuel record
        \App\Models\FuelRecord::factory()->create([
            'truck_id' => $truck->id,
            'total_cost' => 500.00
        ]);

        // Create financial record
        \App\Models\TruckFinancialRecord::factory()->create([
            'truck_id' => $truck->id,
            'revenue' => 10000.00,
            'net_profit' => 8500.00
        ]);

        // 1. Test truck report
        $response = $this->actingAs($this->user)
            ->get(route('reports.trucks'));

        $response->assertStatus(200);

        // 2. Test driver report
        $response = $this->actingAs($this->user)
            ->get(route('reports.drivers'));

        $response->assertStatus(200);

        // 3. Test maintenance report
        $response = $this->actingAs($this->user)
            ->get(route('reports.maintenance'));

        $response->assertStatus(200);

        // 4. Test financial report
        $response = $this->actingAs($this->user)
            ->get(route('reports.financial'));

        $response->assertStatus(200);

        // 5. Test dashboard with data
        $response = $this->actingAs($this->user)
            ->get(route('dashboard'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Dashboard')
                ->has('stats')
                ->has('dailyPerformance')
                ->has('operationsReport')
                ->has('statusBreakdown')
                ->has('recentPerformances')
            );
    }
}

<?php

namespace Tests\Feature\Validation;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Operation;
use App\Models\Place;
use App\Models\Region;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Validator;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ValidationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

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
            'operations.view', 'operations.create', 'operations.store', 'operations.edit',
            'operations.update', 'operations.destroy', 'operations.export',
            'performances.view', 'performances.create', 'performances.store', 'performances.edit',
            'performances.update', 'performances.destroy', 'performances.export',
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);
    }

    /** @test */
    public function truck_validation_rules_work()
    {
        $vehicleType = VehicleType::factory()->create();

        // Test valid data
        $validData = [
            'plate' => 'ABC-123',
            'vehicletype_id' => $vehicleType->id,
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'tyreSyze' => '12R22.5',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 500000,
            'productionDate' => '2023-01-01',
            'serviceStartDate' => '2023-02-01',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $validData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'ABC-123']);

        // Test invalid data
        $invalidData = [
            'plate' => '', // Empty plate
            'vehicletype_id' => 99999, // Non-existent vehicle type
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $invalidData);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function driver_validation_rules_work()
    {
        $zone = Zone::factory()->create();
        $woreda = Woreda::factory()->create(['zone_id' => $zone->id]);

        // Test valid data
        $validData = [
            'name' => 'John Doe',
            'driver_id' => 'DRV001',
            'mobile' => '+251911234567',
            'sex' => 'Male',
            'birthdate' => '1990-05-15',
            'hired_date' => '2020-01-01',
            'zone_id' => $zone->id,
            'woreda_id' => $woreda->id,
            'kebele' => '01',
            'house_number' => '123',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $validData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['name' => 'John Doe']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'driver_id' => '', // Empty driver ID
            'mobile' => 'invalid_mobile', // Invalid mobile format
            'sex' => 'invalid_sex', // Invalid sex
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'driver_id', 'mobile', 'sex', 'status']);
    }

    /** @test */
    public function maintenance_validation_rules_work()
    {
        $truck = Truck::factory()->create();
        $mechanic = User::factory()->create();
        $scheduledDate = Carbon::now()->addDays(7)->toDateString();
        $completedDate = Carbon::now()->addDays(8)->toDateString();

        // Test valid data
        $validData = [
            'truck_id' => $truck->id,
            'maintenance_type_id' => \App\Models\MaintenanceType::factory()->create()->id,
            'scheduled_date' => $scheduledDate,
            'completed_date' => $completedDate,
            'status' => 'scheduled',
            'description' => 'Regular maintenance',
            'cost' => 1500.00,
            'odometer_reading' => 123456,
            'work_performed' => 'Inspection and oil change prepared.',
            'parts_replaced' => 'Oil filter',
            'service_provider' => 'Acme Workshop',
            'assigned_mechanic_id' => $mechanic->id,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('maintenance.store'), $validData);

        $response->assertRedirect(route('maintenance.index'));
        $this->assertDatabaseHas('vehicle_maintenance_records', ['truck_id' => $truck->id]);

        // Test invalid data
        $invalidData = [
            'truck_id' => 99999,
            'maintenance_type_id' => 99999,
            'scheduled_date' => Carbon::now()->subDay()->toDateString(),
            'completed_date' => Carbon::now()->subDays(5)->toDateString(),
            'status' => 'invalid_status',
            'cost' => 'invalid_cost',
            'odometer_reading' => -10,
            'service_provider' => str_repeat('X', 300),
            'work_performed' => str_repeat('Y', 2501),
            'parts_replaced' => str_repeat('Z', 2501),
            'assigned_mechanic_id' => 999999,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('maintenance.store'), $invalidData);

        $response->assertSessionHasErrors([
            'truck_id',
            'maintenance_type_id',
            'scheduled_date',
            'completed_date',
            'status',
            'cost',
            'odometer_reading',
            'service_provider',
            'work_performed',
            'parts_replaced',
            'assigned_mechanic_id',
        ]);
    }

    /** @test */
    public function fuel_validation_rules_work()
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        // Test valid data
        $validData = [
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
            'notes' => 'Regular fuel fill',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('fuel.store'), $validData);

        $response->assertRedirect(route('fuel.index'));
        $this->assertDatabaseHas('fuel_records', ['truck_id' => $truck->id]);

        // Test invalid data
        $invalidData = [
            'truck_id' => 99999, // Non-existent truck
            'driver_id' => 99999, // Non-existent driver
            'fuel_date' => 'invalid_date', // Invalid date format
            'fuel_quantity_liters' => 'invalid_quantity', // Invalid quantity format
            'fuel_price_per_liter' => 'invalid_price', // Invalid price format
            'total_cost' => 'invalid_cost', // Invalid cost format
            'fuel_type' => '', // Empty fuel type
            'odometer_reading' => 'invalid_odometer', // Invalid odometer format
        ];

        $response = $this->actingAs($this->user)
            ->post(route('fuel.store'), $invalidData);

        $response->assertSessionHasErrors(['truck_id', 'driver_id', 'fuel_date', 'fuel_quantity_liters', 'fuel_price_per_liter', 'total_cost', 'fuel_type', 'odometer_reading']);
    }

    /** @test */
    public function financial_validation_rules_work()
    {
        $truck = Truck::factory()->create();

        // Test valid data
        $validData = [
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
            'notes' => 'Monthly financial record',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('financial.store'), $validData);

        $response->assertRedirect(route('financial.index'));
        $this->assertDatabaseHas('truck_financial_records', ['truck_id' => $truck->id]);

        // Test invalid data
        $invalidData = [
            'truck_id' => 99999, // Non-existent truck
            'record_date' => 'invalid_date', // Invalid date format
            'period_type' => 'invalid_period', // Invalid period type
            'revenue' => 'invalid_revenue', // Invalid revenue format
            'fuel_cost' => 'invalid_fuel_cost', // Invalid fuel cost format
            'maintenance_cost' => 'invalid_maintenance_cost', // Invalid maintenance cost format
            'driver_salary' => 'invalid_driver_salary', // Invalid driver salary format
            'insurance_cost' => 'invalid_insurance_cost', // Invalid insurance cost format
            'depreciation' => 'invalid_depreciation', // Invalid depreciation format
            'other_costs' => 'invalid_other_costs', // Invalid other costs format
        ];

        $response = $this->actingAs($this->user)
            ->post(route('financial.store'), $invalidData);

        $response->assertSessionHasErrors(['truck_id', 'record_date', 'period_type', 'revenue', 'fuel_cost', 'maintenance_cost', 'driver_salary', 'insurance_cost', 'depreciation', 'other_costs']);
    }

    /** @test */
    public function user_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'New User',
            'email' => 'newuser@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('users.store'), $validData);

        $response->assertRedirect(route('users.index'));
        $this->assertDatabaseHas('users', ['email' => 'newuser@example.com']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'email' => 'invalid_email', // Invalid email format
            'password' => '123', // Password too short
            'password_confirmation' => '456', // Password confirmation doesn't match
        ];

        $response = $this->actingAs($this->user)
            ->post(route('users.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'email', 'password']);
    }

    /** @test */
    public function role_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'manager',
            'guard_name' => 'web',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('roles.store'), $validData);

        $response->assertRedirect(route('roles.index'));
        $this->assertDatabaseHas('roles', ['name' => 'manager']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'guard_name' => '', // Empty guard name
        ];

        $response = $this->actingAs($this->user)
            ->post(route('roles.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'guard_name']);
    }

    /** @test */
    public function permission_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'trucks.create',
            'guard_name' => 'web',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('permissions.store'), $validData);

        $response->assertRedirect(route('permissions.index'));
        $this->assertDatabaseHas('permissions', ['name' => 'trucks.create']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'guard_name' => '', // Empty guard name
        ];

        $response = $this->actingAs($this->user)
            ->post(route('permissions.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'guard_name']);
    }

    /** @test */
    public function customer_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'Test Customer',
            'contact_person' => 'John Smith',
            'phone' => '+251911234567',
            'email' => 'customer@example.com',
            'address' => 'Test Address',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('customers.store'), $validData);

        $response->assertRedirect(route('customers.index'));
        $this->assertDatabaseHas('customers', ['name' => 'Test Customer']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'email' => 'invalid_email', // Invalid email format
            'phone' => 'invalid_phone', // Invalid phone format
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post(route('customers.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'email', 'phone', 'status']);
    }

    /** @test */
    public function region_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'Test Region',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('regions.store'), $validData);

        $response->assertRedirect(route('regions.index'));
        $this->assertDatabaseHas('regions', ['name' => 'Test Region']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
        ];

        $response = $this->actingAs($this->user)
            ->post(route('regions.store'), $invalidData);

        $response->assertSessionHasErrors(['name']);
    }

    /** @test */
    public function zone_validation_rules_work()
    {
        $region = Region::factory()->create();

        // Test valid data
        $validData = [
            'name' => 'Test Zone',
            'region_id' => $region->id,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('zones.store'), $validData);

        $response->assertRedirect(route('zones.index'));
        $this->assertDatabaseHas('zones', ['name' => 'Test Zone']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'region_id' => 99999, // Non-existent region
        ];

        $response = $this->actingAs($this->user)
            ->post(route('zones.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'region_id']);
    }

    /** @test */
    public function woreda_validation_rules_work()
    {
        $zone = Zone::factory()->create();

        // Test valid data
        $validData = [
            'name' => 'Test Woreda',
            'zone_id' => $zone->id,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('woredas.store'), $validData);

        $response->assertRedirect(route('woredas.index'));
        $this->assertDatabaseHas('woredas', ['name' => 'Test Woreda']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'zone_id' => 99999, // Non-existent zone
        ];

        $response = $this->actingAs($this->user)
            ->post(route('woredas.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'zone_id']);
    }

    /** @test */
    public function place_validation_rules_work()
    {
        $woreda = Woreda::factory()->create();

        // Test valid data
        $validData = [
            'name' => 'Test Place',
            'woreda_id' => $woreda->id,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('places.store'), $validData);

        $response->assertRedirect(route('places.index'));
        $this->assertDatabaseHas('places', ['name' => 'Test Place']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'woreda_id' => 99999, // Non-existent woreda
        ];

        $response = $this->actingAs($this->user)
            ->post(route('places.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'woreda_id']);
    }

    /** @test */
    public function cargo_type_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'Test Cargo',
            'category' => 'Construction',
            'weight_per_cubic_meter' => 2.5,
            'handling_requirements' => 'Handle with care',
            'safety_requirements' => 'Wear safety equipment',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('cargo-types.store'), $validData);

        $response->assertRedirect(route('cargo-types.index'));
        $this->assertDatabaseHas('cargo_types', ['name' => 'Test Cargo']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'category' => '', // Empty category
            'weight_per_cubic_meter' => 'invalid_weight', // Invalid weight format
            'handling_requirements' => str_repeat('a', 1001), // Too long
            'safety_requirements' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->actingAs($this->user)
            ->post(route('cargo-types.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'category', 'weight_per_cubic_meter', 'handling_requirements', 'safety_requirements']);
    }

    /** @test */
    public function vehicle_type_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'Test Vehicle Type',
            'description' => 'Test description',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('vehicletypes.store'), $validData);

        $response->assertRedirect(route('vehicletypes.index'));
        $this->assertDatabaseHas('vehicletypes', ['name' => 'Test Vehicle Type']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'description' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->actingAs($this->user)
            ->post(route('vehicletypes.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'description']);
    }

    /** @test */
    public function status_type_validation_rules_work()
    {
        // Test valid data
        $validData = [
            'name' => 'Test Status Type',
            'description' => 'Test description',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statustypes.store'), $validData);

        $response->assertRedirect(route('statustypes.index'));
        $this->assertDatabaseHas('statustypes', ['name' => 'Test Status Type']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'description' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statustypes.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'description']);
    }

    /** @test */
    public function status_validation_rules_work()
    {
        $statusType = \App\Models\StatusType::factory()->create();

        // Test valid data
        $validData = [
            'name' => 'Test Status',
            'statustype_id' => $statusType->id,
            'description' => 'Test description',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statuses.store'), $validData);

        $response->assertRedirect(route('statuses.index'));
        $this->assertDatabaseHas('statuses', ['name' => 'Test Status']);

        // Test invalid data
        $invalidData = [
            'name' => '', // Empty name
            'statustype_id' => 99999, // Non-existent status type
            'description' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->actingAs($this->user)
            ->post(route('statuses.store'), $invalidData);

        $response->assertSessionHasErrors(['name', 'statustype_id', 'description']);
    }

    /** @test */
    public function operation_validation_rules_work()
    {
        $customer = Customer::factory()->create();
        $region = Region::factory()->create();
        $cargoType = CargoType::create([
            'name' => 'Validation Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        // Test valid data
        $validData = [
            'operationid' => 'OP001',
            'customer_id' => $customer->id,
            'startdate' => '2023-12-01',
            'destination_scope' => 'region',
            'destination_id' => $region->id,
            'volume' => 100.0,
            'cargo_type_id' => $cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 500.0,
            'tariff' => 50.0,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('operations.store'), $validData);

        $response->assertRedirect(route('operations.index'));
        $this->assertDatabaseHas('operations', ['operationid' => 'OP001']);

        // Test invalid data
        $invalidData = [
            'operationid' => '', // Empty operation ID
            'customer_id' => 99999, // Non-existent customer
            'startdate' => 'invalid_date', // Invalid date format
            'destination_scope' => 'invalid_scope',
            'destination_id' => 99999,
            'volume' => 'invalid_volume', // Invalid volume format
            'cargo_type_id' => '', // Empty cargo type selection
            'cargo_service_type' => 'invalid_service',
            'km' => 'invalid_km', // Invalid km format
            'tariff' => 'invalid_tariff', // Invalid tariff format
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post(route('operations.store'), $invalidData);

        $response->assertSessionHasErrors([
            'operationid',
            'customer_id',
            'startdate',
            'destination_scope',
            'destination_id',
            'volume',
            'cargo_type_id',
            'cargo_service_type',
            'km',
            'tariff',
            'status',
        ]);
    }

    /** @test */
    public function performance_validation_rules_work()
    {
        $operation = Operation::factory()->create();
        $driverTruck = \App\Models\DriverTruck::factory()->create();

        // Test valid data
        $validData = [
            'load_phase' => 'main',
            'load_completion' => 'full',
            'FOnumber' => 'FO001',
            'operation_id' => $operation->id,
            'driver_truck_id' => $driverTruck->id,
            'DateDispach' => '2023-12-01',
            'orgion_id' => Place::factory()->create()->id,
            'destination_id' => Place::factory()->create()->id,
            'DistanceWCargo' => 500.0,
            'tonkm' => 2500.0,
            'DistanceWOCargo' => 100.0,
            'CargoVolumMT' => 5.0,
            'fuelInLitter' => 50.0,
            'fuelInBirr' => 2250.0,
            'perdiem' => 500.0,
            'workOnGoing' => 1000.0,
            'other' => 200.0,
            'comment' => 'Test performance',
            'satus' => 'active',
            'is_returned' => false,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('performances.store'), $validData);

        $response->assertRedirect(route('performances.index'));
        $this->assertDatabaseHas('performances', [
            'FOnumber' => 'FO001',
            'load_phase' => 'main',
        ]);

        // Test invalid data
        $invalidData = [
            'load_phase' => '', // Empty load phase
            'load_completion' => '', // Empty load completion
            'FOnumber' => '', // Empty FO number
            'operation_id' => 99999, // Non-existent operation
            'driver_truck_id' => 99999, // Non-existent driver truck
            'DateDispach' => 'invalid_date', // Invalid date format
            'orgion_id' => 99999, // Non-existent origin
            'destination_id' => 99999, // Non-existent destination
            'DistanceWCargo' => 'invalid_distance', // Invalid distance format
            'tonkm' => 'invalid_tonkm', // Invalid tonkm format
            'DistanceWOCargo' => 'invalid_distance', // Invalid distance format
            'CargoVolumMT' => 'invalid_volume', // Invalid volume format
            'fuelInLitter' => 'invalid_fuel', // Invalid fuel format
            'fuelInBirr' => 'invalid_fuel_cost', // Invalid fuel cost format
            'perdiem' => 'invalid_perdiem', // Invalid perdiem format
            'workOnGoing' => 'invalid_work', // Invalid work format
            'other' => 'invalid_other', // Invalid other format
            'satus' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post(route('performances.store'), $invalidData);

        $response->assertSessionHasErrors([
            'load_phase',
            'load_completion',
            'FOnumber',
            'operation_id',
            'driver_truck_id',
            'DateDispach',
            'orgion_id',
            'destination_id',
            'DistanceWCargo',
            'tonkm',
            'DistanceWOCargo',
            'CargoVolumMT',
            'fuelInLitter',
            'fuelInBirr',
            'perdiem',
            'workOnGoing',
            'other',
            'satus',
        ]);
    }

    /** @test */
    public function distance_validation_rules_work()
    {
        $origin = Place::factory()->create();
        $destination = Place::factory()->create();

        // Test valid data
        $validData = [
            'origin_id' => $origin->id,
            'destination_id' => $destination->id,
            'distance_km' => 100.0,
            'estimated_time_hours' => 2.5,
            'road_condition' => 'Good',
            'notes' => 'Test distance',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('distances.store'), $validData);

        $response->assertRedirect(route('distances.index'));
        $this->assertDatabaseHas('distances', ['origin_id' => $origin->id, 'destination_id' => $destination->id]);

        // Test invalid data
        $invalidData = [
            'origin_id' => 99999, // Non-existent origin
            'destination_id' => 99999, // Non-existent destination
            'distance_km' => 'invalid_distance', // Invalid distance format
            'estimated_time_hours' => 'invalid_time', // Invalid time format
            'road_condition' => '', // Empty road condition
            'notes' => str_repeat('a', 1001), // Too long
        ];

        $response = $this->actingAs($this->user)
            ->post(route('distances.store'), $invalidData);

        $response->assertSessionHasErrors(['origin_id', 'destination_id', 'distance_km', 'estimated_time_hours', 'road_condition', 'notes']);
    }

    /** @test */
    public function custom_validation_rules_work()
    {
        // Test custom validation rules
        $rules = [
            'plate' => 'required|string|max:20|regex:/^[A-Z]{3}-\d{3}$/',
            'email' => 'required|email|unique:users,email',
            'phone' => 'required|string|regex:/^\+251\d{9}$/',
            'date' => 'required|date|after:today',
            'number' => 'required|numeric|min:0|max:999999.99',
        ];

        $data = [
            'plate' => 'ABC-123',
            'email' => 'test@example.com',
            'phone' => '+251911234567',
            'date' => '2024-12-01',
            'number' => 100.50,
        ];

        $validator = Validator::make($data, $rules);
        $this->assertTrue($validator->passes());

        // Test invalid data
        $invalidData = [
            'plate' => 'invalid',
            'email' => 'invalid_email',
            'phone' => 'invalid_phone',
            'date' => '2020-01-01',
            'number' => -10,
        ];

        $validator = Validator::make($invalidData, $rules);
        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('plate', $validator->errors()->toArray());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
        $this->assertArrayHasKey('phone', $validator->errors()->toArray());
        $this->assertArrayHasKey('date', $validator->errors()->toArray());
        $this->assertArrayHasKey('number', $validator->errors()->toArray());
    }

    /** @test */
    public function validation_error_messages_are_customized()
    {
        $invalidData = [
            'plate' => 'invalid',
            'email' => 'invalid_email',
            'phone' => 'invalid_phone',
        ];

        $rules = [
            'plate' => 'required|string|max:20|regex:/^[A-Z]{3}-\d{3}$/',
            'email' => 'required|email',
            'phone' => 'required|string|regex:/^\+251\d{9}$/',
        ];

        $messages = [
            'plate.regex' => 'The plate must be in format ABC-123',
            'email.email' => 'Please enter a valid email address',
            'phone.regex' => 'Please enter a valid Ethiopian phone number',
        ];

        $validator = Validator::make($invalidData, $rules, $messages);
        $this->assertTrue($validator->fails());

        $errors = $validator->errors();
        $this->assertEquals('The plate must be in format ABC-123', $errors->first('plate'));
        $this->assertEquals('Please enter a valid email address', $errors->first('email'));
        $this->assertEquals('Please enter a valid Ethiopian phone number', $errors->first('phone'));
    }

    /** @test */
    public function validation_works_with_form_requests()
    {
        $vehicleType = VehicleType::factory()->create();

        $truckData = [
            'plate' => 'REQ-123',
            'vehicletype_id' => $vehicleType->id,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'REQ-123']);

        // Test with invalid data
        $invalidTruckData = [
            'plate' => '',
            'vehicletype_id' => 99999,
            'status' => 'invalid',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $invalidTruckData);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }
}

<?php

namespace Tests\Feature;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\MaintenanceType;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\RoutePlan;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TimsSystemTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected VehicleType $vehicleType;

    protected Truck $truck;

    protected DriverTruck $driverTruck;

    protected Driver $driver;

    protected Customer $customer;

    protected Region $region;

    protected Zone $zone;

    protected Woreda $woreda;

    protected Place $originPlace;

    protected Place $destinationPlace;

    protected Operation $operation;

    protected CargoType $cargoType;

    protected function setUp(): void
    {
        parent::setUp();

        Carbon::setTestNow(Carbon::parse('2025-01-01 09:00:00'));

        $this->seed(CheckPermissionSeeder::class);

        // Create test user
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@tims.com',
        ]);

        $this->user->assignRole('admin');

        // Create test data
        $this->createTestData();
    }

    protected function tearDown(): void
    {
        Carbon::setTestNow();

        parent::tearDown();
    }

    private function createTestData(): void
    {
        // Create Vehicle Type
        $this->vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck for heavy loads',
        ]);

        // Create Truck
        $this->truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 2500000.00,
        ]);

        // Create Driver
        $this->driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $this->driverTruck = DriverTruck::create([
            'driver_id' => $this->driver->id,
            'driverid' => $this->driver->driverid,
            'truck_id' => $this->truck->id,
            'plate' => $this->truck->plate,
            'date_recived' => Carbon::now()->subMonth()->toDateString(),
            'is_attached' => true,
            'status' => 'active',
            'user_id' => $this->user->id,
        ]);

        // Create Customer
        $this->customer = Customer::create([
            'name' => 'ABC Transport Company',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);

        // Create Region
        $this->region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $this->zone = Zone::create([
            'name' => 'Addis Ketema',
            'region_id' => $this->region->id,
            'status' => 'active',
        ]);

        $this->woreda = Woreda::create([
            'name' => 'Woreda 01',
            'zone_id' => $this->zone->id,
            'status' => 'active',
        ]);

        $this->originPlace = Place::create([
            'name' => 'Addis Logistics Hub',
            'code' => 'ALH',
            'woreda_id' => $this->woreda->id,
            'status' => 'active',
            'is_logistics_hub' => true,
        ]);

        $this->destinationPlace = Place::create([
            'name' => 'Dire Distribution Center',
            'code' => 'DDC',
            'woreda_id' => $this->woreda->id,
            'status' => 'active',
            'is_logistics_hub' => true,
        ]);

        $this->cargoType = CargoType::create([
            'name' => 'General Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        // Create Operation
        $this->operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-01-01',
            'volume' => 100.00,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'destination_scope' => 'region',
            'destination_name' => $this->region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $this->region->id,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function user_can_view_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Dashboard')
        );
    }

    /** @test */
    public function user_can_create_vehicle_type()
    {
        $vehicleTypeData = [
            'name' => 'Light Truck',
            'description' => 'Small truck for light loads',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('vehicletypes.store'), $vehicleTypeData);

        $response->assertRedirect(route('vehicletypes.index'));
        $this->assertDatabaseHas('vehicletypes', [
            'name' => 'Light Truck',
            'description' => 'Small truck for light loads',
        ]);
    }

    /** @test */
    public function user_can_create_truck()
    {
        $truckData = [
            'plate' => 'BB-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'serviceIntervalKM' => 15000,
            'purchasePrice' => 3000000.00,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', [
            'plate' => 'BB-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
        ]);
    }

    /** @test */
    public function user_can_create_driver()
    {
        $driverData = [
            'driverid' => 'DRV002',
            'name' => 'Jane Smith',
            'sex' => 'female',
            'status' => 'active',
            'zone' => 'Dire Dawa',
            'mobile' => '+251911234568',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', [
            'driverid' => 'DRV002',
            'name' => 'Jane Smith',
            'sex' => 'female',
            'status' => 'active',
        ]);
    }

    /** @test */
    public function user_can_create_customer()
    {
        $customerData = [
            'name' => 'XYZ Logistics',
            'contact_person' => 'Bob Johnson',
            'phone' => '+251912345679',
            'email' => 'contact@xyzlogistics.com',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('customers.store'), $customerData);

        $response->assertRedirect(route('customers.index'));
        $this->assertDatabaseHas('customers', [
            'name' => 'XYZ Logistics',
            'email' => 'contact@xyzlogistics.com',
            'status' => 'active',
        ]);
    }

    /** @test */
    public function user_can_create_operation()
    {
        $operationData = [
            'operationid' => 'OP002',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-02-01',
            'destination_scope' => 'region',
            'destination_id' => $this->region->id,
            'volume' => 200.00,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => 'commercial',
            'km' => 750.00,
            'tariff' => 75.00,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('operations.store'), $operationData);

        $response->assertRedirect(route('operations.index'));
        $this->assertDatabaseHas('operations', [
            'operationid' => 'OP002',
            'customer_id' => $this->customer->id,
            'cargo_type_id' => $this->cargoType->id,
            'destination_scope' => 'region',
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $this->region->id,
        ]);
    }

    /** @test */
    public function user_can_create_maintenance_record()
    {
        $maintenanceType = MaintenanceType::create([
            'name' => 'Oil Change',
            'category' => 'Preventive',
            'description' => 'Regular oil change maintenance',
            'recommended_interval_km' => 10000,
            'estimated_duration_hours' => 2,
            'is_active' => true,
        ]);

        $scheduledDate = Carbon::now()->addDays(3)->toDateString();
        $maintenanceData = [
            'truck_id' => $this->truck->id,
            'maintenance_type_id' => $maintenanceType->id,
            'scheduled_date' => $scheduledDate,
            'description' => 'Regular oil change',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('maintenance.store'), $maintenanceData);

        $response->assertRedirect(route('maintenance.index'));

        $record = VehicleMaintenanceRecord::query()->latest('id')->first();

        $this->assertNotNull($record);
        $this->assertSame($this->truck->id, $record->truck_id);
        $this->assertSame($maintenanceType->id, $record->maintenance_type_id);
        $this->assertSame('scheduled', $record->status);
        $this->assertSame('Regular oil change', $record->description);
        $this->assertEquals($scheduledDate, $record->scheduled_date->toDateString());
    }

    /** @test */
    public function user_can_create_fuel_record()
    {
        $fuelDate = Carbon::now()->subDay()->toDateString();

        $fuelData = [
            'driver_truck_id' => $this->driverTruck->id,
            'fuel_date' => $fuelDate,
            'fuel_type' => 'diesel',
            'fuel_quantity_liters' => 200.00,
            'fuel_price_per_liter' => 45.00,
            'fuel_station' => 'Shell Station',
            'odometer_reading' => 50000,
            'receipt_number' => 'RCPT-1001',
            'notes' => 'Test fueling',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('fuel.store'), $fuelData);

        $response->assertRedirect(route('fuel.index'));

        $fuelRecord = FuelRecord::query()->latest('id')->first();

        $this->assertNotNull($fuelRecord);
        $this->assertSame($this->truck->id, $fuelRecord->truck_id);
        $this->assertSame($this->driver->id, $fuelRecord->driver_id);
        $this->assertSame($this->driverTruck->id, $fuelRecord->driver_truck_id);
        $this->assertSame('diesel', $fuelRecord->fuel_type);
        $this->assertEquals(200.00, (float) $fuelRecord->fuel_quantity_liters);
        $this->assertEquals(45.00, (float) $fuelRecord->fuel_price_per_liter);
        $this->assertEquals(9000.00, (float) $fuelRecord->total_cost);
        $this->assertEquals($fuelDate, $fuelRecord->fuel_date->toDateString());
    }

    /** @test */
    public function user_can_create_driver_performance_record()
    {
        $recordDate = Carbon::now()->subDay()->toDateString();
        $performanceData = [
            'driver_id' => $this->driver->id,
            'truck_id' => $this->truck->id,
            'record_date' => $recordDate,
            'period_type' => 'daily',
            'total_trips' => 3,
            'total_distance_km' => 500.00,
            'total_cargo_tonnage' => 150.00,
            'fuel_efficiency' => 8.5,
            'safety_violations' => 0,
            'accidents' => 0,
            'customer_rating' => 4.5,
            'performance_notes' => 'Strong performance',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('driver-performance.store'), $performanceData);

        $response->assertRedirect(route('driver-performance.index'));

        $record = DriverPerformanceRecord::query()->latest('id')->first();

        $this->assertNotNull($record);
        $this->assertSame($this->driver->id, $record->driver_id);
        $this->assertSame($this->truck->id, $record->truck_id);
        $this->assertEquals(3, $record->total_trips);
        $this->assertEquals(500.00, (float) $record->total_distance_km);
        $this->assertEquals(150.00, (float) $record->total_cargo_tonnage);
        $this->assertEquals(8.50, (float) $record->fuel_efficiency);
        $this->assertEquals(0, $record->safety_violations);
        $this->assertEquals(0, $record->accidents);
        $this->assertEquals(4.50, (float) $record->customer_rating);
        $this->assertEquals('Strong performance', $record->performance_notes);
        $this->assertEquals($recordDate, $record->record_date->toDateString());
    }

    /** @test */
    public function user_can_create_cargo_type()
    {
        $cargoData = [
            'name' => 'Construction Materials',
            'category' => CargoCategory::Construction->value,
            'weight_per_cubic_meter' => 750.00,
            'handling_requirements' => 'Special handling required',
            'safety_requirements' => 'Protective gear required',
            'requires_special_equipment' => true,
        ];

        $response = $this->actingAs($this->user)
            ->post(route('cargo-types.store'), $cargoData);

        $response->assertRedirect(route('cargo-types.index'));
        $this->assertDatabaseHas('cargo_types', [
            'name' => 'Construction Materials',
            'category' => CargoCategory::Construction->value,
            'requires_special_equipment' => true,
        ]);
    }

    /** @test */
    public function user_can_create_financial_record()
    {
        $recordDate = Carbon::now()->toDateString();
        $financialData = [
            'truck_id' => $this->truck->id,
            'record_date' => $recordDate,
            'period_type' => 'daily',
            'revenue' => 50000.00,
            'fuel_cost' => 9000.00,
            'maintenance_cost' => 2000.00,
            'driver_salary' => 3000.00,
            'insurance_cost' => 500.00,
            'depreciation' => 1000.00,
            'other_costs' => 500.00,
        ];

        $expectedProfit = $financialData['revenue'] - (
            $financialData['fuel_cost'] +
            $financialData['maintenance_cost'] +
            $financialData['driver_salary'] +
            $financialData['insurance_cost'] +
            $financialData['depreciation'] +
            $financialData['other_costs']
        );

        $response = $this->actingAs($this->user)
            ->post(route('financial.store'), $financialData);

        $response->assertRedirect(route('financial.index'));

        $financialRecord = TruckFinancialRecord::query()->latest('id')->first();

        $this->assertNotNull($financialRecord);
        $this->assertSame($this->truck->id, $financialRecord->truck_id);
        $this->assertEquals($recordDate, $financialRecord->record_date->toDateString());
        $this->assertSame('daily', $financialRecord->period_type);
        $this->assertEquals($expectedProfit, (float) $financialRecord->net_profit);
    }

    /** @test */
    public function user_can_create_route_plan()
    {
        $plannedDate = Carbon::now()->addDays(2)->toDateString();
        $routeData = [
            'operation_id' => $this->operation->id,
            'truck_id' => $this->truck->id,
            'driver_id' => $this->driver->id,
            'planned_date' => $plannedDate,
            'planned_departure_time' => '08:00',
            'planned_arrival_time' => '16:00',
            'route_waypoints' => [$this->originPlace->id, $this->destinationPlace->id],
            'total_distance_km' => 500.00,
            'total_travel_time_minutes' => 480,
            'estimated_fuel_cost' => 8500.00,
            'notes' => 'Regular route plan',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('route-plans.store'), $routeData);

        $response->assertRedirect(route('route-plans.index'));

        $routePlan = RoutePlan::withoutGlobalScopes()->orderByDesc('id')->first();

        $this->assertNotNull($routePlan);
        $this->assertSame($this->operation->id, $routePlan->operation_id);
        $this->assertSame($this->truck->id, $routePlan->truck_id);
        $this->assertSame($this->driver->id, $routePlan->driver_id);
        $this->assertEquals($plannedDate, $routePlan->planned_date->toDateString());
        $this->assertEquals('08:00', $routePlan->planned_departure_time->format('H:i'));
        $this->assertEquals('16:00', $routePlan->planned_arrival_time->format('H:i'));
        $this->assertEquals([$this->originPlace->id, $this->destinationPlace->id], $routePlan->route_waypoints);
        $this->assertEquals(500.00, (float) $routePlan->total_distance_km);
        $this->assertEquals(480, $routePlan->total_travel_time_minutes);
        $this->assertEquals(8500.00, (float) $routePlan->estimated_fuel_cost);
        $this->assertSame('planned', $routePlan->status);
    }

    /** @test */
    public function user_can_view_trucks_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/trucks');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Trucks/Index')
            ->has('trucks')
        );
    }

    /** @test */
    public function user_can_view_drivers_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/drivers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Drivers/Index')
            ->has('drivers')
        );
    }

    /** @test */
    public function user_can_view_customers_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/customers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Customers/Index')
            ->has('customers')
        );
    }

    /** @test */
    public function user_can_view_operations_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/operations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Operations/Index')
            ->has('operations')
        );
    }

    /** @test */
    public function user_can_view_maintenance_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/maintenance');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Maintenance/Index')
            ->has('maintenanceRecords')
        );
    }

    /** @test */
    public function user_can_view_fuel_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/fuel');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page->component('Fuel/Index')
            ->has('fuelRecords')
        );
    }

    /** @test */
    public function user_can_view_reports()
    {
        $reports = [
            'maintenance' => '/reports/maintenance',
        ];

        foreach ($reports as $report => $url) {
            $response = $this->actingAs($this->user)->get($url);

            if ($response->isRedirection()) {
                $response->assertSessionHasErrors(['error']);

                continue;
            }

            $response->assertStatus(200);
        }
    }

    /** @test */
    public function truck_validation_works_correctly()
    {
        $invalidData = [
            'plate' => 'INVALID', // Invalid plate format
            'vehicletype_id' => 999, // Non-existent vehicle type
            'status' => 'invalid_status', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->post('/trucks', $invalidData);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function driver_validation_works_correctly()
    {
        $invalidData = [
            'driverid' => '', // Required field
            'name' => '', // Required field
            'sex' => 'invalid', // Invalid sex
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $invalidData);

        $response->assertSessionHasErrors(['error']);
    }

    /** @test */
    public function system_handles_soft_deletes_correctly()
    {
        // Create a truck
        $truck = Truck::create([
            'plate' => 'CC-9999',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
        ]);

        // Soft delete the truck
        $truck->delete();

        // Verify it's soft deleted
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);

        // Verify it doesn't appear in normal queries
        $this->assertDatabaseMissing('trucks', [
            'id' => $truck->id,
            'deleted_at' => null,
        ]);
    }

    /** @test */
    public function database_relationships_work_correctly()
    {
        // Test truck belongs to vehicle type
        $this->assertEquals($this->vehicleType->id, $this->truck->vehicleType->id);

        // Test operation belongs to customer
        $this->assertEquals($this->customer->id, $this->operation->customer->id);

        // Test operation destination morph points to region
        $this->assertEquals(Region::class, $this->operation->destination_reference_type);
        $this->assertEquals($this->region->id, $this->operation->destination_reference_id);
        $this->assertEquals($this->region->name, $this->operation->destination_name);

        // Test operation belongs to user
        $this->assertEquals($this->user->id, $this->operation->user->id);
    }

    /** @test */
    public function system_performance_is_acceptable()
    {
        $startTime = microtime(true);

        // Create multiple records
        for ($i = 0; $i < 100; $i++) {
            VehicleType::create([
                'name' => "Test Type {$i}",
                'description' => "Test description {$i}",
            ]);
        }

        $endTime = microtime(true);
        $executionTime = $endTime - $startTime;

        // Assert that creating 100 records takes less than 5 seconds
        $this->assertLessThan(5, $executionTime);

        // Test query performance
        $startTime = microtime(true);
        $vehicleTypes = VehicleType::where('name', 'like', 'Test Type%')->get();
        $endTime = microtime(true);
        $queryTime = $endTime - $startTime;

        // Assert that querying 100 records takes less than 1 second
        $this->assertLessThan(1, $queryTime);
        $this->assertCount(100, $vehicleTypes);
    }
}

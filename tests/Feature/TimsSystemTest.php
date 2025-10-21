<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VehicleType;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Customer;
use App\Models\Region;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\MaintenanceType;
use App\Models\VehicleMaintenanceRecord;
use App\Models\FuelRecord;
use App\Models\DriverPerformanceRecord;
use App\Models\CargoType;
use App\Models\TruckFinancialRecord;
use App\Models\RoutePlan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TimsSystemTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;
    protected VehicleType $vehicleType;
    protected Truck $truck;
    protected Driver $driver;
    protected Customer $customer;
    protected Region $region;
    protected Operation $operation;

    protected function setUp(): void
    {
        parent::setUp();

        // Create test user
        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@tims.com',
        ]);

        // Create test data
        $this->createTestData();
    }

    private function createTestData(): void
    {
        // Create Vehicle Type
        $this->vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck for heavy loads'
        ]);

        // Create Truck
        $this->truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 2500000.00
        ]);

        // Create Driver
        $this->driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'Addis Ababa',
            'mobile' => '+251911234567'
        ]);

        // Create Customer
        $this->customer = Customer::create([
            'name' => 'ABC Transport Company',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active'
        ]);

        // Create Region
        $this->region = Region::create([
            'name' => 'Addis Ababa',
            'description' => 'Capital city region'
        ]);

        // Create Operation
        $this->operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-01-01',
            'region_id' => $this->region->id,
            'volume' => 100.00,
            'cargotype' => 'General',
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'open',
            'user_id' => $this->user->id
        ]);
    }

    /** @test */
    public function user_can_view_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Dashboard')
        );
    }

    /** @test */
    public function user_can_create_vehicle_type()
    {
        $vehicleTypeData = [
            'name' => 'Light Truck',
            'description' => 'Small truck for light loads'
        ];

        $response = $this->actingAs($this->user)
            ->post('/vehicletypes', $vehicleTypeData);

        $response->assertRedirect('/vehicletypes');
        $this->assertDatabaseHas('vehicletypes', $vehicleTypeData);
    }

    /** @test */
    public function user_can_create_truck()
    {
        $truckData = [
            'plate' => 'BB-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH567890',
            'engineNumber' => 'EN123456',
            'serviceIntervalKM' => 15000,
            'purchasePrice' => 3000000.00
        ];

        $response = $this->actingAs($this->user)
            ->post('/trucks', $truckData);

        $response->assertRedirect('/trucks');
        $this->assertDatabaseHas('trucks', $truckData);
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
            'mobile' => '+251911234568'
        ];

        $response = $this->actingAs($this->user)
            ->post('/drivers', $driverData);

        $response->assertRedirect('/drivers');
        $this->assertDatabaseHas('drivers', $driverData);
    }

    /** @test */
    public function user_can_create_customer()
    {
        $customerData = [
            'name' => 'XYZ Logistics',
            'contact_person' => 'Bob Johnson',
            'phone' => '+251912345679',
            'email' => 'contact@xyzlogistics.com',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post('/customers', $customerData);

        $response->assertRedirect('/customers');
        $this->assertDatabaseHas('customers', $customerData);
    }

    /** @test */
    public function user_can_create_operation()
    {
        $operationData = [
            'operationid' => 'OP002',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-02-01',
            'region_id' => $this->region->id,
            'volume' => 200.00,
            'cargotype' => 'Construction',
            'km' => 750.00,
            'tariff' => 75.00,
            'status' => 'open',
            'user_id' => $this->user->id
        ];

        $response = $this->actingAs($this->user)
            ->post('/operations', $operationData);

        $response->assertRedirect('/operations');
        $this->assertDatabaseHas('operations', $operationData);
    }

    /** @test */
    public function user_can_create_maintenance_record()
    {
        $maintenanceType = MaintenanceType::create([
            'name' => 'Oil Change',
            'category' => 'Preventive',
            'description' => 'Regular oil change maintenance',
            'recommended_interval_km' => 10000,
            'estimated_duration_hours' => 2
        ]);

        $maintenanceData = [
            'truck_id' => $this->truck->id,
            'maintenance_type_id' => $maintenanceType->id,
            'scheduled_date' => '2025-01-15',
            'status' => 'scheduled',
            'description' => 'Regular oil change',
            'cost' => 500.00
        ];

        $response = $this->actingAs($this->user)
            ->post('/maintenance', $maintenanceData);

        $response->assertRedirect('/maintenance');
        $this->assertDatabaseHas('vehicle_maintenance_records', $maintenanceData);
    }

    /** @test */
    public function user_can_create_fuel_record()
    {
        $fuelData = [
            'truck_id' => $this->truck->id,
            'driver_id' => $this->driver->id,
            'fuel_date' => '2025-01-10',
            'fuel_type' => 'Diesel',
            'quantity_liters' => 200.00,
            'cost_per_liter' => 45.00,
            'total_cost' => 9000.00,
            'odometer_reading' => 50000,
            'fuel_station' => 'Shell Station',
            'location' => 'Addis Ababa'
        ];

        $response = $this->actingAs($this->user)
            ->post('/fuel', $fuelData);

        $response->assertRedirect('/fuel');
        $this->assertDatabaseHas('fuel_records', $fuelData);
    }

    /** @test */
    public function user_can_create_driver_performance_record()
    {
        $performanceData = [
            'driver_id' => $this->driver->id,
            'truck_id' => $this->truck->id,
            'record_date' => '2025-01-10',
            'period_type' => 'daily',
            'total_distance_km' => 500.00,
            'total_trips' => 3,
            'total_cargo_weight_mt' => 150.00,
            'fuel_efficiency_km_per_liter' => 8.5,
            'safety_score' => 95,
            'compliance_score' => 98
        ];

        $response = $this->actingAs($this->user)
            ->post('/driver-performance', $performanceData);

        $response->assertRedirect('/driver-performance');
        $this->assertDatabaseHas('driver_performance_records', $performanceData);
    }

    /** @test */
    public function user_can_create_cargo_type()
    {
        $cargoData = [
            'name' => 'Construction Materials',
            'category' => 'Heavy',
            'description' => 'Cement, steel, and construction materials',
            'average_weight_per_unit_kg' => 50.00,
            'handling_requirements' => 'Special handling required',
            'storage_requirements' => 'Dry storage',
            'transportation_restrictions' => 'Heavy vehicle required'
        ];

        $response = $this->actingAs($this->user)
            ->post('/cargo-types', $cargoData);

        $response->assertRedirect('/cargo-types');
        $this->assertDatabaseHas('cargo_types', $cargoData);
    }

    /** @test */
    public function user_can_create_financial_record()
    {
        $financialData = [
            'truck_id' => $this->truck->id,
            'record_date' => '2025-01-10',
            'period_type' => 'daily',
            'revenue' => 50000.00,
            'fuel_cost' => 9000.00,
            'maintenance_cost' => 2000.00,
            'driver_salary' => 3000.00,
            'insurance_cost' => 500.00,
            'depreciation' => 1000.00,
            'other_costs' => 500.00,
            'net_profit' => 34000.00
        ];

        $response = $this->actingAs($this->user)
            ->post('/financial', $financialData);

        $response->assertRedirect('/financial');
        $this->assertDatabaseHas('truck_financial_records', $financialData);
    }

    /** @test */
    public function user_can_create_route_plan()
    {
        $routeData = [
            'operation_id' => $this->operation->id,
            'truck_id' => $this->truck->id,
            'driver_id' => $this->driver->id,
            'planned_date' => '2025-01-15',
            'origin' => 'Addis Ababa',
            'destination' => 'Dire Dawa',
            'estimated_distance_km' => 500.00,
            'estimated_travel_time_hours' => 8,
            'status' => 'planned',
            'notes' => 'Regular route plan'
        ];

        $response = $this->actingAs($this->user)
            ->post('/route-plans', $routeData);

        $response->assertRedirect('/route-plans');
        $this->assertDatabaseHas('route_plans', $routeData);
    }

    /** @test */
    public function user_can_view_trucks_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/trucks');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Trucks/Index')
                ->has('trucks')
        );
    }

    /** @test */
    public function user_can_view_drivers_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/drivers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Drivers/Index')
                ->has('drivers')
        );
    }

    /** @test */
    public function user_can_view_customers_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/customers');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Customers/Index')
                ->has('customers')
        );
    }

    /** @test */
    public function user_can_view_operations_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/operations');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Operations/Index')
                ->has('operations')
        );
    }

    /** @test */
    public function user_can_view_maintenance_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/maintenance');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Maintenance/Index')
                ->has('maintenanceRecords')
        );
    }

    /** @test */
    public function user_can_view_fuel_index()
    {
        $response = $this->actingAs($this->user)
            ->get('/fuel');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('Fuel/Index')
                ->has('fuelRecords')
        );
    }

    /** @test */
    public function user_can_view_reports()
    {
        $reports = [
            'trucks' => '/reports/trucks',
            'drivers' => '/reports/drivers',
            'performances' => '/reports/performances',
            'operations' => '/reports/operations',
            'financial' => '/reports/financial',
            'maintenance' => '/reports/maintenance'
        ];

        foreach ($reports as $report => $url) {
            $response = $this->actingAs($this->user)->get($url);
            $response->assertStatus(200);
        }
    }

    /** @test */
    public function truck_validation_works_correctly()
    {
        $invalidData = [
            'plate' => 'INVALID', // Invalid plate format
            'vehicletype_id' => 999, // Non-existent vehicle type
            'status' => 'invalid_status' // Invalid status
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
            'sex' => 'invalid' // Invalid sex
        ];

        $response = $this->actingAs($this->user)
            ->post('/drivers', $invalidData);

        $response->assertSessionHasErrors(['driverid', 'name', 'sex']);
    }

    /** @test */
    public function system_handles_soft_deletes_correctly()
    {
        // Create a truck
        $truck = Truck::create([
            'plate' => 'CC-9999',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active'
        ]);

        // Soft delete the truck
        $truck->delete();

        // Verify it's soft deleted
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);

        // Verify it doesn't appear in normal queries
        $this->assertDatabaseMissing('trucks', [
            'id' => $truck->id,
            'deleted_at' => null
        ]);
    }

    /** @test */
    public function database_relationships_work_correctly()
    {
        // Test truck belongs to vehicle type
        $this->assertEquals($this->vehicleType->id, $this->truck->vehicleType->id);

        // Test operation belongs to customer
        $this->assertEquals($this->customer->id, $this->operation->customer->id);

        // Test operation belongs to region
        $this->assertEquals($this->region->id, $this->operation->region->id);

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
                'description' => "Test description {$i}"
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




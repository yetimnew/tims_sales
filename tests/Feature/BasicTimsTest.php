<?php

namespace Tests\Feature;

use App\Enums\CargoServiceType;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Operation;
use App\Models\Region;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class BasicTimsTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected VehicleType $vehicleType;

    protected Truck $truck;

    protected Driver $driver;

    protected Customer $customer;

    protected Region $region;

    protected CargoType $cargoType;

    protected Operation $operation;

    protected function setUp(): void
    {
        parent::setUp();

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
            'zone' => 'Addis Ababa',
            'mobile' => '+251911234567',
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
            'name' => 'Addis Ababa',
            'description' => 'Capital city region',
        ]);

        $this->cargoType = CargoType::factory()->create();

        // Create Operation
        $this->operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-01-01',
            'destination_scope' => 'region',
            'destination_name' => $this->region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $this->region->id,
            'volume' => 100.00,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => CargoServiceType::Commercial->value,
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function user_can_view_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard');

        $response->assertStatus(200);
    }

    /** @test */
    public function user_can_create_vehicle_type()
    {
        $vehicleTypeData = [
            'name' => 'Light Truck',
            'description' => 'Small truck for light loads',
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
            'purchasePrice' => 3000000.00,
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
            'mobile' => '+251911234568',
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
            'status' => 'active',
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
            'volume' => 200.00,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => CargoServiceType::Commercial->value,
            'km' => 750.00,
            'tariff' => 75.00,
            'status' => 'active',
            'destination_scope' => 'region',
            'destination_id' => $this->region->id,
            'remark' => 'Test remark',
        ];

        $response = $this->actingAs($this->user)
            ->post('/operations', $operationData);

        $response->assertRedirect('/operations');

        $this->assertDatabaseHas('operations', [
            'operationid' => 'OP002',
            'customer_id' => $this->customer->id,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => CargoServiceType::Commercial->value,
            'status' => 'active',
        ]);
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

    /** @test */
    public function unauthenticated_users_cannot_access_protected_routes()
    {
        $protectedRoutes = [
            '/dashboard',
            '/trucks',
            '/drivers',
            '/customers',
            '/operations',
        ];

        foreach ($protectedRoutes as $route) {
            $response = $this->get($route);
            $response->assertRedirect('/login');
        }
    }

    /** @test */
    public function authenticated_users_can_access_protected_routes()
    {
        $protectedRoutes = [
            '/dashboard',
            '/trucks',
            '/drivers',
            '/customers',
            '/operations',
        ];

        foreach ($protectedRoutes as $route) {
            $response = $this->actingAs($this->user)->get($route);
            $response->assertStatus(200);
        }
    }

    /** @test */
    public function csrf_protection_is_enabled()
    {
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'BB-5678',
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        // Should redirect back with CSRF error
        $response->assertStatus(419);
    }

    /** @test */
    public function sql_injection_attempts_are_blocked()
    {
        $maliciousInput = "'; DROP TABLE trucks; --";

        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => $maliciousInput,
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        // Should handle gracefully without executing SQL
        $response->assertSessionHasErrors(['plate']);

        // Verify table still exists
        $this->assertDatabaseHas('trucks', ['id' => $this->truck->id]);
    }

    /** @test */
    public function unique_constraints_prevent_duplicates()
    {
        // Try to create truck with existing plate
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'AA-1234', // Already exists
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        $response->assertSessionHasErrors(['plate']);
    }

    /** @test */
    public function foreign_key_constraints_prevent_orphaned_records()
    {
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'DD-1111',
                'vehicletype_id' => 99999, // Non-existent ID
                'status' => 'active',
            ]);

        $response->assertSessionHasErrors(['vehicletype_id']);
    }
}

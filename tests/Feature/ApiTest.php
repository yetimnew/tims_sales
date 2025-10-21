<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\VehicleType;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Customer;
use App\Models\Region;
use App\Models\Operation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class ApiTest extends TestCase
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

        $this->user = User::factory()->create();
        $this->createTestData();
    }

    private function createTestData(): void
    {
        $this->vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck for heavy loads'
        ]);

        $this->truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012'
        ]);

        $this->driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'Addis Ababa',
            'mobile' => '+251911234567'
        ]);

        $this->customer = Customer::create([
            'name' => 'ABC Transport Company',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active'
        ]);

        $this->region = Region::create([
            'name' => 'Addis Ababa',
            'description' => 'Capital city region'
        ]);

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
    public function api_returns_trucks_list()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'plate',
                        'status',
                        'vehicle_type' => [
                            'id',
                            'name'
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function api_returns_drivers_list()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/drivers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'driverid',
                        'name',
                        'status'
                    ]
                ]
            ]);
    }

    /** @test */
    public function api_returns_customers_list()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/customers');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'contact_person',
                        'status'
                    ]
                ]
            ]);
    }

    /** @test */
    public function api_returns_operations_list()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/operations');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'operationid',
                        'status',
                        'customer' => [
                            'id',
                            'name'
                        ]
                    ]
                ]
            ]);
    }

    /** @test */
    public function api_creates_truck()
    {
        $truckData = [
            'plate' => 'BB-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH567890',
            'engineNumber' => 'EN123456'
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/trucks', $truckData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'status',
                    'vehicle_type'
                ]
            ]);

        $this->assertDatabaseHas('trucks', $truckData);
    }

    /** @test */
    public function api_creates_driver()
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
            ->postJson('/api/drivers', $driverData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'driverid',
                    'name',
                    'status'
                ]
            ]);

        $this->assertDatabaseHas('drivers', $driverData);
    }

    /** @test */
    public function api_updates_truck()
    {
        $updateData = [
            'plate' => 'CC-9999',
            'status' => 'inactive'
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/api/trucks/{$this->truck->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'status'
                ]
            ]);

        $this->assertDatabaseHas('trucks', [
            'id' => $this->truck->id,
            'plate' => 'CC-9999',
            'status' => 'inactive'
        ]);
    }

    /** @test */
    public function api_deletes_truck()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/trucks/{$this->truck->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('trucks', ['id' => $this->truck->id]);
    }

    /** @test */
    public function api_returns_truck_details()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/trucks/{$this->truck->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'status',
                    'vehicle_type',
                    'created_at',
                    'updated_at'
                ]
            ]);
    }

    /** @test */
    public function api_returns_driver_details()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/drivers/{$this->driver->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'driverid',
                    'name',
                    'sex',
                    'status',
                    'zone',
                    'mobile'
                ]
            ]);
    }

    /** @test */
    public function api_returns_customer_details()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/customers/{$this->customer->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'name',
                    'contact_person',
                    'phone',
                    'email',
                    'status'
                ]
            ]);
    }

    /** @test */
    public function api_returns_operation_details()
    {
        $response = $this->actingAs($this->user)
            ->getJson("/api/operations/{$this->operation->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'operationid',
                    'status',
                    'customer',
                    'region',
                    'volume',
                    'cargotype',
                    'km',
                    'tariff'
                ]
            ]);
    }

    /** @test */
    public function api_handles_validation_errors()
    {
        $invalidData = [
            'plate' => '', // Required field
            'vehicletype_id' => 999, // Non-existent
            'status' => 'invalid' // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/trucks', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function api_handles_unauthorized_access()
    {
        $response = $this->getJson('/api/trucks');

        $response->assertStatus(401);
    }

    /** @test */
    public function api_handles_not_found()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks/99999');

        $response->assertStatus(404);
    }

    /** @test */
    public function api_supports_pagination()
    {
        // Create multiple trucks
        for ($i = 0; $i < 25; $i++) {
            Truck::create([
                'plate' => 'DD-' . str_pad($i, 4, '0', STR_PAD_LEFT),
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active'
            ]);
        }

        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks?page=1&per_page=10');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data',
                'links',
                'meta' => [
                    'current_page',
                    'per_page',
                    'total',
                    'last_page'
                ]
            ]);

        $responseData = $response->json();
        $this->assertCount(10, $responseData['data']);
        $this->assertEquals(1, $responseData['meta']['current_page']);
        $this->assertEquals(10, $responseData['meta']['per_page']);
    }

    /** @test */
    public function api_supports_filtering()
    {
        // Create trucks with different statuses
        Truck::create([
            'plate' => 'EE-0001',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active'
        ]);

        Truck::create([
            'plate' => 'EE-0002',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'inactive'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks?status=active');

        $response->assertStatus(200);

        $responseData = $response->json();
        foreach ($responseData['data'] as $truck) {
            $this->assertEquals('active', $truck['status']);
        }
    }

    /** @test */
    public function api_supports_searching()
    {
        // Create trucks with different plates
        Truck::create([
            'plate' => 'FF-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active'
        ]);

        Truck::create([
            'plate' => 'GG-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks?search=FF-1234');

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertCount(1, $responseData['data']);
        $this->assertEquals('FF-1234', $responseData['data'][0]['plate']);
    }

    /** @test */
    public function api_returns_dashboard_statistics()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'total_trucks',
                    'active_trucks',
                    'total_drivers',
                    'active_drivers',
                    'total_customers',
                    'total_operations'
                ]
            ]);
    }

    /** @test */
    public function api_returns_performance_analytics()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/analytics/performance');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'fleet_utilization',
                    'driver_performance',
                    'cost_analysis',
                    'revenue_trends'
                ]
            ]);
    }
}


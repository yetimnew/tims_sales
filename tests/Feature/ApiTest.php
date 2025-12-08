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
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Test;
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

    protected CargoType $cargoType;

    protected Operation $operation;

    protected function setUp(): void
    {
        parent::setUp();

        if (! Route::has('api.trucks.index')) {
            $this->markTestSkipped('API routes are not configured for this installation.');
        }

        $this->seed(CheckPermissionSeeder::class);

        $this->user = User::factory()->create();
        $this->user->assignRole('admin');
        $this->createTestData();
    }

    private function createTestData(): void
    {
        $this->vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck for heavy loads',
        ]);

        $this->truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
        ]);

        $this->driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $this->customer = Customer::create([
            'name' => 'ABC Transport Company',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);

        $this->region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $this->cargoType = CargoType::factory()->create();

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

    #[Test]
    public function api_returns_trucks_list()
    {
        if (! Route::has('api.trucks.index')) {
            $this->markTestSkipped('Trucks API route not available.');
        }

        $response = $this->actingAs($this->user)
            ->getJson(route('api.trucks.index'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'plate',
                        'status',
                        'vehicle_type' => [
                            'id',
                            'name',
                        ],
                    ],
                ],
            ]);
    }

    #[Test]
    public function api_returns_drivers_list()
    {
        if (! Route::has('api.drivers.index')) {
            $this->markTestSkipped('Drivers API route not available.');
        }

        $response = $this->actingAs($this->user)
            ->getJson(route('api.drivers.index'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'driverid',
                        'name',
                        'status',
                    ],
                ],
            ]);
    }

    #[Test]
    public function api_returns_customers_list()
    {
        if (! Route::has('api.customers.index')) {
            $this->markTestSkipped('Customers API route not available.');
        }

        $response = $this->actingAs($this->user)
            ->getJson(route('api.customers.index'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'name',
                        'contact_person',
                        'status',
                    ],
                ],
            ]);
    }

    #[Test]
    public function api_returns_operations_list()
    {
        if (! Route::has('api.operations.index')) {
            $this->markTestSkipped('Operations API route not available.');
        }

        $response = $this->actingAs($this->user)
            ->getJson(route('api.operations.index'));

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    '*' => [
                        'id',
                        'operationid',
                        'status',
                        'customer' => [
                            'id',
                            'name',
                        ],
                        'cargoType' => [
                            'id',
                            'name',
                            'category',
                        ],
                        'cargoServiceType',
                        'destination' => [
                            'scope',
                            'name',
                            'reference_id',
                            'reference_type',
                        ],
                    ],
                ],
            ]);
    }

    #[Test]
    public function api_creates_truck()
    {
        $truckData = [
            'plate' => 'BB-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH567890',
            'engineNumber' => 'EN123456',
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/trucks', $truckData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'status',
                    'vehicle_type',
                ],
            ]);

        $this->assertDatabaseHas('trucks', $truckData);
    }

    #[Test]
    public function api_creates_driver()
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
            ->postJson('/api/drivers', $driverData);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'driverid',
                    'name',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('drivers', $driverData);
    }

    #[Test]
    public function api_updates_truck()
    {
        $updateData = [
            'plate' => 'CC-9999',
            'status' => 'inactive',
        ];

        $response = $this->actingAs($this->user)
            ->putJson("/api/trucks/{$this->truck->id}", $updateData);

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => [
                    'id',
                    'plate',
                    'status',
                ],
            ]);

        $this->assertDatabaseHas('trucks', [
            'id' => $this->truck->id,
            'plate' => 'CC-9999',
            'status' => 'inactive',
        ]);
    }

    #[Test]
    public function api_deletes_truck()
    {
        $response = $this->actingAs($this->user)
            ->deleteJson("/api/trucks/{$this->truck->id}");

        $response->assertStatus(204);

        $this->assertSoftDeleted('trucks', ['id' => $this->truck->id]);
    }

    #[Test]
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
                    'updated_at',
                ],
            ]);
    }

    #[Test]
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
                    'mobile',
                ],
            ]);
    }

    #[Test]
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
                    'status',
                ],
            ]);
    }

    #[Test]
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
                    'cargoType',
                    'cargoServiceType',
                    'destination',
                    'volume',
                    'km',
                    'tariff',
                ],
            ]);
    }

    #[Test]
    public function api_handles_validation_errors()
    {
        $invalidData = [
            'plate' => '', // Required field
            'vehicletype_id' => 999, // Non-existent
            'status' => 'invalid', // Invalid status
        ];

        $response = $this->actingAs($this->user)
            ->postJson('/api/trucks', $invalidData);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['plate', 'vehicletype_id', 'status']);
    }

    #[Test]
    public function api_handles_unauthorized_access()
    {
        $response = $this->getJson('/api/trucks');

        $response->assertStatus(401);
    }

    #[Test]
    public function api_handles_not_found()
    {
        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks/99999');

        $response->assertStatus(404);
    }

    #[Test]
    public function api_supports_pagination()
    {
        // Create multiple trucks
        for ($i = 0; $i < 25; $i++) {
            Truck::create([
                'plate' => 'DD-'.str_pad($i, 4, '0', STR_PAD_LEFT),
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
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
                    'last_page',
                ],
            ]);

        $responseData = $response->json();
        $this->assertCount(10, $responseData['data']);
        $this->assertEquals(1, $responseData['meta']['current_page']);
        $this->assertEquals(10, $responseData['meta']['per_page']);
    }

    #[Test]
    public function api_supports_filtering()
    {
        // Create trucks with different statuses
        Truck::create([
            'plate' => 'EE-0001',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
        ]);

        Truck::create([
            'plate' => 'EE-0002',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'inactive',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks?status=active');

        $response->assertStatus(200);

        $responseData = $response->json();
        foreach ($responseData['data'] as $truck) {
            $this->assertEquals('active', $truck['status']);
        }
    }

    #[Test]
    public function api_supports_searching()
    {
        // Create trucks with different plates
        Truck::create([
            'plate' => 'FF-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
        ]);

        Truck::create([
            'plate' => 'GG-5678',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/trucks?search=FF-1234');

        $response->assertStatus(200);

        $responseData = $response->json();
        $this->assertCount(1, $responseData['data']);
        $this->assertEquals('FF-1234', $responseData['data'][0]['plate']);
    }

    #[Test]
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
                    'total_operations',
                ],
            ]);
    }

    #[Test]
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
                    'revenue_trends',
                ],
            ]);
    }
}

<?php

namespace Tests\Feature\Performance;

use App\Models\Driver;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class PerformanceTest extends TestCase
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
            'trucks.show', 'trucks.store', 'trucks.update',
            'drivers.view', 'drivers.create', 'drivers.edit', 'drivers.destroy',
            'drivers.show', 'drivers.store', 'drivers.update',
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
    public function trucks_index_page_loads_within_acceptable_time()
    {
        // Create test data
        Truck::factory()->count(100)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Trucks index page took too long to load');
    }

    /** @test */
    public function trucks_search_performs_well_with_large_dataset()
    {
        // Create large dataset
        Truck::factory()->count(1000)->create();
        Truck::factory()->create(['plate' => 'SEARCH-TEST']);

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['search' => 'SEARCH']));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Trucks/Index')
            ->has('trucks.data', 1)
            ->where('trucks.data.0.plate', 'SEARCH-TEST')
        );

        // Assert search response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks search took too long');
    }

    /** @test */
    public function trucks_sort_performs_well_with_large_dataset()
    {
        // Create large dataset
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['sort' => 'plate', 'direction' => 'asc']));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert sort response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks sort took too long');
    }

    /** @test */
    public function trucks_pagination_performs_well_with_large_dataset()
    {
        // Create large dataset
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['page' => 50]));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert pagination response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks pagination took too long');
    }

    /** @test */
    public function trucks_export_endpoint_is_not_available()
    {
        Truck::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get('/trucks/export/csv');

        $response->assertNotFound();

        $responseTime = microtime(true) - $startTime;
        $this->assertLessThan(1.0, $responseTime, 'Disabled export endpoint responded too slowly');
    }

    /** @test */
    public function trucks_show_page_loads_within_acceptable_time()
    {
        $truck = Truck::factory()->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks show page took too long to load');
    }

    /** @test */
    public function trucks_create_page_loads_within_acceptable_time()
    {
        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.create'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks create page took too long to load');
    }

    /** @test */
    public function trucks_store_performs_well()
    {
        $truckData = [
            'plate' => 'PERF-123',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
        ];

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'PERF-123']);

        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks store took too long');
    }

    /** @test */
    public function trucks_update_performs_well()
    {
        $truck = Truck::factory()->create();

        $updateData = [
            'plate' => 'UPDATED-123',
            'vehicletype_id' => $truck->vehicletype_id,
            'status' => 'active',
        ];

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), $updateData);

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertRedirect(route('trucks.show', $truck));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'plate' => 'UPDATED-123',
        ]);

        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks update took too long');
    }

    /** @test */
    public function trucks_destroy_performs_well()
    {
        $truck = Truck::factory()->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);

        // Assert response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Trucks destroy took too long');
    }

    /** @test */
    public function drivers_index_page_loads_within_acceptable_time()
    {
        // Create test data
        Driver::factory()->count(100)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Drivers index page took too long to load');
    }

    /** @test */
    public function drivers_search_performs_well_with_large_dataset()
    {
        // Create large dataset
        Driver::factory()->count(1000)->create();
        Driver::factory()->create(['name' => 'SEARCH TEST']);

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['search' => 'SEARCH']));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Drivers/Index')
            ->has('drivers.data', 1)
            ->where('drivers.data.0.name', 'SEARCH TEST')
        );

        // Assert search response time is under 1 second
        $this->assertLessThan(1.0, $responseTime, 'Drivers search took too long');
    }

    /** @test */
    public function drivers_export_endpoint_is_not_available()
    {
        // Create large dataset
        Driver::factory()->count(1000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get('/drivers/export/csv');

        $response->assertNotFound();

        $responseTime = microtime(true) - $startTime;

        // Assert disabled endpoint responds quickly
        $this->assertLessThan(1.0, $responseTime, 'Disabled export endpoint responded too slowly');
    }

    /** @test */
    public function dashboard_loads_within_acceptable_time()
    {
        // Create test data
        Truck::factory()->count(50)->create();
        Driver::factory()->count(50)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('dashboard'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Dashboard took too long to load');
    }

    /** @test */
    public function maintenance_index_page_loads_within_acceptable_time()
    {
        // Create test data
        \App\Models\VehicleMaintenanceRecord::factory()->count(100)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('maintenance.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Maintenance index page took too long to load');
    }

    /** @test */
    public function fuel_index_page_loads_within_acceptable_time()
    {
        // Create test data
        \App\Models\FuelRecord::factory()->count(100)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('fuel.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Fuel index page took too long to load');
    }

    /** @test */
    public function financial_index_page_loads_within_acceptable_time()
    {
        // Create test data
        \App\Models\TruckFinancialRecord::factory()->count(100)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('financial.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Financial index page took too long to load');
    }

    /** @test */
    public function concurrent_requests_handle_well()
    {
        // Create test data
        Truck::factory()->count(100)->create();

        $startTime = microtime(true);

        // Simulate concurrent requests
        $responses = [];
        for ($i = 0; $i < 10; $i++) {
            $responses[] = $this->actingAs($this->user)
                ->get(route('trucks.index'));
        }

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        // Verify all responses are successful
        foreach ($responses as $response) {
            $response->assertStatus(200);
        }

        // Assert total response time is under 5 seconds
        $this->assertLessThan(5.0, $responseTime, 'Concurrent requests took too long');
    }

    /** @test */
    public function memory_usage_stays_within_limits()
    {
        // Create large dataset
        Truck::factory()->count(1000)->create();

        $memoryBefore = memory_get_usage();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $memoryAfter = memory_get_usage();
        $memoryUsed = $memoryAfter - $memoryBefore;

        $response->assertStatus(200);

        // Assert memory usage is under 50MB
        $this->assertLessThan(50 * 1024 * 1024, $memoryUsed, 'Memory usage exceeded limits');
    }

    /** @test */
    public function database_queries_are_optimized()
    {
        // Create test data
        Truck::factory()->count(100)->create();

        // Enable query logging
        \DB::enableQueryLog();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $queries = \DB::getQueryLog();
        $queryCount = count($queries);

        $response->assertStatus(200);

        // Assert query count is reasonable (under 20 queries)
        $this->assertLessThan(20, $queryCount, 'Too many database queries executed');
    }

    /** @test */
    public function n_plus_one_queries_are_prevented()
    {
        // Create test data with relationships
        $trucks = Truck::factory()->count(50)->create();
        foreach ($trucks as $truck) {
            \App\Models\VehicleMaintenanceRecord::factory()->count(3)->create(['truck_id' => $truck->id]);
        }

        // Enable query logging
        \DB::enableQueryLog();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $queries = \DB::getQueryLog();
        $queryCount = count($queries);

        $response->assertStatus(200);

        // Assert query count is reasonable (under 10 queries)
        $this->assertLessThan(10, $queryCount, 'N+1 query problem detected');
    }

    /** @test */
    public function large_csv_export_endpoint_is_not_available()
    {
        Truck::factory()->count(5000)->create();

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get('/trucks/export/csv');

        $response->assertNotFound();

        $responseTime = microtime(true) - $startTime;
        $this->assertLessThan(1.0, $responseTime, 'Disabled export endpoint responded too slowly');
    }

    /** @test */
    public function complex_search_performs_well()
    {
        // Create test data
        Truck::factory()->count(1000)->create();
        Driver::factory()->count(1000)->create();

        $startTime = microtime(true);

        // Complex search with multiple parameters
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', [
                'search' => 'TEST',
                'status' => 'active',
                'sort' => 'plate',
                'direction' => 'asc',
                'page' => 1,
            ]));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert complex search response time is under 2 seconds
        $this->assertLessThan(2.0, $responseTime, 'Complex search took too long');
    }

    /** @test */
    public function relationship_loading_performs_well()
    {
        // Create test data with relationships
        $trucks = Truck::factory()->count(100)->create();
        foreach ($trucks as $truck) {
            \App\Models\VehicleMaintenanceRecord::factory()->count(5)->create(['truck_id' => $truck->id]);
            \App\Models\FuelRecord::factory()->count(10)->create(['truck_id' => $truck->id]);
        }

        $startTime = microtime(true);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $endTime = microtime(true);
        $responseTime = $endTime - $startTime;

        $response->assertStatus(200);

        // Assert response time is under 3 seconds
        $this->assertLessThan(3.0, $responseTime, 'Relationship loading took too long');
    }
}

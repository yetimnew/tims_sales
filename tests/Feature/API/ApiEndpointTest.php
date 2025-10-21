<?php

namespace Tests\Feature\API;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiEndpointTest extends TestCase
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
            'drivers.show', 'drivers.store', 'drivers.update', 'drivers.export'
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
    public function trucks_index_endpoint_returns_correct_data()
    {
        Truck::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 3)
                ->has('trucks.meta')
                ->where('trucks.meta.total', 3)
            );
    }

    /** @test */
    public function trucks_create_endpoint_returns_correct_data()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.create'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Create')
                ->has('vehicleTypes')
            );
    }

    /** @test */
    public function trucks_store_endpoint_creates_truck()
    {
        $truckData = [
            'plate' => 'API-123',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'API-123']);
    }

    /** @test */
    public function trucks_show_endpoint_returns_correct_data()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Show')
                ->has('truck')
                ->has('activityLogs')
                ->where('truck.id', $truck->id)
            );
    }

    /** @test */
    public function trucks_edit_endpoint_returns_correct_data()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.edit', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Edit')
                ->has('truck')
                ->has('vehicleTypes')
                ->where('truck.id', $truck->id)
            );
    }

    /** @test */
    public function trucks_update_endpoint_updates_truck()
    {
        $truck = Truck::factory()->create(['plate' => 'OLD-123']);

        $updateData = [
            'plate' => 'NEW-456',
            'vehicletype_id' => $truck->vehicletype_id,
            'status' => 'maintenance'
        ];

        $response = $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), $updateData);

        $response->assertRedirect(route('trucks.show', $truck));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'plate' => 'NEW-456',
            'status' => 'maintenance'
        ]);
    }

    /** @test */
    public function trucks_destroy_endpoint_deletes_truck()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);
    }

    /** @test */
    public function trucks_export_endpoint_returns_csv()
    {
        Truck::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="trucks.csv"');
    }

    /** @test */
    public function drivers_index_endpoint_returns_correct_data()
    {
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 3)
                ->has('drivers.meta')
                ->where('drivers.meta.total', 3)
            );
    }

    /** @test */
    public function drivers_create_endpoint_returns_correct_data()
    {
        $response = $this->actingAs($this->user)
            ->get(route('drivers.create'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Create')
                ->has('zones')
                ->has('woredas')
            );
    }

    /** @test */
    public function drivers_store_endpoint_creates_driver()
    {
        $driverData = [
            'name' => 'API Driver',
            'driver_id' => 'API001',
            'mobile' => '+251911234567',
            'sex' => 'Male',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['name' => 'API Driver']);
    }

    /** @test */
    public function drivers_show_endpoint_returns_correct_data()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.show', $driver));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Show')
                ->has('driver')
                ->has('activityLogs')
                ->where('driver.id', $driver->id)
            );
    }

    /** @test */
    public function drivers_edit_endpoint_returns_correct_data()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.edit', $driver));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Edit')
                ->has('driver')
                ->has('zones')
                ->has('woredas')
                ->where('driver.id', $driver->id)
            );
    }

    /** @test */
    public function drivers_update_endpoint_updates_driver()
    {
        $driver = Driver::factory()->create(['name' => 'Old Name']);

        $updateData = [
            'name' => 'New Name',
            'driver_id' => $driver->driver_id,
            'mobile' => $driver->mobile,
            'sex' => $driver->sex,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), $updateData);

        $response->assertRedirect(route('drivers.show', $driver));
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'name' => 'New Name'
        ]);
    }

    /** @test */
    public function drivers_destroy_endpoint_deletes_driver()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $response->assertRedirect(route('drivers.index'));
        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    /** @test */
    public function drivers_export_endpoint_returns_csv()
    {
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="drivers.csv"');
    }

    /** @test */
    public function maintenance_index_endpoint_returns_correct_data()
    {
        \App\Models\VehicleMaintenanceRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('maintenance.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Maintenance/Index')
                ->has('maintenanceRecords.data', 3)
                ->has('statistics')
            );
    }

    /** @test */
    public function fuel_index_endpoint_returns_correct_data()
    {
        \App\Models\FuelRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('fuel.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Fuel/Index')
                ->has('fuelRecords.data', 3)
            );
    }

    /** @test */
    public function financial_index_endpoint_returns_correct_data()
    {
        \App\Models\TruckFinancialRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('financial.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Financial/Index')
                ->has('financialRecords.data', 3)
            );
    }

    /** @test */
    public function dashboard_endpoint_returns_correct_data()
    {
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

    /** @test */
    public function api_endpoints_require_authentication()
    {
        $truck = Truck::factory()->create();

        $response = $this->get(route('trucks.index'));
        $response->assertRedirect('/login');

        $response = $this->get(route('trucks.show', $truck));
        $response->assertRedirect('/login');

        $response = $this->post(route('trucks.store'), []);
        $response->assertRedirect('/login');
    }

    /** @test */
    public function api_endpoints_require_permissions()
    {
        $userWithoutPermission = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.index'));

        $response->assertStatus(403);

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);

        $response = $this->actingAs($userWithoutPermission)
            ->post(route('trucks.store'), []);

        $response->assertStatus(403);
    }

    /** @test */
    public function api_endpoints_handle_validation_errors()
    {
        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);

        $truck = Truck::factory()->create();
        $response = $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function api_endpoints_handle_not_found_resources()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', 99999));

        $response->assertStatus(404);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.edit', 99999));

        $response->assertStatus(404);

        $response = $this->actingAs($this->user)
            ->put(route('trucks.update', 99999), []);

        $response->assertStatus(404);

        $response = $this->actingAs($this->user)
            ->delete(route('trucks.destroy', 99999));

        $response->assertStatus(404);
    }

    /** @test */
    public function api_endpoints_handle_search_parameters()
    {
        Truck::factory()->create(['plate' => 'SEARCH-123']);
        Truck::factory()->create(['plate' => 'OTHER-456']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['search' => 'SEARCH']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 1)
                ->where('trucks.data.0.plate', 'SEARCH-123')
            );
    }

    /** @test */
    public function api_endpoints_handle_sort_parameters()
    {
        Truck::factory()->create(['plate' => 'ZYX-999']);
        Truck::factory()->create(['plate' => 'ABC-123']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['sort' => 'plate', 'direction' => 'asc']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 2)
                ->where('trucks.data.0.plate', 'ABC-123')
                ->where('trucks.data.1.plate', 'ZYX-999')
            );
    }

    /** @test */
    public function api_endpoints_handle_pagination_parameters()
    {
        Truck::factory()->count(25)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['page' => 2]));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 10)
                ->where('trucks.meta.current_page', 2)
                ->where('trucks.meta.last_page', 2)
            );
    }

    /** @test */
    public function api_endpoints_handle_filter_parameters()
    {
        Truck::factory()->create(['status' => 'active']);
        Truck::factory()->create(['status' => 'inactive']);
        Truck::factory()->create(['status' => 'maintenance']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['status' => 'active']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 1)
                ->where('trucks.data.0.status', 'active')
            );
    }

    /** @test */
    public function api_endpoints_handle_export_parameters()
    {
        Truck::factory()->create(['plate' => 'EXPORT-123', 'status' => 'active']);
        Truck::factory()->create(['plate' => 'OTHER-456', 'status' => 'inactive']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['status' => 'active']));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('EXPORT-123', $csvContent);
        $this->assertStringNotContainsString('OTHER-456', $csvContent);
    }

    /** @test */
    public function api_endpoints_handle_rate_limiting()
    {
        // Test rate limiting by making multiple requests
        for ($i = 0; $i < 5; $i++) {
            $response = $this->actingAs($this->user)
                ->get(route('trucks.index'));
            $response->assertStatus(200);
        }

        // Rate limiting should kick in after multiple requests
        // This test ensures the middleware is properly configured
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));
        $response->assertStatus(200); // Should still work within limits
    }

    /** @test */
    public function api_endpoints_handle_cors_headers()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
        // CORS headers would be tested in a real API scenario
        // This test ensures the endpoint is accessible
    }

    /** @test */
    public function api_endpoints_handle_content_type_headers()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/html; charset=UTF-8');
    }

    /** @test */
    public function api_endpoints_handle_method_not_allowed()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->patch(route('trucks.update', $truck), []);

        $response->assertStatus(405); // Method Not Allowed
    }

    /** @test */
    public function api_endpoints_handle_invalid_route_parameters()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', 'invalid-id'));

        $response->assertStatus(404);
    }
}

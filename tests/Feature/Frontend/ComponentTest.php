<?php

namespace Tests\Feature\Frontend;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComponentTest extends TestCase
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
    public function trucks_index_page_displays_correctly()
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
    public function trucks_create_page_displays_correctly()
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
    public function trucks_show_page_displays_correctly()
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
    public function trucks_edit_page_displays_correctly()
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
    public function drivers_index_page_displays_correctly()
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
    public function drivers_create_page_displays_correctly()
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
    public function drivers_show_page_displays_correctly()
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
    public function drivers_edit_page_displays_correctly()
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
    public function dashboard_displays_correctly()
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
    public function maintenance_index_page_displays_correctly()
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
    public function fuel_index_page_displays_correctly()
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
    public function financial_index_page_displays_correctly()
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
    public function vehicle_types_index_page_displays_correctly()
    {
        \App\Models\VehicleType::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('vehicletypes.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('VehicleTypes/Index')
                ->has('vehicleTypes.data', 3)
            );
    }

    /** @test */
    public function cargo_types_index_page_displays_correctly()
    {
        \App\Models\CargoType::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('cargo-types.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('CargoTypes/Index')
                ->has('cargoTypes.data', 3)
            );
    }

    /** @test */
    public function regions_index_page_displays_correctly()
    {
        \App\Models\Region::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('regions.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Regions/Index')
                ->has('regions.data', 3)
            );
    }

    /** @test */
    public function zones_index_page_displays_correctly()
    {
        \App\Models\Zone::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('zones.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Zones/Index')
                ->has('zones.data', 3)
            );
    }

    /** @test */
    public function woredas_index_page_displays_correctly()
    {
        \App\Models\Woreda::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('woredas.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Woredas/Index')
                ->has('woredas.data', 3)
            );
    }

    /** @test */
    public function places_index_page_displays_correctly()
    {
        \App\Models\Place::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('places.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Places/Index')
                ->has('places.data', 3)
            );
    }

    /** @test */
    public function customers_index_page_displays_correctly()
    {
        \App\Models\Customer::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('customers.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Customers/Index')
                ->has('customers.data', 3)
            );
    }

    /** @test */
    public function users_index_page_displays_correctly()
    {
        User::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('users.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Users/Index')
                ->has('users.data', 4) // 3 created + 1 authenticated user
            );
    }

    /** @test */
    public function roles_index_page_displays_correctly()
    {
        \App\Models\Role::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('roles.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Roles/Index')
                ->has('roles.data', 3)
            );
    }

    /** @test */
    public function permissions_index_page_displays_correctly()
    {
        \App\Models\Permission::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('permissions.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Permissions/Index')
                ->has('permissions.data', 3)
            );
    }

    /** @test */
    public function status_types_index_page_displays_correctly()
    {
        \App\Models\StatusType::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('statustypes.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('StatusTypes/Index')
                ->has('statusTypes.data', 3)
            );
    }

    /** @test */
    public function statuses_index_page_displays_correctly()
    {
        \App\Models\Status::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('statuses.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Statuses/Index')
                ->has('statuses.data', 3)
            );
    }

    /** @test */
    public function page_components_have_correct_props()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Show')
                ->has('truck.id')
                ->has('truck.plate')
                ->has('truck.status')
                ->has('truck.created_at')
                ->has('truck.updated_at')
                ->has('activityLogs')
            );
    }

    /** @test */
    public function page_components_have_correct_layout()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data')
                ->has('trucks.meta.total')
                ->has('trucks.meta.per_page')
                ->has('trucks.meta.current_page')
                ->has('trucks.meta.last_page')
            );
    }

    /** @test */
    public function page_components_handle_empty_data()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 0)
                ->where('trucks.meta.total', 0)
            );
    }

    /** @test */
    public function page_components_handle_search_results()
    {
        Truck::factory()->create(['plate' => 'ABC-123']);
        Truck::factory()->create(['plate' => 'XYZ-789']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['search' => 'ABC']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 1)
                ->where('trucks.data.0.plate', 'ABC-123')
            );
    }

    /** @test */
    public function page_components_handle_sort_results()
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
    public function page_components_handle_pagination()
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
    public function page_components_handle_permissions()
    {
        $userWithoutPermission = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);
    }

    /** @test */
    public function page_components_handle_validation_errors()
    {
        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function page_components_handle_flash_messages()
    {
        $truckData = [
            'plate' => 'FLASH-123',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $response->assertSessionHas('success', 'Truck created successfully');
    }
}

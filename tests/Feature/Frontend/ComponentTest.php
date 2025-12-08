<?php

namespace Tests\Feature\Frontend;

use App\Models\Driver;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class ComponentTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected array $permissionNames = [];

    protected function setUp(): void
    {
        parent::setUp();

        $this->permissionNames = [
            'trucks.view',
            'trucks.create',
            'trucks.show',
            'trucks.edit',
            'trucks.store',
            'trucks.update',
            'trucks.destroy',
            'drivers.view',
            'drivers.create',
            'drivers.show',
            'drivers.edit',
            'drivers.export',
            'drivers.destroy',
            'maintenance.view',
            'maintenance.show',
            'maintenance.create',
            'maintenance.store',
            'maintenance.edit',
            'maintenance.update',
            'maintenance.destroy',
            'maintenance.export',
            'maintenance.complete',
            'maintenance-types.view',
            'maintenance-types.show',
            'maintenance-types.create',
            'maintenance-types.store',
            'maintenance-types.edit',
            'maintenance-types.update',
            'maintenance-types.destroy',
            'maintenance-types.export',
            'fuel.view',
            'financial.view',
            'vehicletypes.view',
            'customers.view',
            'customers.destroy',
            'users.view',
            'roles.view',
            'permissions.view',
        ];

        foreach ($this->permissionNames as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $adminRole = Role::firstOrCreate([
            'name' => 'admin',
            'guard_name' => 'web',
        ]);
        $adminRole->syncPermissions($this->permissionNames);

        $managerRole = Role::firstOrCreate([
            'name' => 'manager',
            'guard_name' => 'web',
        ]);
        $managerRole->syncPermissions(array_filter(
            $this->permissionNames,
            fn (string $permission): bool => ! str_contains($permission, '.destroy')
        ));

        $viewerPermissions = array_values(array_filter(
            $this->permissionNames,
            fn (string $permission): bool => str_contains($permission, '.view') || str_contains($permission, '.show')
        ));

        $userRole = Role::firstOrCreate([
            'name' => 'user',
            'guard_name' => 'web',
        ]);
        $userRole->syncPermissions($viewerPermissions);

        $this->user = User::factory()->create();
        $this->user->assignRole($adminRole);
    }

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
    public function maintenance_index_page_displays_correctly()
    {
        \App\Models\VehicleMaintenanceRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('maintenance.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Maintenance/Index')
                ->has('maintenanceRecords.data', 3)
                ->has('metrics')
            );
    }

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
    public function roles_index_page_displays_correctly()
    {
        $response = $this->actingAs($this->user)
            ->get(route('roles.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Roles/Index')
                ->has('roles.data', 3)
            );
    }

    #[Test]
    public function permissions_index_page_displays_correctly()
    {
        $response = $this->actingAs($this->user)
            ->get(route('permissions.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Permissions/Index')
                ->has('permissions.data')
                ->where('permissions.meta.total', count($this->permissionNames))
            );
    }

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
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

    #[Test]
    public function page_components_handle_permissions()
    {
        /** @var User $userWithoutPermission */
        $userWithoutPermission = User::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);
    }

    #[Test]
    public function page_components_handle_validation_errors()
    {
        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    #[Test]
    public function page_components_handle_flash_messages()
    {
        $truckData = [
            'plate' => 'FLASH-123',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $response->assertSessionHas('success', 'Truck created successfully');
    }
}

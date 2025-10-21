<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Driver;
use App\Models\Truck;
use App\Models\Zone;
use App\Models\Woreda;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class DriverControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $zone;
    protected $woreda;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
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

        // Create zone and woreda for testing
        $this->zone = Zone::factory()->create();
        $this->woreda = Woreda::factory()->create(['zone_id' => $this->zone->id]);
    }

    /** @test */
    public function it_can_display_drivers_index_page()
    {
        Driver::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 5)
            );
    }

    /** @test */
    public function it_can_search_drivers()
    {
        Driver::factory()->create(['name' => 'John Doe']);
        Driver::factory()->create(['name' => 'Jane Smith']);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['search' => 'John']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 1)
                ->where('drivers.data.0.name', 'John Doe')
            );
    }

    /** @test */
    public function it_can_sort_drivers_by_name()
    {
        Driver::factory()->create(['name' => 'Zoe Wilson']);
        Driver::factory()->create(['name' => 'Alice Brown']);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['sort' => 'name', 'direction' => 'asc']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 2)
                ->where('drivers.data.0.name', 'Alice Brown')
                ->where('drivers.data.1.name', 'Zoe Wilson')
            );
    }

    /** @test */
    public function it_can_display_driver_create_page()
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
    public function it_can_store_a_new_driver()
    {
        $driverData = [
            'name' => 'John Doe',
            'driver_id' => 'DRV001',
            'mobile' => '+251911234567',
            'sex' => 'Male',
            'birthdate' => '1990-05-15',
            'hired_date' => '2020-01-01',
            'zone_id' => $this->zone->id,
            'woreda_id' => $this->woreda->id,
            'kebele' => '01',
            'house_number' => '123',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['name' => 'John Doe']);
    }

    /** @test */
    public function it_validates_driver_store_request()
    {
        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), []);

        $response->assertSessionHasErrors(['name', 'driver_id', 'mobile', 'sex', 'status']);
    }

    /** @test */
    public function it_can_display_driver_show_page()
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
    public function it_can_display_driver_edit_page()
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
    public function it_can_update_a_driver()
    {
        $driver = Driver::factory()->create(['name' => 'Old Name']);

        $updateData = [
            'name' => 'New Name',
            'driver_id' => $driver->driver_id,
            'mobile' => $driver->mobile,
            'sex' => $driver->sex,
            'status' => 'inactive'
        ];

        $response = $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), $updateData);

        $response->assertRedirect(route('drivers.show', $driver));
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'name' => 'New Name',
            'status' => 'inactive'
        ]);
    }

    /** @test */
    public function it_can_delete_a_driver()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $response->assertRedirect(route('drivers.index'));
        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    /** @test */
    public function it_can_export_drivers_to_csv()
    {
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="drivers.csv"');
    }

    /** @test */
    public function it_can_assign_driver_to_truck()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->post(route('drivers.assign-truck', $driver), [
                'truck_id' => $truck->id,
                'assigned_date' => now()->format('Y-m-d')
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active'
        ]);
    }

    /** @test */
    public function it_can_unassign_driver_from_truck()
    {
        $driver = Driver::factory()->create();
        $truck = Truck::factory()->create();

        // First assign the driver to truck
        $driver->trucks()->attach($truck->id, [
            'assigned_date' => now(),
            'status' => 'active'
        ]);

        $response = $this->actingAs($this->user)
            ->post(route('drivers.unassign-truck', $driver), [
                'truck_id' => $truck->id,
                'unassigned_date' => now()->format('Y-m-d')
            ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'inactive'
        ]);
    }

    /** @test */
    public function it_requires_permission_to_view_drivers()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.index'));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_create_drivers()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.create'));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_edit_drivers()
    {
        $driver = Driver::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.edit', $driver));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_delete_drivers()
    {
        $driver = Driver::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->delete(route('drivers.destroy', $driver));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_logs_activity_when_creating_driver()
    {
        $driverData = [
            'name' => 'John Doe',
            'driver_id' => 'DRV001',
            'mobile' => '+251911234567',
            'sex' => 'Male',
            'status' => 'active'
        ];

        $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\Driver',
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_activity_when_updating_driver()
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), [
                'name' => 'Updated Name',
                'driver_id' => $driver->driver_id,
                'mobile' => $driver->mobile,
                'sex' => $driver->sex,
                'status' => 'active'
            ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'updated',
            'subject_type' => 'App\Models\Driver',
            'subject_id' => $driver->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_activity_when_deleting_driver()
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'deleted',
            'subject_type' => 'App\Models\Driver',
            'subject_id' => $driver->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_can_filter_drivers_by_status()
    {
        Driver::factory()->create(['status' => 'active']);
        Driver::factory()->create(['status' => 'inactive']);
        Driver::factory()->create(['status' => 'suspended']);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['status' => 'active']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 1)
                ->where('drivers.data.0.status', 'active')
            );
    }

    /** @test */
    public function it_can_filter_drivers_by_zone()
    {
        $zone1 = Zone::factory()->create();
        $zone2 = Zone::factory()->create();

        Driver::factory()->create(['zone_id' => $zone1->id]);
        Driver::factory()->create(['zone_id' => $zone2->id]);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['zone_id' => $zone1->id]));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 1)
            );
    }
}

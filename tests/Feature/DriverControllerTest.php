<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\User;
use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
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
            'drivers.show', 'drivers.store', 'drivers.update', 'drivers.export',
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

    #[Test]
    public function it_can_display_drivers_index_page()
    {
        Driver::factory()->count(5)->create(['status' => 'active']);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 5)
            );
    }

    #[Test]
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

    #[Test]
    public function it_can_sort_drivers_by_name()
    {
        Driver::factory()->create(['name' => 'Zoe Wilson', 'status' => 'active']);
        Driver::factory()->create(['name' => 'Alice Brown', 'status' => 'active']);

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

    #[Test]
    public function it_lists_drivers_newest_first(): void
    {
        $olderDriver = Driver::factory()->create([
            'created_at' => now()->subDays(2),
            'status' => 'active',
        ]);
        $newerDriver = Driver::factory()->create([
            'created_at' => now()->subDay(),
            'status' => 'active',
        ]);
        $latestDriver = Driver::factory()->create([
            'created_at' => now(),
            'status' => 'active',
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index'));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 3)
                ->where('drivers.data.0.id', $latestDriver->id)
                ->where('drivers.data.1.id', $newerDriver->id)
                ->where('drivers.data.2.id', $olderDriver->id)
            );
    }

    #[Test]
    public function it_can_display_driver_create_page()
    {
        $response = $this->actingAs($this->user)
            ->get(route('drivers.create'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Create')
            );
    }

    #[Test]
    public function it_can_store_a_new_driver()
    {
        $driverData = [
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'birthdate' => '1990-05-15',
            'zone' => 'ADDISE ABABA',
            'woreda' => 'Bole',
            'kebele' => '01',
            'housenumber' => '123',
            'mobile' => '+251911234567',
            'hireddate' => '2020-01-01',
            'status' => 'active',
        ];

        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['driverid' => 'DRV001', 'name' => 'John Doe']);
    }

    #[Test]
    public function it_validates_driver_store_request()
    {
        $response = $this->actingAs($this->user)
            ->post(route('drivers.store'), []);

        $response->assertSessionHasErrors(['driverid', 'name', 'sex', 'status']);
    }

    #[Test]
    public function it_can_display_driver_show_page()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.show', $driver));

        $response->assertStatus(200)
            ->assertInertia(fn (Assert $page) => $page
                ->component('Drivers/Show')
                ->has('driver')
                ->has('activityLogs')
                ->has('performanceSummary')
                ->has('safetySummary')
                ->has('counts', fn (Assert $counts) => $counts
                    ->where('trucks', 0)
                    ->where('assignments', 0)
                    ->where('performances', 0)
                    ->where('performance_records', 0)
                    ->where('safety_records', 0)
                    ->where('fuel_records', 0)
                )
                ->where('driver.id', $driver->id)
            );
    }

    #[Test]
    public function it_can_display_driver_edit_page()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.edit', $driver));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Edit')
                ->has('driver')
                ->where('driver.id', $driver->id)
            );
    }

    #[Test]
    public function it_can_update_a_driver()
    {
        $driver = Driver::factory()->create(['name' => 'Old Name']);

        $updateData = [
            'driverid' => $driver->driverid,
            'name' => 'New Name',
            'sex' => strtolower($driver->sex),
            'birthdate' => optional($driver->birthdate)->format('Y-m-d'),
            'zone' => $driver->zone,
            'woreda' => $driver->woreda,
            'kebele' => $driver->kebele,
            'housenumber' => $driver->housenumber,
            'mobile' => $driver->mobile,
            'hireddate' => optional($driver->hireddate)->format('Y-m-d'),
            'status' => 'inactive',
        ];

        $response = $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), $updateData);

        $response->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'name' => 'New Name',
            'status' => 'inactive',
        ]);
    }

    #[Test]
    public function it_can_delete_a_driver()
    {
        $driver = Driver::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $response->assertRedirect(route('drivers.index'));
        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    #[Test]
    public function it_can_export_drivers_to_csv()
    {
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $contentDisposition = $response->headers->get('Content-Disposition');

        $this->assertNotNull($contentDisposition);
        $this->assertTrue(Str::startsWith($contentDisposition, 'attachment; filename="drivers_'));
        $this->assertTrue(Str::endsWith($contentDisposition, '.csv"'));
    }

    #[Test]
    public function it_requires_permission_to_view_drivers()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.index'));

        $response->assertStatus(403);
    }

    #[Test]
    public function it_requires_permission_to_create_drivers()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.create'));

        $response->assertStatus(403);
    }

    #[Test]
    public function it_requires_permission_to_edit_drivers()
    {
        $driver = Driver::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('drivers.edit', $driver));

        $response->assertStatus(403);
    }

    #[Test]
    public function it_requires_permission_to_delete_drivers()
    {
        $driver = Driver::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->delete(route('drivers.destroy', $driver));

        $response->assertStatus(403);
    }

    #[Test]
    public function it_logs_activity_when_creating_driver()
    {
        $driverData = [
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'mobile' => '+251911234567',
            'status' => 'active',
        ];

        $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $driver = Driver::where('driverid', 'DRV001')->first();

        $this->assertNotNull($driver);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => Driver::class,
            'subject_id' => $driver->id,
        ]);
    }

    #[Test]
    public function it_logs_activity_when_updating_driver()
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), [
                'driverid' => $driver->driverid,
                'name' => 'Updated Name',
                'sex' => strtolower($driver->sex),
                'birthdate' => optional($driver->birthdate)->format('Y-m-d'),
                'zone' => $driver->zone,
                'woreda' => $driver->woreda,
                'kebele' => $driver->kebele,
                'housenumber' => $driver->housenumber,
                'mobile' => $driver->mobile,
                'hireddate' => optional($driver->hireddate)->format('Y-m-d'),
                'status' => 'active',
            ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'updated',
            'subject_type' => Driver::class,
            'subject_id' => $driver->id,
        ]);
    }

    #[Test]
    public function it_logs_activity_when_deleting_driver()
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'deleted',
            'subject_type' => Driver::class,
            'subject_id' => $driver->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User',
        ]);
    }

    #[Test]
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

    #[Test]
    public function it_can_filter_drivers_by_zone()
    {
        Driver::factory()->create(['zone' => 'Zone One', 'status' => 'active']);
        Driver::factory()->create(['zone' => 'Zone Two', 'status' => 'active']);

        $response = $this->actingAs($this->user)
            ->get(route('drivers.index', ['search' => 'Zone One']));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Index')
                ->has('drivers.data', 1)
                ->where('drivers.data.0.zone', 'Zone One')
            );
    }
}

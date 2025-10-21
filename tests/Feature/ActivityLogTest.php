<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Spatie\Activitylog\Models\Activity;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ActivityLogTest extends TestCase
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
            'drivers.show', 'drivers.store', 'drivers.update'
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
    public function it_logs_truck_creation()
    {
        $truckData = [
            'plate' => 'LOG-123',
            'vehicletype_id' => \App\Models\VehicleType::factory()->create()->id,
            'status' => 'active'
        ];

        $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'description' => 'created',
            'subject_type' => 'App\Models\Truck',
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);

        $activity = Activity::latest()->first();
        $this->assertEquals('created', $activity->description);
        $this->assertEquals('App\Models\Truck', $activity->subject_type);
        $this->assertEquals($this->user->id, $activity->causer_id);
    }

    /** @test */
    public function it_logs_truck_update()
    {
        $truck = Truck::factory()->create(['plate' => 'OLD-123']);

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'NEW-456',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'maintenance'
            ]);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'description' => 'updated',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);

        $activity = Activity::latest()->first();
        $this->assertEquals('updated', $activity->description);
        $this->assertEquals($truck->id, $activity->subject_id);
        $this->assertArrayHasKey('old_values', $activity->properties);
        $this->assertArrayHasKey('attributes', $activity->properties);
    }

    /** @test */
    public function it_logs_truck_deletion()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'description' => 'deleted',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);

        $activity = Activity::latest()->first();
        $this->assertEquals('deleted', $activity->description);
        $this->assertEquals($truck->id, $activity->subject_id);
    }

    /** @test */
    public function it_logs_driver_creation()
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
            'log_name' => 'default',
            'description' => 'created',
            'subject_type' => 'App\Models\Driver',
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_driver_update()
    {
        $driver = Driver::factory()->create(['name' => 'Old Name']);

        $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), [
                'name' => 'New Name',
                'driver_id' => $driver->driver_id,
                'mobile' => $driver->mobile,
                'sex' => $driver->sex,
                'status' => 'active'
            ]);

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'description' => 'updated',
            'subject_type' => 'App\Models\Driver',
            'subject_id' => $driver->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_driver_deletion()
    {
        $driver = Driver::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $this->assertDatabaseHas('activity_log', [
            'log_name' => 'default',
            'description' => 'deleted',
            'subject_type' => 'App\Models\Driver',
            'subject_id' => $driver->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_stores_old_and_new_values_in_update_log()
    {
        $truck = Truck::factory()->create([
            'plate' => 'OLD-123',
            'status' => 'active'
        ]);

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'NEW-456',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'maintenance'
            ]);

        $activity = Activity::latest()->first();
        $properties = $activity->properties;

        $this->assertArrayHasKey('old_values', $properties);
        $this->assertArrayHasKey('attributes', $properties);
        $this->assertEquals('OLD-123', $properties['old_values']['plate']);
        $this->assertEquals('active', $properties['old_values']['status']);
        $this->assertEquals('NEW-456', $properties['attributes']['plate']);
        $this->assertEquals('maintenance', $properties['attributes']['status']);
    }

    /** @test */
    public function it_can_retrieve_activity_logs_for_model()
    {
        $truck = Truck::factory()->create();

        // Create some activities
        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $activities = Activity::forSubject($truck)->get();

        $this->assertCount(2, $activities);
        $this->assertTrue($activities->contains('description', 'updated'));
        $this->assertTrue($activities->contains('description', 'deleted'));
    }

    /** @test */
    public function it_can_retrieve_activity_logs_by_causer()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $activities = Activity::causedBy($this->user)->get();

        $this->assertGreaterThan(0, $activities->count());
        $this->assertTrue($activities->contains('causer_id', $this->user->id));
    }

    /** @test */
    public function it_can_retrieve_activity_logs_by_log_name()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $activities = Activity::inLog('default')->get();

        $this->assertGreaterThan(0, $activities->count());
        $this->assertTrue($activities->contains('log_name', 'default'));
    }

    /** @test */
    public function it_can_filter_activity_logs_by_description()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $updateActivities = Activity::where('description', 'updated')->get();
        $deleteActivities = Activity::where('description', 'deleted')->get();

        $this->assertGreaterThan(0, $updateActivities->count());
        $this->assertGreaterThan(0, $deleteActivities->count());
        $this->assertTrue($updateActivities->contains('description', 'updated'));
        $this->assertTrue($deleteActivities->contains('description', 'deleted'));
    }

    /** @test */
    public function it_can_get_activity_logs_with_pagination()
    {
        // Create multiple trucks and activities
        for ($i = 0; $i < 15; $i++) {
            $truck = Truck::factory()->create();
            $this->actingAs($this->user)
                ->put(route('trucks.update', $truck), [
                    'plate' => "UPDATED-{$i}",
                    'vehicletype_id' => $truck->vehicletype_id,
                    'status' => 'active'
                ]);
        }

        $activities = Activity::paginate(10);

        $this->assertCount(10, $activities->items());
        $this->assertGreaterThan(10, $activities->total());
    }

    /** @test */
    public function it_can_get_recent_activity_logs()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $recentActivities = Activity::latest()->take(5)->get();

        $this->assertLessThanOrEqual(5, $recentActivities->count());
        $this->assertTrue($recentActivities->contains('subject_id', $truck->id));
    }

    /** @test */
    public function it_can_get_activity_logs_for_specific_date_range()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $today = now()->startOfDay();
        $tomorrow = now()->addDay()->endOfDay();

        $activities = Activity::whereBetween('created_at', [$today, $tomorrow])->get();

        $this->assertGreaterThan(0, $activities->count());
    }

    /** @test */
    public function it_can_get_activity_logs_with_model_relationships()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $activity = Activity::with(['subject', 'causer'])->latest()->first();

        $this->assertInstanceOf(Truck::class, $activity->subject);
        $this->assertInstanceOf(User::class, $activity->causer);
        $this->assertEquals($truck->id, $activity->subject->id);
        $this->assertEquals($this->user->id, $activity->causer->id);
    }

    /** @test */
    public function it_can_export_activity_logs()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active'
            ]);

        $activities = Activity::all();
        $this->assertGreaterThan(0, $activities->count());

        // Test CSV export functionality
        $csvData = $activities->map(function ($activity) {
            return [
                'id' => $activity->id,
                'description' => $activity->description,
                'subject_type' => $activity->subject_type,
                'subject_id' => $activity->subject_id,
                'causer_id' => $activity->causer_id,
                'created_at' => $activity->created_at->format('Y-m-d H:i:s')
            ];
        });

        $this->assertGreaterThan(0, $csvData->count());
        $this->assertArrayHasKey('description', $csvData->first());
        $this->assertArrayHasKey('subject_type', $csvData->first());
    }
}

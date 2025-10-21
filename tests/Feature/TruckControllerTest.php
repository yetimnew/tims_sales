<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Truck;
use App\Models\VehicleType;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class TruckControllerTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected $user;
    protected $vehicleType;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
            'trucks.view', 'trucks.create', 'trucks.edit', 'trucks.destroy',
            'trucks.show', 'trucks.store', 'trucks.update', 'trucks.export'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);

        // Create vehicle type for testing
        $this->vehicleType = VehicleType::factory()->create();
    }

    /** @test */
    public function it_can_display_trucks_index_page()
    {
        Truck::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index'));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 5)
            );
    }

    /** @test */
    public function it_can_search_trucks()
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
    public function it_can_sort_trucks_by_plate()
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
    public function it_can_display_truck_create_page()
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
    public function it_can_store_a_new_truck()
    {
        $truckData = [
            'plate' => 'NEW-123',
            'vehicletype_id' => $this->vehicleType->id,
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'tyreSyze' => '12R22.5',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 500000,
            'productionDate' => '2023-01-01',
            'serviceStartDate' => '2023-02-01',
            'status' => 'active'
        ];

        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $response->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'NEW-123']);
    }

    /** @test */
    public function it_validates_truck_store_request()
    {
        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }

    /** @test */
    public function it_can_display_truck_show_page()
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
    public function it_can_display_truck_edit_page()
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
    public function it_can_update_a_truck()
    {
        $truck = Truck::factory()->create(['plate' => 'OLD-123']);

        $updateData = [
            'plate' => 'NEW-456',
            'vehicletype_id' => $this->vehicleType->id,
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
    public function it_can_delete_a_truck()
    {
        $truck = Truck::factory()->create();

        $response = $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $response->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);
    }

    /** @test */
    public function it_can_export_trucks_to_csv()
    {
        Truck::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="trucks.csv"');
    }

    /** @test */
    public function it_requires_permission_to_view_trucks()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.index'));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_create_trucks()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.create'));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_edit_trucks()
    {
        $truck = Truck::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.edit', $truck));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_requires_permission_to_delete_trucks()
    {
        $truck = Truck::factory()->create();
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->delete(route('trucks.destroy', $truck));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_can_paginate_trucks()
    {
        Truck::factory()->count(25)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.index', ['page' => 2]));

        $response->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.meta')
                ->where('trucks.meta.current_page', 2)
            );
    }

    /** @test */
    public function it_logs_activity_when_creating_truck()
    {
        $truckData = [
            'plate' => 'LOG-123',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active'
        ];

        $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'created',
            'subject_type' => 'App\Models\Truck',
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_activity_when_updating_truck()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active'
            ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'updated',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }

    /** @test */
    public function it_logs_activity_when_deleting_truck()
    {
        $truck = Truck::factory()->create();

        $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'deleted',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
            'causer_type' => 'App\Models\User'
        ]);
    }
}

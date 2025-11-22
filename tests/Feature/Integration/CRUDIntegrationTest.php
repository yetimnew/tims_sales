<?php

namespace Tests\Feature\Integration;

use App\Models\Driver;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use App\Models\Woreda;
use App\Models\Zone;
use Carbon\Carbon;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CRUDIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected $vehicleType;

    protected $zone;

    protected $woreda;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CheckPermissionSeeder::class);

        // Create user with permissions
        $this->user = User::factory()->create();

        $this->user->assignRole('admin');

        // Create related models
        $this->vehicleType = VehicleType::factory()->create();
        $this->zone = Zone::factory()->create();
        $this->woreda = Woreda::factory()->create(['zone_id' => $this->zone->id]);
    }

    /** @test */
    public function it_can_perform_complete_truck_crud_workflow()
    {
        // CREATE
        $truckData = [
            'plate' => 'TEST-123',
            'vehicletype_id' => $this->vehicleType->id,
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
            'tyreSyze' => '12R22.5',
            'serviceIntervalKM' => 10000,
            'purchasePrice' => 500000,
            'productionDate' => '2023-01-01',
            'serviceStartDate' => '2023-02-01',
            'status' => 'active',
        ];

        $createResponse = $this->actingAs($this->user)
            ->post(route('trucks.store'), $truckData);

        $createResponse->assertRedirect(route('trucks.index'));
        $this->assertDatabaseHas('trucks', ['plate' => 'TEST-123']);

        $truck = Truck::where('plate', 'TEST-123')->first();

        // READ
        $showResponse = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $showResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Show')
                ->where('truck.id', $truck->id)
                ->where('truck.plate', 'TEST-123')
            );

        // UPDATE
        $updateData = [
            'plate' => 'UPDATED-456',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'maintenance',
        ];

        $updateResponse = $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), $updateData);

        $updateResponse->assertRedirect(route('trucks.show', $truck));
        $this->assertDatabaseHas('trucks', [
            'id' => $truck->id,
            'plate' => 'UPDATED-456',
            'status' => 'maintenance',
        ]);

        // DELETE
        $deleteResponse = $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $deleteResponse->assertRedirect(route('trucks.index'));
        $this->assertSoftDeleted('trucks', ['id' => $truck->id]);
    }

    /** @test */
    public function it_can_perform_complete_driver_crud_workflow()
    {
        // CREATE
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
            'status' => 'active',
        ];

        $createResponse = $this->actingAs($this->user)
            ->post(route('drivers.store'), $driverData);

        $createResponse->assertRedirect(route('drivers.index'));
        $this->assertDatabaseHas('drivers', ['name' => 'John Doe']);

        $driver = Driver::where('name', 'John Doe')->first();

        // READ
        $showResponse = $this->actingAs($this->user)
            ->get(route('drivers.show', $driver));

        $showResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Drivers/Show')
                ->where('driver.id', $driver->id)
                ->where('driver.name', 'John Doe')
            );

        // UPDATE
        $updateData = [
            'name' => 'Jane Smith',
            'driver_id' => $driver->driver_id,
            'mobile' => $driver->mobile,
            'sex' => $driver->sex,
            'status' => 'inactive',
        ];

        $updateResponse = $this->actingAs($this->user)
            ->put(route('drivers.update', $driver), $updateData);

        $updateResponse->assertRedirect(route('drivers.show', $driver));
        $this->assertDatabaseHas('drivers', [
            'id' => $driver->id,
            'name' => 'Jane Smith',
            'status' => 'inactive',
        ]);

        // DELETE
        $deleteResponse = $this->actingAs($this->user)
            ->delete(route('drivers.destroy', $driver));

        $deleteResponse->assertRedirect(route('drivers.index'));
        $this->assertSoftDeleted('drivers', ['id' => $driver->id]);
    }

    /** @test */
    public function it_can_perform_complete_maintenance_crud_workflow()
    {
        $truck = Truck::factory()->create(['status' => 'active']);
        $scheduledDate = Carbon::now()->addDays(7)->toDateString();
        $completedDate = Carbon::now()->addDays(8)->toDateString();

        // CREATE
        $maintenanceData = [
            'truck_id' => $truck->id,
            'maintenance_type_id' => \App\Models\MaintenanceType::factory()->create()->id,
            'scheduled_date' => $scheduledDate,
            'status' => 'scheduled',
            'description' => 'Regular maintenance',
            'cost' => 1500.00,
        ];

        $createResponse = $this->actingAs($this->user)
            ->post(route('maintenance.store'), $maintenanceData);

        $createResponse->assertRedirect(route('maintenance.index'));
        $this->assertDatabaseHas('vehicle_maintenance_records', ['truck_id' => $truck->id]);

        $maintenance = \App\Models\VehicleMaintenanceRecord::where('truck_id', $truck->id)->first();

        // READ
        $showResponse = $this->actingAs($this->user)
            ->get(route('maintenance.show', $maintenance));

        $showResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Maintenance/Show')
                ->where('maintenance.id', $maintenance->id)
            );

        // UPDATE
        $updateData = [
            'truck_id' => $truck->id,
            'maintenance_type_id' => $maintenance->maintenance_type_id,
            'scheduled_date' => $scheduledDate,
            'completed_date' => $completedDate,
            'status' => 'completed',
            'description' => 'Regular maintenance completed',
            'cost' => 1500.00,
        ];

        $updateResponse = $this->actingAs($this->user)
            ->put(route('maintenance.update', $maintenance), $updateData);

        $updateResponse->assertRedirect(route('maintenance.index'));
        $this->assertDatabaseHas('vehicle_maintenance_records', [
            'id' => $maintenance->id,
            'status' => 'completed',
        ]);

        // DELETE
        $deleteResponse = $this->actingAs($this->user)
            ->delete(route('maintenance.destroy', $maintenance));

        $deleteResponse->assertRedirect(route('maintenance.index'));
        $this->assertSoftDeleted('vehicle_maintenance_records', ['id' => $maintenance->id]);
    }

    /** @test */
    public function it_can_perform_complete_fuel_crud_workflow()
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        // CREATE
        $fuelData = [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'fuel_date' => '2023-12-01',
            'fuel_quantity_liters' => 50.0,
            'fuel_price_per_liter' => 45.0,
            'total_cost' => 2250.0,
            'fuel_type' => 'Diesel',
            'fuel_station' => 'Shell Station',
            'receipt_number' => 'RCP001',
            'odometer_reading' => 100000,
            'notes' => 'Regular fuel fill',
        ];

        $createResponse = $this->actingAs($this->user)
            ->post(route('fuel.store'), $fuelData);

        $createResponse->assertRedirect(route('fuel.index'));
        $this->assertDatabaseHas('fuel_records', ['truck_id' => $truck->id]);

        $fuel = \App\Models\FuelRecord::where('truck_id', $truck->id)->first();

        // READ
        $showResponse = $this->actingAs($this->user)
            ->get(route('fuel.show', $fuel));

        $showResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Fuel/Show')
                ->where('fuelRecord.id', $fuel->id)
            );

        // UPDATE
        $updateData = [
            'truck_id' => $truck->id,
            'driver_id' => $driver->id,
            'fuel_date' => '2023-12-01',
            'fuel_quantity_liters' => 55.0,
            'fuel_price_per_liter' => 45.0,
            'total_cost' => 2475.0,
            'fuel_type' => 'Diesel',
            'fuel_station' => 'Shell Station',
            'receipt_number' => 'RCP001',
            'odometer_reading' => 100000,
            'notes' => 'Updated fuel fill',
        ];

        $updateResponse = $this->actingAs($this->user)
            ->put(route('fuel.update', $fuel), $updateData);

        $updateResponse->assertRedirect(route('fuel.show', $fuel));
        $this->assertDatabaseHas('fuel_records', [
            'id' => $fuel->id,
            'fuel_quantity_liters' => 55.0,
            'total_cost' => 2475.0,
        ]);

        // DELETE
        $deleteResponse = $this->actingAs($this->user)
            ->delete(route('fuel.destroy', $fuel));

        $deleteResponse->assertRedirect(route('fuel.index'));
        $this->assertSoftDeleted('fuel_records', ['id' => $fuel->id]);
    }

    /** @test */
    public function it_can_perform_complete_financial_crud_workflow()
    {
        $truck = Truck::factory()->create();

        // CREATE
        $financialData = [
            'truck_id' => $truck->id,
            'record_date' => '2023-12-01',
            'period_type' => 'monthly',
            'revenue' => 50000.00,
            'fuel_cost' => 15000.00,
            'maintenance_cost' => 5000.00,
            'driver_salary' => 8000.00,
            'insurance_cost' => 2000.00,
            'depreciation' => 3000.00,
            'other_costs' => 1000.00,
            'notes' => 'Monthly financial record',
        ];

        $createResponse = $this->actingAs($this->user)
            ->post(route('financial.store'), $financialData);

        $createResponse->assertRedirect(route('financial.index'));
        $this->assertDatabaseHas('truck_financial_records', ['truck_id' => $truck->id]);

        $financial = \App\Models\TruckFinancialRecord::where('truck_id', $truck->id)->first();

        // READ
        $showResponse = $this->actingAs($this->user)
            ->get(route('financial.show', $financial));

        $showResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Financial/Show')
                ->where('financialRecord.id', $financial->id)
            );

        // UPDATE
        $updateData = [
            'truck_id' => $truck->id,
            'record_date' => '2023-12-01',
            'period_type' => 'monthly',
            'revenue' => 55000.00,
            'fuel_cost' => 15000.00,
            'maintenance_cost' => 5000.00,
            'driver_salary' => 8000.00,
            'insurance_cost' => 2000.00,
            'depreciation' => 3000.00,
            'other_costs' => 1000.00,
            'notes' => 'Updated monthly financial record',
        ];

        $updateResponse = $this->actingAs($this->user)
            ->put(route('financial.update', $financial), $updateData);

        $updateResponse->assertRedirect(route('financial.show', $financial));
        $this->assertDatabaseHas('truck_financial_records', [
            'id' => $financial->id,
            'revenue' => 55000.00,
        ]);

        // DELETE
        $deleteResponse = $this->actingAs($this->user)
            ->delete(route('financial.destroy', $financial));

        $deleteResponse->assertRedirect(route('financial.index'));
        $this->assertSoftDeleted('truck_financial_records', ['id' => $financial->id]);
    }

    /** @test */
    public function it_can_perform_search_and_sort_operations()
    {
        // Create test data
        Truck::factory()->create(['plate' => 'ABC-123', 'status' => 'active']);
        Truck::factory()->create(['plate' => 'XYZ-789', 'status' => 'inactive']);
        Truck::factory()->create(['plate' => 'DEF-456', 'status' => 'active']);

        // Test search
        $searchResponse = $this->actingAs($this->user)
            ->get(route('trucks.index', ['search' => 'ABC']));

        $searchResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 1)
                ->where('trucks.data.0.plate', 'ABC-123')
            );

        // Test sort
        $sortResponse = $this->actingAs($this->user)
            ->get(route('trucks.index', ['sort' => 'plate', 'direction' => 'asc']));

        $sortResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 3)
                ->where('trucks.data.0.plate', 'ABC-123')
                ->where('trucks.data.1.plate', 'DEF-456')
                ->where('trucks.data.2.plate', 'XYZ-789')
            );

        // Test filter
        $filterResponse = $this->actingAs($this->user)
            ->get(route('trucks.index', ['status' => 'active']));

        $filterResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 2)
            );
    }

    /** @test */
    public function it_can_perform_pagination_operations()
    {
        // Create more than 15 trucks for pagination
        Truck::factory()->count(25)->create();

        // Test first page
        $firstPageResponse = $this->actingAs($this->user)
            ->get(route('trucks.index', ['page' => 1]));

        $firstPageResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 15)
                ->where('trucks.meta.current_page', 1)
                ->where('trucks.meta.per_page', 15)
            );

        // Test second page
        $secondPageResponse = $this->actingAs($this->user)
            ->get(route('trucks.index', ['page' => 2]));

        $secondPageResponse->assertStatus(200)
            ->assertInertia(fn ($page) => $page
                ->component('Trucks/Index')
                ->has('trucks.data', 10)
                ->where('trucks.meta.current_page', 2)
                ->where('trucks.meta.last_page', 2)
            );
    }

    /** @test */
    public function it_can_perform_export_operations()
    {
        // Create test data
        Truck::factory()->count(5)->create();

        // Test CSV export
        $exportResponse = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $exportResponse->assertStatus(200);
        $exportResponse->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $exportResponse->assertHeader('Content-Disposition', 'attachment; filename="trucks.csv"');

        $csvContent = $exportResponse->getContent();
        $this->assertStringContainsString('plate', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
    }

    /** @test */
    public function it_can_perform_relationship_operations()
    {
        $truck = Truck::factory()->create();
        $driver = Driver::factory()->create();

        // Assign driver to truck
        $assignResponse = $this->actingAs($this->user)
            ->post(route('drivers.assign-truck', $driver), [
                'truck_id' => $truck->id,
                'assigned_date' => now()->format('Y-m-d'),
            ]);

        $assignResponse->assertRedirect();
        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'active',
        ]);

        // Unassign driver from truck
        $unassignResponse = $this->actingAs($this->user)
            ->post(route('drivers.unassign-truck', $driver), [
                'truck_id' => $truck->id,
                'unassigned_date' => now()->format('Y-m-d'),
            ]);

        $unassignResponse->assertRedirect();
        $this->assertDatabaseHas('driver_truck', [
            'driver_id' => $driver->id,
            'truck_id' => $truck->id,
            'status' => 'inactive',
        ]);
    }

    /** @test */
    public function it_can_perform_activity_logging_operations()
    {
        $truck = Truck::factory()->create();

        // Test activity logging on update
        $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), [
                'plate' => 'UPDATED-123',
                'vehicletype_id' => $truck->vehicletype_id,
                'status' => 'active',
            ]);

        $this->assertDatabaseHas('activity_log', [
            'description' => 'updated',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
        ]);

        // Test activity logging on delete
        $this->actingAs($this->user)
            ->delete(route('trucks.destroy', $truck));

        $this->assertDatabaseHas('activity_log', [
            'description' => 'deleted',
            'subject_type' => 'App\Models\Truck',
            'subject_id' => $truck->id,
            'causer_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function it_can_perform_permission_operations()
    {
        /** @var User $userWithoutPermission */
        $userWithoutPermission = User::factory()->createOne();
        $truck = Truck::factory()->create();

        // Test permission denied
        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(403);

        // Test permission granted
        $response = $this->actingAs($this->user)
            ->get(route('trucks.show', $truck));

        $response->assertStatus(200);
    }

    /** @test */
    public function it_can_perform_validation_operations()
    {
        // Test validation on create
        $response = $this->actingAs($this->user)
            ->post(route('trucks.store'), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);

        // Test validation on update
        $truck = Truck::factory()->create();
        $response = $this->actingAs($this->user)
            ->put(route('trucks.update', $truck), []);

        $response->assertSessionHasErrors(['plate', 'vehicletype_id', 'status']);
    }
}

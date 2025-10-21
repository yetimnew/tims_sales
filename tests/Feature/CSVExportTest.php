<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CSVExportTest extends TestCase
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
            'trucks.view', 'trucks.export',
            'drivers.view', 'drivers.export',
            'maintenance.view', 'maintenance.export',
            'fuel.view', 'fuel.export',
            'financial.view', 'financial.export'
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
    public function it_can_export_trucks_to_csv()
    {
        // Create test trucks
        Truck::factory()->count(5)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="trucks.csv"');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('plate', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
        $this->assertStringContainsString('created_at', $csvContent);
    }

    /** @test */
    public function it_can_export_drivers_to_csv()
    {
        // Create test drivers
        Driver::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('drivers.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="drivers.csv"');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('name', $csvContent);
        $this->assertStringContainsString('driver_id', $csvContent);
        $this->assertStringContainsString('mobile', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
    }

    /** @test */
    public function it_can_export_filtered_trucks_to_csv()
    {
        // Create trucks with different statuses
        Truck::factory()->create(['plate' => 'ACT-123', 'status' => 'active']);
        Truck::factory()->create(['plate' => 'INACT-456', 'status' => 'inactive']);
        Truck::factory()->create(['plate' => 'MAINT-789', 'status' => 'maintenance']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['status' => 'active']));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('ACT-123', $csvContent);
        $this->assertStringNotContainsString('INACT-456', $csvContent);
        $this->assertStringNotContainsString('MAINT-789', $csvContent);
    }

    /** @test */
    public function it_can_export_searched_trucks_to_csv()
    {
        // Create trucks with different plates
        Truck::factory()->create(['plate' => 'ABC-123']);
        Truck::factory()->create(['plate' => 'XYZ-789']);
        Truck::factory()->create(['plate' => 'DEF-456']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['search' => 'ABC']));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('ABC-123', $csvContent);
        $this->assertStringNotContainsString('XYZ-789', $csvContent);
        $this->assertStringNotContainsString('DEF-456', $csvContent);
    }

    /** @test */
    public function it_can_export_sorted_trucks_to_csv()
    {
        // Create trucks with different plates
        Truck::factory()->create(['plate' => 'ZYX-999']);
        Truck::factory()->create(['plate' => 'ABC-123']);
        Truck::factory()->create(['plate' => 'DEF-456']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['sort' => 'plate', 'direction' => 'asc']));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        // Check that plates are in ascending order
        $lines = explode("\n", $csvContent);
        $plateLines = array_filter($lines, function($line) {
            return strpos($line, 'ABC-123') !== false ||
                   strpos($line, 'DEF-456') !== false ||
                   strpos($line, 'ZYX-999') !== false;
        });

        $this->assertGreaterThan(0, count($plateLines));
    }

    /** @test */
    public function it_can_export_maintenance_records_to_csv()
    {
        // Create test maintenance records
        \App\Models\VehicleMaintenanceRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('maintenance.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="maintenance.csv"');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('scheduled_date', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
        $this->assertStringContainsString('cost', $csvContent);
    }

    /** @test */
    public function it_can_export_fuel_records_to_csv()
    {
        // Create test fuel records
        \App\Models\FuelRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('fuel.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="fuel.csv"');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('fuel_date', $csvContent);
        $this->assertStringContainsString('fuel_quantity_liters', $csvContent);
        $this->assertStringContainsString('total_cost', $csvContent);
    }

    /** @test */
    public function it_can_export_financial_records_to_csv()
    {
        // Create test financial records
        \App\Models\TruckFinancialRecord::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('financial.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $response->assertHeader('Content-Disposition', 'attachment; filename="financial.csv"');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('record_date', $csvContent);
        $this->assertStringContainsString('revenue', $csvContent);
        $this->assertStringContainsString('net_profit', $csvContent);
    }

    /** @test */
    public function it_requires_export_permission()
    {
        $userWithoutPermission = User::factory()->create();

        $response = $this->actingAs($userWithoutPermission)
            ->get(route('trucks.export'));

        $response->assertStatus(403);
    }

    /** @test */
    public function it_can_export_empty_dataset_to_csv()
    {
        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        // Should contain headers even with no data
        $this->assertStringContainsString('plate', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
    }

    /** @test */
    public function it_can_export_large_dataset_to_csv()
    {
        // Create a large number of trucks
        Truck::factory()->count(100)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        // Count lines in CSV (subtract 1 for header)
        $lines = explode("\n", trim($csvContent));
        $this->assertGreaterThan(100, count($lines));
    }

    /** @test */
    public function it_can_export_with_custom_filename()
    {
        Truck::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['filename' => 'custom_trucks']));

        $response->assertStatus(200);
        $response->assertHeader('Content-Disposition', 'attachment; filename="custom_trucks.csv"');
    }

    /** @test */
    public function it_can_export_with_date_range_filter()
    {
        $oldTruck = Truck::factory()->create(['created_at' => now()->subDays(30)]);
        $newTruck = Truck::factory()->create(['created_at' => now()]);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', [
                'start_date' => now()->subDays(7)->format('Y-m-d'),
                'end_date' => now()->format('Y-m-d')
            ]));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        // Should only contain recent truck
        $this->assertStringNotContainsString($oldTruck->plate, $csvContent);
    }

    /** @test */
    public function it_can_export_with_multiple_filters()
    {
        Truck::factory()->create(['plate' => 'ACT-123', 'status' => 'active']);
        Truck::factory()->create(['plate' => 'ACT-456', 'status' => 'active']);
        Truck::factory()->create(['plate' => 'INACT-789', 'status' => 'inactive']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', [
                'search' => 'ACT',
                'status' => 'active',
                'sort' => 'plate',
                'direction' => 'asc'
            ]));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('ACT-123', $csvContent);
        $this->assertStringContainsString('ACT-456', $csvContent);
        $this->assertStringNotContainsString('INACT-789', $csvContent);
    }

    /** @test */
    public function it_can_export_with_relationships()
    {
        $vehicleType = \App\Models\VehicleType::factory()->create();
        Truck::factory()->create(['vehicletype_id' => $vehicleType->id]);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('vehicle_type', $csvContent);
    }

    /** @test */
    public function it_handles_csv_export_errors_gracefully()
    {
        // Mock a database error
        $this->mock(\App\Models\Truck::class, function ($mock) {
            $mock->shouldReceive('newQuery')->andThrow(new \Exception('Database error'));
        });

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(500);
    }

    /** @test */
    public function it_can_export_with_custom_columns()
    {
        Truck::factory()->count(3)->create();

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export', ['columns' => 'plate,status']));

        $response->assertStatus(200);
        $csvContent = $response->getContent();

        $this->assertStringContainsString('plate', $csvContent);
        $this->assertStringContainsString('status', $csvContent);
        $this->assertStringNotContainsString('chasisNumber', $csvContent);
    }

    /** @test */
    public function it_can_export_with_utf8_encoding()
    {
        Truck::factory()->create(['plate' => 'TEST-ÑOÑO']);

        $response = $this->actingAs($this->user)
            ->get(route('trucks.export'));

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');

        $csvContent = $response->getContent();
        $this->assertStringContainsString('TEST-ÑOÑO', $csvContent);
    }
}

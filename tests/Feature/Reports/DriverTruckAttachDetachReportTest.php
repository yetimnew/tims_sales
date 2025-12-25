<?php

namespace Tests\Feature\Reports;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Truck;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DriverTruckAttachDetachReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_driver_truck_attach_detach_report_exposes_summary_and_collections(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Permission::firstOrCreate([
            'name' => 'reports.attach-detach.view',
            'guard_name' => 'web',
        ]);

        $user->givePermissionTo('reports.attach-detach.view');

        $activeDriver = Driver::factory()->state(['status' => 'active', 'name' => 'Active Driver'])->create();
        $activeTruck = Truck::factory()->state(['status' => 'active', 'plate' => 'AA-1234'])->create();

        $activeAssignedAt = Carbon::parse('2024-11-01 08:30:00', 'UTC');

        $activeAssignment = DriverTruck::factory()
            ->for($activeDriver, 'driver')
            ->for($activeTruck, 'truck')
            ->state([
                'assigned_date' => $activeAssignedAt,
                'unassigned_date' => null,
                'status' => 'active',
                'is_attached' => true,
                'created_at' => $activeAssignedAt,
                'updated_at' => $activeAssignedAt,
            ])
            ->create();

        $historicalDriver = Driver::factory()->state(['status' => 'active', 'name' => 'Historical Driver'])->create();
        $historicalTruck = Truck::factory()->state(['status' => 'active', 'plate' => 'BB-5678'])->create();

        $historicalAssignedAt = Carbon::parse('2024-09-10 09:00:00', 'UTC');
        $historicalDetachedAt = Carbon::parse('2024-10-05 17:15:00', 'UTC');

        DriverTruck::factory()
            ->for($historicalDriver, 'driver')
            ->for($historicalTruck, 'truck')
            ->state([
                'assigned_date' => $historicalAssignedAt,
                'unassigned_date' => $historicalDetachedAt,
                'status' => 'inactive',
                'is_attached' => false,
                'created_at' => $historicalDetachedAt->copy()->addDay(),
                'updated_at' => $historicalDetachedAt->copy()->addDay(),
            ])
            ->create();

        $availableDriver = Driver::factory()->state(['status' => 'active', 'name' => 'Available Driver'])->create();
        $availableTruck = Truck::factory()->state(['status' => 'active', 'plate' => 'CC-9012'])->create();

        $response = $this->actingAs($user)->get(route('reports.attach-detach'));

        $props = [];

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use (&$props, $activeAssignment) {
                $page->component('Reports/DriverTruckAttachDetach')
                    ->has('rows', 2)
                    ->has('summary', fn (AssertableInertia $summary) => $summary
                        ->where('totalAssignments', 2)
                        ->where('attached', 1)
                        ->where('detached', 1)
                        ->where('currentActive', 1)
                        ->where('availableDrivers', 2)
                        ->where('availableTrucks', 2)
                    )
                    ->has('currentAssignments', 1)
                    ->has('availableDrivers', 2)
                    ->has('availableTrucks', 2);

                $props = $page->toArray()['props'];
            });

        $this->assertNotEmpty($props);

        $row = collect($props['rows'])->firstWhere('id', $activeAssignment->id);
        $this->assertNotNull($row);
        $this->assertArrayHasKey('assigned_display', $row);
        $this->assertArrayHasKey('assigned_relative', $row);
        $this->assertSame('2024-11-01T08:30:00+00:00', $row['assigned_date']);
        $this->assertSame('Active', $row['is_attached'] ? 'Active' : 'Detached');

        $currentAssignment = $props['currentAssignments'][0];
        $this->assertSame('Active Driver', $currentAssignment['driver']['name']);
        $this->assertSame('AA-1234', $currentAssignment['truck']['plate']);
        $this->assertSame('2024-11-01T08:30:00+00:00', $currentAssignment['assignedDate']);

        $availableDriverNames = collect($props['availableDrivers'])->pluck('name');
        $this->assertTrue($availableDriverNames->contains('Available Driver'));
        $this->assertTrue($availableDriverNames->contains('Historical Driver'));

        $availableDriversPayload = collect($props['availableDrivers']);
        $historicalDriverPayload = $availableDriversPayload->firstWhere('name', 'Historical Driver');
        $this->assertNotNull($historicalDriverPayload);
        $this->assertSame('2024-10-05T17:15:00+00:00', $historicalDriverPayload['lastDetachedDate']);
        $this->assertSame('Oct 5, 2024 5:15 PM', $historicalDriverPayload['lastDetachedDisplay']);

        $availableDriverPayload = $availableDriversPayload->firstWhere('name', 'Available Driver');
        $this->assertNotNull($availableDriverPayload);
        $this->assertNull($availableDriverPayload['lastDetachedDate']);
        $this->assertNull($availableDriverPayload['lastDetachedDisplay']);

        $availableTruckPlates = collect($props['availableTrucks'])->pluck('plate');
        $this->assertTrue($availableTruckPlates->contains('CC-9012'));
        $this->assertTrue($availableTruckPlates->contains('BB-5678'));

        $availableTrucksPayload = collect($props['availableTrucks']);
        $historicalTruckPayload = $availableTrucksPayload->firstWhere('plate', 'BB-5678');
        $this->assertNotNull($historicalTruckPayload);
        $this->assertSame('2024-10-05T17:15:00+00:00', $historicalTruckPayload['lastDetachedDate']);
        $this->assertSame('Oct 5, 2024 5:15 PM', $historicalTruckPayload['lastDetachedDisplay']);

        $availableTruckPayload = $availableTrucksPayload->firstWhere('plate', 'CC-9012');
        $this->assertNotNull($availableTruckPayload);
        $this->assertNull($availableTruckPayload['lastDetachedDate']);
        $this->assertNull($availableTruckPayload['lastDetachedDisplay']);
    }
}

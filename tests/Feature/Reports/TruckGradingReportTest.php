<?php

namespace Tests\Feature\Reports;

use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use App\Models\User;
use App\Models\VehicleType;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class TruckGradingReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CheckPermissionSeeder::class);
    }

    public function test_truck_grading_report_renders_with_snapshot(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $user->givePermissionTo('trucks.show');

        $vehicleType = VehicleType::factory()->create(['name' => 'Flatbed']);
        $truck = Truck::factory()->create([
            'plate' => 'AB-1234',
            'status' => 'active',
            'vehicletype_id' => $vehicleType->id,
        ]);

        $snapshotDate = now()->toDateString();

        TruckGradeSnapshot::factory()
            ->for($truck)
            ->state([
                'snapshot_date' => $snapshotDate,
                'vehicle_type_id' => $vehicleType->id,
                'status' => 'active',
                'filter_vehicle_type_id' => $vehicleType->id,
                'filter_status' => 'active',
                'overall_score' => 92.5,
                'overall_letter' => 'A',
            ])
            ->create();

        $storedSnapshot = TruckGradeSnapshot::query()->first();
        $this->assertNotNull($storedSnapshot);

        $this->assertSame($vehicleType->id, $storedSnapshot->filter_vehicle_type_id);
        $this->assertSame('active', $storedSnapshot->filter_status);
        $this->assertSame($snapshotDate, $storedSnapshot->snapshot_date->toDateString());

        $result = app(\App\Services\Reports\TruckGradingReport::class)->build([
            'snapshot_date' => $snapshotDate,
            'vehicle_type_id' => $vehicleType->id,
            'status' => 'active',
        ]);

        $this->assertSame($snapshotDate, $result['filters']['snapshot_date']);
        $this->assertSame($vehicleType->id, $result['filters']['vehicle_type_id']);
        $this->assertSame('active', $result['filters']['status']);

        $this->assertNotEmpty($result['paginator']['data']);

        $response = $this->actingAs($user)->get(route('reports.truck-grading', [
            'snapshot_date' => $snapshotDate,
            'vehicle_type_id' => $vehicleType->id,
            'status' => 'active',
        ]));

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use ($snapshotDate, $truck) {
                $page->component('Reports/TruckGrading')
                    ->has('filters', fn (AssertableInertia $assert) => $assert
                        ->where('snapshot_date', $snapshotDate)
                        ->etc()
                    )
                    ->has('paginator.data', 1)
                    ->where('paginator.data.0.plate', $truck->plate)
                    ->where('paginator.data.0.grade.overall.letter', 'A')
                    ->where('filterOptions.dates', static function ($dates) use ($snapshotDate) {
                        $values = $dates instanceof \Illuminate\Support\Collection ? $dates->all() : (array) $dates;

                        return in_array($snapshotDate, $values, true);
                    });
            });
    }

    public function test_truck_grading_report_requires_permission(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('reports.truck-grading'));

        $response->assertForbidden();
    }
}

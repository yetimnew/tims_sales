<?php

namespace Tests\Feature;

use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class TruckGradingSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_recalculate_and_store_snapshots(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-02-28 09:00:00'));

        $user = User::factory()->create();

        Permission::firstOrCreate(['name' => 'trucks.update', 'guard_name' => 'web']);
        $user->givePermissionTo('trucks.update');

        Truck::factory()->count(3)->create();

        $snapshotDate = '2025-02-28';

        $this->actingAs($user)
            ->post(route('settings.truck-grading.recalculate'), [
                'snapshot_date' => $snapshotDate,
            ])
            ->assertRedirect(route('settings.truck-grading.edit', ['snapshot_date' => $snapshotDate]));

        $this->assertDatabaseCount('truck_grade_snapshots', 3);
        $this->assertDatabaseHas('truck_grade_snapshots', [
            'snapshot_date' => $snapshotDate,
            'filter_vehicle_type_id' => null,
            'filter_status' => null,
        ]);

        $this->assertNotNull(TruckGradeSnapshot::query()->first()?->grade_thresholds);

        $response = $this->actingAs($user)->get(
            route('settings.truck-grading.edit', ['snapshot_date' => $snapshotDate]),
        );

        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) use ($snapshotDate) {
            $page
                ->component('settings/truck-grading')
                ->where('settings.grade_thresholds.A', 90)
                ->where('settings.grade_thresholds.E', 0)
                ->where('filters.snapshot_date', $snapshotDate)
                ->where('latestCalculation.count', TruckGradeSnapshot::query()->count())
                ->where('truckGrades.data', function ($rows): bool {
                    if ($rows instanceof \Illuminate\Support\Collection) {
                        $rows = $rows->toArray();
                    }

                    if (! is_array($rows) || $rows === []) {
                        return false;
                    }

                    $firstRow = array_values($rows)[0];

                    return isset($firstRow['grade']['overall']['score'])
                        && $firstRow['grade']['overall']['score'] !== null
                        && isset($firstRow['grade']['grade_thresholds']);
                });
        });

        Carbon::setTestNow();
    }
}

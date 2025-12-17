<?php

namespace Tests\Feature;

use App\Models\Driver;
use App\Models\DriverGradeSnapshot;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class DriverGradingSnapshotTest extends TestCase
{
    use RefreshDatabase;

    public function test_authorized_user_can_recalculate_and_store_snapshots(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-02-28 09:00:00'));

        $user = User::factory()->create();
        $this->givePermissions($user, ['drivers.update']);

        Driver::factory()->count(3)->create();

        $snapshotDate = '2025-02-28';

        $this->actingAs($user)
            ->post(route('settings.driver-grading.recalculate'), [
                'snapshot_date' => $snapshotDate,
            ])
            ->assertRedirect(route('settings.driver-grading.edit', ['snapshot_date' => $snapshotDate]));

        $this->assertDatabaseCount('driver_grade_snapshots', 3);
        $this->assertDatabaseHas('driver_grade_snapshots', [
            'snapshot_date' => $snapshotDate,
            'filter_status' => null,
        ]);

        $this->assertNotNull(DriverGradeSnapshot::query()->first()?->grade_thresholds);

        $response = $this->actingAs($user)->get(
            route('settings.driver-grading.edit', ['snapshot_date' => $snapshotDate]),
        );

        $response->assertStatus(200);

        $response->assertInertia(function (Assert $page) use ($snapshotDate) {
            $page
                ->component('settings/driver-grading')
                ->where('settings.grade_thresholds.A', 90)
                ->where('settings.grade_thresholds.E', 0)
                ->where('filters.snapshot_date', $snapshotDate)
                ->where('latestCalculation.count', DriverGradeSnapshot::query()->count());
        });

        Carbon::setTestNow();
    }
}

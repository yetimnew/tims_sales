<?php

namespace Tests\Feature\Reports;

use App\Models\DriverTruckGradeSnapshot;
use App\Models\User;
use Database\Seeders\CheckPermissionSeeder;
use Database\Seeders\ReportPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class DriverTruckGradingReportTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CheckPermissionSeeder::class);
        $this->seed(ReportPermissionSeeder::class);
        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }

    public function test_driver_truck_grading_report_renders_with_snapshot(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        Permission::firstOrCreate([
            'name' => 'reports.driver-truck-grading.view',
            'guard_name' => 'web',
        ]);
        $user->givePermissionTo('reports.driver-truck-grading.view');

        $snapshotDate = now()->toDateString();

        $snapshot = DriverTruckGradeSnapshot::factory()
            ->state([
                'snapshot_date' => $snapshotDate,
                'status' => 'active',
                'filter_status' => 'active',
                'is_attached' => true,
                'filter_is_attached' => true,
                'overall_score' => 88.7,
                'overall_letter' => 'B',
                'grade_thresholds' => [
                    'A' => 90,
                    'B' => 80,
                    'C' => 70,
                    'D' => 60,
                    'E' => 0,
                ],
            ])
            ->create();

        $service = app(\App\Services\Reports\DriverTruckGradingReport::class);
        $result = $service->build([
            'snapshot_date' => $snapshotDate,
            'status' => 'active',
            'attachment_state' => 'attached',
        ]);

        $this->assertSame($snapshotDate, $result['filters']['snapshot_date']);
        $this->assertSame('active', $result['filters']['status']);
        $this->assertSame('attached', $result['filters']['attachment_state']);
        $this->assertNotEmpty($result['paginator']['data']);

        $response = $this->actingAs($user)->get(route('reports.driver-truck-grading', [
            'snapshot_date' => $snapshotDate,
            'status' => 'active',
            'attachment_state' => 'attached',
        ]));

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use ($snapshot, $snapshotDate) {
                $page->component('Reports/DriverTruckGrading')
                    ->has('filters', fn (AssertableInertia $assert) => $assert
                        ->where('snapshot_date', $snapshotDate)
                        ->where('status', 'active')
                        ->where('attachment_state', 'attached')
                        ->etc()
                    )
                    ->has('can', fn (AssertableInertia $assert) => $assert
                        ->where('recalculate', false)
                    )
                    ->has('paginator.data', 1)
                    ->where('paginator.data.0.id', $snapshot->driver_truck_id)
                    ->where('paginator.data.0.grade.overall.letter', 'B');
            });
    }

    public function test_driver_truck_grading_report_requires_permission(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get(route('reports.driver-truck-grading'));

        $response->assertForbidden();
    }
}

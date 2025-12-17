<?php

namespace Tests\Feature\Reports;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\PermissionRegistrar;
use Tests\TestCase;

class PerformanceByStatusReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_displays_summary_and_latest_status_updates(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        app(PermissionRegistrar::class)->forgetCachedPermissions();
        $this->grantPermissions($user, 'reports.performance-by-status.view');

        $statusType = StatusType::create([
            'name' => 'Operational Status',
            'description' => 'Operational states for daily truck utilisation.',
        ]);

        $available = Status::create([
            'statustype_id' => $statusType->id,
            'name' => 'Available',
            'description' => 'Ready for work',
        ]);

        $dispatched = Status::create([
            'statustype_id' => $statusType->id,
            'name' => 'Dispatched',
            'description' => 'Currently dispatched',
        ]);

        $truckA = Truck::factory()->create(['plate' => 'AB-1234']);
        $truckB = Truck::factory()->create(['plate' => 'BC-2345']);

        $date = now()->toDateString();

        $earlier = now()->subMinutes(20);
        $later = now()->subMinutes(5);

        DailyTruckStatus::query()->create([
            'truck_id' => $truckA->id,
            'status_id' => $available->id,
            'status_date' => $date,
            'notes' => 'Awaiting assignment',
            'changed_by' => $user->id,
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $truckB->id,
            'status_id' => $dispatched->id,
            'status_date' => $date,
            'notes' => 'En route to customer',
            'changed_by' => $user->id,
        ]);

        DailyTruckStatus::query()
            ->where('truck_id', $truckA->id)
            ->update([
                'created_at' => $earlier,
                'updated_at' => $earlier,
            ]);

        DailyTruckStatus::query()
            ->where('truck_id', $truckB->id)
            ->update([
                'created_at' => $later,
                'updated_at' => $later,
            ]);

        $props = [];

        $response = $this->actingAs($user)->get(route('reports.performance-by-status', [
            'date' => $date,
        ]));

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) use ($date, &$props) {
                $page->component('Reports/PerformanceByStatus')
                    ->where('filters.date', $date)
                    ->where('filters.status_ids', [])
                    ->has('options.statuses', 2)
                    ->has('summary', 2)
                    ->has('latest', 2)
                    ->has('metrics.vehicles_tracked')
                    ->has('metrics.top_status');

                $props = $page->toArray()['props'];
            });

        $summary = collect($props['summary']);
        $this->assertTrue($summary->contains(fn (array $row) => $row['status_name'] === 'Available' && $row['count'] === 1));
        $this->assertTrue($summary->contains(fn (array $row) => $row['status_name'] === 'Dispatched' && $row['count'] === 1));

        $latest = collect($props['latest']);
        $this->assertSame('Dispatched', $latest->first()['status_name']);
        $this->assertSame('BC-2345', $latest->first()['plate']);
    }

    private function grantPermissions(User $user, string ...$permissions): void
    {
        foreach ($permissions as $permission) {
            Permission::firstOrCreate([
                'name' => $permission,
                'guard_name' => 'web',
            ]);
        }

        $user->givePermissionTo($permissions);
    }
}

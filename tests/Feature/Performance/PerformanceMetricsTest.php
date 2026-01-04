<?php

namespace Tests\Feature\Performance;

use App\Models\Operation;
use App\Models\Performance;
use App\Models\User;
use App\Models\DriverTruck;
use App\Models\Truck;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class PerformanceMetricsTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function index_metrics_include_only_last_thirty_days(): void
    {
        $now = Carbon::create(2025, 1, 15, 12, 0, 0);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-any',
            'performances.show',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(10),
            'satus' => 'active',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(5),
            'satus' => 'completed',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(1),
            'satus' => 'failed',
        ]);

        Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(45),
            'satus' => 'completed',
        ]);

        $this->actingAs($user)
            ->get(route('performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->where('metrics.total', 3)
                ->where('metrics.active', 1)
                ->where('metrics.completed', 1)
                ->where('metrics.failed', 1)
            );

        Carbon::setTestNow();
    }

    #[Test]
    public function index_lists_latest_dispatch_first_by_default(): void
    {
        $now = Carbon::create(2025, 2, 1, 8, 30, 0);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-any',
            'performances.show',
        ]);

        $oldest = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(25),
            'satus' => 'completed',
        ]);

        $middle = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(7),
            'satus' => 'active',
        ]);

        $latest = Performance::factory()->create([
            'DateDispach' => $now->copy()->subDays(1),
            'satus' => 'failed',
        ]);

        $this->actingAs($user)
            ->get(route('performances.index'))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->where('performances.data.0.id', $latest->id)
                ->where('performances.data.1.id', $middle->id)
                ->where('performances.data.2.id', $oldest->id)
            );

        Carbon::setTestNow();
    }

    #[Test]
    public function index_filters_by_truck_when_requested(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, [
            'performances.view',
            'performances.view-any',
            'performances.show',
        ]);

        $targetTruck = Truck::factory()->create();
        $otherTruck = Truck::factory()->create();

        $targetAssignment = DriverTruck::factory()->create([
            'truck_id' => $targetTruck->id,
        ]);

        $otherAssignment = DriverTruck::factory()->create([
            'truck_id' => $otherTruck->id,
        ]);

        $matchingPerformance = Performance::factory()->create([
            'driver_truck_id' => $targetAssignment->id,
            'DateDispach' => now()->subDay(),
        ]);

        Performance::factory()->create([
            'driver_truck_id' => $otherAssignment->id,
            'DateDispach' => now()->subDays(2),
        ]);

        $this->actingAs($user)
            ->get(route('performances.index', ['truck' => $targetTruck->id]))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Index')
                ->has('performances.data', 1)
                ->where('performances.data.0.id', $matchingPerformance->id)
                ->where('filters.truck', $targetTruck->id)
                ->where('metrics.total', 1)
            );
    }

    #[Test]
    public function show_uses_ton_kilometers_for_planned_contribution_when_available(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['performances.show', 'performances.view-any']);

        $operation = Operation::factory()->create([
            'volume' => 100,
            'km' => 200,
            'tariff' => 10,
        ]);

        $performance = Performance::factory()
            ->for($operation)
            ->create([
                'CargoVolumMT' => 10,
                'DistanceWCargo' => 100,
                'DistanceWOCargo' => 0,
                'tonkm' => 2000,
                'fuelInBirr' => 1000,
                'perdiem' => 100,
                'other' => 50,
                'is_returned' => true,
            ]);

        $this->actingAs($user)
            ->get(route('performances.show', $performance))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Show')
                ->where('operationInsights.performanceShare.plannedContribution', fn ($value) => is_numeric($value) && abs($value - 10.0) < 0.01)
                ->where('operationInsights.economics.tonKmCompletionRate', fn ($value) => is_numeric($value) && abs($value - 10.0) < 0.01)
            );
    }

    #[Test]
    public function show_planned_contribution_falls_back_to_tonnage_when_ton_kilometer_plan_missing(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['performances.show', 'performances.view-any']);

        $operation = Operation::factory()->create([
            'volume' => 80,
            'km' => 0,
            'tariff' => 12,
        ]);

        $performance = Performance::factory()
            ->for($operation)
            ->create([
                'CargoVolumMT' => 20,
                'DistanceWCargo' => 50,
                'DistanceWOCargo' => 0,
                'tonkm' => null,
                'fuelInBirr' => 800,
                'perdiem' => 90,
                'other' => 60,
                'is_returned' => true,
            ]);

        $this->actingAs($user)
            ->get(route('performances.show', $performance))
            ->assertOk()
            ->assertInertia(fn (AssertableInertia $page) => $page
                ->component('Performances/Show')
                ->where('operationInsights.performanceShare.plannedContribution', fn ($value) => is_numeric($value) && abs($value - 25.0) < 0.01)
                ->where('operationInsights.economics.tonKmCompletionRate', null)
            );
    }
}

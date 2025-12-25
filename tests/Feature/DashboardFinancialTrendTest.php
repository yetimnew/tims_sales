<?php

namespace Tests\Feature;

use App\Models\FuelRecord;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Inertia\Testing\Assert;
use Tests\TestCase;

class DashboardFinancialTrendTest extends TestCase
{
    use RefreshDatabase;

    public function test_dashboard_falls_back_to_performance_financial_trend(): void
    {
        $now = Carbon::create(2025, 12, 24, 9, 30);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 150]);

        $currentMonth = Carbon::now()->startOfMonth();
        $previousMonth = $currentMonth->copy()->subMonth();

        Performance::factory()->create([
            'operation_id' => $operation->id,
            'user_id' => $user->id,
            'DateDispach' => $previousMonth->copy()->addDays(3),
            'CargoVolumMT' => 10,
            'fuelInBirr' => 500,
            'perdiem' => 120,
            'workOnGoing' => 180,
            'other' => 40,
        ]);

        Performance::factory()->create([
            'operation_id' => $operation->id,
            'user_id' => $user->id,
            'DateDispach' => $currentMonth->copy()->addDays(4),
            'CargoVolumMT' => 8,
            'fuelInBirr' => 400,
            'perdiem' => 90,
            'workOnGoing' => 150,
            'other' => 30,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->has('financialOverview.trend', 6)
                ->where('financialOverview.trend.4.period', $previousMonth->format('Y-m'))
                ->where('financialOverview.trend.4.revenue', 1500.0)
                ->where('financialOverview.trend.4.cost', 840.0)
                ->where('financialOverview.trend.4.net', 660.0)
                ->where('financialOverview.trend.5.period', $currentMonth->format('Y-m'))
                ->where('financialOverview.trend.5.revenue', 1200.0)
                ->where('financialOverview.trend.5.cost', 670.0)
                ->where('financialOverview.trend.5.net', 530.0)
            );

        Carbon::setTestNow();
    }

    public function test_dashboard_fuel_exposure_uses_performance_records(): void
    {
        $now = Carbon::create(2025, 12, 24, 8, 0);
        Carbon::setTestNow($now);

        $user = User::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 125]);

        Performance::factory()
            ->for($operation)
            ->for($user)
            ->create([
                'DateDispach' => Carbon::now()->copy()->subDays(5),
                'fuelInBirr' => 1500,
                'fuelInLitter' => 300,
            ]);

        Performance::factory()
            ->for($operation)
            ->for($user)
            ->create([
                'DateDispach' => Carbon::now()->copy()->subMonths(2)->startOfMonth()->addDays(3),
                'fuelInBirr' => 500,
                'fuelInLitter' => 100,
            ]);

        FuelRecord::factory()->create([
            'fuel_date' => Carbon::now()->copy()->subDays(7),
            'total_cost' => 9_999_999,
            'fuel_quantity_liters' => 1_234,
        ]);

        $this->actingAs($user)
            ->get(route('dashboard'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Dashboard')
                ->where('financialOverview.fuel.totalCost30d', 1500.0)
                ->where('financialOverview.fuel.totalVolume30d', 300.0)
                ->where('financialOverview.fuel.avgCostPerLiter30d', 5.0)
                ->where('financialOverview.fuel.trend.3.cost', 500.0)
                ->where('financialOverview.fuel.trend.3.volume', 100.0)
                ->where('financialOverview.fuel.trend.5.cost', 1500.0)
                ->where('financialOverview.fuel.trend.5.volume', 300.0)
            );

        Carbon::setTestNow();
    }
}

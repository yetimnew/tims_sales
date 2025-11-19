<?php

namespace Tests\Feature\Report;

use App\Models\Customer;
use App\Models\Operation;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class OperationsReportTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_displays_internal_and_outsource_mix_statistics(): void
    {
        $user = User::factory()->create();
        $customer = Customer::factory()->create(['name' => 'Acme Logistics']);

        $operation = Operation::factory()->create([
            'customer_id' => $customer->id,
            'tariff' => 150,
            'status' => 'active',
            'operationid' => 'OP-001',
        ]);

        $periodStart = Carbon::now()->subMonth()->startOfDay();
        $periodEnd = Carbon::now()->endOfDay();

        Performance::factory()->create([
            'operation_id' => $operation->id,
            'CargoVolumMT' => 20,
            'DistanceWCargo' => 120,
            'DistanceWOCargo' => 30,
            'fuelInBirr' => 1_000,
            'perdiem' => 200,
            'other' => 100,
            'DateDispach' => Carbon::now()->subWeek(),
        ]);

        OutsourcePerformance::factory()->create([
            'operation_id' => $operation->id,
            'cargo_volume_mt' => 15,
            'distance_km' => 200,
            'cost' => 5_000,
            'dispatch_date' => Carbon::now()->subDays(5),
        ]);

        $response = $this->actingAs($user)->get(route('reports.operations', [
            'from' => $periodStart->toDateString(),
            'to' => $periodEnd->toDateString(),
        ]));

        $response->assertStatus(200);

        $response->assertInertia(fn (Assert $page) => $page
            ->component('Reports/Operations')
            ->where('operationStats.internal_trips', 1)
            ->where('operationStats.internal_tonnage', 20)
            ->where('operationStats.internal_cost', 1_300)
            ->where('operationStats.outsource_trips', 1)
            ->where('operationStats.outsource_tonnage', 15)
            ->where('operationStats.outsource_cost', 5_000)
            ->where('operationStats.total_revenue', 5_250)
            ->where('operationStats.margin', -1_050)
            ->has('operations.data', 1)
            ->where('operations.data.0.internal.trips', 1)
            ->where('operations.data.0.outsource.trips', 1)
            ->where('operations.data.0.revenue', 5_250)
            ->where('operations.data.0.margin', -1_050)
            ->where('operations.data.0.margin_percent', -20)
            ->has('customerHighlights', 1)
            ->where('customerHighlights.0.customer_name', 'Acme Logistics')
            ->where('customerHighlights.0.revenue', 5_250)
            ->where('customerHighlights.0.margin', -1_050)
            ->has('mixTrend', 1)
            ->where('mixTrend.0.internal_trips', 1)
            ->where('mixTrend.0.outsource_trips', 1)
        );
    }
}

<?php

namespace Tests\Feature\Reports;

use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Services\Reports\OutsourcePerformanceReport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutsourcePerformanceReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_outsource_performance_report(): void
    {
        Carbon::setTestNow('2024-09-01 12:00:00');

        $report = app(OutsourcePerformanceReport::class);

        $vendorA = Outsource::factory()->create(['name' => 'Hauler A', 'status' => 'active']);
        $vendorB = Outsource::factory()->create(['name' => 'Hauler B', 'status' => 'inactive']);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorA->id,
            'dispatch_date' => now()->subDays(12),
            'distance_km' => 300,
            'tonkm' => 900,
            'cost' => 6000,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorA->id,
            'dispatch_date' => now()->subDays(3),
            'distance_km' => 200,
            'tonkm' => 700,
            'cost' => 5000,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorB->id,
            'dispatch_date' => now()->subDays(15),
            'distance_km' => 200,
            'tonkm' => 400,
            'cost' => 1600,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorB->id,
            'dispatch_date' => now()->subDays(40),
            'distance_km' => 300,
            'tonkm' => 600,
            'cost' => 3300,
            'status' => 'cancelled',
        ]);

        OutsourcePerformance::factory()->create([
            'dispatch_date' => now()->subMonths(8),
            'distance_km' => 500,
            'cost' => 9000,
            'status' => 'completed',
        ]);

        Performance::factory()->create([
            'DateDispach' => now()->subDays(10),
            'DistanceWCargo' => 320,
            'DistanceWOCargo' => 80,
            'fuelInBirr' => 4000,
            'perdiem' => 800,
            'other' => 200,
        ]);

        Performance::factory()->create([
            'DateDispach' => now()->subMonths(8),
            'DistanceWCargo' => 200,
            'DistanceWOCargo' => 50,
            'fuelInBirr' => 2000,
            'perdiem' => 400,
            'other' => 100,
        ]);

        $result = $report->build([
            'from' => now()->subMonths(2)->startOfMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]);

        $this->assertSame('2024-07-01', $result['resolved_from']);
        $this->assertSame('2024-09-01', $result['resolved_to']);
        $this->assertSame([], $result['outsource_ids']);
        $this->assertSame([], $result['statuses']);

        $totals = $result['totals'];
        $this->assertSame(4, $totals['trips']);
        $this->assertSame(3, $totals['completed_trips']);
        $this->assertSame(2, $totals['vendor_count']);
        $this->assertEqualsWithDelta(1000.0, $totals['distance_km'], 0.01);
        $this->assertEqualsWithDelta(15900.0, $totals['cost'], 0.01);
        $this->assertEqualsWithDelta(2600.0, $totals['tonkm'], 0.01);
        $this->assertEqualsWithDelta(15.9, $totals['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(75.0, $totals['average_completion_rate_pct'], 0.01);

        $summary = $result['summary'];
        $this->assertEqualsWithDelta(15.9, $summary['outsourced_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(12.5, $summary['internal_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(3.4, $summary['cost_delta_per_km'], 0.01);
        $this->assertEqualsWithDelta(3400.0, $summary['projected_cost_delta'], 0.01);
        $this->assertEqualsWithDelta(3975.0, $summary['average_cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(250.0, $summary['average_distance_per_trip'], 0.01);
        $this->assertEqualsWithDelta(75.0, $summary['average_completion_rate_pct'], 0.01);

        $baseline = $result['baseline'];
        $this->assertSame(1, $baseline['trip_count']);
        $this->assertEqualsWithDelta(400.0, $baseline['distance_km'], 0.01);
        $this->assertEqualsWithDelta(5000.0, $baseline['cost'], 0.01);
        $this->assertEqualsWithDelta(12.5, $baseline['cost_per_km'], 0.01);

        $rows = collect($result['breakdown'])->keyBy('outsource_id');
        $this->assertCount(2, $rows);

        $vendorARow = $rows[$vendorA->id];
        $this->assertSame('Hauler A', $vendorARow['name']);
        $this->assertSame(2, $vendorARow['trips']);
        $this->assertSame(2, $vendorARow['completed_trips']);
        $this->assertEqualsWithDelta(100.0, $vendorARow['completion_rate_pct'], 0.01);
        $this->assertEqualsWithDelta(500.0, $vendorARow['total_distance_km'], 0.01);
        $this->assertEqualsWithDelta(11000.0, $vendorARow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(1600.0, $vendorARow['total_tonkm'], 0.01);
        $this->assertEqualsWithDelta(22.0, $vendorARow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(9.5, $vendorARow['cost_delta_per_km'], 0.01);
        $this->assertEqualsWithDelta(4750.0, $vendorARow['total_cost_delta'], 0.01);
        $this->assertEqualsWithDelta(5500.0, $vendorARow['average_cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(250.0, $vendorARow['average_distance_per_trip'], 0.01);

        $vendorBRow = $rows[$vendorB->id];
        $this->assertSame('Hauler B', $vendorBRow['name']);
        $this->assertSame(2, $vendorBRow['trips']);
        $this->assertSame(1, $vendorBRow['completed_trips']);
        $this->assertEqualsWithDelta(50.0, $vendorBRow['completion_rate_pct'], 0.01);
        $this->assertEqualsWithDelta(500.0, $vendorBRow['total_distance_km'], 0.01);
        $this->assertEqualsWithDelta(4900.0, $vendorBRow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(1000.0, $vendorBRow['total_tonkm'], 0.01);
        $this->assertEqualsWithDelta(9.8, $vendorBRow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(-2.7, $vendorBRow['cost_delta_per_km'], 0.01);
        $this->assertEqualsWithDelta(-1350.0, $vendorBRow['total_cost_delta'], 0.01);
        $this->assertEqualsWithDelta(2450.0, $vendorBRow['average_cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(250.0, $vendorBRow['average_distance_per_trip'], 0.01);

        $trend = collect($result['trend'])->keyBy('period');
        $this->assertCount(2, $trend);
        $this->assertEqualsWithDelta(1.0, $trend['2024-07']['trips'], 0.01);
        $this->assertEqualsWithDelta(300.0, $trend['2024-07']['total_distance_km'], 0.01);
        $this->assertEqualsWithDelta(3300.0, $trend['2024-07']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(11.0, $trend['2024-07']['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(0.0, $trend['2024-07']['completion_rate_pct'], 0.01);
        $this->assertEqualsWithDelta(3.0, $trend['2024-08']['trips'], 0.01);
        $this->assertEqualsWithDelta(700.0, $trend['2024-08']['total_distance_km'], 0.01);
        $this->assertEqualsWithDelta(12600.0, $trend['2024-08']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(18.0, $trend['2024-08']['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(100.0, $trend['2024-08']['completion_rate_pct'], 0.01);

        $this->assertSame($vendorA->id, $result['highlights']['highest_cost_per_km'][0]['outsource_id']);
        $this->assertSame($vendorA->id, $result['highlights']['best_completion_rate'][0]['outsource_id']);
        $this->assertSame($vendorA->id, $result['highlights']['largest_spend'][0]['outsource_id']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_selected_vendors(): void
    {
        Carbon::setTestNow('2024-09-01 12:00:00');

        $report = app(OutsourcePerformanceReport::class);

        $vendorA = Outsource::factory()->create();
        $vendorB = Outsource::factory()->create();

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorA->id,
            'dispatch_date' => now()->subDays(5),
            'distance_km' => 150,
            'cost' => 2000,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorB->id,
            'dispatch_date' => now()->subDays(5),
            'distance_km' => 180,
            'cost' => 2600,
            'status' => 'completed',
        ]);

        Performance::factory()->create([
            'DateDispach' => now()->subDays(5),
            'DistanceWCargo' => 100,
            'DistanceWOCargo' => 20,
            'fuelInBirr' => 1200,
            'perdiem' => 200,
            'other' => 100,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'outsource_ids' => [$vendorB->id],
        ]);

        $this->assertSame([$vendorB->id], $result['outsource_ids']);
        $this->assertCount(1, $result['breakdown']);
        $this->assertSame($vendorB->id, $result['breakdown'][0]['outsource_id']);

        Carbon::setTestNow();
    }
}

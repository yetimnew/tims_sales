<?php

namespace Tests\Feature\Reports;

use App\Models\FuelRecord;
use App\Models\Truck;
use App\Services\Reports\FuelEfficiencyReport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class FuelEfficiencyReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_fuel_efficiency_report(): void
    {
        Carbon::setTestNow('2024-07-15 12:00:00');

        $report = app(FuelEfficiencyReport::class);

        $truckA = Truck::factory()->create(['plate' => 'ABC-123', 'status' => 'active']);
        $truckB = Truck::factory()->create(['plate' => 'XYZ-987', 'status' => 'maintenance']);

        FuelRecord::factory()
            ->for($truckA)
            ->create([
                'fuel_date' => now()->subDays(15),
                'fuel_quantity_liters' => 100,
                'fuel_price_per_liter' => 30,
                'total_cost' => 3000,
                'odometer_reading' => 12000,
            ]);

        FuelRecord::factory()
            ->for($truckA)
            ->create([
                'fuel_date' => now()->subDays(10),
                'fuel_quantity_liters' => 80,
                'fuel_price_per_liter' => 32,
                'total_cost' => 2560,
                'odometer_reading' => 12360,
            ]);

        FuelRecord::factory()
            ->for($truckB)
            ->create([
                'fuel_date' => now()->subDays(20),
                'fuel_quantity_liters' => 150,
                'fuel_price_per_liter' => 28,
                'total_cost' => 4200,
                'odometer_reading' => 50000,
            ]);

        FuelRecord::factory()
            ->for($truckB)
            ->create([
                'fuel_date' => now()->subDays(5),
                'fuel_quantity_liters' => 120,
                'fuel_price_per_liter' => 27,
                'total_cost' => 3240,
                'odometer_reading' => 50330,
            ]);

        FuelRecord::factory()
            ->create([
                'fuel_date' => now()->subMonths(6),
                'fuel_quantity_liters' => 90,
                'total_cost' => 1800,
            ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]);

        $this->assertSame('2024-06-15', $result['resolved_from']);
        $this->assertSame('2024-07-15', $result['resolved_to']);
        $this->assertSame([], $result['truck_ids']);

        $totals = $result['totals'];
        $this->assertEqualsWithDelta(450.0, $totals['total_liters'], 0.01);
        $this->assertEqualsWithDelta(13000.0, $totals['total_cost'], 0.01);
        $this->assertEqualsWithDelta(690.0, $totals['total_distance_km'], 0.01);
        $this->assertSame(4, $totals['refuel_events']);
        $this->assertSame(2, $totals['truck_count']);

        $summary = $result['summary'];
        $this->assertEqualsWithDelta(1.53, $summary['fleet_efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(18.84, $summary['fleet_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(28.89, $summary['average_cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(112.5, $summary['average_liters_per_event'], 0.01);
        $this->assertEqualsWithDelta(3250.0, $summary['average_cost_per_event'], 0.01);
        $this->assertEqualsWithDelta(172.5, $summary['average_distance_per_event'], 0.01);

        $rows = collect($result['breakdown'])->keyBy('truck_id');
        $this->assertCount(2, $rows);

        $truckARow = $rows[$truckA->id];
        $this->assertSame('ABC-123', $truckARow['plate']);
        $this->assertSame(2, $truckARow['refuel_events']);
        $this->assertEqualsWithDelta(180.0, $truckARow['total_liters'], 0.01);
        $this->assertEqualsWithDelta(5560.0, $truckARow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(360.0, $truckARow['distance_km'], 0.01);
        $this->assertEqualsWithDelta(2.0, $truckARow['efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(15.44, $truckARow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(30.89, $truckARow['cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(90.0, $truckARow['avg_liters_per_event'], 0.01);
        $this->assertEqualsWithDelta(2780.0, $truckARow['avg_cost_per_event'], 0.01);
        $this->assertSame(now()->subDays(15)->toDateString(), $truckARow['first_fill_on']);
        $this->assertSame(now()->subDays(10)->toDateString(), $truckARow['last_fill_on']);
        $this->assertTrue($truckARow['has_distance']);

        $truckBRow = $rows[$truckB->id];
        $this->assertSame('XYZ-987', $truckBRow['plate']);
        $this->assertSame(2, $truckBRow['refuel_events']);
        $this->assertEqualsWithDelta(270.0, $truckBRow['total_liters'], 0.01);
        $this->assertEqualsWithDelta(7440.0, $truckBRow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(330.0, $truckBRow['distance_km'], 0.01);
        $this->assertEqualsWithDelta(1.22, $truckBRow['efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(22.55, $truckBRow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(27.56, $truckBRow['cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(135.0, $truckBRow['avg_liters_per_event'], 0.01);
        $this->assertEqualsWithDelta(3720.0, $truckBRow['avg_cost_per_event'], 0.01);
        $this->assertSame(now()->subDays(20)->toDateString(), $truckBRow['first_fill_on']);
        $this->assertSame(now()->subDays(5)->toDateString(), $truckBRow['last_fill_on']);
        $this->assertTrue($truckBRow['has_distance']);

        $trend = collect($result['trend'])->keyBy('period');
        $this->assertCount(2, $trend);
        $this->assertEqualsWithDelta(250.0, $trend['2024-06']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(7200.0, $trend['2024-06']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(28.8, $trend['2024-06']['average_price_per_liter'], 0.01);
        $this->assertEqualsWithDelta(125.0, $trend['2024-06']['average_liters_per_event'], 0.01);
        $this->assertEqualsWithDelta(200.0, $trend['2024-07']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(5800.0, $trend['2024-07']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(29.0, $trend['2024-07']['average_price_per_liter'], 0.01);
        $this->assertEqualsWithDelta(100.0, $trend['2024-07']['average_liters_per_event'], 0.01);

        $this->assertSame($truckA->id, $result['highlights']['best_efficiency'][0]['truck_id']);
        $this->assertSame($truckB->id, $result['highlights']['highest_cost_per_km'][0]['truck_id']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_specific_trucks(): void
    {
        Carbon::setTestNow('2024-07-15 12:00:00');

        $report = app(FuelEfficiencyReport::class);

        $truckA = Truck::factory()->create();
        $truckB = Truck::factory()->create();

        FuelRecord::factory()->for($truckA)->create([
            'fuel_date' => now()->subDays(7),
            'fuel_quantity_liters' => 60,
            'total_cost' => 1800,
            'odometer_reading' => 8000,
        ]);

        FuelRecord::factory()->for($truckA)->create([
            'fuel_date' => now()->subDays(3),
            'fuel_quantity_liters' => 40,
            'total_cost' => 1400,
            'odometer_reading' => 8200,
        ]);

        FuelRecord::factory()->for($truckB)->create([
            'fuel_date' => now()->subDays(4),
            'fuel_quantity_liters' => 50,
            'total_cost' => 1600,
            'odometer_reading' => 6000,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'truck_ids' => [$truckA->id],
        ]);

        $this->assertSame([$truckA->id], $result['truck_ids']);
        $this->assertCount(1, $result['breakdown']);
        $this->assertEquals(2, $result['totals']['refuel_events']);
        $this->assertEqualsWithDelta(100.0, $result['totals']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(3200.0, $result['totals']['total_cost'], 0.01);

        Carbon::setTestNow();
    }
}

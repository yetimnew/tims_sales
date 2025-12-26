<?php

namespace Tests\Feature\Reports;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Performance;
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
        $truckB = Truck::factory()->create(['plate' => 'XYZ-987', 'status' => 'inactive']);

        $driverA = Driver::factory()->create(['name' => 'Alice Carter']);
        $driverB = Driver::factory()->create(['name' => 'Brian Hall']);
        $driverC = Driver::factory()->create(['name' => 'Cara Bloom']);

        $assignmentA = DriverTruck::factory()
            ->for($driverA, 'driver')
            ->for($truckA, 'truck')
            ->create([
                'plate' => $truckA->plate,
                'driverid' => 'DRV1001',
                'date_recived' => now()->subMonths(2),
                'assigned_date' => now()->subMonths(2),
            ]);

        $assignmentB = DriverTruck::factory()
            ->for($driverB, 'driver')
            ->for($truckB, 'truck')
            ->create([
                'plate' => $truckB->plate,
                'driverid' => 'DRV2001',
                'date_recived' => now()->subMonths(2),
                'assigned_date' => now()->subMonths(2),
            ]);

        $assignmentB2 = DriverTruck::factory()
            ->for($driverC, 'driver')
            ->for($truckB, 'truck')
            ->create([
                'plate' => $truckB->plate,
                'driverid' => 'DRV2002',
                'date_recived' => now()->subMonths(1),
                'assigned_date' => now()->subMonths(1),
            ]);

        Performance::factory()
            ->for($assignmentA, 'driverTruck')
            ->create([
                'DateDispach' => now()->subDays(20),
                'DistanceWCargo' => 300,
                'DistanceWOCargo' => 50,
                'fuelInLitter' => 100,
                'fuelInBirr' => 4000,
            ]);

        Performance::factory()
            ->for($assignmentA, 'driverTruck')
            ->create([
                'DateDispach' => now()->subDays(5),
                'DistanceWCargo' => 200,
                'DistanceWOCargo' => 30,
                'fuelInLitter' => 80,
                'fuelInBirr' => 3200,
            ]);

        Performance::factory()
            ->for($assignmentB, 'driverTruck')
            ->create([
                'DateDispach' => now()->subDays(18),
                'DistanceWCargo' => 150,
                'DistanceWOCargo' => 70,
                'fuelInLitter' => 120,
                'fuelInBirr' => 3600,
            ]);

        Performance::factory()
            ->for($assignmentB2, 'driverTruck')
            ->create([
                'DateDispach' => now()->subDays(3),
                'DistanceWCargo' => 100,
                'DistanceWOCargo' => 90,
                'fuelInLitter' => 110,
                'fuelInBirr' => 3300,
            ]);

        Performance::factory()
            ->for($assignmentA, 'driverTruck')
            ->create([
                'DateDispach' => now()->subMonths(6),
                'DistanceWCargo' => 400,
                'DistanceWOCargo' => 40,
                'fuelInLitter' => 150,
                'fuelInBirr' => 5000,
            ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]);

        $this->assertSame('2024-06-15', $result['resolved_from']);
        $this->assertSame('2024-07-15', $result['resolved_to']);
        $this->assertSame([], $result['truck_ids']);

        $totals = $result['totals'];
        $this->assertEqualsWithDelta(410.0, $totals['total_liters'], 0.01);
        $this->assertEqualsWithDelta(14100.0, $totals['total_cost'], 0.01);
        $this->assertEqualsWithDelta(750.0, $totals['total_loaded_distance_km'], 0.01);
        $this->assertEqualsWithDelta(240.0, $totals['total_empty_distance_km'], 0.01);
        $this->assertEqualsWithDelta(990.0, $totals['total_distance_km'], 0.01);
        $this->assertSame(4, $totals['trip_count']);
        $this->assertSame(2, $totals['truck_count']);

        $summary = $result['summary'];
        $this->assertEqualsWithDelta(2.41, $summary['fleet_efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(14.24, $summary['fleet_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(34.39, $summary['average_cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(102.5, $summary['average_liters_per_trip'], 0.01);
        $this->assertEqualsWithDelta(3525.0, $summary['average_cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(187.5, $summary['average_loaded_distance_per_trip'], 0.01);
        $this->assertEqualsWithDelta(60.0, $summary['average_empty_distance_per_trip'], 0.01);
        $this->assertEqualsWithDelta(75.76, $summary['loaded_distance_share_percent'], 0.01);
        $this->assertEqualsWithDelta(24.24, $summary['empty_distance_share_percent'], 0.01);

        $rows = collect($result['breakdown'])->keyBy('truck_id');
        $this->assertCount(2, $rows);

        $truckARow = $rows[$truckA->id];
        $this->assertSame('ABC-123', $truckARow['plate']);
        $this->assertSame(2, $truckARow['trip_count']);
        $this->assertEqualsWithDelta(180.0, $truckARow['total_liters'], 0.01);
        $this->assertEqualsWithDelta(7200.0, $truckARow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(500.0, $truckARow['distance_loaded_km'], 0.01);
        $this->assertEqualsWithDelta(80.0, $truckARow['distance_empty_km'], 0.01);
        $this->assertEqualsWithDelta(580.0, $truckARow['distance_total_km'], 0.01);
        $this->assertEqualsWithDelta(3.22, $truckARow['efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(12.41, $truckARow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(40.0, $truckARow['cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(90.0, $truckARow['avg_liters_per_trip'], 0.01);
        $this->assertEqualsWithDelta(3600.0, $truckARow['avg_cost_per_trip'], 0.01);
        $this->assertSame([ucwords($driverA->name)], $truckARow['driver_names']);
        $this->assertEqualsWithDelta(13.79, $truckARow['empty_distance_share_percent'], 0.01);
        $this->assertSame(now()->subDays(20)->toDateString(), $truckARow['first_activity_on']);
        $this->assertSame(now()->subDays(5)->toDateString(), $truckARow['last_activity_on']);
        $this->assertTrue($truckARow['has_distance']);

        $truckBRow = $rows[$truckB->id];
        $this->assertSame('XYZ-987', $truckBRow['plate']);
        $this->assertSame(2, $truckBRow['trip_count']);
        $this->assertEqualsWithDelta(230.0, $truckBRow['total_liters'], 0.01);
        $this->assertEqualsWithDelta(6900.0, $truckBRow['total_cost'], 0.01);
        $this->assertEqualsWithDelta(250.0, $truckBRow['distance_loaded_km'], 0.01);
        $this->assertEqualsWithDelta(160.0, $truckBRow['distance_empty_km'], 0.01);
        $this->assertEqualsWithDelta(410.0, $truckBRow['distance_total_km'], 0.01);
        $this->assertEqualsWithDelta(1.78, $truckBRow['efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(16.83, $truckBRow['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(30.0, $truckBRow['cost_per_liter'], 0.01);
        $this->assertEqualsWithDelta(115.0, $truckBRow['avg_liters_per_trip'], 0.01);
        $this->assertEqualsWithDelta(3450.0, $truckBRow['avg_cost_per_trip'], 0.01);
        $this->assertEqualsCanonicalizing([
            ucwords($driverB->name),
            ucwords($driverC->name),
        ], $truckBRow['driver_names']);
        $this->assertEqualsWithDelta(39.02, $truckBRow['empty_distance_share_percent'], 0.01);
        $this->assertSame(now()->subDays(18)->toDateString(), $truckBRow['first_activity_on']);
        $this->assertSame(now()->subDays(3)->toDateString(), $truckBRow['last_activity_on']);
        $this->assertTrue($truckBRow['has_distance']);

        $trend = collect($result['trend'])->keyBy('period');
        $this->assertCount(2, $trend);
        $this->assertEqualsWithDelta(220.0, $trend['2024-06']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(7600.0, $trend['2024-06']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(450.0, $trend['2024-06']['distance_loaded_km'], 0.01);
        $this->assertEqualsWithDelta(120.0, $trend['2024-06']['distance_empty_km'], 0.01);
        $this->assertEqualsWithDelta(2.59, $trend['2024-06']['fleet_efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(13.33, $trend['2024-06']['fleet_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(190.0, $trend['2024-07']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(6500.0, $trend['2024-07']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(300.0, $trend['2024-07']['distance_loaded_km'], 0.01);
        $this->assertEqualsWithDelta(120.0, $trend['2024-07']['distance_empty_km'], 0.01);
        $this->assertEqualsWithDelta(2.21, $trend['2024-07']['fleet_efficiency_km_per_liter'], 0.01);
        $this->assertEqualsWithDelta(15.48, $trend['2024-07']['fleet_cost_per_km'], 0.01);

        $this->assertSame($truckA->id, $result['highlights']['best_efficiency'][0]['truck_id']);
        $this->assertSame($truckB->id, $result['highlights']['highest_cost_per_km'][0]['truck_id']);
        $this->assertSame($truckB->id, $result['highlights']['highest_empty_distance_share'][0]['truck_id']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_specific_trucks(): void
    {
        Carbon::setTestNow('2024-07-15 12:00:00');

        $report = app(FuelEfficiencyReport::class);

        $truckA = Truck::factory()->create();
        $truckB = Truck::factory()->create();

        $driverA = Driver::factory()->create();
        $driverB = Driver::factory()->create();

        $assignmentA = DriverTruck::factory()->for($driverA, 'driver')->for($truckA, 'truck')->create([
            'plate' => $truckA->plate,
        ]);

        $assignmentB = DriverTruck::factory()->for($driverB, 'driver')->for($truckB, 'truck')->create([
            'plate' => $truckB->plate,
        ]);

        Performance::factory()->for($assignmentA, 'driverTruck')->create([
            'DateDispach' => now()->subDays(7),
            'DistanceWCargo' => 120,
            'DistanceWOCargo' => 30,
            'fuelInLitter' => 60,
            'fuelInBirr' => 1800,
        ]);

        Performance::factory()->for($assignmentA, 'driverTruck')->create([
            'DateDispach' => now()->subDays(3),
            'DistanceWCargo' => 100,
            'DistanceWOCargo' => 20,
            'fuelInLitter' => 40,
            'fuelInBirr' => 1400,
        ]);

        Performance::factory()->for($assignmentB, 'driverTruck')->create([
            'DateDispach' => now()->subDays(4),
            'DistanceWCargo' => 90,
            'DistanceWOCargo' => 10,
            'fuelInLitter' => 50,
            'fuelInBirr' => 1600,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'truck_ids' => [$truckA->id],
        ]);

        $this->assertSame([$truckA->id], $result['truck_ids']);
        $this->assertCount(1, $result['breakdown']);
        $this->assertEquals(2, $result['totals']['trip_count']);
        $this->assertEqualsWithDelta(100.0, $result['totals']['total_liters'], 0.01);
        $this->assertEqualsWithDelta(3200.0, $result['totals']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(220.0, $result['totals']['total_loaded_distance_km'], 0.01);
        $this->assertEqualsWithDelta(50.0, $result['totals']['total_empty_distance_km'], 0.01);

        Carbon::setTestNow();
    }
}

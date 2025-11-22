<?php

namespace Tests\Feature\Reports;

use App\Models\Customer;
use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\Place;
use App\Services\Reports\CustomerProfitabilityReport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CustomerProfitabilityReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_customer_profitability_report(): void
    {
        Carbon::setTestNow('2024-06-15 12:00:00');

        $report = app(CustomerProfitabilityReport::class);

        $customerA = Customer::factory()->create(['name' => 'Customer Alpha']);
        $customerB = Customer::factory()->create(['name' => 'Customer Beta']);

        $operationA = Operation::factory()
            ->for($customerA)
            ->create([
                'tariff' => 400,
                'status' => 'active',
            ]);

        $operationB = Operation::factory()
            ->for($customerB)
            ->create([
                'tariff' => 250,
                'status' => 'active',
            ]);

        $driverTruck = DriverTruck::factory()->create();

        $originOne = Place::factory()->create();
        $destinationOne = Place::factory()->create();
        $originTwo = Place::factory()->create();
        $destinationTwo = Place::factory()->create();

        Performance::factory()->create([
            'operation_id' => $operationA->id,
            'driver_truck_id' => $driverTruck->id,
            'DateDispach' => now()->subDays(10),
            'CargoVolumMT' => 10,
            'tonkm' => 1000,
            'DistanceWCargo' => 120,
            'DistanceWOCargo' => 30,
            'fuelInBirr' => 1000,
            'perdiem' => 200,
            'workOnGoing' => 100,
            'other' => 50,
            'orgion_id' => $originOne->id,
            'destination_id' => $destinationOne->id,
        ]);

        Performance::factory()->create([
            'operation_id' => $operationA->id,
            'driver_truck_id' => $driverTruck->id,
            'DateDispach' => now()->subDays(6),
            'CargoVolumMT' => 8,
            'tonkm' => 800,
            'DistanceWCargo' => 100,
            'DistanceWOCargo' => 20,
            'fuelInBirr' => 900,
            'perdiem' => 150,
            'workOnGoing' => 80,
            'other' => 40,
            'orgion_id' => $originTwo->id,
            'destination_id' => $destinationTwo->id,
        ]);

        OutsourcePerformance::factory()->create([
            'operation_id' => $operationA->id,
            'dispatch_date' => now()->subDays(5),
            'cargo_volume_mt' => 5,
            'tonkm' => 500,
            'distance_km' => 80,
            'cost' => 800,
        ]);

        OutsourcePerformance::factory()->create([
            'operation_id' => $operationB->id,
            'dispatch_date' => now()->subDays(4),
            'cargo_volume_mt' => 6,
            'tonkm' => 600,
            'distance_km' => 90,
            'cost' => 900,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'customer_ids' => [$customerA->id],
        ]);

        $this->assertSame([$customerA->id], $result['customer_ids']);

        $rows = collect($result['rows']);
        $this->assertCount(1, $rows);

        $row = $rows->first();
        $this->assertSame($customerA->id, $row['customer_id']);
        $this->assertSame('Customer Alpha', $row['customer_name']);
        $this->assertSame(1, $row['operations']);
        $this->assertSame(2, $row['lanes_used']);
        $this->assertSame(2, $row['internal_trips']);
        $this->assertSame(1, $row['outsource_trips']);
        $this->assertSame(3, $row['total_trips']);
        $this->assertEqualsWithDelta(18.0, $row['internal_tonnage'], 0.01);
        $this->assertEqualsWithDelta(5.0, $row['outsource_tonnage'], 0.01);
        $this->assertEqualsWithDelta(23.0, $row['total_tonnage'], 0.01);
        $this->assertEqualsWithDelta(1800.0, $row['internal_ton_km'], 0.01);
        $this->assertEqualsWithDelta(500.0, $row['outsource_ton_km'], 0.01);
        $this->assertEqualsWithDelta(2300.0, $row['total_ton_km'], 0.01);
        $this->assertEqualsWithDelta(270.0, $row['internal_distance'], 0.01);
        $this->assertEqualsWithDelta(80.0, $row['outsource_distance'], 0.01);
        $this->assertEqualsWithDelta(350.0, $row['total_distance'], 0.01);
        $this->assertEqualsWithDelta(2520.0, $row['internal_expense'], 0.01);
        $this->assertEqualsWithDelta(800.0, $row['outsource_cost'], 0.01);
        $this->assertEqualsWithDelta(3320.0, $row['total_cost'], 0.01);
        $this->assertEqualsWithDelta(9200.0, $row['revenue'], 0.01);
        $this->assertEqualsWithDelta(5880.0, $row['profit'], 0.01);
        $this->assertEqualsWithDelta(63.91, $row['margin_percent'], 0.01);
        $this->assertEqualsWithDelta(116.67, $row['average_km_per_trip'], 0.01);
        $this->assertEqualsWithDelta(9.49, $row['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(4.0, $row['revenue_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(1.44, $row['cost_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(2.56, $row['profit_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(3066.67, $row['revenue_per_trip'], 0.01);
        $this->assertEqualsWithDelta(1106.67, $row['cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(7.67, $row['tonnage_per_trip'], 0.01);
        $this->assertEqualsWithDelta(18.52, $row['empty_distance_ratio_percent'], 0.01);
        $this->assertEqualsWithDelta(7.04, $row['internal_fuel_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(10.0, $row['outsource_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(33.33, $row['outsource_trip_share_percent'], 0.01);
        $this->assertEqualsWithDelta(21.74, $row['outsource_tonnage_share_percent'], 0.01);

        $summary = $result['summary'];
        $this->assertSame(1, $summary['customer_count']);
        $this->assertSame(1, $summary['operations']);
        $this->assertSame(2, $summary['internal_trips']);
        $this->assertSame(1, $summary['outsource_trips']);
        $this->assertSame(3, $summary['total_trips']);
        $this->assertEqualsWithDelta(23.0, $summary['total_tonnage'], 0.01);
        $this->assertEqualsWithDelta(9200.0, $summary['revenue'], 0.01);
        $this->assertEqualsWithDelta(3320.0, $summary['total_cost'], 0.01);
        $this->assertEqualsWithDelta(5880.0, $summary['profit'], 0.01);
        $this->assertEqualsWithDelta(63.91, $summary['margin_percent'], 0.01);
        $this->assertEqualsWithDelta(116.67, $summary['average_km_per_trip'], 0.01);
        $this->assertEqualsWithDelta(9.49, $summary['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(4.0, $summary['revenue_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(1.44, $summary['cost_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(2.56, $summary['profit_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(3066.67, $summary['revenue_per_trip'], 0.01);
        $this->assertEqualsWithDelta(1106.67, $summary['cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(7.67, $summary['tonnage_per_trip'], 0.01);
        $this->assertEqualsWithDelta(33.33, $summary['outsource_trip_share_percent'], 0.01);
        $this->assertEqualsWithDelta(21.74, $summary['outsource_tonnage_share_percent'], 0.01);

        $trend = $result['trend'];
        $this->assertCount(1, $trend);
        $monthly = $trend[0];
        $this->assertSame('2024-06', $monthly['month']);
        $this->assertEqualsWithDelta(9200.0, $monthly['revenue'], 0.01);
        $this->assertEqualsWithDelta(3320.0, $monthly['cost'], 0.01);
        $this->assertEqualsWithDelta(5880.0, $monthly['profit'], 0.01);

        Carbon::setTestNow();
    }
}

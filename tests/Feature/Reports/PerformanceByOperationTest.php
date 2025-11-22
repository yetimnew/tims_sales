<?php

namespace Tests\Feature\Reports;

use App\Models\Customer;
use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Services\Reports\OperationPerformanceReport;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PerformanceByOperationTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_operation_performance_report(): void
    {
        $report = app(OperationPerformanceReport::class);

        $customer = Customer::factory()->create(['name' => 'Acme Logistics']);
        $operation = Operation::factory()
            ->for($customer)
            ->create([
                'operationid' => 'OP-100',
                'tariff' => 200,
                'status' => 'active',
            ]);

        $driverTruck = DriverTruck::factory()->create();

        Performance::factory()->create([
            'operation_id' => $operation->id,
            'driver_truck_id' => $driverTruck->id,
            'DateDispach' => now()->subDays(2),
            'CargoVolumMT' => 10,
            'tonkm' => 1000,
            'DistanceWCargo' => 120,
            'DistanceWOCargo' => 30,
            'fuelInBirr' => 1500,
            'perdiem' => 200,
            'workOnGoing' => 100,
            'other' => 50,
        ]);

        Performance::factory()->create([
            'operation_id' => $operation->id,
            'driver_truck_id' => $driverTruck->id,
            'DateDispach' => now()->subDay(),
            'CargoVolumMT' => 15,
            'tonkm' => 1500,
            'DistanceWCargo' => 150,
            'DistanceWOCargo' => 40,
            'fuelInBirr' => 1800,
            'perdiem' => 300,
            'workOnGoing' => 200,
            'other' => 100,
        ]);

        OutsourcePerformance::factory()->create([
            'operation_id' => $operation->id,
            'dispatch_date' => now()->subDay(),
            'cargo_volume_mt' => 20,
            'tonkm' => 2000,
            'distance_km' => 160,
            'cost' => 3000,
        ]);

        $result = $report->build([
            'from' => now()->subDays(7)->toDateString(),
            'to' => now()->toDateString(),
            'operation_ids' => [$operation->id],
        ]);

        $this->assertEquals([$operation->id], $result['operation_ids']);
        $this->assertCount(1, $result['rows']);

        $row = $result['rows'][0];
        $this->assertSame($customer->id, $row['customer_id']);
        $this->assertSame('OP-100', $row['operation_code']);
        $this->assertSame(2, $row['internal_trips']);
        $this->assertSame(1, $row['outsource_trips']);
        $this->assertSame(3, $row['total_trips']);
        $this->assertEqualsWithDelta(25.0, $row['internal_tonnage'], 0.01);
        $this->assertEqualsWithDelta(20.0, $row['outsource_tonnage'], 0.01);
        $this->assertEqualsWithDelta(45.0, $row['total_tonnage'], 0.01);
        $this->assertEqualsWithDelta(2500.0, $row['internal_ton_km'], 0.01);
        $this->assertEqualsWithDelta(2000.0, $row['outsource_ton_km'], 0.01);
        $this->assertEqualsWithDelta(4500.0, $row['total_ton_km'], 0.01);
        $this->assertEqualsWithDelta(340.0, $row['internal_distance'], 0.01);
        $this->assertEqualsWithDelta(160.0, $row['outsource_distance'], 0.01);
        $this->assertEqualsWithDelta(500.0, $row['total_distance'], 0.01);
        $this->assertEqualsWithDelta(3300.0, $row['internal_fuel_cost'], 0.01);
        $this->assertEqualsWithDelta(4250.0, $row['internal_expense'], 0.01);
        $this->assertEqualsWithDelta(3000.0, $row['outsource_cost'], 0.01);
        $this->assertEqualsWithDelta(7250.0, $row['total_cost'], 0.01);
        $this->assertEqualsWithDelta(9000.0, $row['revenue'], 0.01);
        $this->assertEqualsWithDelta(1750.0, $row['profit'], 0.01);
        $this->assertNotNull($row['margin_percent']);
        $this->assertEqualsWithDelta(19.44, $row['margin_percent'], 0.01);
        $this->assertEqualsWithDelta(166.67, $row['average_km_per_trip'], 0.01);
        $this->assertEqualsWithDelta(14.5, $row['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(2.0, $row['revenue_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(1.61, $row['cost_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(0.39, $row['profit_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(3000.0, $row['revenue_per_trip'], 0.01);
        $this->assertEqualsWithDelta(2416.67, $row['cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(15.0, $row['tonnage_per_trip'], 0.01);
        $this->assertEqualsWithDelta(20.59, $row['empty_distance_ratio_percent'], 0.01);
        $this->assertEqualsWithDelta(9.71, $row['internal_fuel_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(18.75, $row['outsource_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(33.33, $row['outsource_trip_share_percent'], 0.01);
        $this->assertEqualsWithDelta(44.44, $row['outsource_tonnage_share_percent'], 0.01);

        $summary = $result['summary'];
        $this->assertSame(1, $summary['operation_count']);
        $this->assertSame(3, $summary['total_trips']);
        $this->assertEqualsWithDelta(45.0, $summary['total_tonnage'], 0.01);
        $this->assertEqualsWithDelta(9000.0, $summary['revenue'], 0.01);
        $this->assertEqualsWithDelta(1750.0, $summary['profit'], 0.01);
        $this->assertNotNull($summary['margin_percent']);
        $this->assertEqualsWithDelta(19.44, $summary['margin_percent'], 0.01);
        $this->assertEqualsWithDelta(166.67, $summary['average_km_per_trip'], 0.01);
        $this->assertEqualsWithDelta(14.5, $summary['cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(2.0, $summary['revenue_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(1.61, $summary['cost_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(0.39, $summary['profit_per_ton_km'], 0.01);
        $this->assertEqualsWithDelta(3000.0, $summary['revenue_per_trip'], 0.01);
        $this->assertEqualsWithDelta(2416.67, $summary['cost_per_trip'], 0.01);
        $this->assertEqualsWithDelta(15.0, $summary['tonnage_per_trip'], 0.01);
        $this->assertEqualsWithDelta(20.59, $summary['empty_distance_ratio_percent'], 0.01);
        $this->assertEqualsWithDelta(9.71, $summary['internal_fuel_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(18.75, $summary['outsource_cost_per_km'], 0.01);
        $this->assertEqualsWithDelta(33.33, $summary['outsource_trip_share_percent'], 0.01);
        $this->assertEqualsWithDelta(44.44, $summary['outsource_tonnage_share_percent'], 0.01);

        $this->assertNotEmpty($result['customer_highlights']);
        $topCustomer = $result['customer_highlights'][0];
        $this->assertSame($customer->id, $topCustomer['customer_id']);
        $this->assertEqualsWithDelta(45.0, $topCustomer['tonnage'], 0.01);
        $this->assertEqualsWithDelta(9000.0, $topCustomer['revenue'], 0.01);
        $this->assertEqualsWithDelta(7250.0, $topCustomer['cost'], 0.01);
        $this->assertEqualsWithDelta(1750.0, $topCustomer['profit'], 0.01);
        $this->assertEqualsWithDelta(19.44, $topCustomer['margin_percent'], 0.01);

        $expectedPeriod = now()->format('Y-m');
        $period = collect($result['mix_trend'])->firstWhere('period', $expectedPeriod);
        $this->assertNotNull($period);
        $this->assertSame(2, $period['internal_trips']);
        $this->assertSame(1, $period['outsource_trips']);
        $this->assertSame(3, $period['total_trips']);
        $this->assertEqualsWithDelta(25.0, $period['internal_tonnage'], 0.01);
        $this->assertEqualsWithDelta(20.0, $period['outsource_tonnage'], 0.01);
    }
}

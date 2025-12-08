<?php

namespace Tests\Feature\Reports;

use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Place;
use App\Services\Reports\OutsourcePerformanceReport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutsourcePerformanceReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_dispatch_rows_for_outsource_report(): void
    {
        Carbon::setTestNow('2024-09-01 12:00:00');

        $report = app(OutsourcePerformanceReport::class);

        $vendor = Outsource::factory()->create(['name' => 'Vendor A', 'status' => 'active']);
        $operation = Operation::factory()->create(['tariff' => 12.5]);
        $origin = Place::factory()->create(['name' => 'Origin Hub']);
        $destination = Place::factory()->create(['name' => 'Destination Hub']);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendor->id,
            'operation_id' => $operation->id,
            'from_place_id' => $origin->id,
            'to_place_id' => $destination->id,
            'trip_number' => 'OUT-001',
            'dispatch_date' => now()->subDays(5),
            'distance_km' => 200,
            'cargo_volume_mt' => 20,
            'tonkm' => 4000,
            'cost' => 5000,
            'status' => 'completed',
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
        ]);

        $this->assertSame('2024-08-01', $result['resolved_from']);
        $this->assertSame('2024-09-01', $result['resolved_to']);

        $filters = $result['filters'];
        $this->assertSame([], $filters['outsource_ids']);
        $this->assertSame([], $filters['operation_ids']);
        $this->assertSame([], $filters['destination_ids']);
        $this->assertSame([], $filters['statuses']);
        $this->assertSame(200, $filters['limit']);

        $rows = collect($result['rows']);
        $this->assertCount(1, $rows);

        $row = $rows->first();
        $this->assertSame('Vendor A', $row['driver_name']);
        $this->assertSame('active', $row['truck_plate']);
        $this->assertSame('OUT-001', $row['fo_number']);
        $this->assertSame('Origin Hub', $row['origin_name']);
        $this->assertSame('Destination Hub', $row['destination_name']);
        $this->assertEqualsWithDelta(200.0, $row['distance_total'], 0.01);
        $this->assertEqualsWithDelta(4000.0, $row['ton_km'], 0.01);
        $this->assertEqualsWithDelta(5000.0, $row['expense'], 0.01);
        $this->assertEqualsWithDelta(50000.0, $row['revenue'], 0.01);
        $this->assertEqualsWithDelta(45000.0, $row['profit'], 0.01);
        $this->assertEqualsWithDelta(90.0, $row['margin_percent'], 0.01);

        $summary = $result['summary'];
        $this->assertEquals(1, $summary['records']);
        $this->assertEqualsWithDelta(20.0, $summary['tonnage'], 0.01);
        $this->assertEqualsWithDelta(200.0, $summary['distance_total'], 0.01);
        $this->assertEqualsWithDelta(5000.0, $summary['expense'], 0.01);
        $this->assertEqualsWithDelta(50000.0, $summary['revenue'], 0.01);
        $this->assertEqualsWithDelta(45000.0, $summary['profit'], 0.01);
        $this->assertEqualsWithDelta(90.0, $summary['margin_percent'], 0.01);

        $highlights = $result['highlights'];
        $this->assertSame('Vendor A', $highlights['top_vendors'][0]['label']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_selected_vendors(): void
    {
        Carbon::setTestNow('2024-09-01 12:00:00');

        $report = app(OutsourcePerformanceReport::class);

        $vendorA = Outsource::factory()->create();
        $vendorB = Outsource::factory()->create();
        $operation = Operation::factory()->create(['tariff' => 10]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorA->id,
            'operation_id' => $operation->id,
            'dispatch_date' => now()->subDays(5),
            'distance_km' => 150,
            'tonkm' => 1500,
            'cost' => 2000,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendorB->id,
            'operation_id' => $operation->id,
            'dispatch_date' => now()->subDays(4),
            'distance_km' => 180,
            'tonkm' => 1800,
            'cost' => 2600,
            'status' => 'completed',
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'outsource_ids' => [$vendorB->id],
        ]);

        $this->assertSame([$vendorB->id], $result['filters']['outsource_ids']);
        $this->assertCount(1, $result['rows']);
        $this->assertSame($vendorB->id, $result['rows'][0]['outsource_id']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_status(): void
    {
        Carbon::setTestNow('2024-09-01 12:00:00');

        $report = app(OutsourcePerformanceReport::class);

        $operation = Operation::factory()->create(['tariff' => 8]);
        $vendor = Outsource::factory()->create();

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendor->id,
            'operation_id' => $operation->id,
            'dispatch_date' => now()->subDays(2),
            'distance_km' => 100,
            'tonkm' => 800,
            'cost' => 1500,
            'status' => 'completed',
        ]);

        OutsourcePerformance::factory()->create([
            'outsource_id' => $vendor->id,
            'operation_id' => $operation->id,
            'dispatch_date' => now()->subDays(3),
            'distance_km' => 120,
            'tonkm' => 900,
            'cost' => 1700,
            'status' => 'cancelled',
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->toDateString(),
            'to' => now()->toDateString(),
            'statuses' => ['completed'],
        ]);

        $this->assertSame(['completed'], $result['filters']['statuses']);
        $this->assertCount(1, $result['rows']);
        $this->assertSame('completed', $result['rows'][0]['driver_status']);

        Carbon::setTestNow();
    }
}

<?php

namespace Tests\Feature\Reports;

use App\Models\MaintenanceType;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use App\Services\Reports\MaintenancePerformanceReport;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MaintenancePerformanceReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_builds_maintenance_performance_report(): void
    {
        Carbon::setTestNow('2024-09-15 12:00:00');

        $report = app(MaintenancePerformanceReport::class);

        $truckA = Truck::factory()->create(['plate' => 'ABC-123', 'status' => 'active']);
        $truckB = Truck::factory()->create(['plate' => 'XYZ-789', 'status' => 'in_workshop']);

        $typeA = MaintenanceType::factory()->create(['name' => 'Engine Service', 'category' => 'powertrain']);
        $typeB = MaintenanceType::factory()->create(['name' => 'Brake Inspection', 'category' => 'safety']);

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckA->id,
            'maintenance_type_id' => $typeA->id,
            'scheduled_date' => now()->subDays(10),
            'completed_date' => now()->subDays(5),
            'status' => 'completed',
            'cost' => 1200,
            'service_provider' => 'Workshop A',
        ]);

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckA->id,
            'maintenance_type_id' => $typeA->id,
            'scheduled_date' => now()->addDays(3),
            'completed_date' => null,
            'status' => 'scheduled',
            'cost' => 800,
            'service_provider' => 'Workshop A',
        ]);

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckB->id,
            'maintenance_type_id' => $typeB->id,
            'scheduled_date' => now()->subDays(7),
            'completed_date' => null,
            'status' => 'in_progress',
            'cost' => 500,
            'service_provider' => 'Workshop B',
        ]);

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckB->id,
            'maintenance_type_id' => $typeB->id,
            'scheduled_date' => now()->subDays(4),
            'completed_date' => null,
            'status' => 'scheduled',
            'cost' => 300,
            'service_provider' => 'Workshop B',
        ]);

        VehicleMaintenanceRecord::factory()->create([
            'scheduled_date' => now()->subMonths(6),
            'completed_date' => now()->subMonths(6)->addDays(2),
            'status' => 'completed',
            'cost' => 1500,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->startOfMonth()->toDateString(),
            'to' => now()->copy()->addDays(7)->toDateString(),
        ]);

        $this->assertSame('2024-08-01', $result['resolved_from']);
        $this->assertSame('2024-09-22', $result['resolved_to']);
        $this->assertSame([], $result['truck_ids']);
        $this->assertSame([], $result['maintenance_type_ids']);
        $this->assertSame([], $result['statuses']);
        $this->assertSame([], $result['service_providers']);

        $totals = $result['totals'];
        $this->assertSame(4, $totals['records']);
        $this->assertSame(1, $totals['completed']);
        $this->assertSame(2, $totals['scheduled']);
        $this->assertSame(1, $totals['in_progress']);
        $this->assertSame(1, $totals['overdue']);
        $this->assertEqualsWithDelta(2800.0, $totals['total_cost'], 0.01);
        $this->assertEqualsWithDelta(1200.0, $totals['completed_cost'], 0.01);
        $this->assertEqualsWithDelta(1600.0, $totals['open_cost'], 0.01);
        $this->assertSame(2, $totals['truck_count']);
        $this->assertSame(2, $totals['type_count']);
        $this->assertEqualsWithDelta(5.0, $totals['average_completion_days'], 0.01);

        $summary = $result['summary'];
        $this->assertEqualsWithDelta(25.0, $summary['completion_rate_pct'], 0.01);
        $this->assertEqualsWithDelta(25.0, $summary['overdue_rate_pct'], 0.01);
        $this->assertEqualsWithDelta(700.0, $summary['average_cost_per_record'], 0.01);
        $this->assertEqualsWithDelta(1200.0, $summary['average_cost_per_completed'], 0.01);
        $this->assertEqualsWithDelta(5.0, $summary['average_completion_days'], 0.01);
        $this->assertEqualsWithDelta(100.0, $summary['share_of_cost_tracked_types_pct'], 0.01);
        $this->assertSame(1, $summary['upcoming_within_seven_days']);

        $breakdown = collect($result['breakdown'])->keyBy('truck_id');
        $this->assertCount(2, $breakdown);

        $truckABreakdown = $breakdown[$truckA->id];
        $this->assertSame('ABC-123', $truckABreakdown['plate']);
        $this->assertSame(2, $truckABreakdown['records']);
        $this->assertSame(1, $truckABreakdown['completed']);
        $this->assertSame(1, $truckABreakdown['scheduled']);
        $this->assertSame(0, $truckABreakdown['overdue']);
        $this->assertEqualsWithDelta(2000.0, $truckABreakdown['total_cost'], 0.01);
        $this->assertEqualsWithDelta(800.0, $truckABreakdown['open_cost'], 0.01);
        $this->assertEqualsWithDelta(1000.0, $truckABreakdown['average_cost'], 0.01);
        $this->assertEqualsWithDelta(5.0, $truckABreakdown['average_completion_days'], 0.01);
        $this->assertSame(now()->addDays(3)->toDateString(), $truckABreakdown['next_scheduled_at']);

        $truckBBreakdown = $breakdown[$truckB->id];
        $this->assertSame('XYZ-789', $truckBBreakdown['plate']);
        $this->assertSame(2, $truckBBreakdown['records']);
        $this->assertSame(0, $truckBBreakdown['completed']);
        $this->assertSame(1, $truckBBreakdown['scheduled']);
        $this->assertSame(1, $truckBBreakdown['overdue']);
        $this->assertEqualsWithDelta(800.0, $truckBBreakdown['total_cost'], 0.01);
        $this->assertEqualsWithDelta(800.0, $truckBBreakdown['open_cost'], 0.01);
        $this->assertEqualsWithDelta(400.0, $truckBBreakdown['average_cost'], 0.01);
        $this->assertNull($truckBBreakdown['average_completion_days']);
        $this->assertNull($truckBBreakdown['next_scheduled_at']);
        $this->assertEqualsWithDelta(4.0, $truckBBreakdown['max_overdue_days'] ?? 0.0, 0.01);

        $typeBreakdown = collect($result['type_breakdown'])->keyBy('maintenance_type_id');
        $this->assertCount(2, $typeBreakdown);
        $engineType = $typeBreakdown[$typeA->id];
        $this->assertSame('Engine Service', $engineType['name']);
        $this->assertSame(2, $engineType['records']);
        $this->assertEqualsWithDelta(2000.0, $engineType['total_cost'], 0.01);
        $this->assertEqualsWithDelta(1000.0, $engineType['average_cost'], 0.01);

        $trend = collect($result['trend'])->keyBy('period');
        $this->assertCount(1, $trend);
        $this->assertEqualsWithDelta(4.0, $trend['2024-09']['records'], 0.01);
        $this->assertEqualsWithDelta(2800.0, $trend['2024-09']['total_cost'], 0.01);
        $this->assertEqualsWithDelta(700.0, $trend['2024-09']['average_cost_per_record'], 0.01);

        $upcoming = $result['upcoming'];
        $this->assertCount(1, $upcoming);
        $this->assertSame('ABC-123', $upcoming[0]['truck']['plate']);
        $this->assertSame('Engine Service', $upcoming[0]['maintenance_type']['name']);
        $this->assertSame('Workshop A', $upcoming[0]['service_provider']);
        $this->assertEqualsWithDelta(800.0, $upcoming[0]['estimated_cost'], 0.01);

        $highlights = $result['highlights'];
        $this->assertSame($truckA->id, $highlights['highest_cost_trucks'][0]['truck_id']);
        $this->assertSame($truckB->id, $highlights['most_overdue_trucks'][0]['truck_id']);
        $this->assertSame($typeA->id, $highlights['costliest_types'][0]['maintenance_type_id']);
        $this->assertSame($upcoming[0]['id'], $highlights['upcoming'][0]['id']);

        Carbon::setTestNow();
    }

    public function test_it_filters_by_selected_trucks(): void
    {
        Carbon::setTestNow('2024-09-15 12:00:00');

        $report = app(MaintenancePerformanceReport::class);

        $truckA = Truck::factory()->create();
        $truckB = Truck::factory()->create();

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckA->id,
            'scheduled_date' => now()->subDays(2),
            'completed_date' => now()->subDay(),
            'status' => 'completed',
            'cost' => 900,
        ]);

        VehicleMaintenanceRecord::factory()->create([
            'truck_id' => $truckB->id,
            'scheduled_date' => now()->subDays(3),
            'status' => 'scheduled',
            'cost' => 500,
        ]);

        $result = $report->build([
            'from' => now()->subMonth()->startOfMonth()->toDateString(),
            'to' => now()->toDateString(),
            'truck_ids' => [$truckB->id],
        ]);

        $this->assertSame([$truckB->id], $result['truck_ids']);
        $this->assertCount(1, $result['breakdown']);
        $this->assertSame($truckB->id, $result['breakdown'][0]['truck_id']);

        Carbon::setTestNow();
    }
}

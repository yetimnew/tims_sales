<?php

namespace Tests\Unit;

use App\Models\Driver;
use App\Models\DriverGradingSetting;
use App\Models\DriverPerformanceRecord;
use App\Models\DriverSafetyRecord;
use App\Models\DriverTruck;
use App\Models\FuelRecord;
use App\Models\Truck;
use App\Models\User;
use App\Services\DriverGradeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DriverGradeServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_calculates_a_driver_grade_from_metrics(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-15 12:00:00'));

        DriverGradingSetting::query()->create([
            'performance_weight' => 35,
            'efficiency_weight' => 20,
            'safety_weight' => 25,
            'compliance_weight' => 10,
            'engagement_weight' => 10,
            'peer_sample_size' => 1,
        ]);

        $targetTruck = Truck::factory()->create();
        $peerTruck = Truck::factory()->create();

        $targetDriver = Driver::factory()->create([
            'status' => 'active',
            'hireddate' => Carbon::now()->subYears(3),
        ]);

        $peerDriver = Driver::factory()->create([
            'status' => 'active',
            'hireddate' => Carbon::now()->subYear(),
        ]);

        $targetAssignment = DriverTruck::factory()
            ->for($targetDriver, 'driver')
            ->for($targetTruck, 'truck')
            ->state([
                'driverid' => $targetDriver->driverid,
                'plate' => $targetTruck->plate,
                'date_recived' => Carbon::now()->subMonths(6),
                'date_detach' => null,
                'is_attached' => true,
                'status' => 'active',
            ])
            ->create();

        DriverTruck::factory()
            ->for($peerDriver, 'driver')
            ->for($peerTruck, 'truck')
            ->state([
                'driverid' => $peerDriver->driverid,
                'plate' => $peerTruck->plate,
                'date_recived' => Carbon::now()->subMonths(4),
                'date_detach' => Carbon::now()->subMonth(),
                'is_attached' => false,
                'status' => 'inactive',
            ])
            ->create();

        DriverPerformanceRecord::factory()
            ->for($targetDriver, 'driver')
            ->for($targetTruck, 'truck')
            ->create([
                'record_date' => Carbon::now()->subMonths(2),
                'total_trips' => 60,
                'total_distance_km' => 6000,
                'total_cargo_tonnage' => 320,
                'fuel_efficiency' => 7.5,
                'safety_violations' => 0,
                'accidents' => 0,
                'customer_rating' => 4.9,
                'period_type' => 'monthly',
            ]);

        DriverPerformanceRecord::factory()
            ->for($targetDriver, 'driver')
            ->for($targetTruck, 'truck')
            ->create([
                'record_date' => Carbon::now()->subMonth(),
                'total_trips' => 55,
                'total_distance_km' => 5400,
                'total_cargo_tonnage' => 300,
                'fuel_efficiency' => 7.8,
                'safety_violations' => 0,
                'accidents' => 0,
                'customer_rating' => 4.8,
                'period_type' => 'monthly',
            ]);

        DriverPerformanceRecord::factory()
            ->for($peerDriver, 'driver')
            ->for($peerTruck, 'truck')
            ->create([
                'record_date' => Carbon::now()->subMonths(2),
                'total_trips' => 18,
                'total_distance_km' => 1800,
                'total_cargo_tonnage' => 90,
                'fuel_efficiency' => 4.1,
                'safety_violations' => 3,
                'accidents' => 1,
                'customer_rating' => 3.2,
                'period_type' => 'monthly',
            ]);

        DriverPerformanceRecord::factory()
            ->for($peerDriver, 'driver')
            ->for($peerTruck, 'truck')
            ->create([
                'record_date' => Carbon::now()->subMonth(),
                'total_trips' => 15,
                'total_distance_km' => 1500,
                'total_cargo_tonnage' => 80,
                'fuel_efficiency' => 4.5,
                'safety_violations' => 2,
                'accidents' => 0,
                'customer_rating' => 3.0,
                'period_type' => 'monthly',
            ]);

        DriverSafetyRecord::factory()
            ->for($peerDriver, 'driver')
            ->for(User::factory(), 'reportedBy')
            ->create([
                'incident_date' => Carbon::now()->subWeeks(6),
                'incident_type' => 'accident',
                'severity' => 'critical',
                'damage_cost' => 15000,
            ]);

        DriverSafetyRecord::factory()
            ->for($peerDriver, 'driver')
            ->for(User::factory(), 'reportedBy')
            ->create([
                'incident_date' => Carbon::now()->subWeeks(4),
                'incident_type' => 'violation',
                'severity' => 'high',
                'damage_cost' => 3000,
            ]);

        FuelRecord::factory()
            ->for($targetDriver, 'driver')
            ->for($targetTruck, 'truck')
            ->state([
                'driver_truck_id' => $targetAssignment->id,
                'fuel_date' => Carbon::now()->subWeeks(3),
                'fuel_quantity_liters' => 2400,
                'fuel_price_per_liter' => 50,
                'total_cost' => 12000,
                'user_id' => User::factory(),
            ])
            ->create();

        FuelRecord::factory()
            ->for($peerDriver, 'driver')
            ->for($peerTruck, 'truck')
            ->state([
                'fuel_date' => Carbon::now()->subWeeks(2),
                'fuel_quantity_liters' => 1800,
                'fuel_price_per_liter' => 60,
                'total_cost' => 16000,
                'user_id' => User::factory(),
            ])
            ->create();

        $service = app(DriverGradeService::class);

        $report = $service->grade($targetDriver);
        $peerReport = $service->grade($peerDriver);

        $collectionReports = $service->gradeMany(collect([$targetDriver, $peerDriver]));

        Carbon::setTestNow();

        $this->assertSame('A', $report['overall']['letter']);
        $this->assertGreaterThanOrEqual(95.0, $report['overall']['score']);

        $this->assertGreaterThanOrEqual(95.0, $report['categories']['performance']['score']);
        $this->assertGreaterThanOrEqual(88.0, $report['categories']['efficiency']['score']);
        $this->assertGreaterThanOrEqual(90.0, $report['categories']['safety']['score']);
        $this->assertGreaterThanOrEqual(95.0, $report['categories']['compliance']['score']);
        $this->assertGreaterThanOrEqual(90.0, $report['categories']['engagement']['score']);

        $this->assertSame([
            'performance_weight' => 35,
            'efficiency_weight' => 20,
            'safety_weight' => 25,
            'compliance_weight' => 10,
            'engagement_weight' => 10,
        ], $report['weights']);

        $this->assertSame(2, $collectionReports->count());
        $this->assertEquals($report, $collectionReports->get($targetDriver->id));
        $this->assertEquals($peerReport, $collectionReports->get($peerDriver->id));
    }
}

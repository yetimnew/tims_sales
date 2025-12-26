<?php

namespace Tests\Unit\Services;

use App\Models\DailyTruckStatus;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\VehicleType;
use App\Services\TruckMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TruckMetricsServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_calculates_metrics_without_filters(): void
    {
        $vehicleType = VehicleType::factory()->create();

        Truck::factory()
            ->count(3)
            ->for($vehicleType, 'vehicleType')
            ->state([
                'status' => 'active',
                'purchasePrice' => 1_000_000,
            ])
            ->create();

        Truck::factory()
            ->count(2)
            ->for($vehicleType, 'vehicleType')
            ->state([
                'status' => 'inactive',
                'purchasePrice' => 2_000_000,
            ])
            ->create();

        Truck::factory()
            ->for($vehicleType, 'vehicleType')
            ->create([
                'status' => 'inactive',
                'purchasePrice' => 500_000,
            ]);

        $service = new TruckMetricsService;

        $metrics = $service->metrics(null, null);

        $this->assertSame(6, $metrics['total']);
        $this->assertSame(3, $metrics['active']);
        $this->assertSame(3, $metrics['inactive']);
        $this->assertEqualsWithDelta(7_500_000.0, $metrics['fleet_value'], 0.01);

        $utilization = $metrics['utilization'];

        $this->assertSame(30, $utilization['window_days']);
        $this->assertSame(90, $utilization['service_days']);
        $this->assertSame(90, $utilization['idle_days']);
        $this->assertSame(0, $utilization['unknown_days']);
        $this->assertSame(180, $utilization['total_days']);
        $this->assertEqualsWithDelta(0.5, $utilization['utilization_rate'], 0.0001);
        $this->assertEqualsWithDelta(0.5, $utilization['idle_rate'], 0.0001);

        $financial = $metrics['financial'];

        $this->assertSame(30, $financial['window_days']);
        $this->assertEqualsWithDelta(0.0, $financial['total_revenue'], 0.01);
        $this->assertEqualsWithDelta(0.0, $financial['total_cost'], 0.01);
        $this->assertEqualsWithDelta(0.0, $financial['total_profit'], 0.01);
        $this->assertEqualsWithDelta(0.0, $financial['avg_revenue_per_truck'], 0.01);
        $this->assertEqualsWithDelta(0.0, $financial['ton_km'], 0.01);
        $this->assertNull($financial['ton_km_per_birr']);

        $staffing = $metrics['staffing'];

        $this->assertSame(180, $staffing['window_days']);
        $this->assertNull($staffing['average_tenure_days']);
        $this->assertSame(0, $staffing['assignment_count']);
        $this->assertSame(0, $staffing['truck_count_with_assignments']);
        $this->assertSame(45, $staffing['short_tenure_threshold_days']);
        $this->assertSame(0, $staffing['high_churn_truck_count']);
        $this->assertSame([], $staffing['high_churn_trucks']);
        $this->assertSame([], $staffing['flagged_truck_ids']);
    }

    public function test_it_applies_search_filter_to_metrics(): void
    {
        $vehicleType = VehicleType::factory()->create();

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'plate' => 'AB123CD',
            'status' => 'active',
            'purchasePrice' => 100_000,
        ]);

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'plate' => 'XY987ZT',
            'status' => 'inactive',
            'purchasePrice' => 200_000,
        ]);

        $service = new TruckMetricsService;

        $metrics = $service->metrics('AB', null);

        $this->assertSame(1, $metrics['total']);
        $this->assertSame(1, $metrics['active']);
        $this->assertSame(0, $metrics['inactive']);
        $this->assertEqualsWithDelta(100_000.0, $metrics['fleet_value'], 0.01);

        $utilization = $metrics['utilization'];

        $this->assertSame(30, $utilization['window_days']);
        $this->assertSame(30, $utilization['service_days']);
        $this->assertSame(0, $utilization['idle_days']);
        $this->assertSame(0, $utilization['unknown_days']);
        $this->assertSame(30, $utilization['total_days']);
        $this->assertEqualsWithDelta(1.0, $utilization['utilization_rate'], 0.0001);
        $this->assertEqualsWithDelta(0.0, $utilization['idle_rate'], 0.0001);

        $financial = $metrics['financial'];

        $this->assertSame(30, $financial['window_days']);
        $this->assertEqualsWithDelta(0.0, $financial['total_revenue'], 0.01);
        $this->assertNull($financial['ton_km_per_birr']);

        $staffing = $metrics['staffing'];

        $this->assertSame(180, $staffing['window_days']);
        $this->assertSame(0, $staffing['assignment_count']);
    }

    public function test_it_applies_vehicle_type_filter_to_metrics(): void
    {
        $typeA = VehicleType::factory()->create();
        $typeB = VehicleType::factory()->create();

        Truck::factory()->for($typeA, 'vehicleType')->create([
            'status' => 'active',
            'purchasePrice' => 300_000,
        ]);

        Truck::factory()->for($typeB, 'vehicleType')->create([
            'status' => 'inactive',
            'purchasePrice' => 400_000,
        ]);

        $service = new TruckMetricsService;

        $metricsForTypeA = $service->metrics(null, $typeA->id);
        $metricsForTypeB = $service->metrics(null, $typeB->id);

        $this->assertSame(1, $metricsForTypeA['total']);
        $this->assertSame(1, $metricsForTypeA['active']);
        $this->assertSame(0, $metricsForTypeA['inactive']);
        $this->assertEqualsWithDelta(300_000.0, $metricsForTypeA['fleet_value'], 0.01);

        $utilizationTypeA = $metricsForTypeA['utilization'];

        $this->assertSame(30, $utilizationTypeA['window_days']);
        $this->assertSame(30, $utilizationTypeA['service_days']);
        $this->assertSame(0, $utilizationTypeA['idle_days']);
        $this->assertSame(0, $utilizationTypeA['unknown_days']);
        $this->assertSame(30, $utilizationTypeA['total_days']);
        $this->assertEqualsWithDelta(1.0, $utilizationTypeA['utilization_rate'], 0.0001);
        $this->assertEqualsWithDelta(0.0, $utilizationTypeA['idle_rate'], 0.0001);

        $this->assertSame(1, $metricsForTypeB['total']);
        $this->assertSame(0, $metricsForTypeB['active']);
        $this->assertSame(1, $metricsForTypeB['inactive']);
        $this->assertEqualsWithDelta(400_000.0, $metricsForTypeB['fleet_value'], 0.01);

        $utilizationTypeB = $metricsForTypeB['utilization'];

        $this->assertSame(30, $utilizationTypeB['window_days']);
        $this->assertSame(0, $utilizationTypeB['service_days']);
        $this->assertSame(30, $utilizationTypeB['idle_days']);
        $this->assertSame(0, $utilizationTypeB['unknown_days']);
        $this->assertSame(30, $utilizationTypeB['total_days']);
        $this->assertEqualsWithDelta(0.0, $utilizationTypeB['utilization_rate'], 0.0001);
        $this->assertEqualsWithDelta(1.0, $utilizationTypeB['idle_rate'], 0.0001);
    }

    public function test_it_applies_status_filter_to_metrics(): void
    {
        $vehicleType = VehicleType::factory()->create();

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'status' => 'active',
            'purchasePrice' => 250_000,
        ]);

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'status' => 'inactive',
            'purchasePrice' => 125_000,
        ]);

        $service = new TruckMetricsService;

        $metrics = $service->metrics(null, null, 'Maintenance');

        $this->assertSame(1, $metrics['total']);
        $this->assertSame(0, $metrics['active']);
        $this->assertSame(1, $metrics['inactive']);
        $this->assertEqualsWithDelta(125_000.0, $metrics['fleet_value'], 0.01);

        $utilization = $metrics['utilization'];

        $this->assertSame(30, $utilization['window_days']);
        $this->assertSame(0, $utilization['service_days']);
        $this->assertSame(30, $utilization['idle_days']);
        $this->assertSame(0, $utilization['unknown_days']);
        $this->assertSame(30, $utilization['total_days']);
        $this->assertEqualsWithDelta(0.0, $utilization['utilization_rate'], 0.0001);
        $this->assertEqualsWithDelta(1.0, $utilization['idle_rate'], 0.0001);
    }

    public function test_it_calculates_utilization_using_daily_status_records(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 12, 3));

        try {
            $vehicleType = VehicleType::factory()->create();

            $statusType = StatusType::query()->create([
                'name' => 'Operational',
                'description' => 'Operational statuses',
            ]);

            $activeStatus = Status::query()->create([
                'statustype_id' => $statusType->id,
                'name' => 'Active',
                'description' => 'Active status',
            ]);

            $maintenanceStatus = Status::query()->create([
                'statustype_id' => $statusType->id,
                'name' => 'Maintenance',
                'description' => 'Maintenance status',
            ]);

            $activeTruck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'active',
            ]);

            $maintenanceTruck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'inactive',
            ]);

            $serviceDates = [
                Carbon::today(),
                Carbon::today()->subDay(),
                Carbon::today()->subDays(2),
            ];

            foreach ($serviceDates as $date) {
                DailyTruckStatus::query()->create([
                    'truck_id' => $activeTruck->id,
                    'status_id' => $activeStatus->id,
                    'status_date' => $date,
                ]);
            }

            $idleDates = [
                Carbon::today(),
                Carbon::today()->subDay(),
            ];

            foreach ($idleDates as $date) {
                DailyTruckStatus::query()->create([
                    'truck_id' => $maintenanceTruck->id,
                    'status_id' => $maintenanceStatus->id,
                    'status_date' => $date,
                ]);
            }

            $metrics = (new TruckMetricsService)->metrics(null, null);
            $utilization = $metrics['utilization'];

            $this->assertSame(30, $utilization['window_days']);
            $this->assertSame(3, $utilization['service_days']);
            $this->assertSame(2, $utilization['idle_days']);
            $this->assertSame(55, $utilization['unknown_days']);
            $this->assertSame(5, $utilization['total_days']);
            $this->assertEqualsWithDelta(0.6, $utilization['utilization_rate'], 0.0001);
            $this->assertEqualsWithDelta(0.4, $utilization['idle_rate'], 0.0001);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_it_calculates_financial_metrics_for_filtered_trucks(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 12, 3));

        try {
            $vehicleType = VehicleType::factory()->create();

            $truck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'active',
            ]);

            $driverTruck = DriverTruck::factory()->for($truck, 'truck')->create();

            Performance::factory()
                ->for($driverTruck, 'driverTruck')
                ->state([
                    'DateDispach' => Carbon::today()->subDays(5),
                    'tonkm' => 1_200,
                ])
                ->create();

            TruckFinancialRecord::factory()
                ->for($truck, 'truck')
                ->state([
                    'record_date' => Carbon::today()->subDays(5),
                    'revenue' => 6_000,
                    'fuel_cost' => 2_000,
                    'maintenance_cost' => 500,
                    'driver_salary' => 700,
                    'insurance_cost' => 300,
                    'depreciation' => 400,
                    'other_costs' => 100,
                    'net_profit' => 2_500,
                    'period_type' => 'daily',
                ])
                ->create();

            $service = new TruckMetricsService;

            $metrics = $service->metrics(null, null);

            $financial = $metrics['financial'];

            $this->assertSame(30, $financial['window_days']);
            $this->assertEqualsWithDelta(6_000.0, $financial['total_revenue'], 0.01);
            $this->assertEqualsWithDelta(4_000.0, $financial['total_cost'], 0.01);
            $this->assertEqualsWithDelta(2_500.0, $financial['total_profit'], 0.01);
            $this->assertEqualsWithDelta(6_000.0, $financial['avg_revenue_per_truck'], 0.01);
            $this->assertEqualsWithDelta(1_200.0, $financial['ton_km'], 0.01);
            $this->assertEqualsWithDelta(0.2, $financial['ton_km_per_birr'], 0.0001);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_it_calculates_staffing_metrics_for_filtered_trucks(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 12, 3));

        try {
            $vehicleType = VehicleType::factory()->create();

            $unstableTruck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'active',
                'plate' => 'CHURN-01',
            ]);

            $stableTruck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'active',
                'plate' => 'STABLE-01',
            ]);

            DriverTruck::factory()
                ->for($unstableTruck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(20),
                    'assigned_date' => Carbon::today()->subDays(20),
                    'date_detach' => Carbon::today()->subDays(10),
                    'unassigned_date' => Carbon::today()->subDays(10),
                    'is_attached' => false,
                    'status' => 'detached',
                ])
                ->create();

            DriverTruck::factory()
                ->for($unstableTruck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(9),
                    'assigned_date' => Carbon::today()->subDays(9),
                    'date_detach' => Carbon::today()->subDays(1),
                    'unassigned_date' => Carbon::today()->subDays(1),
                    'is_attached' => false,
                    'status' => 'detached',
                ])
                ->create();

            DriverTruck::factory()
                ->for($unstableTruck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(3),
                    'assigned_date' => Carbon::today()->subDays(3),
                    'date_detach' => null,
                    'unassigned_date' => null,
                    'is_attached' => true,
                    'status' => 'active',
                ])
                ->create();

            DriverTruck::factory()
                ->for($stableTruck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(120),
                    'assigned_date' => Carbon::today()->subDays(120),
                    'date_detach' => Carbon::today()->subDays(60),
                    'unassigned_date' => Carbon::today()->subDays(60),
                    'is_attached' => false,
                    'status' => 'detached',
                ])
                ->create();

            DriverTruck::factory()
                ->for($stableTruck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(59),
                    'assigned_date' => Carbon::today()->subDays(59),
                    'date_detach' => null,
                    'unassigned_date' => null,
                    'is_attached' => true,
                    'status' => 'active',
                ])
                ->create();

            $service = new TruckMetricsService;

            $metrics = $service->metrics(null, null);

            $staffing = $metrics['staffing'];

            $this->assertSame(180, $staffing['window_days']);
            $this->assertSame(5, $staffing['assignment_count']);
            $this->assertSame(2, $staffing['truck_count_with_assignments']);
            $this->assertEqualsWithDelta(29.0, $staffing['average_tenure_days'], 0.2);
            $this->assertSame(1, $staffing['high_churn_truck_count']);
            $this->assertContains($unstableTruck->id, $staffing['flagged_truck_ids']);
            $this->assertNotEmpty($staffing['high_churn_trucks']);
            $this->assertSame($unstableTruck->id, $staffing['high_churn_trucks'][0]['truck_id']);
            $this->assertEqualsWithDelta(8.0, $staffing['high_churn_trucks'][0]['average_tenure_days'], 0.2);
        } finally {
            Carbon::setTestNow();
        }
    }

    public function test_it_calculates_staffing_snapshot_for_single_truck(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 12, 3));

        try {
            $vehicleType = VehicleType::factory()->create();

            $truck = Truck::factory()->for($vehicleType, 'vehicleType')->create([
                'status' => 'active',
                'plate' => 'RISK-01',
            ]);

            DriverTruck::factory()
                ->for($truck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(15),
                    'assigned_date' => Carbon::today()->subDays(15),
                    'date_detach' => Carbon::today()->subDays(5),
                    'unassigned_date' => Carbon::today()->subDays(5),
                    'is_attached' => false,
                    'status' => 'detached',
                ])
                ->create();

            DriverTruck::factory()
                ->for($truck, 'truck')
                ->state([
                    'date_recived' => Carbon::today()->subDays(4),
                    'assigned_date' => Carbon::today()->subDays(4),
                    'date_detach' => null,
                    'unassigned_date' => null,
                    'is_attached' => true,
                    'status' => 'active',
                ])
                ->create();

            $service = new TruckMetricsService;

            $snapshot = $service->staffingForTruck($truck);

            $this->assertSame(180, $snapshot['window_days']);
            $this->assertSame(2, $snapshot['assignment_count']);
            $this->assertSame(1, $snapshot['truck_count_with_assignments']);
            $this->assertSame([$truck->id], $snapshot['flagged_truck_ids']);
            $this->assertSame(1, $snapshot['high_churn_truck_count']);
            $this->assertNotEmpty($snapshot['high_churn_trucks']);
            $this->assertEqualsWithDelta(8.0, $snapshot['average_tenure_days'], 0.2);
            $this->assertEqualsWithDelta(8.0, $snapshot['high_churn_trucks'][0]['average_tenure_days'], 0.2);
        } finally {
            Carbon::setTestNow();
        }
    }
}

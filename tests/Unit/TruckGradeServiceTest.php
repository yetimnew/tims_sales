<?php

namespace Tests\Unit;

use App\Models\DailyTruckStatus;
use App\Models\DriverTruck;
use App\Models\MaintenanceType;
use App\Models\Performance;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\TruckGradingSetting;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Services\TruckGradeService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class TruckGradeServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_calculates_a_truck_grade_from_metrics(): void
    {
        Carbon::setTestNow(Carbon::parse('2025-01-15 12:00:00'));

        TruckGradingSetting::query()->create([
            'utilization_weight' => 25,
            'efficiency_weight' => 25,
            'reliability_weight' => 30,
            'financial_weight' => 15,
            'compliance_weight' => 5,
            'peer_sample_size' => 1,
        ]);

        $vehicleType = VehicleType::factory()->create();
        $user = User::factory()->create();
        $maintenanceType = MaintenanceType::factory()->create();

        $statusType = StatusType::query()->create([
            'name' => 'Operational',
            'description' => 'Truck lifecycle statuses',
        ]);

        $activeStatus = Status::query()->create([
            'statustype_id' => $statusType->id,
            'name' => 'active',
            'description' => 'Operational',
        ]);

        $maintenanceStatus = Status::query()->create([
            'statustype_id' => $statusType->id,
            'name' => 'maintenance',
            'description' => 'Under maintenance',
        ]);

        $inactiveStatus = Status::query()->create([
            'statustype_id' => $statusType->id,
            'name' => 'inactive',
            'description' => 'Temporarily inactive',
        ]);

        $targetTruck = Truck::factory()
            ->for($vehicleType, 'vehicleType')
            ->create([
                'purchasePrice' => 1_200_000,
                'productionDate' => Carbon::now()->subYears(4),
                'serviceStartDate' => Carbon::now()->subYears(2),
                'status' => 'active',
            ]);

        $peerTruck = Truck::factory()
            ->for($vehicleType, 'vehicleType')
            ->create([
                'purchasePrice' => 950_000,
                'productionDate' => Carbon::now()->subYears(3),
                'serviceStartDate' => Carbon::now()->subYears(2),
                'status' => 'active',
            ]);

        $targetAssignment = DriverTruck::factory()
            ->for($targetTruck, 'truck')
            ->create([
                'plate' => $targetTruck->plate,
            ]);

        $peerAssignment = DriverTruck::factory()
            ->for($peerTruck, 'truck')
            ->create([
                'plate' => $peerTruck->plate,
            ]);

        Performance::factory()
            ->for($targetAssignment, 'driverTruck')
            ->create([
                'DistanceWCargo' => 900,
                'DistanceWOCargo' => 100,
                'fuelInLitter' => 100,
                'fuelInBirr' => 5000,
            ]);

        Performance::factory()
            ->for($peerAssignment, 'driverTruck')
            ->create([
                'DistanceWCargo' => 400,
                'DistanceWOCargo' => 100,
                'fuelInLitter' => 100,
                'fuelInBirr' => 8000,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($targetTruck, 'truck')
            ->create([
                'status' => 'completed',
                'scheduled_date' => Carbon::now()->subMonths(3),
                'completed_date' => Carbon::now()->subMonths(2),
                'cost' => 1000,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($targetTruck, 'truck')
            ->create([
                'status' => 'completed',
                'scheduled_date' => Carbon::now()->subMonths(5),
                'completed_date' => Carbon::now()->subMonths(4),
                'cost' => 500,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($targetTruck, 'truck')
            ->create([
                'status' => 'scheduled',
                'scheduled_date' => Carbon::now()->addMonth(),
                'completed_date' => null,
                'cost' => 0,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($peerTruck, 'truck')
            ->create([
                'status' => 'completed',
                'scheduled_date' => Carbon::now()->subMonths(6),
                'completed_date' => Carbon::now()->subMonths(5),
                'cost' => 6000,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($peerTruck, 'truck')
            ->create([
                'status' => 'scheduled',
                'scheduled_date' => Carbon::now()->subDays(20),
                'completed_date' => null,
                'cost' => 0,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        VehicleMaintenanceRecord::factory()
            ->for($peerTruck, 'truck')
            ->create([
                'status' => 'scheduled',
                'scheduled_date' => Carbon::now()->subDays(10),
                'completed_date' => null,
                'cost' => 0,
                'maintenance_type_id' => $maintenanceType->id,
            ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $targetTruck->id,
            'status_id' => $activeStatus->id,
            'status_date' => Carbon::now()->subDays(5),
            'changed_by' => $user->id,
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $targetTruck->id,
            'status_id' => $maintenanceStatus->id,
            'status_date' => Carbon::now()->subDays(2),
            'changed_by' => $user->id,
        ]);

        foreach (range(1, 3) as $offset) {
            DailyTruckStatus::query()->create([
                'truck_id' => $peerTruck->id,
                'status_id' => $inactiveStatus->id,
                'status_date' => Carbon::now()->subDays($offset * 7),
                'changed_by' => $user->id,
            ]);
        }

        DailyTruckStatus::query()->create([
            'truck_id' => $peerTruck->id,
            'status_id' => $maintenanceStatus->id,
            'status_date' => Carbon::now()->subDays(3),
            'changed_by' => $user->id,
        ]);

        $service = app(TruckGradeService::class);

        $report = $service->grade($targetTruck);
        $peerReport = $service->grade($peerTruck);

        $collectionReports = $service->gradeMany(collect([$targetTruck, $peerTruck]));

        Carbon::setTestNow();

        $this->assertSame('A', $report['overall']['letter']);
        $this->assertSame(100.0, $report['overall']['score']);
        $this->assertSame(100.0, $report['categories']['utilization']['score']);
        $this->assertSame(100.0, $report['categories']['efficiency']['score']);
        $this->assertSame(100.0, $report['categories']['reliability']['score']);
        $this->assertSame(100.0, $report['categories']['financial']['score']);
        $this->assertSame(100.0, $report['categories']['compliance']['score']);

        $this->assertSame([
            'utilization_weight' => 25,
            'efficiency_weight' => 25,
            'reliability_weight' => 30,
            'financial_weight' => 15,
            'compliance_weight' => 5,
        ], $report['weights']);

        $this->assertEquals(
            array_map(static fn ($value) => (float) $value, TruckGradingSetting::defaultGradeThresholds()),
            $report['grade_thresholds'],
        );

        $this->assertSame(2, $collectionReports->count());
        $this->assertEquals($report, $collectionReports->get($targetTruck->id));
        $this->assertEquals($peerReport, $collectionReports->get($peerTruck->id));
    }
}

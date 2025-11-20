<?php

namespace Tests\Unit\Services;

use App\Models\Truck;
use App\Models\VehicleType;
use App\Services\TruckMetricsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
                'status' => 'maintenance',
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
        $this->assertSame(2, $metrics['maintenance']);
        $this->assertEqualsWithDelta(7_500_000.0, $metrics['fleet_value'], 0.01);
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
            'status' => 'maintenance',
            'purchasePrice' => 200_000,
        ]);

        $service = new TruckMetricsService;

        $metrics = $service->metrics('AB', null);

        $this->assertSame(1, $metrics['total']);
        $this->assertSame(1, $metrics['active']);
        $this->assertSame(0, $metrics['maintenance']);
        $this->assertEqualsWithDelta(100_000.0, $metrics['fleet_value'], 0.01);
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
            'status' => 'maintenance',
            'purchasePrice' => 400_000,
        ]);

        $service = new TruckMetricsService;

        $metricsForTypeA = $service->metrics(null, $typeA->id);
        $metricsForTypeB = $service->metrics(null, $typeB->id);

        $this->assertSame(1, $metricsForTypeA['total']);
        $this->assertSame(1, $metricsForTypeA['active']);
        $this->assertSame(0, $metricsForTypeA['maintenance']);
        $this->assertEqualsWithDelta(300_000.0, $metricsForTypeA['fleet_value'], 0.01);

        $this->assertSame(1, $metricsForTypeB['total']);
        $this->assertSame(0, $metricsForTypeB['active']);
        $this->assertSame(1, $metricsForTypeB['maintenance']);
        $this->assertEqualsWithDelta(400_000.0, $metricsForTypeB['fleet_value'], 0.01);
    }

    public function test_it_applies_status_filter_to_metrics(): void
    {
        $vehicleType = VehicleType::factory()->create();

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'status' => 'active',
            'purchasePrice' => 250_000,
        ]);

        Truck::factory()->for($vehicleType, 'vehicleType')->create([
            'status' => 'maintenance',
            'purchasePrice' => 125_000,
        ]);

        $service = new TruckMetricsService;

        $metrics = $service->metrics(null, null, 'Maintenance');

        $this->assertSame(1, $metrics['total']);
        $this->assertSame(0, $metrics['active']);
        $this->assertSame(1, $metrics['maintenance']);
        $this->assertEqualsWithDelta(125_000.0, $metrics['fleet_value'], 0.01);
    }
}

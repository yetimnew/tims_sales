<?php

namespace Tests\Feature\Reports;

use App\Enums\OperationDestinationScope;
use App\Models\Customer;
use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\User;
use App\Models\Woreda;
use App\Models\Zone;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class OperationProfitabilityReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_operation_profitability_report_returns_expected_metrics(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['reports.operation-profitability.view']);

        $regionAlpha = Region::factory()->create(['name' => 'Region Alpha']);
        $regionBeta = Region::factory()->create(['name' => 'Region Beta']);

        $zoneBeta = Zone::factory()->create([
            'region_id' => $regionBeta->id,
            'name' => 'Zone Beta',
        ]);

        $woredaBeta = Woreda::factory()->create([
            'zone_id' => $zoneBeta->id,
        ]);

        $placeOrigin = Place::factory()->create([
            'woreda_id' => $woredaBeta->id,
        ]);

        $placeDestination = Place::factory()->create([
            'woreda_id' => $woredaBeta->id,
        ]);

        $customerA = Customer::factory()->create(['name' => 'Customer A']);
        $customerB = Customer::factory()->create(['name' => 'Customer B']);

        $operationRegion = Operation::factory()->create([
            'operationid' => 'OP-REGION',
            'customer_id' => $customerA->id,
            'tariff' => 1000,
            'destination_scope' => OperationDestinationScope::Region->value,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $regionAlpha->id,
        ]);

        $operationZone = Operation::factory()->create([
            'operationid' => 'OP-ZONE',
            'customer_id' => $customerB->id,
            'tariff' => 800,
            'destination_scope' => OperationDestinationScope::Zone->value,
            'destination_reference_type' => Zone::class,
            'destination_reference_id' => $zoneBeta->id,
        ]);

        $this->assertInstanceOf(Region::class, $operationRegion->fresh()->destinationReference);
        $this->assertInstanceOf(Zone::class, $operationZone->fresh()->destinationReference);

        $driverTruck = DriverTruck::factory()->create();

        $baselineDate = Carbon::parse('2025-01-15');

        Performance::factory()
            ->for($operationRegion)
            ->for($driverTruck)
            ->state([
                'DateDispach' => $baselineDate,
                'CargoVolumMT' => 5,
                'DistanceWCargo' => 100,
                'DistanceWOCargo' => 20,
                'fuelInBirr' => 200,
                'perdiem' => 50,
                'other' => 30,
                'orgion_id' => $placeOrigin->id,
                'destination_id' => $placeDestination->id,
            ])
            ->create();

        Performance::factory()
            ->for($operationRegion)
            ->for($driverTruck)
            ->state([
                'DateDispach' => $baselineDate->copy()->addDay(),
                'CargoVolumMT' => 7,
                'DistanceWCargo' => 90,
                'DistanceWOCargo' => 15,
                'fuelInBirr' => 180,
                'perdiem' => 60,
                'other' => 20,
                'orgion_id' => $placeOrigin->id,
                'destination_id' => $placeDestination->id,
            ])
            ->create();

        Performance::factory()
            ->for($operationZone)
            ->for($driverTruck)
            ->state([
                'DateDispach' => $baselineDate,
                'CargoVolumMT' => 10,
                'DistanceWCargo' => 120,
                'DistanceWOCargo' => 30,
                'fuelInBirr' => 300,
                'perdiem' => 80,
                'other' => 20,
                'orgion_id' => $placeOrigin->id,
                'destination_id' => $placeDestination->id,
            ])
            ->create();

        $response = $this->actingAs($user)->get(route('reports.operation-profitability', [
            'from' => $baselineDate->copy()->subDay()->toDateString(),
            'to' => $baselineDate->copy()->addDays(2)->toDateString(),
        ]));

        $response->assertOk()
            ->assertInertia(function (AssertableInertia $page) {
                $page->component('Reports/OperationProfitability')
                    ->where('totals.revenue', 20000)
                    ->where('totals.cost', 940)
                    ->where('totals.profit', 19060)
                    ->where('totals.trips', 3)
                    ->where('totals.tonnage', 22)
                    ->where('totals.margin_percent', 95.3)
                    ->where('totals.operations', 2)
                    ->where('filters.customer_ids', [])
                    ->where('filters.region_ids', [])
                    ->has('operations', 2)
                    ->has('operations.0', function (AssertableInertia $operation) {
                        $operation
                            ->where('code', 'OP-REGION')
                            ->where('customer_name', 'Customer A')
                            ->where('region_name', 'Region Alpha')
                            ->where('revenue', 12000)
                            ->where('cost', 540)
                            ->where('profit', 11460)
                            ->where('margin_percent', 95.5)
                            ->where('trips', 2)
                            ->where('tonnage', 12)
                            ->where('avg_km_per_trip', 112.5)
                            ->where('cost_per_km', 2.4)
                            ->etc();
                    })
                    ->has('operations.1', function (AssertableInertia $operation) {
                        $operation
                            ->where('code', 'OP-ZONE')
                            ->where('customer_name', 'Customer B')
                            ->where('region_name', 'Region Beta')
                            ->where('revenue', 8000)
                            ->where('cost', 400)
                            ->where('profit', 7600)
                            ->where('margin_percent', 95)
                            ->where('trips', 1)
                            ->where('tonnage', 10)
                            ->where('avg_km_per_trip', 150)
                            ->where('cost_per_km', 2.67)
                            ->etc();
                    })
                    ->has('options.customers', 2)
                    ->where('options.customers.0.name', 'Customer A')
                    ->where('options.customers.1.name', 'Customer B')
                    ->has('options.regions', 2)
                    ->where('options.regions.0.name', 'Region Alpha')
                    ->where('options.regions.1.name', 'Region Beta');
            });
    }
}

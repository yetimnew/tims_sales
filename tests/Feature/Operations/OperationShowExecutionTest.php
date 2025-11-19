<?php

namespace Tests\Feature\Operations;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Tests\TestCase;

class OperationShowExecutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_surfaces_transport_execution_mix_on_operation_show(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        Permission::firstOrCreate([
            'name' => 'operations.show',
            'guard_name' => 'web',
        ]);
        $user->givePermissionTo('operations.show');

        /** @var Operation $operation */
        $operation = Operation::factory()->create([
            'operationid' => 'OP-EXEC-001',
            'volume' => 150,
            'km' => 300,
            'tariff' => 3.5,
            'user_id' => $user->id,
        ]);

        /** @var DriverTruck $driverTruck */
        $driverTruck = DriverTruck::factory()->create();

        Performance::factory()
            ->for($operation)
            ->for($driverTruck)
            ->create([
                'CargoVolumMT' => 40,
                'tonkm' => 12000,
                'is_returned' => true,
                'fuelInBirr' => 5000,
                'perdiem' => 1500,
                'other' => 250,
            ]);

        Performance::factory()
            ->for($operation)
            ->for($driverTruck)
            ->create([
                'CargoVolumMT' => 30,
                'tonkm' => 6000,
                'is_returned' => true,
                'fuelInBirr' => 3000,
                'perdiem' => 1000,
                'other' => 150,
            ]);

        /** @var Outsource $outsource */
        $outsource = Outsource::factory()->create();

        OutsourcePerformance::factory()
            ->for($outsource)
            ->for($operation)
            ->for(Place::factory(), 'fromPlace')
            ->for(Place::factory(), 'toPlace')
            ->create([
                'cargo_volume_mt' => 20,
                'tonkm' => 8000,
                'cost' => 12000,
            ]);

        $response = $this->actingAs($user)->get(route('operations.show', $operation));

        $response->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Operations/Show')
                ->where('transportExecution.companyTrips', 2)
                ->where('transportExecution.vendorTrips', 1)
                ->where('transportExecution.companyTonnage', 70)
                ->where('transportExecution.vendorTonnage', 20)
                ->where('transportExecution.companyTonKm', 18000)
                ->where('transportExecution.vendorTonKm', 8000)
                ->where('transportExecution.companyAverageTonPerTrip', 35)
                ->where('transportExecution.vendorAverageTonPerTrip', 20)
                ->where('transportExecution.companyAverageTonKmPerTrip', 9000)
                ->where('transportExecution.vendorAverageTonKmPerTrip', 8000)
                ->where('transportExecution.companyCost', 10900)
                ->where('transportExecution.vendorCost', 12000)
                ->where('transportExecution.totalCost', 22900)
                ->where('transportExecution.executionMode', 'hybrid')
                ->where('transportExecution.companyTripShare', 66.7)
                ->where('transportExecution.vendorTripShare', 33.3)
                ->where('transportExecution.companyTonnageShare', 77.8)
                ->where('transportExecution.vendorTonnageShare', 22.2)
                ->where('transportExecution.companyTonKmShare', 69.2)
                ->where('transportExecution.vendorTonKmShare', 30.8)
                ->where('transportExecution.companyCostShare', 47.6)
                ->where('transportExecution.vendorCostShare', 52.4)
                ->where('transportExecution.companyCostPerTonKm', 0.61)
                ->where('transportExecution.vendorCostPerTonKm', 1.5)
            );
    }
}

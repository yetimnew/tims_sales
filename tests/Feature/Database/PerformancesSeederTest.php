<?php

namespace Tests\Feature\Database;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\User;
use Database\Seeders\CargoTypesSeeder;
use Database\Seeders\CustomersSeeder;
use Database\Seeders\DriversSeeder;
use Database\Seeders\DriverTrucksSeeder;
use Database\Seeders\EthiopiaPlacesSeeder;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\EthiopiaWoredasSeeder;
use Database\Seeders\EthiopiaZonesSeeder;
use Database\Seeders\OperationsSeeder;
use Database\Seeders\PerformancesSeeder;
use Database\Seeders\TrucksSeeder;
use Database\Seeders\UsersSeeder;
use Database\Seeders\VehicleTypesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class PerformancesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_performances_from_legacy_dataset(): void
    {
        $this->seed(UsersSeeder::class);
        $this->seed(VehicleTypesSeeder::class);
        $this->seed(TrucksSeeder::class);
        $this->seed(DriversSeeder::class);
        $this->seed(DriverTrucksSeeder::class);
        $this->seed(CustomersSeeder::class);
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);
        $this->seed(EthiopiaPlacesSeeder::class);
        $this->seed(CargoTypesSeeder::class);
        $this->seed(OperationsSeeder::class);

        $operation = Operation::firstOrFail();
        $driverTruck = DriverTruck::firstOrFail();
        $origin = Place::firstOrFail();
        $destination = Place::query()->where('id', '!=', $origin->getKey())->firstOrFail();
        $user = User::firstOrFail();

        Performance::create([
            'load_phase' => 'main',
            'load_completion' => 'full',
            'FOnumber' => 'PLACEHOLDER',
            'operation_id' => $operation->getKey(),
            'driver_truck_id' => $driverTruck->getKey(),
            'DateDispach' => now()->toDateString(),
            'orgion_id' => $origin->getKey(),
            'destination_id' => $destination->getKey(),
            'DistanceWCargo' => 100,
            'tonkm' => 1000,
            'DistanceWOCargo' => 100,
            'CargoVolumMT' => 10,
            'fuelInLitter' => 20,
            'fuelInBirr' => 1000,
            'perdiem' => 100,
            'workOnGoing' => 0,
            'other' => 0,
            'comment' => 'placeholder',
            'satus' => 'active',
            'is_returned' => false,
            'user_id' => $user->getKey(),
        ]);

        $this->seed(PerformancesSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_performances.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $performances = Performance::withTrashed()
            ->with(['operation', 'driverTruck', 'origin', 'destination', 'user'])
            ->orderBy('id')
            ->get();

        $this->assertCount($dataset->count(), $performances);
        $this->assertFalse(Performance::where('FOnumber', 'PLACEHOLDER')->exists());

        $firstPerformance = $performances->firstWhere('id', 20);
        $this->assertNotNull($firstPerformance);
        $this->assertSame('main', $firstPerformance->load_phase);
        $this->assertSame('full', $firstPerformance->load_completion);
        $this->assertSame('57137-38', $firstPerformance->FOnumber);
        $this->assertSame('2019-07-12', $firstPerformance->DateDispach?->toDateString());
        $this->assertSame('2019-07-17', $firstPerformance->returned_date?->toDateString());
        $this->assertSame('795.00', $firstPerformance->DistanceWCargo);
        $this->assertSame('31800.00', $firstPerformance->tonkm);
        $this->assertSame('795.00', $firstPerformance->DistanceWOCargo);
        $this->assertSame('40.00', $firstPerformance->CargoVolumMT);
        $this->assertSame('925.00', $firstPerformance->fuelInLitter);
        $this->assertSame('17339.00', $firstPerformance->fuelInBirr);
        $this->assertSame('0.00', $firstPerformance->perdiem);
        $this->assertSame('795.00', $firstPerformance->workOnGoing);
        $this->assertSame('2520.00', $firstPerformance->other);
        $this->assertSame('de', $firstPerformance->comment);
        $this->assertSame('active', $firstPerformance->satus);
        $this->assertTrue($firstPerformance->is_returned);
        $this->assertSame(6, $firstPerformance->operation_id);
        $this->assertSame(134, $firstPerformance->driver_truck_id);
        $this->assertSame(5, $firstPerformance->user_id);
        $this->assertSame('LEGACY_PLACE_4', $firstPerformance->origin->code);
        $this->assertSame('LEGACY_PLACE_88', $firstPerformance->destination->code);
    }
}

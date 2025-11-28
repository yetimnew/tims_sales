<?php

namespace Tests\Feature\Database;

use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Place;
use App\Models\User;
use Database\Seeders\CargoTypesSeeder;
use Database\Seeders\CustomersSeeder;
use Database\Seeders\EthiopiaPlacesSeeder;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\EthiopiaWoredasSeeder;
use Database\Seeders\EthiopiaZonesSeeder;
use Database\Seeders\OperationsSeeder;
use Database\Seeders\OutsourcePerformancesSeeder;
use Database\Seeders\OutsourcesSeeder;
use Database\Seeders\UsersSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Str;
use Tests\TestCase;

class OutsourcePerformancesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_outsource_performances_from_legacy_dataset(): void
    {
        $this->seed(UsersSeeder::class);
        $this->seed(CustomersSeeder::class);
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);
        $this->seed(EthiopiaPlacesSeeder::class);
        $this->seed(CargoTypesSeeder::class);
        $this->seed(OperationsSeeder::class);
        $this->seed(OutsourcesSeeder::class);

        $outsource = Outsource::firstOrFail();
        $operation = Operation::firstOrFail();
        $fromPlace = Place::firstOrFail();
        $toPlace = Place::where('id', '!=', $fromPlace->getKey())->firstOrFail();
        $user = User::firstOrFail();

        OutsourcePerformance::create([
            'outsource_id' => $outsource->getKey(),
            'operation_id' => $operation->getKey(),
            'trip_number' => 'PLACEHOLDER',
            'dispatch_date' => now()->toDateString(),
            'from_place_id' => $fromPlace->getKey(),
            'to_place_id' => $toPlace->getKey(),
            'distance_km' => '100.00',
            'cargo_volume_mt' => '10.00',
            'tonkm' => '1000.00',
            'cost' => '100.00',
            'status' => 'inactive',
            'user_id' => $user->getKey(),
        ]);

        $this->seed(OutsourcePerformancesSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_outsource_performances.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $performances = OutsourcePerformance::with(['outsource', 'operation', 'fromPlace', 'toPlace'])->orderBy('id')->get();

        $this->assertCount($dataset->count(), $performances);
        $this->assertFalse(OutsourcePerformance::where('trip_number', 'PLACEHOLDER')->exists());

        $firstPerformance = $performances->firstWhere('id', 1);
        $this->assertNotNull($firstPerformance);
        $this->assertSame('57080', $firstPerformance->trip_number);
        $this->assertSame('2019-07-09', $firstPerformance->dispatch_date?->toDateString());
        $this->assertSame('3.50', $firstPerformance->cost);
        $this->assertSame('33970.00', $firstPerformance->tonkm);
        $this->assertNotNull($firstPerformance->outsource);
        $this->assertSame('Natherath', Str::of((string) $firstPerformance->outsource->address)->before(PHP_EOL)->toString());
        $this->assertSame('LEGACY_PLACE_4', $firstPerformance->fromPlace->code);
        $this->assertSame('LEGACY_PLACE_294', $firstPerformance->toPlace->code);
        $this->assertStringContainsString('Driver: TSGAYE BERHIE', (string) $firstPerformance->remarks);
    }
}

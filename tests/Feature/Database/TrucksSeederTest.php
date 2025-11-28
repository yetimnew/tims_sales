<?php

namespace Tests\Feature\Database;

use App\Models\Truck;
use App\Models\VehicleType;
use Database\Seeders\TrucksSeeder;
use Database\Seeders\VehicleTypesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class TrucksSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_trucks_from_legacy_dataset(): void
    {
        $this->seed(VehicleTypesSeeder::class);

        $placeholderTruck = Truck::factory()
            ->for(VehicleType::first(), 'vehicleType')
            ->create();

        $this->seed(TrucksSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_trucks.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $trucks = Truck::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $trucks);
        $this->assertFalse(Truck::where('plate', $placeholderTruck->plate)->exists());

        $firstTruck = $trucks->firstWhere('id', 1);
        $this->assertNotNull($firstTruck);
        $this->assertSame('75309', $firstTruck->plate);
        $this->assertSame(3, $firstTruck->vehicletype_id);
        $this->assertSame(10000, $firstTruck->serviceIntervalKM);
        $this->assertSame('8.00', $firstTruck->purchasePrice);
        $this->assertSame('active', $firstTruck->status);
        $this->assertNull($firstTruck->deleted_at);

        $inactiveTruck = $trucks->firstWhere('id', 4);
        $this->assertNotNull($inactiveTruck);
        $this->assertSame('inactive', $inactiveTruck->status);
        $this->assertSame('10189', $inactiveTruck->plate);
    }
}

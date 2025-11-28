<?php

namespace Tests\Feature\Database;

use App\Models\Distance;
use App\Models\Place;
use Database\Seeders\EthiopiaDistancesSeeder;
use Database\Seeders\EthiopiaPlacesSeeder;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\EthiopiaWoredasSeeder;
use Database\Seeders\EthiopiaZonesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EthiopiaDistancesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_distances_from_legacy_dataset(): void
    {
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);
        $this->seed(EthiopiaPlacesSeeder::class);
        $this->seed(EthiopiaDistancesSeeder::class);

        $origin = Place::query()->where('code', 'LEGACY_PLACE_2')->first();
        $destination = Place::query()->where('code', 'LEGACY_PLACE_4')->first();

        $this->assertNotNull($origin, 'Expected origin place LEGACY_PLACE_2 to be seeded.');
        $this->assertNotNull($destination, 'Expected destination place LEGACY_PLACE_4 to be seeded.');

        $distance = Distance::query()
            ->where('from_place_id', $origin->id)
            ->where('to_place_id', $destination->id)
            ->first();

        $this->assertNotNull($distance, 'Expected distance between LEGACY_PLACE_2 and LEGACY_PLACE_4 to exist.');
        $this->assertEquals(92.0, (float) $distance->distance_km);
        $this->assertEquals('active', $distance->status);
        $this->assertEquals('Addis Abeba to Nazeth', $distance->route_description);
    }
}

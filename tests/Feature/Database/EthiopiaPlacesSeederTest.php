<?php

namespace Tests\Feature\Database;

use App\Models\Place;
use App\Models\Woreda;
use Database\Seeders\EthiopiaPlacesSeeder;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\EthiopiaWoredasSeeder;
use Database\Seeders\EthiopiaZonesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EthiopiaPlacesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_places_with_woreda_relationships(): void
    {
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);
        $this->seed(EthiopiaPlacesSeeder::class);

        $place = Place::query()->where('code', 'LEGACY_PLACE_2')->first();
        $woreda = Woreda::query()->where('code', 'LEGACY_WOREDA_18')->first();

        $this->assertNotNull($place, 'Expected place LEGACY_PLACE_2 to be seeded.');
        $this->assertNotNull($woreda, 'Expected woreda LEGACY_WOREDA_18 to be seeded.');

        $this->assertEquals('Addis Abeba', $place->name);
        $this->assertEquals('active', $place->status);
        $this->assertEquals('my second contry', $place->description);
        $this->assertTrue($place->woreda->is($woreda));
    }

    public function test_it_marks_inactive_places_with_status_zero(): void
    {
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);
        $this->seed(EthiopiaPlacesSeeder::class);

        $place = Place::query()->where('code', 'LEGACY_PLACE_274')->first();

        $this->assertNotNull($place, 'Expected place LEGACY_PLACE_274 to be seeded.');
        $this->assertEquals('inactive', $place->status);
        $this->assertEquals('de', $place->description);
    }
}

<?php

namespace Tests\Feature\Database;

use App\Models\Woreda;
use App\Models\Zone;
use Database\Seeders\EthiopiaRegionsSeeder;
use Database\Seeders\EthiopiaWoredasSeeder;
use Database\Seeders\EthiopiaZonesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class EthiopiaWoredasSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_woredas_with_zone_relationships(): void
    {
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);

        $woreda = Woreda::query()->where('code', 'LEGACY_WOREDA_5')->first();
        $zone = Zone::query()->where('code', 'LEGACY_ZONE_5')->first();

        $this->assertNotNull($woreda, 'Expected woreda LEGACY_WOREDA_5 to be seeded.');
        $this->assertNotNull($zone, 'Expected zone LEGACY_ZONE_5 to be seeded.');

        $this->assertTrue($woreda->zone->is($zone));
        $this->assertEquals('active', $woreda->status);
        $this->assertEquals('de', $woreda->description);
    }

    public function test_it_marks_inactive_woredas_with_status_zero(): void
    {
        $this->seed(EthiopiaRegionsSeeder::class);
        $this->seed(EthiopiaZonesSeeder::class);
        $this->seed(EthiopiaWoredasSeeder::class);

        $inactiveWoreda = Woreda::query()->where('code', 'LEGACY_WOREDA_18')->first();
        $this->assertNotNull($inactiveWoreda, 'Expected woreda LEGACY_WOREDA_18 to be seeded.');

        $this->assertEquals('inactive', $inactiveWoreda->status);
        $this->assertNull($inactiveWoreda->description);
        $this->assertEquals('LEGACY_ZONE_58', $inactiveWoreda->zone->code);
    }
}

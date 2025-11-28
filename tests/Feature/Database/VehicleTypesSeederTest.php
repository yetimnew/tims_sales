<?php

namespace Tests\Feature\Database;

use App\Models\VehicleType;
use Database\Seeders\VehicleTypesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VehicleTypesSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_vehicle_types_from_legacy_dataset(): void
    {
        VehicleType::factory()->create();

        $this->seed(VehicleTypesSeeder::class);

        $vehicleTypes = VehicleType::withTrashed()->orderBy('id')->get();

        $this->assertCount(4, $vehicleTypes);

        $firstType = $vehicleTypes->firstWhere('id', 1);
        $this->assertNotNull($firstType);
        $this->assertSame('old', $firstType->name);
        $this->assertSame('64h4', $firstType->description);
        $this->assertNull($firstType->deleted_at);

        $lastType = $vehicleTypes->last();
        $this->assertSame(4, $lastType->id);
        $this->assertSame('SINOTRUCK', $lastType->name);
    }
}

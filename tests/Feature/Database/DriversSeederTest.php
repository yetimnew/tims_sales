<?php

namespace Tests\Feature\Database;

use App\Models\Driver;
use Database\Seeders\DriversSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DriversSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_drivers_from_legacy_dataset(): void
    {
        $placeholderDriver = Driver::factory()->create();

        $this->seed(DriversSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_drivers.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $drivers = Driver::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $drivers);
        $this->assertFalse(Driver::where('driverid', $placeholderDriver->driverid)->exists());

        $firstDriver = $drivers->firstWhere('id', 1);
        $this->assertNotNull($firstDriver);
        $this->assertSame('117', $firstDriver->driverid);
        $this->assertSame('FASILE YEMER', $firstDriver->name);
        $this->assertSame('Male', $firstDriver->sex);
        $this->assertSame('1985-12-21', $firstDriver->birthdate?->toDateString());
        $this->assertSame('active', $firstDriver->status);
        $this->assertNull($firstDriver->deleted_at);

        $inactiveDriver = $drivers->firstWhere('id', 5);
        $this->assertNotNull($inactiveDriver);
        $this->assertSame('inactive', $inactiveDriver->status);
        $this->assertNull($inactiveDriver->birthdate);

        $femaleDriver = $drivers->firstWhere('id', 130);
        $this->assertNotNull($femaleDriver);
        $this->assertSame('Female', $femaleDriver->sex);
    }
}

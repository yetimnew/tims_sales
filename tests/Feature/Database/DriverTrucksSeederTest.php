<?php

namespace Tests\Feature\Database;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Truck;
use Database\Seeders\DriversSeeder;
use Database\Seeders\DriverTrucksSeeder;
use Database\Seeders\TrucksSeeder;
use Database\Seeders\VehicleTypesSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\File;
use Tests\TestCase;

class DriverTrucksSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_driver_truck_assignments_from_legacy_dataset(): void
    {
        $this->seed(VehicleTypesSeeder::class);
        $this->seed(TrucksSeeder::class);
        $this->seed(DriversSeeder::class);

        $placeholderAssignment = DriverTruck::factory()
            ->for(Driver::first(), 'driver')
            ->for(Truck::first(), 'truck')
            ->state(['user_id' => null])
            ->create();

        $this->seed(DriverTrucksSeeder::class);

        $dataset = collect(json_decode(
            File::get(database_path('seeders/data/legacy_driver_trucks.json')),
            true,
            512,
            JSON_THROW_ON_ERROR
        ));

        $assignments = DriverTruck::withTrashed()->orderBy('id')->get();

        $this->assertCount($dataset->count(), $assignments);
        $this->assertFalse(DriverTruck::whereKey($placeholderAssignment->id)->exists());

        $activeAssignment = $assignments->firstWhere('id', 41);
        $this->assertNotNull($activeAssignment);
        $this->assertSame(32, $activeAssignment->driver_id);
        $this->assertSame(26, $activeAssignment->truck_id);
        $this->assertFalse($activeAssignment->is_attached);
        $this->assertSame('active', $activeAssignment->status);
        $this->assertSame('2018-07-07', $activeAssignment->assigned_date?->toDateString());
        $this->assertSame('2019-07-13', $activeAssignment->unassigned_date?->toDateString());

        $attachedAssignment = $assignments->first(fn ($assignment) => $assignment->is_attached === true);
        $this->assertNotNull($attachedAssignment);
        $this->assertSame('active', $attachedAssignment->status);
    }
}

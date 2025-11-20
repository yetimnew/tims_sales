<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\Truck;
use App\Models\VehicleType;
use Illuminate\Database\Eloquent\Factories\Sequence;
use Illuminate\Database\Seeder;

class LargeDatasetSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $targetCount = 1000;

        $vehicleTypeIds = VehicleType::query()->pluck('id');

        if ($vehicleTypeIds->isEmpty()) {
            $vehicleTypeIds = VehicleType::factory()
                ->count(5)
                ->create()
                ->pluck('id');
        }

        $existingDrivers = Driver::count();
        $driversToCreate = max(0, $targetCount - $existingDrivers);

        if ($driversToCreate > 0) {
            Driver::factory($driversToCreate)->create();
        }

        $existingTrucks = Truck::count();
        $trucksToCreate = max(0, $targetCount - $existingTrucks);

        if ($trucksToCreate > 0) {
            Truck::factory()
                ->count($trucksToCreate)
                ->state(new Sequence(
                    fn () => ['vehicletype_id' => $vehicleTypeIds->random()],
                ))
                ->create();
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\Performance;
use App\Models\Operation;
use App\Models\DriverTruck;
use App\Models\Place;
use App\Models\User;
use App\Models\CargoType;
use Illuminate\Database\Seeder;

class AdditionalPerformancesSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->command->info('Creating additional performances...');

        // Get existing data
        $operations = Operation::all();
        $driverTrucks = DriverTruck::all();
        $places = Place::all();
        $users = User::all();
        $cargoTypes = CargoType::all();

        if ($operations->isEmpty() || $driverTrucks->isEmpty() || $places->isEmpty()) {
            $this->command->warn('Required data not found. Please run TimsSeeder first.');
            return;
        }

        $statuses = ['returned', 'in_progress', 'pending', 'completed'];
        $loadTypes = ['main', 'return', 'empty'];

        // Create 50 additional performances
        for ($i = 5; $i <= 54; $i++) {
            $operation = $operations->random();
            $driverTruck = $driverTrucks->random();
            $origin = $places->random();
            $destination = $places->where('id', '!=', $origin->id)->random();
            $status = $statuses[array_rand($statuses)];
            $loadType = $loadTypes[array_rand($loadTypes)];
            $cargoType = $cargoTypes->random();
            $user = $users->random();

            $distance = rand(50, 300);
            $cargoVolume = rand(2, 10);
            $fuelLiters = $distance * 0.35; // Approximate fuel consumption
            $fuelCost = $fuelLiters * 50; // 50 birr per liter

            Performance::create([
                'trip' => 'AA-' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'LoadType' => $loadType,
                'FOnumber' => 'FO' . str_pad($i, 3, '0', STR_PAD_LEFT),
                'operation_id' => $operation->id,
                'driver_truck_id' => $driverTruck->id,
                'DateDispach' => now()->subDays(rand(1, 30)),
                'orgion_id' => $origin->id,
                'destination_id' => $destination->id,
                'DistanceWCargo' => $distance,
                'tonkm' => $distance * $cargoVolume,
                'DistanceWOCargo' => $distance,
                'CargoVolumMT' => $cargoVolume,
                'fuelInLitter' => $fuelLiters,
                'fuelInBirr' => $fuelCost,
                'perdiem' => rand(300, 800),
                'workOnGoing' => 0.00,
                'other' => rand(100, 500),
                'comment' => 'Performance record #' . $i,
                'satus' => $status,
                'is_returned' => $status === 'returned' || $status === 'completed',
                'returned_date' => ($status === 'returned' || $status === 'completed') ? now()->subDays(rand(0, 5)) : null,
                'user_id' => $user->id,
                'cargo_type_id' => $cargoType->id,
                'cargo_weight_kg' => $cargoVolume * 1000,
                'cargo_volume_cubic_meters' => $cargoVolume * 3,
                'loading_method' => ['Manual', 'Forklift', 'Crane'][array_rand(['Manual', 'Forklift', 'Crane'])],
                'unloading_method' => ['Manual', 'Forklift', 'Crane'][array_rand(['Manual', 'Forklift', 'Crane'])],
                'loading_time_minutes' => rand(60, 180),
                'unloading_time_minutes' => rand(60, 150),
                'cargo_condition_notes' => 'Good condition',
            ]);
        }

        $this->command->info('✓ Created 50 additional performance records (Total: 54)');
    }
}


<?php

namespace Database\Seeders;

use App\Models\FuelRecord;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Carbon\Carbon;

class FuelRecordSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $trucks = Truck::active()->get();
        $drivers = Driver::active()->get();
        $users = User::all();

        if ($trucks->isEmpty() || $drivers->isEmpty()) {
            return; // Skip seeding if no trucks or drivers exist
        }

        $fuelStations = [
            'Total Station Addis Ababa',
            'Shell Station Bole',
            'National Oil Ethiopia',
            'Agelgil Fuel Station',
            'Oilibya Station',
            'Kero Station',
        ];

        $fuelRecords = [];

        // Generate fuel records for the past 3 months
        for ($i = 0; $i < 50; $i++) {
            $fuelDate = Carbon::now()->subDays(rand(1, 90));
            $quantity = rand(50, 200); // 50-200 liters
            $pricePerLiter = rand(3000, 4500) / 100; // 30.00-45.00 ETB
            $totalCost = $quantity * $pricePerLiter;

            // Find a random active driver-truck assignment
            $driverTruck = \App\Models\DriverTruck::where('is_attached', true)
                ->whereNull('date_detach')
                ->inRandomOrder()
                ->first();

            if (!$driverTruck) {
                continue; // Skip if no active assignments
            }

            $fuelRecords[] = [
                'driver_truck_id' => $driverTruck->id,
                'user_id' => $users->random()->id,
                'fuel_date' => $fuelDate,
                'fuel_quantity_liters' => $quantity,
                'fuel_price_per_liter' => $pricePerLiter,
                'total_cost' => $totalCost,
                'fuel_station' => $fuelStations[array_rand($fuelStations)],
                'fuel_type' => ['diesel', 'petrol'][rand(0, 1)],
                'odometer_reading' => rand(50000, 300000),
                'receipt_number' => 'RCP-' . str_pad($i + 1, 6, '0', STR_PAD_LEFT),
                'notes' => rand(0, 2) === 0 ? null : 'Fuel refill for route delivery',
                'created_at' => $fuelDate,
                'updated_at' => $fuelDate,
            ];
        }

        foreach ($fuelRecords as $record) {
            FuelRecord::create($record);
        }
    }
}

<?php

namespace Database\Seeders\Legacy;

use Illuminate\Database\Seeder;

class LegacyImportSeeder extends Seeder
{
    public function run(): void
    {
        // Order matters due to foreign keys
        $this->call([
            VehicleTypesLegacySeeder::class,
            GeoLegacySeeder::class,
            CustomersLegacySeeder::class,
            DriversLegacySeeder::class,
            TrucksLegacySeeder::class,
            OperationsLegacySeeder::class,
            StatusTypesLegacySeeder::class,
            DailyTruckStatusesLegacySeeder::class,
        ]);
    }
}



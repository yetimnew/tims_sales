<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(NotificationTypeSeeder::class);
        $this->call(CheckPermissionSeeder::class);
        $this->call(ReportPermissionSeeder::class);
        $this->call(UsersSeeder::class);
        $this->call(AdminUserSeeder::class);

        // Seed Ethiopia's geographic structure
        $this->call(EthiopiaRegionsSeeder::class);
        $this->call(EthiopiaZonesSeeder::class);
        $this->call(EthiopiaWoredasSeeder::class);
        $this->call(EthiopiaPlacesSeeder::class);
        $this->call(EthiopiaDistancesSeeder::class);
        $this->call(VehicleTypesSeeder::class);
        $this->call(CargoTypesSeeder::class);
        $this->call(TrucksSeeder::class);
        $this->call(DriversSeeder::class);
        $this->call(DriverTrucksSeeder::class);
        $this->call(CustomersSeeder::class);
        $this->call(OutsourcesSeeder::class);
        $this->call(OperationsSeeder::class);
        $this->call(PerformancesSeeder::class);
        $this->call(OutsourcePerformancesSeeder::class);

        // Optionally import legacy data from old TIMS dump if configured
        if (config('database.connections.legacy.database')) {
            $this->call(\Database\Seeders\Legacy\LegacyImportSeeder::class);
        }

        // Seed truck statuses
        $this->call(TruckStatusSeeder::class);

        // Create a test user if none exist
        if (User::count() === 0) {
            $user = User::factory()->create([
                'name' => 'Test User',
                'email' => 'test@example.com',
            ]);

            // Assign admin role
            $user->assignRole('admin');
        }
    }
}

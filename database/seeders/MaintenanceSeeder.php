<?php

namespace Database\Seeders;

use App\Models\MaintenanceType;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Spatie\Permission\Models\Role;

class MaintenanceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $trucks = Truck::query()->where('status', 'active')->get();
        $maintenanceTypes = MaintenanceType::query()->where('is_active', true)->get();
        if ($maintenanceTypes->isEmpty()) {
            $this->call(MaintenanceTypeSeeder::class);
            $maintenanceTypes = MaintenanceType::query()->where('is_active', true)->get();
        }
        $users = User::query()->get();

        if ($trucks->isEmpty() || $maintenanceTypes->isEmpty() || $users->isEmpty()) {
            return;
        }

        $mechanicRoleExists = Role::query()->where('name', 'mechanic')->exists();
        $mechanics = $mechanicRoleExists ? User::role('mechanic')->get() : collect();

        if ($mechanics->isEmpty()) {
            $mechanics = $users;
        }

        $serviceProviders = [
            'Addis Premier Auto Care',
            'Blue Nile Fleet Services',
            'Capital City Mechanics',
            'Logistics Service Hub',
            'FleetGuard Maintenance Center',
            'Prime Mechanics Cooperative',
        ];

        $partsInventory = [
            'Oil Filter',
            'Air Filter',
            'Brake Pads',
            'Hydraulic Pump',
            'Timing Belt',
            'Coolant Hose',
            'Spark Plugs',
            'Drive Belt',
        ];

        $statuses = [
            'scheduled',
            'scheduled',
            'scheduled',
            'in_progress',
            'completed',
            'completed',
            'overdue',
        ];

        $minimumRecordsPerTruck = 10;
        $truckIds = $trucks->modelKeys();

        $existingCounts = VehicleMaintenanceRecord::query()
            ->whereIn('truck_id', $truckIds)
            ->select('truck_id')
            ->selectRaw('COUNT(*) as aggregate')
            ->groupBy('truck_id')
            ->pluck('aggregate', 'truck_id');

        foreach ($trucks as $truck) {
            $currentCount = (int) ($existingCounts[$truck->getKey()] ?? 0);
            $missingRecords = max(0, $minimumRecordsPerTruck - $currentCount);

            if ($missingRecords === 0) {
                continue;
            }

            for ($i = 0; $i < $missingRecords; $i++) {
                $maintenanceType = $maintenanceTypes->random();
                $status = Arr::random($statuses);

                $scheduledDate = match ($status) {
                    'completed' => Carbon::now()->subDays(random_int(30, 365)),
                    'in_progress' => Carbon::now()->subDays(random_int(1, 10)),
                    'overdue' => Carbon::now()->subDays(random_int(11, 120)),
                    default => Carbon::now()->addDays(random_int(3, 90)),
                };

                $completedDate = null;
                if ($status === 'completed') {
                    $completedDate = (clone $scheduledDate)->addDays(random_int(1, 14));
                }

                $baseCost = $maintenanceType->estimated_cost ?? 250.0;
                $cost = max(150.0, $baseCost + random_int(-50, 150));

                $workPerformed = null;
                $partsReplaced = null;
                $includeWorkDetails = in_array($status, ['completed', 'in_progress'], true);

                if ($includeWorkDetails) {
                    $workPerformed = sprintf(
                        '%s performed on truck %s at %s km.',
                        $maintenanceType->name,
                        $truck->plate,
                        number_format(random_int(10_000, 900_000))
                    );

                    $partsSelection = Arr::wrap(
                        Arr::random($partsInventory, random_int(1, min(3, count($partsInventory))))
                    );

                    $partsReplaced = implode(', ', $partsSelection);
                }

                VehicleMaintenanceRecord::create([
                    'truck_id' => $truck->id,
                    'maintenance_type_id' => $maintenanceType->id,
                    'scheduled_date' => $scheduledDate->toDateString(),
                    'completed_date' => $completedDate?->toDateString(),
                    'odometer_reading' => random_int(50_000, 850_000),
                    'cost' => $cost,
                    'description' => sprintf(
                        '%s maintenance cycle #%d for fleet truck %s.',
                        $maintenanceType->name,
                        $currentCount + $i + 1,
                        $truck->plate
                    ),
                    'work_performed' => $workPerformed,
                    'parts_replaced' => $partsReplaced,
                    'service_provider' => Arr::random($serviceProviders),
                    'status' => $status,
                    'assigned_mechanic_id' => $mechanics->random()->id,
                    'user_id' => $users->random()->id,
                ]);
            }
        }
    }
}

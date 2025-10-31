<?php

namespace Database\Seeders;

use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\DailyTruckStatus;
use App\Models\User;
use Illuminate\Database\Seeder;

class TruckStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create or get "Operational Status" type
        $operationalStatusType = StatusType::firstOrCreate(
            ['name' => 'Operational Status'],
            ['description' => 'Daily operational status for trucks']
        );

        // Create all operational statuses
        $statuses = [
            ['name' => 'In Garage', 'description' => 'Truck is in the garage'],
            ['name' => 'On Road', 'description' => 'Truck is on the road'],
            ['name' => 'Waiting Load', 'description' => 'Truck is waiting for load'],
            ['name' => 'Loading', 'description' => 'Truck is being loaded'],
            ['name' => 'Unloading', 'description' => 'Truck is being unloaded'],
            ['name' => 'Available', 'description' => 'Truck is available for assignment'],
            ['name' => 'Breakdown', 'description' => 'Truck has broken down'],
            ['name' => 'Out of Service', 'description' => 'Truck is out of service'],
        ];

        $createdStatuses = [];
        foreach ($statuses as $status) {
            $createdStatuses[$status['name']] = Status::firstOrCreate(
                [
                    'statustype_id' => $operationalStatusType->id,
                    'name' => $status['name'],
                ],
                ['description' => $status['description']]
            );
        }

        $this->command->info('Truck operational statuses created successfully!');

        // Get trucks
        $trucks = Truck::all();

        if ($trucks->isEmpty()) {
            $this->command->warn('No trucks found. Run TimsSeeder first.');
            return;
        }

        // Get first user for changed_by
        $user = User::first();

        if (!$user) {
            $this->command->warn('No users found. Run AdminUserSeeder first.');
            return;
        }

        // Assign statuses to trucks for today
        $today = now()->format('Y-m-d');
        $statusAssignments = [
            ['In Garage', ['plate' => 'AA-22222']],
            ['On Road', ['plate' => 'AA-12345']],
            ['On Road', ['plate' => 'AA-67890']],
            ['Waiting Load', ['plate' => 'AA-11111']],
            ['Loading', ['plate' => 'AA-33333']],
        ];

        foreach ($statusAssignments as [$statusName, $truckFilter]) {
            $truck = Truck::where($truckFilter)->first();
            $status = $createdStatuses[$statusName];

            if ($truck && $status) {
                DailyTruckStatus::updateOrCreate(
                    [
                        'truck_id' => $truck->id,
                        'status_date' => $today,
                    ],
                    [
                        'status_id' => $status->id,
                        'changed_by' => $user->id,
                        'notes' => 'Initial status assignment',
                    ]
                );
            }
        }

        $this->command->info('Sample truck statuses assigned for today!');
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\Truck;
use App\Models\StatusType;
use App\Models\Status;
use App\Models\DailyTruckStatus;
use App\Models\User;

class TruckBulkTestSeeder extends Seeder
{
    /**
     * Seed 1000 trucks and assign them all to a single operational status for today.
     */
    public function run(): void
    {
        $today = now()->format('Y-m-d');

        // Ensure an admin/user exists for changed_by
        $userId = User::value('id');
        if (! $userId) {
            $user = User::factory()->create([
                'name' => 'Seeder User',
                'email' => 'seeder_'.Str::random(6).'@example.com',
                'password' => bcrypt('password123'),
            ]);
            $userId = $user->id;
        }

        // Ensure the Operational Status type and a primary status exist
        $statusType = StatusType::firstOrCreate(
            ['name' => 'Operational Status'],
            ['description' => 'Operational statuses for trucks']
        );

        // Use an existing status under Operational Status, or create "Available"
        $primaryStatus = Status::where('statustype_id', $statusType->id)->orderBy('id')->first();
        if (! $primaryStatus) {
            $primaryStatus = Status::create([
                'statustype_id' => $statusType->id,
                'name' => 'Available',
                'description' => 'Truck is available for assignment',
            ]);
        }

        // Create 1000 trucks (or top up to 1000 if some already exist)
        $existingCount = Truck::count();
        $toCreate = max(0, 1000 - $existingCount);
        if ($toCreate > 0) {
            Truck::factory($toCreate)->create();
        }

        // Assign all trucks to the primary status for today
        Truck::query()->take(1000)->get()->each(function (Truck $truck) use ($today, $primaryStatus, $userId) {
            DailyTruckStatus::updateOrCreate(
                [
                    'truck_id' => $truck->id,
                    'status_date' => $today,
                ],
                [
                    'status_id' => $primaryStatus->id,
                    'notes' => null,
                    'changed_by' => $userId,
                ]
            );
        });
    }
}







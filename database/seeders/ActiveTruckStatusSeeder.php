<?php

namespace Database\Seeders;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class ActiveTruckStatusSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statusType = StatusType::query()->where('name', 'Operational Status')->first();

        if (! $statusType) {
            $this->command?->warn('Operational Status type not found. Run TruckStatusSeeder before seeding active truck statuses.');

            return;
        }

        $statuses = $statusType->statuses()->orderBy('name')->get()->values();

        if ($statuses->isEmpty()) {
            $this->command?->warn('No operational statuses available. Run TruckStatusSeeder before seeding active truck statuses.');

            return;
        }

        $activeTrucks = Truck::query()->active()->orderBy('id')->get();

        if ($activeTrucks->isEmpty()) {
            $this->command?->warn('No active trucks found. Seed trucks before running ActiveTruckStatusSeeder.');

            return;
        }

        $changedByUserId = User::query()->orderBy('id')->value('id');

        if (! $changedByUserId) {
            $this->command?->warn('No users available to assign as status changers. Seed users before running ActiveTruckStatusSeeder.');

            return;
        }

        $startDate = Carbon::today()->subDays(30);
        $endDate = Carbon::today();

        foreach ($activeTrucks as $truck) {
            $statusCursor = random_int(0, $statuses->count() - 1);

            for ($date = $startDate->clone(); $date->lte($endDate); $date->addDay()) {
                /** @var Status $status */
                $status = $statuses->get($statusCursor % $statuses->count());

                DailyTruckStatus::updateOrCreate(
                    [
                        'truck_id' => $truck->id,
                        'status_date' => $date->toDateString(),
                    ],
                    [
                        'status_id' => $status->id,
                        'notes' => $this->noteForStatus($status->name),
                        'changed_by' => $changedByUserId,
                    ]
                );

                if ($date->isMonday()) {
                    $statusCursor++;
                }
            }
        }

        $this->command?->info('Active truck statuses seeded for the past 30 days.');
    }

    /**
     * Provide contextual note for specific statuses to enrich seeded data.
     */
    private function noteForStatus(string $statusName): ?string
    {
        $notes = [
            'Breakdown' => 'Maintenance is coordinating repairs.',
            'Out of Service' => 'Temporarily unavailable pending inspection.',
            'In Garage' => 'Routine service scheduled.',
        ];

        return $notes[$statusName] ?? null;
    }
}

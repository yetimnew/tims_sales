<?php

namespace Database\Seeders;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class DailyTruckStatusHistorySeeder extends Seeder
{
    private const STATUS_WEIGHTS = [
        'On Road' => 32,
        'Available' => 14,
        'Waiting Load' => 12,
        'Loading' => 8,
        'Unloading' => 8,
        'In Garage' => 10,
        'Breakdown' => 6,
        'Out of Service' => 4,
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $statusType = StatusType::query()->where('name', 'Operational Status')->first();

        if (! $statusType) {
            $this->command?->warn('Operational Status type not found. Run TruckStatusSeeder before seeding history.');

            return;
        }

        $statuses = $statusType->statuses()->get()->keyBy('name');

        if ($statuses->isEmpty()) {
            $this->command?->warn('No operational statuses available. Run TruckStatusSeeder before seeding history.');

            return;
        }

        $trucks = Truck::query()->orderBy('id')->get();

        if ($trucks->isEmpty()) {
            $this->command?->warn('No trucks available. Run TrucksSeeder before seeding history.');

            return;
        }

        $changedByUserId = User::query()->orderBy('id')->value('id');

        $startDate = Carbon::today()->subDays(44);
        $endDate = Carbon::today();

        foreach ($trucks as $truck) {
            $currentStatus = $this->selectStatus($statuses);

            for ($date = $startDate->clone(); $date->lte($endDate); $date->addDay()) {
                if ($this->shouldShiftStatus($date)) {
                    $currentStatus = $this->selectStatus($statuses, $currentStatus);
                }

                DailyTruckStatus::updateOrCreate(
                    [
                        'truck_id' => $truck->id,
                        'status_date' => $date->toDateString(),
                    ],
                    [
                        'status_id' => $currentStatus->id,
                        'notes' => $this->generateNote($currentStatus->name),
                        'changed_by' => $changedByUserId,
                    ]
                );
            }
        }

        $this->command?->info('Daily truck statuses seeded for the past 45 days.');
    }

    /**
     * Select a status with weighted randomness, avoiding immediate repeats when possible.
     */
    private function selectStatus(Collection $statuses, ?Status $previous = null): Status
    {
        $pool = collect();

        foreach (self::STATUS_WEIGHTS as $name => $weight) {
            if (! $statuses->has($name) || $weight <= 0) {
                continue;
            }

            $status = $statuses->get($name);

            for ($iteration = 0; $iteration < $weight; $iteration++) {
                $pool->push($status);
            }
        }

        if ($pool->isEmpty()) {
            return $statuses->first();
        }

        if ($previous) {
            $pool = $pool->reject(static fn (Status $status) => $status->is($previous))->values();

            if ($pool->isEmpty()) {
                $pool = $statuses->values();
            }
        }

        return $pool->random();
    }

    /**
     * Determine whether the status should change for a given day.
     */
    private function shouldShiftStatus(Carbon $date): bool
    {
        if ($date->isMonday()) {
            return true;
        }

        return random_int(1, 100) <= 35;
    }

    /**
     * Generate optional context notes for notable statuses.
     */
    private function generateNote(string $statusName): ?string
    {
        $notes = [
            'Breakdown' => [
                'Awaiting maintenance clearance.',
                'Maintenance team dispatched for roadside support.',
            ],
            'Out of Service' => [
                'Scheduled downtime awaiting spare parts.',
                'Compliance inspection in progress.',
            ],
            'In Garage' => [
                'Routine service scheduled for the week.',
                'Driver reported minor issues, pending review.',
            ],
        ];

        $options = $notes[$statusName] ?? null;

        if (! $options) {
            return null;
        }

        return Arr::random($options);
    }
}

<?php

namespace Tests\Feature;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Database\Seeders\DailyTruckStatusHistorySeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\TestCase;

class DailyTruckStatusHistorySeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_seeds_daily_truck_statuses_for_the_last_forty_five_days(): void
    {
        Carbon::setTestNow(Carbon::create(2025, 1, 15, 9));

        $statusType = StatusType::create([
            'name' => 'Operational Status',
            'description' => 'Test operational statuses',
        ]);

        $statusNames = [
            'On Road',
            'Available',
            'Waiting Load',
            'Loading',
            'Unloading',
            'In Garage',
            'Breakdown',
            'Out of Service',
        ];

        foreach ($statusNames as $statusName) {
            Status::create([
                'statustype_id' => $statusType->id,
                'name' => $statusName,
                'description' => null,
            ]);
        }

        $trucks = Truck::factory()->count(3)->create();

        User::factory()->create();

        $this->seed(DailyTruckStatusHistorySeeder::class);

        $startDate = Carbon::today()->subDays(44)->toDateString();
        $endDate = Carbon::today()->toDateString();

        $expectedTotal = $trucks->count() * 45;

        $this->assertDatabaseCount('daily_truck_statuses', $expectedTotal);

        $this->assertTrue(
            DailyTruckStatus::query()
                ->whereDate('status_date', $startDate)
                ->exists()
        );

        $this->assertTrue(
            DailyTruckStatus::query()
                ->whereDate('status_date', $endDate)
                ->exists()
        );

        $this->assertFalse(
            DailyTruckStatus::query()
                ->whereNull('changed_by')
                ->exists()
        );

        $this->assertTrue(
            DailyTruckStatus::query()
                ->whereDate('status_date', '<', $startDate)
                ->doesntExist()
        );
    }
}

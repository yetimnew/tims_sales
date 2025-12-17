<?php

namespace Tests\Feature;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DailyTruckStatusControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Status $availableStatus;

    private Status $maintenanceStatus;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $this->user = User::factory()->create();
        $this->givePermissions($this->user, [
            'truck-status-board.view',
        ]);

        $statusType = StatusType::factory()->create([
            'name' => 'Operational Status',
        ]);

        $this->availableStatus = Status::factory()->create([
            'statustype_id' => $statusType->id,
            'name' => 'Available',
        ]);

        $this->maintenanceStatus = Status::factory()->create([
            'statustype_id' => $statusType->id,
            'name' => 'Maintenance',
        ]);
    }

    #[Test]
    public function it_only_lists_active_trucks_on_the_status_board(): void
    {
        $date = now()->format('Y-m-d');

        $activeTruck = Truck::factory()->create([
            'status' => 'active',
            'plate' => 'ACTIVE-001',
        ]);

        $inactiveTruck = Truck::factory()->create([
            'status' => 'inactive',
            'plate' => 'INACTIVE-001',
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $activeTruck->id,
            'status_id' => $this->availableStatus->id,
            'status_date' => $date,
            'notes' => 'Ready to deploy',
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $inactiveTruck->id,
            'status_id' => $this->maintenanceStatus->id,
            'status_date' => $date,
            'notes' => 'Inactive unit',
        ]);

        $availableStatusId = $this->availableStatus->id;

        $response = $this->actingAs($this->user)
            ->get(route('truck-status-board.index', ['date' => $date]));

        $response->assertOk()
            ->assertInertia(function (Assert $page) use ($availableStatusId, $activeTruck, $inactiveTruck): Assert {
                return $page
                    ->component('Status/Index')
                    ->has("trucksByStatus.{$availableStatusId}.trucks", 1)
                    ->where("trucksByStatus.{$availableStatusId}.trucks", function ($trucks) use ($activeTruck, $inactiveTruck): bool {
                        $ids = collect($trucks)->pluck('id');

                        return $ids->contains($activeTruck->id) && ! $ids->contains($inactiveTruck->id);
                    });
            });
    }
}

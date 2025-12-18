<?php

namespace Tests\Feature;

use App\Models\DailyTruckStatus;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\File;
use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class DailyTruckStatusControllerTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Status $availableStatus;

    private Status $maintenanceStatus;

    private bool $createdViteManifest = false;

    protected function setUp(): void
    {
        parent::setUp();

        Cache::flush();

        $manifestPath = public_path('build/manifest.json');
        if (! File::exists($manifestPath)) {
            File::ensureDirectoryExists(dirname($manifestPath));
            File::put($manifestPath, json_encode([
                'resources/js/app.tsx' => [
                    'file' => 'assets/app.js',
                    'src' => 'resources/js/app.tsx',
                    'isEntry' => true,
                    'css' => ['assets/app.css'],
                ],
            ], JSON_THROW_ON_ERROR));

            $this->createdViteManifest = true;
        }

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

    protected function tearDown(): void
    {
        if ($this->createdViteManifest) {
            File::delete(public_path('build/manifest.json'));
            $this->createdViteManifest = false;
        }

        parent::tearDown();
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

    #[Test]
    public function it_only_displays_the_current_driver_assignment_per_truck(): void
    {
        $date = now()->format('Y-m-d');

        $driver = Driver::factory()->create([
            'name' => 'Mamo Kebede',
        ]);

        $formerTruck = Truck::factory()->create([
            'status' => 'active',
            'plate' => 'AA-FORMER',
        ]);

        $currentTruck = Truck::factory()->create([
            'status' => 'active',
            'plate' => 'AA-CURRENT',
        ]);

        DriverTruck::factory()
            ->for($driver, 'driver')
            ->for($formerTruck, 'truck')
            ->create([
                'driverid' => 'DRV-9001',
                'plate' => $formerTruck->plate,
                'date_recived' => Carbon::now()->subDays(5),
                'assigned_date' => Carbon::now()->subDays(5),
                'date_detach' => Carbon::now()->subDays(1),
                'unassigned_date' => Carbon::now()->subDays(1),
                'is_attached' => false,
                'status' => 'inactive',
                'user_id' => $this->user->id,
            ]);

        DriverTruck::factory()
            ->for($driver, 'driver')
            ->for($currentTruck, 'truck')
            ->create([
                'driverid' => 'DRV-9001',
                'plate' => $currentTruck->plate,
                'date_recived' => Carbon::now()->subHours(6),
                'assigned_date' => Carbon::now()->subHours(6),
                'date_detach' => null,
                'unassigned_date' => null,
                'is_attached' => true,
                'status' => 'active',
                'user_id' => $this->user->id,
            ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $formerTruck->id,
            'status_id' => $this->availableStatus->id,
            'status_date' => $date,
            'notes' => 'Staging area',
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $currentTruck->id,
            'status_id' => $this->availableStatus->id,
            'status_date' => $date,
            'notes' => 'Ready to depart',
        ]);

        $availableStatusId = $this->availableStatus->id;

        $response = $this->actingAs($this->user)
            ->get(route('truck-status-board.index', ['date' => $date]));

        $response->assertOk()
            ->assertInertia(function (Assert $page) use ($availableStatusId, $formerTruck, $currentTruck): Assert {
                return $page
                    ->component('Status/Index')
                    ->where("trucksByStatus.{$availableStatusId}.trucks", function ($trucks) use ($formerTruck, $currentTruck): bool {
                        $collection = collect($trucks)->keyBy('id');

                        $former = $collection->get($formerTruck->id);
                        $current = $collection->get($currentTruck->id);

                        if ($former === null || $current === null) {
                            return false;
                        }

                        $formerDriver = $former['driver'] ?? null;
                        $currentDriver = $current['driver'] ?? null;

                        return $formerDriver === null
                            && is_array($currentDriver)
                            && ($currentDriver['name'] ?? null) === 'Mamo Kebede';
                    });
            });
    }

    #[Test]
    public function it_displays_recent_history_for_a_truck(): void
    {
        $truck = Truck::factory()->create([
            'status' => 'active',
            'plate' => 'HISTORY-001',
        ]);

        $changer = User::factory()->create();

        DailyTruckStatus::query()->create([
            'truck_id' => $truck->id,
            'status_id' => $this->availableStatus->id,
            'status_date' => Carbon::today()->subDays(3),
            'notes' => 'Returned from route',
            'changed_by' => $changer->id,
        ]);

        DailyTruckStatus::query()->create([
            'truck_id' => $truck->id,
            'status_id' => $this->maintenanceStatus->id,
            'status_date' => Carbon::today(),
            'notes' => 'Scheduled maintenance',
            'changed_by' => $changer->id,
        ]);

        $response = $this->actingAs($this->user)
            ->get(route('truck-status-board.trucks.show', $truck));

        $response->assertOk()
            ->assertInertia(function (Assert $page) use ($truck): Assert {
                return $page
                    ->component('Status/TruckStatusShow')
                    ->where('truck.id', $truck->id)
                    ->where('truck.plate', $truck->plate)
                    ->has('recentStatusHistory', 2)
                    ->where('recentStatusSummary.total_records', 2)
                    ->where('recentStatusSummary.current_status', 'Maintenance')
                    ->where('recentStatusSummary.window_days', 30)
                    ->where('recentStatusSummary.status_counts', function ($counts): bool {
                        return collect($counts)
                            ->pluck('status_name')
                            ->contains('Available');
                    });
            });
    }

    #[Test]
    public function it_returns_json_payload_when_status_is_updated_via_ajax(): void
    {
        $this->givePermissions($this->user, [
            'truck-status-board.update',
        ]);

        $truck = Truck::factory()->create([
            'status' => 'active',
            'plate' => 'JSON-001',
        ]);

        $date = now()->format('Y-m-d');

        $response = $this->actingAs($this->user)
            ->postJson(route('truck-status-board.store'), [
                'truck_id' => $truck->id,
                'status_id' => $this->maintenanceStatus->id,
                'status_date' => $date,
            ]);

        $response
            ->assertOk()
            ->assertJsonStructure([
                'truck_id',
                'status_id',
                'notes',
                'changed_at',
                'changed_by',
            ])
            ->assertJsonFragment([
                'truck_id' => $truck->id,
                'status_id' => $this->maintenanceStatus->id,
                'changed_by' => $this->user->name,
            ]);

        $this->assertDatabaseHas('daily_truck_statuses', [
            'truck_id' => $truck->id,
            'status_id' => $this->maintenanceStatus->id,
            'status_date' => Carbon::parse($date)->startOfDay()->toDateTimeString(),
        ]);
    }
}

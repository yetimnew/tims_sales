<?php

namespace Tests\Feature\Notification;

use App\Events\DailyTruckStatusCreated;
use App\Events\DailyTruckStatusDeleted;
use App\Events\DailyTruckStatusUpdated;
use App\Listeners\SendDailyTruckStatusLifecycleNotification;
use App\Models\DailyTruckStatus;
use App\Models\NotificationType;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Models\User;
use App\Models\UserNotificationSetting;
use App\Notifications\DailyTruckStatusLifecycleNotification;
use Database\Seeders\NotificationTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class DailyTruckStatusLifecycleNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $recipient;

    private Status $initialStatus;

    private Status $updatedStatus;

    private Truck $truck;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(NotificationTypeSeeder::class);

        Notification::fake();

        $this->recipient = User::factory()->create();

        foreach ([
            NotificationType::DAILY_TRUCK_STATUS_CREATED,
            NotificationType::DAILY_TRUCK_STATUS_UPDATED,
            NotificationType::DAILY_TRUCK_STATUS_DELETED,
        ] as $key) {
            $type = NotificationType::query()
                ->where('key', $key)
                ->firstOrFail();

            UserNotificationSetting::create([
                'user_id' => $this->recipient->id,
                'notification_type_id' => $type->id,
                'in_app_enabled' => true,
                'email_enabled' => false,
            ]);
        }

        $statusType = StatusType::create([
            'name' => 'Operational',
            'description' => 'Operational readiness states.',
        ]);

        $this->initialStatus = Status::create([
            'name' => 'Available',
            'description' => 'Available for deployment',
            'statustype_id' => $statusType->id,
        ]);

        $this->updatedStatus = Status::create([
            'name' => 'Maintenance',
            'description' => 'Under maintenance',
            'statustype_id' => $statusType->id,
        ]);

        $this->truck = Truck::factory()->create([
            'status' => 'active',
        ]);
    }

    public function test_it_sends_notification_when_daily_truck_status_created(): void
    {
        $dailyStatus = DailyTruckStatus::create([
            'truck_id' => $this->truck->id,
            'status_id' => $this->initialStatus->id,
            'status_date' => now()->toDateString(),
            'notes' => 'Initial assignment',
            'changed_by' => $this->recipient->id,
        ])->load([
            'truck:id,plate',
            'status:id,name,statustype_id',
            'status.statusType:id,name',
            'changedBy:id,name',
        ]);

        $listener = app(SendDailyTruckStatusLifecycleNotification::class);

        $listener->handle(new DailyTruckStatusCreated($dailyStatus, $this->recipient));

        Notification::assertSentTo(
            $this->recipient,
            DailyTruckStatusLifecycleNotification::class,
            fn ($notification) => ($notification->toArray($this->recipient)['payload']['daily_truck_status_id'] ?? null) === $dailyStatus->id
        );
    }

    public function test_it_sends_notification_when_daily_truck_status_updated(): void
    {
        $dailyStatus = DailyTruckStatus::create([
            'truck_id' => $this->truck->id,
            'status_id' => $this->initialStatus->id,
            'status_date' => now()->toDateString(),
            'notes' => 'Initial assignment',
            'changed_by' => $this->recipient->id,
        ]);

        $dailyStatus->status_id = $this->updatedStatus->id;
        $dailyStatus->notes = 'Moved to maintenance bay';
        $dailyStatus->changed_by = $this->recipient->id;
        $dailyStatus->save();

        $dailyStatus->load([
            'truck:id,plate',
            'status:id,name,statustype_id',
            'status.statusType:id,name',
            'changedBy:id,name',
        ]);

        $changes = [
            'status_id' => [
                'old' => $this->initialStatus->id,
                'new' => $this->updatedStatus->id,
            ],
            'notes' => [
                'old' => 'Initial assignment',
                'new' => 'Moved to maintenance bay',
            ],
        ];

        $listener = app(SendDailyTruckStatusLifecycleNotification::class);

        $listener->handle(new DailyTruckStatusUpdated($dailyStatus, $changes, $this->recipient));

        Notification::assertSentTo(
            $this->recipient,
            DailyTruckStatusLifecycleNotification::class,
            fn ($notification) => (($notification->toArray($this->recipient)['payload']['changes']['status']['new']['id'] ?? null) === $this->updatedStatus->id)
        );
    }

    public function test_it_sends_notification_when_daily_truck_status_deleted(): void
    {
        $dailyStatus = DailyTruckStatus::create([
            'truck_id' => $this->truck->id,
            'status_id' => $this->initialStatus->id,
            'status_date' => now()->toDateString(),
            'notes' => 'Initial assignment',
            'changed_by' => $this->recipient->id,
        ]);

        $attributes = [
            'truck_id' => $this->truck->id,
            'truck' => [
                'id' => $this->truck->id,
                'plate' => $this->truck->plate,
            ],
            'status_id' => $this->initialStatus->id,
            'status_date' => $dailyStatus->status_date->toDateString(),
            'notes' => $dailyStatus->notes,
        ];

        $listener = app(SendDailyTruckStatusLifecycleNotification::class);

        $listener->handle(new DailyTruckStatusDeleted(
            $dailyStatus->id,
            $attributes,
            $this->recipient,
        ));

        Notification::assertSentTo(
            $this->recipient,
            DailyTruckStatusLifecycleNotification::class,
            fn ($notification) => ($notification->toArray($this->recipient)['payload']['daily_truck_status_id'] ?? null) === $dailyStatus->id
        );
    }
}

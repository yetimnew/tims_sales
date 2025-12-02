<?php

namespace Tests\Feature\Notification;

use App\Events\StatusTypeCreated;
use App\Events\StatusTypeDeleted;
use App\Events\StatusTypeUpdated;
use App\Listeners\SendStatusTypeLifecycleNotification;
use App\Models\NotificationType;
use App\Models\StatusType;
use App\Models\User;
use App\Models\UserNotificationSetting;
use App\Notifications\StatusTypeLifecycleNotification;
use Database\Seeders\NotificationTypeSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class StatusTypeLifecycleNotificationTest extends TestCase
{
    use RefreshDatabase;

    private User $recipient;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(NotificationTypeSeeder::class);

        Notification::fake();

        $this->recipient = User::factory()->create();

        foreach ([
            NotificationType::STATUS_TYPE_CREATED,
            NotificationType::STATUS_TYPE_UPDATED,
            NotificationType::STATUS_TYPE_DELETED,
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
    }

    public function test_it_sends_notification_when_status_type_created(): void
    {
        $statusType = StatusType::create([
            'name' => 'Operational Status',
            'description' => 'Tracks operational readiness states.',
        ]);

        $listener = app(SendStatusTypeLifecycleNotification::class);

        $listener->handle(new StatusTypeCreated($statusType->fresh(), $this->recipient));

        Notification::assertSentTo(
            $this->recipient,
            StatusTypeLifecycleNotification::class,
            fn ($notification) => ($notification->toArray($this->recipient)['payload']['status_type_id'] ?? null) === $statusType->id
        );
    }

    public function test_it_sends_notification_when_status_type_updated(): void
    {
        $statusType = StatusType::create([
            'name' => 'Operational Status',
            'description' => 'Tracks operational readiness states.',
        ]);

        $statusType->name = 'Maintenance Status';
        $statusType->description = 'Signals maintenance related categories.';
        $statusType->save();

        $changes = [
            'name' => [
                'old' => 'Operational Status',
                'new' => 'Maintenance Status',
            ],
            'description' => [
                'old' => 'Tracks operational readiness states.',
                'new' => 'Signals maintenance related categories.',
            ],
        ];

        $listener = app(SendStatusTypeLifecycleNotification::class);

        $listener->handle(new StatusTypeUpdated($statusType->fresh(), $changes, $this->recipient));

        Notification::assertSentTo(
            $this->recipient,
            StatusTypeLifecycleNotification::class,
            fn ($notification) => ($notification->toArray($this->recipient)['payload']['changes'] ?? []) === $changes
        );
    }

    public function test_it_sends_notification_when_status_type_deleted(): void
    {
        $statusType = StatusType::create([
            'name' => 'Operational Status',
            'description' => 'Tracks operational readiness states.',
        ]);

        $attributes = $statusType->toArray();
        $metrics = ['statuses' => 0];

        $listener = app(SendStatusTypeLifecycleNotification::class);

        $listener->handle(new StatusTypeDeleted(
            $statusType->id,
            $statusType->name,
            $attributes,
            $metrics,
            $this->recipient,
        ));

        Notification::assertSentTo(
            $this->recipient,
            StatusTypeLifecycleNotification::class,
            fn ($notification) => ($notification->toArray($this->recipient)['payload']['status_type_id'] ?? null) === $statusType->id
        );
    }
}

<?php

namespace App\Listeners;

use App\Events\UserCreated;
use App\Events\UserDeleted;
use App\Events\UserUpdated;
use App\Models\NotificationType;
use App\Notifications\UserLifecycleNotification;
use App\Services\NotificationPreferenceService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Support\Facades\Notification;

class SendUserLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationPreferenceService $preferences) {}

    public function handle(object $event): void
    {
        if ($event instanceof UserCreated) {
            $payload = [
                'user' => $this->userPayload($event->subject->id, $event->subject->name, $event->subject->email),
                'actor' => $this->actorPayload($event->actor?->id, $event->actor?->name),
            ];

            $this->notify(NotificationType::USER_CREATED, function (NotificationType $type) use ($payload) {
                $message = sprintf('A new user account (%s) was created.', $payload['user']['email'] ?? 'unknown');

                return new UserLifecycleNotification(
                    $type,
                    'User Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof UserUpdated) {
            $payload = [
                'user' => $this->userPayload($event->subject->id, $event->subject->name, $event->subject->email),
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->id, $event->actor?->name),
            ];

            $this->notify(NotificationType::USER_UPDATED, function (NotificationType $type) use ($payload) {
                $message = sprintf('User %s was updated.', $payload['user']['email'] ?? $payload['user']['name']);

                return new UserLifecycleNotification(
                    $type,
                    'User Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof UserDeleted) {
            $payload = [
                'user' => [
                    'id' => $event->userId,
                    'name' => $event->name,
                    'email' => $event->attributes['email'] ?? null,
                ],
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->id, $event->actor?->name),
            ];

            $this->notify(NotificationType::USER_DELETED, function (NotificationType $type) use ($payload) {
                $reference = $payload['user']['email'] ?? $payload['user']['name'] ?? '#'.$payload['user']['id'];
                $message = sprintf('User %s was deleted.', $reference);

                return new UserLifecycleNotification(
                    $type,
                    'User Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function actorPayload(?int $id, ?string $name): array
    {
        return array_filter([
            'id' => $id,
            'name' => $name,
        ], static fn ($value) => $value !== null);
    }

    private function userPayload(int $id, string $name, ?string $email): array
    {
        return array_filter([
            'id' => $id,
            'name' => $name,
            'email' => $email,
        ], static fn ($value) => $value !== null);
    }

    /**
     * @param  callable(NotificationType): \App\Notifications\UserLifecycleNotification  $factory
     */
    private function notify(string $notificationKey, callable $factory): void
    {
        $type = $this->preferences->resolveType($notificationKey);

        if ($type === null) {
            return;
        }

        $users = $this->preferences->usersFor($type);

        if ($users->isEmpty()) {
            return;
        }

        foreach ($users as $user) {
            /** @var \App\Models\User $user */
            $channels = $this->preferences->channelsFor($user, $type);

            if ($channels === []) {
                continue;
            }

            /** @var \App\Notifications\UserLifecycleNotification $notification */
            $notification = $factory($type);

            Notification::send(
                $user,
                $notification->withChannels($channels),
            );
        }
    }
}

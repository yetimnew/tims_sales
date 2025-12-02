<?php

namespace App\Listeners;

use App\Events\UserCreated;
use App\Events\UserDeleted;
use App\Events\UserUpdated;
use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\UserLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendUserLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof UserCreated) {
            $user = $event->subject->loadMissing('roles', 'permissions');

            $payload = $this->userPayload($user);
            $payload['actor'] = $this->actorPayload($event->actor);

            $reference = $payload['user']['email'] ?? $payload['user']['name'] ?? '#'.$user->getKey();
            $message = sprintf('User %s was created.', $reference);

            $this->dispatcher->dispatch(NotificationType::USER_CREATED, function (NotificationType $type) use ($payload, $message) {
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
            $user = $event->subject->loadMissing('roles', 'permissions');

            $payload = $this->userPayload($user);
            $payload['changes'] = $event->changes;
            $payload['actor'] = $this->actorPayload($event->actor);

            $reference = $payload['user']['email'] ?? $payload['user']['name'] ?? '#'.$user->getKey();
            $message = sprintf('User %s was updated.', $reference);

            $this->dispatcher->dispatch(NotificationType::USER_UPDATED, function (NotificationType $type) use ($payload, $message) {
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
                'user' => array_filter([
                    'id' => $event->userId,
                    'name' => $event->name,
                    'email' => $event->attributes['email'] ?? null,
                    'roles' => $event->attributes['roles'] ?? null,
                ], static fn ($value) => $value !== null && $value !== []),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $reference = $payload['user']['email'] ?? $payload['user']['name'] ?? '#'.$payload['user']['id'];
            $message = sprintf('User %s was deleted.', $reference);

            $this->dispatcher->dispatch(NotificationType::USER_DELETED, function (NotificationType $type) use ($payload, $message) {
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
    private function actorPayload(?User $actor): array
    {
        if ($actor === null) {
            return [];
        }

        return array_filter([
            'id' => $actor->getKey(),
            'name' => $actor->name,
            'email' => $actor->email,
        ], static fn ($value) => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function userPayload(User $user): array
    {
        return array_filter([
            'user' => array_filter([
                'id' => $user->getKey(),
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->filter()->values()->all(),
            ], static fn ($value) => $value !== null && $value !== []),
            'metrics' => array_filter([
                'status' => $user->email_verified_at === null ? 'pending' : 'verified',
                'roles' => $user->roles->count(),
                'permissions' => method_exists($user, 'permissions') ? $user->permissions->count() : null,
            ], static fn ($value) => $value !== null),
        ], static fn ($value) => $value !== null && $value !== []);
    }
}

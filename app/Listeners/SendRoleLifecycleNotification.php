<?php

namespace App\Listeners;

use App\Events\RoleCreated;
use App\Events\RoleDeleted;
use App\Events\RoleUpdated;
use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\RoleLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;
use Spatie\Permission\Models\Role;

class SendRoleLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof RoleCreated) {
            $role = $event->role->load('permissions')->loadCount('users');

            $payload = $this->rolePayload($role);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->roleLabel($role->name, $role->id);
            $message = sprintf('Role %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::ROLE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new RoleLifecycleNotification(
                    $type,
                    'Role Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof RoleUpdated) {
            $role = $event->role->load('permissions')->loadCount('users');

            $payload = $this->rolePayload($role);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->roleLabel($role->name, $role->id);
            $message = sprintf('Role %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::ROLE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new RoleLifecycleNotification(
                    $type,
                    'Role Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof RoleDeleted) {
            $payload = [
                'role_id' => $event->roleId,
                'name' => $event->roleName,
                'attributes' => $event->attributes,
                'permissions' => $event->permissions,
                'actor' => $this->actorPayload($event->actor),
            ];

            $label = $this->roleLabel($event->roleName, $event->roleId);
            $message = sprintf('Role %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::ROLE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new RoleLifecycleNotification(
                    $type,
                    'Role Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function rolePayload(Role $role): array
    {
        $permissions = $role->permissions->pluck('name')->filter()->values()->all();

        $metrics = array_filter([
            'permissions' => count($permissions),
            'users' => $role->getAttribute('users_count'),
        ], static fn ($value) => $value !== null);

        return array_filter([
            'role_id' => $role->id,
            'name' => $role->name,
            'guard' => $role->guard_name,
            'permissions' => $permissions,
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function roleLabel(?string $name, int $fallbackId): string
    {
        $trimmed = trim((string) $name);

        if ($trimmed === '') {
            return '#'.$fallbackId;
        }

        return $trimmed;
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
        ], static fn ($value) => $value !== null);
    }
}

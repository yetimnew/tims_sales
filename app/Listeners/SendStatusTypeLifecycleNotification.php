<?php

namespace App\Listeners;

use App\Events\StatusTypeCreated;
use App\Events\StatusTypeDeleted;
use App\Events\StatusTypeUpdated;
use App\Models\NotificationType;
use App\Models\StatusType;
use App\Models\User;
use App\Notifications\StatusTypeLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendStatusTypeLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof StatusTypeCreated) {
            $statusType = $event->statusType->loadCount('statuses');

            $payload = $this->statusTypePayload($statusType);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->statusTypeLabel($statusType->name, $statusType->id);
            $message = sprintf('Status type %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::STATUS_TYPE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new StatusTypeLifecycleNotification(
                    $type,
                    'Status Type Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof StatusTypeUpdated) {
            $statusType = $event->statusType->loadCount('statuses');

            $payload = $this->statusTypePayload($statusType);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->statusTypeLabel($statusType->name, $statusType->id);
            $message = sprintf('Status type %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::STATUS_TYPE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new StatusTypeLifecycleNotification(
                    $type,
                    'Status Type Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof StatusTypeDeleted) {
            $payload = array_filter([
                'status_type_id' => $event->statusTypeId,
                'name' => $event->statusTypeName,
                'attributes' => $event->attributes,
                'metrics' => $event->metrics,
                'actor' => $this->actorPayload($event->actor),
            ], static fn ($value) => $value !== null && $value !== []);

            $label = $this->statusTypeLabel($event->statusTypeName, $event->statusTypeId);
            $message = sprintf('Status type %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::STATUS_TYPE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new StatusTypeLifecycleNotification(
                    $type,
                    'Status Type Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function statusTypePayload(StatusType $statusType): array
    {
        $metrics = [];

        if (($count = $statusType->getAttribute('statuses_count')) !== null) {
            $metrics['statuses'] = (int) $count;
        }

        return array_filter([
            'status_type_id' => $statusType->id,
            'name' => $statusType->name,
            'description' => $statusType->description,
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== '' && $value !== []);
    }

    private function statusTypeLabel(?string $name, int $fallbackId): string
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

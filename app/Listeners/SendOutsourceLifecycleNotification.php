<?php

namespace App\Listeners;

use App\Events\OutsourceCreated;
use App\Events\OutsourceDeleted;
use App\Events\OutsourceUpdated;
use App\Models\NotificationType;
use App\Models\Outsource;
use App\Models\User;
use App\Notifications\OutsourceLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOutsourceLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof OutsourceCreated) {
            $outsource = $event->outsource->loadCount('outsourcePerformances');

            $payload = $this->outsourcePayload($outsource);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->outsourceLabel($outsource->name, $outsource->id);
            $message = sprintf('Outsource vendor %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourceLifecycleNotification(
                    $type,
                    'Outsource Vendor Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OutsourceUpdated) {
            $outsource = $event->outsource->loadCount('outsourcePerformances');

            $payload = $this->outsourcePayload($outsource);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->outsourceLabel($outsource->name, $outsource->id);
            $message = sprintf('Outsource vendor %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourceLifecycleNotification(
                    $type,
                    'Outsource Vendor Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OutsourceDeleted) {
            $label = $this->outsourceLabel($event->outsourceName, $event->outsourceId);

            $payload = [
                'outsource_id' => $event->outsourceId,
                'name' => $event->outsourceName,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Outsource vendor %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourceLifecycleNotification(
                    $type,
                    'Outsource Vendor Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function outsourcePayload(Outsource $outsource): array
    {
        $metrics = array_filter([
            'performances' => $outsource->outsource_performances_count ?? null,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'outsource_id' => $outsource->id,
            'name' => $outsource->name,
            'contact_person' => $outsource->contact_person,
            'phone' => $outsource->phone,
            'email' => $outsource->email,
            'service_type' => $outsource->service_type,
            'status' => $outsource->status,
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function outsourceLabel(?string $name, int $fallbackId): string
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

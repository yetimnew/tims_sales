<?php

namespace App\Listeners;

use App\Events\TruckCreated;
use App\Events\TruckDeleted;
use App\Events\TruckUpdated;
use App\Models\NotificationType;
use App\Notifications\TruckLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendTruckLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof TruckCreated) {
            $plate = $event->truck->plate;
            $actorName = $event->actor?->name;
            $payload = [
                'truck_id' => $event->truck->id,
                'plate' => $plate,
                'actor' => $this->actorPayload($actorName, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::TRUCK_CREATED, function (NotificationType $type) use ($plate, $actorName, $payload) {
                $message = sprintf('Truck %s was created%s.', $plate, $actorName ? " by {$actorName}" : '');

                return new TruckLifecycleNotification(
                    $type,
                    'Truck Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof TruckUpdated) {
            $plate = $event->truck->plate;
            $actorName = $event->actor?->name;
            $payload = [
                'truck_id' => $event->truck->id,
                'plate' => $plate,
                'changes' => $event->changes,
                'actor' => $this->actorPayload($actorName, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::TRUCK_UPDATED, function (NotificationType $type) use ($plate, $actorName, $payload) {
                $message = sprintf('Truck %s was updated%s.', $plate, $actorName ? " by {$actorName}" : '');

                return new TruckLifecycleNotification(
                    $type,
                    'Truck Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof TruckDeleted) {
            $plate = $event->plate;
            $actorName = $event->actor?->name;
            $payload = [
                'truck_id' => $event->truckId,
                'plate' => $plate,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($actorName, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::TRUCK_DELETED, function (NotificationType $type) use ($plate, $actorName, $payload) {
                $message = sprintf('Truck %s was deleted%s.', $plate, $actorName ? " by {$actorName}" : '');

                return new TruckLifecycleNotification(
                    $type,
                    'Truck Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function actorPayload(?string $name, ?int $id): array
    {
        return array_filter([
            'id' => $id,
            'name' => $name,
        ], static fn ($value) => $value !== null);
    }
}

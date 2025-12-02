<?php

namespace App\Listeners;

use App\Events\CargoTypeCreated;
use App\Events\CargoTypeDeleted;
use App\Events\CargoTypeUpdated;
use App\Models\NotificationType;
use App\Notifications\CargoTypeLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendCargoTypeLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof CargoTypeCreated) {
            $cargoType = $event->cargoType;

            $payload = [
                'cargo_type_id' => $cargoType->id,
                'name' => $cargoType->name,
                'category' => $cargoType->category,
                'requires_special_equipment' => (bool) $cargoType->requires_special_equipment,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $cargoType->name !== null
                ? sprintf('Cargo type %s was created.', $cargoType->name)
                : 'A cargo type was created.';

            $this->dispatcher->dispatch(NotificationType::CARGO_TYPE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new CargoTypeLifecycleNotification(
                    $type,
                    'Cargo Type Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof CargoTypeUpdated) {
            $cargoType = $event->cargoType;

            $payload = [
                'cargo_type_id' => $cargoType->id,
                'name' => $cargoType->name,
                'category' => $cargoType->category,
                'requires_special_equipment' => (bool) $cargoType->requires_special_equipment,
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $cargoType->name !== null
                ? sprintf('Cargo type %s was updated.', $cargoType->name)
                : 'A cargo type was updated.';

            $this->dispatcher->dispatch(NotificationType::CARGO_TYPE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new CargoTypeLifecycleNotification(
                    $type,
                    'Cargo Type Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof CargoTypeDeleted) {
            $payload = [
                'cargo_type_id' => $event->cargoTypeId,
                'name' => $event->name,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $event->name !== null
                ? sprintf('Cargo type %s was deleted.', $event->name)
                : 'A cargo type was deleted.';

            $this->dispatcher->dispatch(NotificationType::CARGO_TYPE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new CargoTypeLifecycleNotification(
                    $type,
                    'Cargo Type Deleted',
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

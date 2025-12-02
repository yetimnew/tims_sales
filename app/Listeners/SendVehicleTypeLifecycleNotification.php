<?php

namespace App\Listeners;

use App\Events\VehicleTypeCreated;
use App\Events\VehicleTypeDeleted;
use App\Events\VehicleTypeUpdated;
use App\Models\NotificationType;
use App\Notifications\VehicleTypeLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendVehicleTypeLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof VehicleTypeCreated) {
            $vehicleType = $event->vehicleType;

            $payload = [
                'vehicle_type_id' => $vehicleType->id,
                'name' => $vehicleType->name,
                'description' => $vehicleType->description,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $vehicleType->name !== null
                ? sprintf('Vehicle type %s was created.', $vehicleType->name)
                : 'A vehicle type was created.';

            $this->dispatcher->dispatch(NotificationType::VEHICLE_TYPE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new VehicleTypeLifecycleNotification(
                    $type,
                    'Vehicle Type Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof VehicleTypeUpdated) {
            $vehicleType = $event->vehicleType;

            $payload = [
                'vehicle_type_id' => $vehicleType->id,
                'name' => $vehicleType->name,
                'description' => $vehicleType->description,
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $vehicleType->name !== null
                ? sprintf('Vehicle type %s was updated.', $vehicleType->name)
                : 'A vehicle type was updated.';

            $this->dispatcher->dispatch(NotificationType::VEHICLE_TYPE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new VehicleTypeLifecycleNotification(
                    $type,
                    'Vehicle Type Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof VehicleTypeDeleted) {
            $payload = [
                'vehicle_type_id' => $event->vehicleTypeId,
                'name' => $event->name,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $event->name !== null
                ? sprintf('Vehicle type %s was deleted.', $event->name)
                : 'A vehicle type was deleted.';

            $this->dispatcher->dispatch(NotificationType::VEHICLE_TYPE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new VehicleTypeLifecycleNotification(
                    $type,
                    'Vehicle Type Deleted',
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

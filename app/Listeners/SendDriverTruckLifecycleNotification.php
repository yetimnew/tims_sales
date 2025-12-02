<?php

namespace App\Listeners;

use App\Events\DriverTruckCreated;
use App\Events\DriverTruckDeleted;
use App\Events\DriverTruckUpdated;
use App\Models\NotificationType;
use App\Notifications\DriverTruckLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDriverTruckLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof DriverTruckCreated) {
            $assignment = $event->assignment->loadMissing(['driver', 'truck']);

            $payload = [
                'assignment_id' => $assignment->id,
                'driver' => $this->driverPayload((string) $assignment->driver?->name, $assignment->driver?->id, $assignment->driver?->driverid ?? $assignment->driverid),
                'truck' => $this->truckPayload($assignment->truck?->id, $assignment->truck?->plate ?? $assignment->plate),
                'status' => $assignment->status,
                'is_attached' => (bool) $assignment->is_attached,
                'dates' => [
                    'received' => $assignment->date_recived?->toDateString(),
                    'detached' => $assignment->date_detach?->toDateString(),
                ],
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $driverLabel = trim(implode(' ', array_filter([$assignment->driver?->name, $assignment->driver?->driverid])));
            $truckPlate = $assignment->truck?->plate ?? $assignment->plate;

            $message = match (true) {
                $driverLabel !== '' && $truckPlate !== null => sprintf('Driver %s was assigned to truck %s.', $driverLabel, $truckPlate),
                $driverLabel !== '' => sprintf('Driver %s was assigned to a truck.', $driverLabel),
                $truckPlate !== null => sprintf('A driver was assigned to truck %s.', $truckPlate),
                default => 'A driver-truck assignment was created.',
            };

            $this->dispatcher->dispatch(NotificationType::DRIVER_TRUCK_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new DriverTruckLifecycleNotification(
                    $type,
                    'Driver-Truck Assignment Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverTruckUpdated) {
            $assignment = $event->assignment->loadMissing(['driver', 'truck']);

            $payload = [
                'assignment_id' => $assignment->id,
                'driver' => $this->driverPayload((string) $assignment->driver?->name, $assignment->driver?->id, $assignment->driver?->driverid ?? $assignment->driverid),
                'truck' => $this->truckPayload($assignment->truck?->id, $assignment->truck?->plate ?? $assignment->plate),
                'status' => $assignment->status,
                'is_attached' => (bool) $assignment->is_attached,
                'dates' => [
                    'received' => $assignment->date_recived?->toDateString(),
                    'detached' => $assignment->date_detach?->toDateString(),
                ],
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $driverLabel = trim(implode(' ', array_filter([$assignment->driver?->name, $assignment->driver?->driverid])));
            $truckPlate = $assignment->truck?->plate ?? $assignment->plate;

            $message = match (true) {
                $driverLabel !== '' && $truckPlate !== null => sprintf('Assignment for driver %s and truck %s was updated.', $driverLabel, $truckPlate),
                $driverLabel !== '' => sprintf('Assignment for driver %s was updated.', $driverLabel),
                $truckPlate !== null => sprintf('Assignment for truck %s was updated.', $truckPlate),
                default => 'A driver-truck assignment was updated.',
            };

            $this->dispatcher->dispatch(NotificationType::DRIVER_TRUCK_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new DriverTruckLifecycleNotification(
                    $type,
                    'Driver-Truck Assignment Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverTruckDeleted) {
            $payload = [
                'assignment_id' => $event->assignmentId,
                'driver' => $this->driverPayload($event->driverName, $event->driverId, null),
                'truck' => $this->truckPayload($event->truckId, $event->truckPlate),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $driverLabel = trim((string) $event->driverName);
            $truckPlate = $event->truckPlate;

            $message = match (true) {
                $driverLabel !== '' && $truckPlate !== null => sprintf('Assignment between driver %s and truck %s was deleted.', $driverLabel, $truckPlate),
                $driverLabel !== '' => sprintf('Assignment for driver %s was deleted.', $driverLabel),
                $truckPlate !== null => sprintf('Assignment for truck %s was deleted.', $truckPlate),
                default => 'A driver-truck assignment was deleted.',
            };

            $this->dispatcher->dispatch(NotificationType::DRIVER_TRUCK_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new DriverTruckLifecycleNotification(
                    $type,
                    'Driver-Truck Assignment Deleted',
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

    /**
     * @return array<string, mixed>
     */
    private function driverPayload(?string $name, ?int $id, ?string $code): array
    {
        return array_filter([
            'id' => $id,
            'name' => $name,
            'code' => $code,
        ], static fn ($value) => $value !== null);
    }

    /**
     * @return array<string, mixed>
     */
    private function truckPayload(?int $id, ?string $plate): array
    {
        return array_filter([
            'id' => $id,
            'plate' => $plate,
        ], static fn ($value) => $value !== null);
    }
}

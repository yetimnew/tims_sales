<?php

namespace App\Listeners;

use App\Events\DriverCreated;
use App\Events\DriverDeleted;
use App\Events\DriverUpdated;
use App\Models\NotificationType;
use App\Notifications\DriverLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDriverLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof DriverCreated) {
            $driver = $event->driver;

            $payload = [
                'driver_id' => $driver->id,
                'driver_code' => $driver->driverid,
                'name' => $driver->name,
                'status' => $driver->status,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::DRIVER_CREATED, function (NotificationType $type) use ($driver, $payload) {
                $identifier = trim(implode(' ', array_filter([$driver->name, $driver->driverid])));
                $message = $identifier === ''
                    ? 'A driver was created.'
                    : sprintf('Driver %s was created.', $identifier);

                return new DriverLifecycleNotification(
                    $type,
                    'Driver Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverUpdated) {
            $driver = $event->driver;

            $payload = [
                'driver_id' => $driver->id,
                'driver_code' => $driver->driverid,
                'name' => $driver->name,
                'status' => $driver->status,
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::DRIVER_UPDATED, function (NotificationType $type) use ($driver, $payload) {
                $identifier = trim(implode(' ', array_filter([$driver->name, $driver->driverid])));
                $message = $identifier === ''
                    ? 'A driver was updated.'
                    : sprintf('Driver %s was updated.', $identifier);

                return new DriverLifecycleNotification(
                    $type,
                    'Driver Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverDeleted) {
            $payload = [
                'driver_id' => $event->driverId,
                'driver_code' => $event->driverCode,
                'name' => $event->driverName,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $this->dispatcher->dispatch(NotificationType::DRIVER_DELETED, function (NotificationType $type) use ($event, $payload) {
                $identifier = trim(implode(' ', array_filter([$event->driverName, $event->driverCode])));
                $message = $identifier === ''
                    ? 'A driver was deleted.'
                    : sprintf('Driver %s was deleted.', $identifier);

                return new DriverLifecycleNotification(
                    $type,
                    'Driver Deleted',
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

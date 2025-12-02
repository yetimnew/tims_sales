<?php

namespace App\Listeners;

use App\Events\DriverSafetyRecordCreated;
use App\Events\DriverSafetyRecordDeleted;
use App\Events\DriverSafetyRecordUpdated;
use App\Models\NotificationType;
use App\Notifications\DriverSafetyLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDriverSafetyLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof DriverSafetyRecordCreated) {
            $record = $event->safetyRecord->loadMissing('driver');

            $payload = [
                'safety_record_id' => $record->id,
                'incident_type' => $record->incident_type,
                'severity' => $record->severity,
                'incident_date' => $record->incident_date?->toDateString(),
                'driver' => $this->driverPayload($record->driver?->id, $record->driver?->name),
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $driverName = $record->driver?->name;
            $message = match (true) {
                $driverName !== null && $record->incident_type !== null => sprintf('Safety incident (%s) was recorded for driver %s.', $record->incident_type, $driverName),
                $driverName !== null => sprintf('A safety incident was recorded for driver %s.', $driverName),
                default => 'A driver safety record was created.',
            };

            $this->dispatcher->dispatch(NotificationType::DRIVER_SAFETY_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new DriverSafetyLifecycleNotification(
                    $type,
                    'Driver Safety Record Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverSafetyRecordUpdated) {
            $record = $event->safetyRecord->loadMissing('driver');

            $payload = [
                'safety_record_id' => $record->id,
                'incident_type' => $record->incident_type,
                'severity' => $record->severity,
                'incident_date' => $record->incident_date?->toDateString(),
                'driver' => $this->driverPayload($record->driver?->id, $record->driver?->name),
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $driverName = $record->driver?->name;
            $message = $driverName !== null
                ? sprintf('A safety record for driver %s was updated.', $driverName)
                : 'A driver safety record was updated.';

            $this->dispatcher->dispatch(NotificationType::DRIVER_SAFETY_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new DriverSafetyLifecycleNotification(
                    $type,
                    'Driver Safety Record Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DriverSafetyRecordDeleted) {
            $payload = [
                'safety_record_id' => $event->safetyRecordId,
                'driver' => $this->driverPayload($event->driverId, $event->driverName),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $event->driverName !== null
                ? sprintf('A safety record for driver %s was deleted.', $event->driverName)
                : 'A driver safety record was deleted.';

            $this->dispatcher->dispatch(NotificationType::DRIVER_SAFETY_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new DriverSafetyLifecycleNotification(
                    $type,
                    'Driver Safety Record Deleted',
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
    private function driverPayload(?int $id, ?string $name): array
    {
        return array_filter([
            'id' => $id,
            'name' => $name,
        ], static fn ($value) => $value !== null);
    }
}

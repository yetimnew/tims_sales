<?php

namespace App\Listeners;

use App\Events\ZoneCreated;
use App\Events\ZoneDeleted;
use App\Events\ZoneUpdated;
use App\Models\NotificationType;
use App\Models\User;
use App\Models\Zone;
use App\Notifications\ZoneLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendZoneLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof ZoneCreated) {
            $zone = $event->zone->loadMissing('region')->loadCount('woredas');

            $payload = $this->zonePayload($zone);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->zoneLabel($zone->name, $zone->id);
            $message = sprintf('Zone %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::ZONE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new ZoneLifecycleNotification(
                    $type,
                    'Zone Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof ZoneUpdated) {
            $zone = $event->zone->loadMissing('region')->loadCount('woredas');

            $payload = $this->zonePayload($zone);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->zoneLabel($zone->name, $zone->id);
            $message = sprintf('Zone %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::ZONE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new ZoneLifecycleNotification(
                    $type,
                    'Zone Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof ZoneDeleted) {
            $label = $this->zoneLabel($event->zoneName, $event->zoneId);

            $payload = [
                'zone_id' => $event->zoneId,
                'name' => $event->zoneName,
                'region' => array_filter([
                    'id' => $event->regionId,
                ], static fn ($value) => $value !== null),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Zone %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::ZONE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new ZoneLifecycleNotification(
                    $type,
                    'Zone Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function zonePayload(Zone $zone): array
    {
        $metrics = array_filter([
            'woredas' => $zone->woredas_count ?? null,
            'population' => $zone->population,
            'area_km2' => $zone->area_km2,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'zone_id' => $zone->id,
            'name' => $zone->name,
            'code' => $zone->code,
            'status' => $zone->status,
            'region' => $zone->region === null ? null : array_filter([
                'id' => $zone->region->getKey(),
                'name' => $zone->region->name,
            ], static fn ($value) => $value !== null),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function zoneLabel(?string $name, int $fallbackId): string
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

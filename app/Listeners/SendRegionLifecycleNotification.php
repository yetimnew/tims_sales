<?php

namespace App\Listeners;

use App\Events\RegionCreated;
use App\Events\RegionDeleted;
use App\Events\RegionUpdated;
use App\Models\NotificationType;
use App\Models\Region;
use App\Models\User;
use App\Notifications\RegionLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendRegionLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof RegionCreated) {
            $region = $event->region->loadCount('zones');

            $payload = $this->regionPayload($region);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->regionLabel($region->name, $region->id);
            $message = sprintf('Region %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::REGION_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new RegionLifecycleNotification(
                    $type,
                    'Region Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof RegionUpdated) {
            $region = $event->region->loadCount('zones');

            $payload = $this->regionPayload($region);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->regionLabel($region->name, $region->id);
            $message = sprintf('Region %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::REGION_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new RegionLifecycleNotification(
                    $type,
                    'Region Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof RegionDeleted) {
            $label = $this->regionLabel($event->regionName, $event->regionId);

            $payload = [
                'region_id' => $event->regionId,
                'name' => $event->regionName,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Region %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::REGION_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new RegionLifecycleNotification(
                    $type,
                    'Region Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function regionPayload(Region $region): array
    {
        $metrics = array_filter([
            'zones' => $region->zones_count ?? null,
            'population' => $region->population,
            'area_km2' => $region->area_km2,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'region_id' => $region->id,
            'name' => $region->name,
            'code' => $region->code,
            'status' => $region->status,
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function regionLabel(?string $name, int $fallbackId): string
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

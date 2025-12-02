<?php

namespace App\Listeners;

use App\Events\WoredaCreated;
use App\Events\WoredaDeleted;
use App\Events\WoredaUpdated;
use App\Models\NotificationType;
use App\Models\User;
use App\Models\Woreda;
use App\Notifications\WoredaLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendWoredaLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof WoredaCreated) {
            $woreda = $event->woreda->loadMissing('zone.region')->loadCount('places');

            $payload = $this->woredaPayload($woreda);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->woredaLabel($woreda->name, $woreda->id);
            $message = sprintf('Woreda %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::WOREDA_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new WoredaLifecycleNotification(
                    $type,
                    'Woreda Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof WoredaUpdated) {
            $woreda = $event->woreda->loadMissing('zone.region')->loadCount('places');

            $payload = $this->woredaPayload($woreda);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->woredaLabel($woreda->name, $woreda->id);
            $message = sprintf('Woreda %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::WOREDA_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new WoredaLifecycleNotification(
                    $type,
                    'Woreda Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof WoredaDeleted) {
            $label = $this->woredaLabel($event->woredaName, $event->woredaId);

            $payload = [
                'woreda_id' => $event->woredaId,
                'name' => $event->woredaName,
                'zone' => array_filter([
                    'id' => $event->zoneId,
                ], static fn ($value) => $value !== null),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Woreda %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::WOREDA_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new WoredaLifecycleNotification(
                    $type,
                    'Woreda Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function woredaPayload(Woreda $woreda): array
    {
        $metrics = array_filter([
            'places' => $woreda->places_count ?? null,
            'population' => $woreda->population,
            'area_km2' => $woreda->area_km2,
        ], static fn ($value) => $value !== null);

        $zone = $woreda->zone;
        $region = $zone?->region;

        return array_filter([
            'woreda_id' => $woreda->id,
            'name' => $woreda->name,
            'code' => $woreda->code,
            'status' => $woreda->status,
            'zone' => $zone === null ? null : array_filter([
                'id' => $zone->getKey(),
                'name' => $zone->name,
            ], static fn ($value) => $value !== null),
            'region' => $region === null ? null : array_filter([
                'id' => $region->getKey(),
                'name' => $region->name,
            ], static fn ($value) => $value !== null),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function woredaLabel(?string $name, int $fallbackId): string
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

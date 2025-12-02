<?php

namespace App\Listeners;

use App\Events\PlaceCreated;
use App\Events\PlaceDeleted;
use App\Events\PlaceUpdated;
use App\Models\NotificationType;
use App\Models\Place;
use App\Models\User;
use App\Notifications\PlaceLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPlaceLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof PlaceCreated) {
            $place = $event->place->loadMissing('woreda.zone')->loadCount(['originPerformances', 'destinationPerformances']);

            $payload = $this->placePayload($place);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->placeLabel($place->name, $place->id);
            $message = sprintf('Place %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::PLACE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new PlaceLifecycleNotification(
                    $type,
                    'Place Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof PlaceUpdated) {
            $place = $event->place->loadMissing('woreda.zone')->loadCount(['originPerformances', 'destinationPerformances']);

            $payload = $this->placePayload($place);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->placeLabel($place->name, $place->id);
            $message = sprintf('Place %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::PLACE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new PlaceLifecycleNotification(
                    $type,
                    'Place Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof PlaceDeleted) {
            $label = $this->placeLabel($event->placeName, $event->placeId);

            $payload = [
                'place_id' => $event->placeId,
                'name' => $event->placeName,
                'woreda' => array_filter([
                    'id' => $event->woredaId,
                ], static fn ($value) => $value !== null),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Place %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::PLACE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new PlaceLifecycleNotification(
                    $type,
                    'Place Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function placePayload(Place $place): array
    {
        $metrics = array_filter([
            'origins' => $place->origin_performances_count ?? null,
            'destinations' => $place->destination_performances_count ?? null,
            'population' => $place->population,
            'accessibility_score' => $place->accessibility_score,
        ], static fn ($value) => $value !== null);

        $woreda = $place->woreda;
        $zone = $woreda?->zone;

        return array_filter([
            'place_id' => $place->id,
            'name' => $place->name,
            'code' => $place->code,
            'status' => $place->status,
            'is_logistics_hub' => $place->is_logistics_hub,
            'woreda' => $woreda === null ? null : array_filter([
                'id' => $woreda->getKey(),
                'name' => $woreda->name,
            ], static fn ($value) => $value !== null),
            'zone' => $zone === null ? null : array_filter([
                'id' => $zone->getKey(),
                'name' => $zone->name,
            ], static fn ($value) => $value !== null),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function placeLabel(?string $name, int $fallbackId): string
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

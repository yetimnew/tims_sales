<?php

namespace App\Listeners;

use App\Events\DistanceCreated;
use App\Events\DistanceDeleted;
use App\Events\DistanceUpdated;
use App\Models\Distance;
use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\DistanceLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDistanceLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof DistanceCreated) {
            $distance = $event->distance->loadMissing(['fromPlace.woreda.zone', 'toPlace.woreda.zone']);

            $payload = $this->distancePayload($distance);
            $payload['actor'] = $this->actorPayload($event->actor);

            $message = sprintf('Distance %s was created.', $this->routeLabel($distance));

            $this->dispatcher->dispatch(NotificationType::DISTANCE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new DistanceLifecycleNotification(
                    $type,
                    'Distance Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DistanceUpdated) {
            $distance = $event->distance->loadMissing(['fromPlace.woreda.zone', 'toPlace.woreda.zone']);

            $payload = $this->distancePayload($distance);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $message = sprintf('Distance %s was updated.', $this->routeLabel($distance));

            $this->dispatcher->dispatch(NotificationType::DISTANCE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new DistanceLifecycleNotification(
                    $type,
                    'Distance Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DistanceDeleted) {
            $payload = [
                'distance_id' => $event->distanceId,
                'from_place' => array_filter([
                    'id' => $event->fromPlaceId,
                ], static fn ($value) => $value !== null),
                'to_place' => array_filter([
                    'id' => $event->toPlaceId,
                ], static fn ($value) => $value !== null),
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Distance #%d was deleted.', $event->distanceId);

            $this->dispatcher->dispatch(NotificationType::DISTANCE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new DistanceLifecycleNotification(
                    $type,
                    'Distance Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function distancePayload(Distance $distance): array
    {
        $from = $distance->fromPlace;
        $to = $distance->toPlace;

        $metrics = array_filter([
            'estimated_time_hours' => $distance->estimated_time_hours,
            'average_speed_kmph' => $distance->average_speed_kmph,
            'road_quality_index' => $distance->road_quality_index,
            'toll_road' => $distance->toll_road,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'distance_id' => $distance->id,
            'distance_km' => $distance->distance_km,
            'status' => $distance->status,
            'route_type' => $distance->route_type,
            'from_place' => $from === null ? null : array_filter([
                'id' => $from->getKey(),
                'name' => $from->name,
            ], static fn ($value) => $value !== null),
            'to_place' => $to === null ? null : array_filter([
                'id' => $to->getKey(),
                'name' => $to->name,
            ], static fn ($value) => $value !== null),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function routeLabel(Distance $distance): string
    {
        $from = trim((string) ($distance->fromPlace?->name ?? ''));
        $to = trim((string) ($distance->toPlace?->name ?? ''));

        if ($from === '' && $to === '') {
            return '#'.$distance->id;
        }

        if ($from === '' || $to === '') {
            return $from !== '' ? $from : $to;
        }

        return sprintf('%s -> %s', $from, $to);
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

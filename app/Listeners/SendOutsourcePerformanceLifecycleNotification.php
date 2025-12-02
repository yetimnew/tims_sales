<?php

namespace App\Listeners;

use App\Events\OutsourcePerformanceCreated;
use App\Events\OutsourcePerformanceDeleted;
use App\Events\OutsourcePerformanceUpdated;
use App\Models\NotificationType;
use App\Models\OutsourcePerformance;
use App\Models\User;
use App\Notifications\OutsourcePerformanceLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOutsourcePerformanceLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof OutsourcePerformanceCreated) {
            $performance = $event->performance->load([
                'outsource:id,name',
                'operation:id,operationid,customer_id',
                'operation.customer:id,name',
                'fromPlace:id,name',
                'toPlace:id,name',
            ]);

            $payload = $this->performancePayload($performance);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->performanceLabel($performance->trip_number, $performance->id);
            $message = sprintf('Outsource performance %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_PERFORMANCE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourcePerformanceLifecycleNotification(
                    $type,
                    'Outsource Performance Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OutsourcePerformanceUpdated) {
            $performance = $event->performance->load([
                'outsource:id,name',
                'operation:id,operationid,customer_id',
                'operation.customer:id,name',
                'fromPlace:id,name',
                'toPlace:id,name',
            ]);

            $payload = $this->performancePayload($performance);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->performanceLabel($performance->trip_number, $performance->id);
            $message = sprintf('Outsource performance %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_PERFORMANCE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourcePerformanceLifecycleNotification(
                    $type,
                    'Outsource Performance Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OutsourcePerformanceDeleted) {
            $label = $this->performanceLabel($event->tripNumber, $event->performanceId);

            $payload = [
                'performance_id' => $event->performanceId,
                'trip_number' => $event->tripNumber,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Outsource performance %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::OUTSOURCE_PERFORMANCE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new OutsourcePerformanceLifecycleNotification(
                    $type,
                    'Outsource Performance Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function performancePayload(OutsourcePerformance $performance): array
    {
        $metrics = array_filter([
            'distance_km' => $performance->distance_km === null ? null : (float) $performance->distance_km,
            'cargo_volume_mt' => $performance->cargo_volume_mt === null ? null : (float) $performance->cargo_volume_mt,
            'tonkm' => $performance->tonkm === null ? null : (float) $performance->tonkm,
            'cost' => $performance->cost === null ? null : (float) $performance->cost,
        ], static fn ($value) => $value !== null);

        $operation = $performance->operation;
        $outsource = $performance->outsource;
        $fromPlace = $performance->fromPlace;
        $toPlace = $performance->toPlace;

        return array_filter([
            'performance_id' => $performance->id,
            'trip_number' => $performance->trip_number,
            'status' => $performance->status,
            'dispatch_date' => $performance->dispatch_date?->toDateString(),
            'outsource' => $outsource === null ? null : array_filter([
                'id' => $outsource->getKey(),
                'name' => $outsource->name,
            ], static fn ($value) => $value !== null),
            'operation' => $operation === null ? null : array_filter([
                'id' => $operation->getKey(),
                'reference' => $operation->operationid,
                'customer' => $operation->customer === null ? null : array_filter([
                    'id' => $operation->customer->getKey(),
                    'name' => $operation->customer->name,
                ], static fn ($value) => $value !== null),
            ], static fn ($value) => $value !== null && $value !== []),
            'route' => array_filter([
                'from' => $fromPlace === null ? null : array_filter([
                    'id' => $fromPlace->getKey(),
                    'name' => $fromPlace->name,
                ], static fn ($value) => $value !== null),
                'to' => $toPlace === null ? null : array_filter([
                    'id' => $toPlace->getKey(),
                    'name' => $toPlace->name,
                ], static fn ($value) => $value !== null),
            ], static fn ($value) => $value !== null && $value !== []),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function performanceLabel(?string $tripNumber, int $fallbackId): string
    {
        $trimmed = trim((string) $tripNumber);

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

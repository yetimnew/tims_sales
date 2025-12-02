<?php

namespace App\Listeners;

use App\Events\PerformanceCreated;
use App\Events\PerformanceDeleted;
use App\Events\PerformanceUpdated;
use App\Models\NotificationType;
use App\Models\Performance;
use App\Models\User;
use App\Notifications\PerformanceLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendPerformanceLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof PerformanceCreated) {
            $performance = $event->performance->load([
                'operation.customer',
                'driverTruck.driver',
                'driverTruck.truck',
                'origin',
                'destination',
                'user',
            ]);

            $payload = $this->performancePayload($performance);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->performanceLabel($performance->FOnumber, $performance->id);
            $message = sprintf('Performance %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::PERFORMANCE_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new PerformanceLifecycleNotification(
                    $type,
                    'Performance Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof PerformanceUpdated) {
            $performance = $event->performance->load([
                'operation.customer',
                'driverTruck.driver',
                'driverTruck.truck',
                'origin',
                'destination',
                'user',
            ]);

            $payload = $this->performancePayload($performance);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->performanceLabel($performance->FOnumber, $performance->id);
            $message = sprintf('Performance %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::PERFORMANCE_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new PerformanceLifecycleNotification(
                    $type,
                    'Performance Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof PerformanceDeleted) {
            $label = $this->performanceLabel($event->performanceReference, $event->performanceId);

            $payload = [
                'performance_id' => $event->performanceId,
                'reference' => $event->performanceReference,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Performance %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::PERFORMANCE_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new PerformanceLifecycleNotification(
                    $type,
                    'Performance Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function performancePayload(Performance $performance): array
    {
        $operation = $performance->operation;
        $operationCustomer = $operation?->customer;
        $driverTruck = $performance->driverTruck;
        $driver = $driverTruck?->driver;
        $truck = $driverTruck?->truck;
        $origin = $performance->origin;
        $destination = $performance->destination;
        $author = $performance->user;

        $fuel = $performance->fuelInBirr;
        $perdiem = $performance->perdiem;
        $other = $performance->other;
        $totalCost = null;

        if ($fuel !== null || $perdiem !== null || $other !== null) {
            $totalCost = (float) (($fuel ?? 0) + ($perdiem ?? 0) + ($other ?? 0));
        }

        $metrics = array_filter([
            'distance_with_cargo' => $performance->DistanceWCargo === null ? null : (float) $performance->DistanceWCargo,
            'distance_without_cargo' => $performance->DistanceWOCargo === null ? null : (float) $performance->DistanceWOCargo,
            'tonnage' => $performance->CargoVolumMT === null ? null : (float) $performance->CargoVolumMT,
            'ton_km' => $performance->tonkm === null ? null : (float) $performance->tonkm,
            'fuel_cost' => $fuel === null ? null : (float) $fuel,
            'perdiem_cost' => $perdiem === null ? null : (float) $perdiem,
            'other_cost' => $other === null ? null : (float) $other,
            'total_cost' => $totalCost,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'performance_id' => $performance->id,
            'reference' => $performance->FOnumber,
            'status' => $performance->satus,
            'load_phase' => $performance->load_phase,
            'load_completion' => $performance->load_completion,
            'dispatch_date' => $performance->DateDispach?->toDateString(),
            'returned_date' => $performance->returned_date?->toDateString(),
            'is_returned' => $performance->is_returned,
            'operation' => $operation === null ? null : array_filter([
                'id' => $operation->getKey(),
                'reference' => $operation->operationid,
                'customer' => $operationCustomer === null ? null : array_filter([
                    'id' => $operationCustomer->getKey(),
                    'name' => $operationCustomer->name,
                ], static fn ($value) => $value !== null),
            ], static fn ($value) => $value !== null && $value !== []),
            'driver_truck' => $driverTruck === null ? null : array_filter([
                'id' => $driverTruck->getKey(),
                'plate' => $driverTruck->plate,
                'driver' => $driver === null ? null : array_filter([
                    'id' => $driver->getKey(),
                    'name' => $driver->name,
                ], static fn ($value) => $value !== null),
                'truck' => $truck === null ? null : array_filter([
                    'id' => $truck->getKey(),
                    'plate' => $truck->plate,
                ], static fn ($value) => $value !== null),
            ], static fn ($value) => $value !== null && $value !== []),
            'route' => array_filter([
                'origin' => $origin === null ? null : array_filter([
                    'id' => $origin->getKey(),
                    'name' => $origin->name,
                ], static fn ($value) => $value !== null),
                'destination' => $destination === null ? null : array_filter([
                    'id' => $destination->getKey(),
                    'name' => $destination->name,
                ], static fn ($value) => $value !== null),
            ], static fn ($value) => $value !== null && $value !== []),
            'author' => $author === null ? null : array_filter([
                'id' => $author->getKey(),
                'name' => $author->name,
            ], static fn ($value) => $value !== null),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function performanceLabel(?string $reference, int $fallbackId): string
    {
        $trimmed = trim((string) $reference);

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

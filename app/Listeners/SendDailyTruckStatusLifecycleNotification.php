<?php

namespace App\Listeners;

use App\Events\DailyTruckStatusCreated;
use App\Events\DailyTruckStatusDeleted;
use App\Events\DailyTruckStatusUpdated;
use App\Models\DailyTruckStatus;
use App\Models\NotificationType;
use App\Models\Status;
use App\Models\User;
use App\Notifications\DailyTruckStatusLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendDailyTruckStatusLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof DailyTruckStatusCreated) {
            $dailyStatus = $event->dailyTruckStatus->load([
                'truck:id,plate',
                'status:id,name,statustype_id',
                'status.statusType:id,name',
                'changedBy:id,name',
            ]);

            $payload = $this->dailyStatusPayload($dailyStatus);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->truckLabel(
                $dailyStatus->truck?->plate,
                ($dailyStatus->truck?->id) ?? $dailyStatus->truck_id
            );
            $message = sprintf('Truck %s status was set.', $label);

            $this->dispatcher->dispatch(NotificationType::DAILY_TRUCK_STATUS_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new DailyTruckStatusLifecycleNotification(
                    $type,
                    'Truck Status Assigned',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DailyTruckStatusUpdated) {
            $dailyStatus = $event->dailyTruckStatus->load([
                'truck:id,plate',
                'status:id,name,statustype_id',
                'status.statusType:id,name',
                'changedBy:id,name',
            ]);

            $payload = $this->dailyStatusPayload($dailyStatus);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $this->transformChanges($event->changes);

            $label = $this->truckLabel(
                $dailyStatus->truck?->plate,
                ($dailyStatus->truck?->id) ?? $dailyStatus->truck_id
            );
            $message = sprintf('Truck %s status was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::DAILY_TRUCK_STATUS_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new DailyTruckStatusLifecycleNotification(
                    $type,
                    'Truck Status Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof DailyTruckStatusDeleted) {
            $payload = array_filter([
                'daily_truck_status_id' => $event->dailyTruckStatusId,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ], static fn ($value) => $value !== null && $value !== []);

            $truckPlate = null;
            $truckId = null;

            if (isset($event->attributes['truck'])) {
                $truck = $event->attributes['truck'];
                $truckPlate = $truck['plate'] ?? null;
                $truckId = $truck['id'] ?? ($event->attributes['truck_id'] ?? null);
            } elseif (isset($event->attributes['truck_id'])) {
                $truckId = $event->attributes['truck_id'];
            }

            $label = $this->truckLabel($truckPlate, is_scalar($truckId) ? (int) $truckId : null);
            $message = sprintf('Truck %s status assignment was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::DAILY_TRUCK_STATUS_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new DailyTruckStatusLifecycleNotification(
                    $type,
                    'Truck Status Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function dailyStatusPayload(DailyTruckStatus $dailyStatus): array
    {
        $truck = $dailyStatus->truck;
        $status = $dailyStatus->status;
        $statusType = $status?->statusType;
        $changedBy = $dailyStatus->changedBy;

        return array_filter([
            'daily_truck_status_id' => $dailyStatus->id,
            'status_date' => $dailyStatus->status_date?->toDateString(),
            'notes' => $dailyStatus->notes,
            'truck' => $truck === null ? null : array_filter([
                'id' => $truck->getKey(),
                'plate' => $truck->plate,
            ], static fn ($value) => $value !== null && $value !== ''),
            'status' => $status === null ? null : array_filter([
                'id' => $status->getKey(),
                'name' => $status->name,
                'status_type' => $statusType === null ? null : array_filter([
                    'id' => $statusType->getKey(),
                    'name' => $statusType->name,
                ], static fn ($value) => $value !== null && $value !== ''),
            ], static fn ($value) => $value !== null && $value !== '' && $value !== []),
            'changed_by' => $changedBy === null ? null : array_filter([
                'id' => $changedBy->getKey(),
                'name' => $changedBy->name,
            ], static fn ($value) => $value !== null && $value !== ''),
            'changed_at' => optional($dailyStatus->updated_at ?? $dailyStatus->created_at)->toDateTimeString(),
        ], static fn ($value) => $value !== null && $value !== '' && $value !== []);
    }

    private function truckLabel(?string $plate, ?int $fallbackId): string
    {
        $trimmed = trim((string) $plate);

        if ($trimmed === '') {
            if ($fallbackId === null) {
                return '#unknown';
            }

            return '#'.$fallbackId;
        }

        return $trimmed;
    }

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     * @return array<string, mixed>
     */
    private function transformChanges(array $changes): array
    {
        $normalized = [];

        foreach ($changes as $attribute => $diff) {
            if (! is_array($diff)) {
                continue;
            }

            if ($attribute === 'status_id') {
                $normalized['status'] = [
                    'old' => $this->statusSnapshot($diff['old'] ?? null),
                    'new' => $this->statusSnapshot($diff['new'] ?? null),
                ];

                continue;
            }

            $normalized[$attribute] = $diff;
        }

        return $normalized;
    }

    /**
     * @return array<string, mixed>
     */
    private function statusSnapshot(mixed $statusId): ?array
    {
        if ($statusId === null) {
            return null;
        }

        $status = Status::query()
            ->with('statusType:id,name')
            ->find($statusId);

        if ($status === null) {
            return null;
        }

        $statusType = $status->statusType;

        return array_filter([
            'id' => $status->getKey(),
            'name' => $status->name,
            'status_type' => $statusType === null ? null : array_filter([
                'id' => $statusType->getKey(),
                'name' => $statusType->name,
            ], static fn ($value) => $value !== null && $value !== ''),
        ], static fn ($value) => $value !== null && $value !== '' && $value !== []);
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

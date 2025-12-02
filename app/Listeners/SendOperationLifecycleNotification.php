<?php

namespace App\Listeners;

use App\Events\OperationCreated;
use App\Events\OperationDeleted;
use App\Events\OperationUpdated;
use App\Models\NotificationType;
use App\Models\Operation;
use App\Models\User;
use App\Notifications\OperationLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendOperationLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof OperationCreated) {
            $operation = $event->operation->load([
                'customer:id,name',
                'cargoType:id,name,category',
            ])->loadCount([
                'performances',
                'outsourcePerformances',
            ]);

            $payload = $this->operationPayload($operation);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->operationLabel($operation->operationid, $operation->id);
            $message = sprintf('Operation %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::OPERATION_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new OperationLifecycleNotification(
                    $type,
                    'Operation Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OperationUpdated) {
            $operation = $event->operation->load([
                'customer:id,name',
                'cargoType:id,name,category',
            ])->loadCount([
                'performances',
                'outsourcePerformances',
            ]);

            $payload = $this->operationPayload($operation);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->operationLabel($operation->operationid, $operation->id);
            $message = sprintf('Operation %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::OPERATION_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new OperationLifecycleNotification(
                    $type,
                    'Operation Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof OperationDeleted) {
            $label = $this->operationLabel($event->operationReference, $event->operationId);

            $payload = [
                'operation_id' => $event->operationId,
                'reference' => $event->operationReference,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Operation %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::OPERATION_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new OperationLifecycleNotification(
                    $type,
                    'Operation Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function operationPayload(Operation $operation): array
    {
        $metrics = array_filter([
            'performances' => $operation->performances_count ?? null,
            'outsource_performances' => $operation->outsource_performances_count ?? null,
            'planned_volume' => $operation->volume === null ? null : (float) $operation->volume,
            'planned_distance' => $operation->km === null ? null : (float) $operation->km,
        ], static fn ($value) => $value !== null);

        $customer = $operation->customer;
        $cargoType = $operation->cargoType;

        return array_filter([
            'operation_id' => $operation->id,
            'reference' => $operation->operationid,
            'status' => $operation->status,
            'cargo_service_type' => $operation->cargo_service_type,
            'closed' => $operation->closed === null ? null : (bool) $operation->closed,
            'start_date' => $operation->startdate,
            'end_date' => $operation->enddate,
            'tariff' => $operation->tariff === null ? null : (float) $operation->tariff,
            'destination' => array_filter([
                'scope' => $operation->destination_scope,
                'name' => $operation->destination_name,
                'reference_id' => $operation->destination_reference_id,
                'reference_type' => $operation->destination_reference_type,
            ], static fn ($value) => $value !== null && $value !== ''),
            'customer' => $customer === null ? null : array_filter([
                'id' => $customer->getKey(),
                'name' => $customer->name,
            ], static fn ($value) => $value !== null),
            'cargo_type' => $cargoType === null ? null : array_filter([
                'id' => $cargoType->getKey(),
                'name' => $cargoType->name,
                'category' => $cargoType->category,
            ], static fn ($value) => $value !== null && $value !== ''),
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function operationLabel(?string $reference, int $fallbackId): string
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

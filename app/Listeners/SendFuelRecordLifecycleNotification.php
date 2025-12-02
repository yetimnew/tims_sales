<?php

namespace App\Listeners;

use App\Events\FuelRecordCreated;
use App\Events\FuelRecordDeleted;
use App\Events\FuelRecordUpdated;
use App\Models\NotificationType;
use App\Notifications\FuelRecordLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendFuelRecordLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof FuelRecordCreated) {
            $record = $event->fuelRecord->loadMissing(['truck', 'driver']);

            $payload = [
                'fuel_record_id' => $record->id,
                'fuel_date' => $record->fuel_date?->toDateString(),
                'fuel_type' => $record->fuel_type,
                'fuel_quantity_liters' => $record->fuel_quantity_liters,
                'total_cost' => $record->total_cost,
                'truck' => $this->truckPayload($record->truck?->id, $record->truck?->plate),
                'driver' => $this->driverPayload($record->driver?->id, $record->driver?->name),
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $truckPlate = $record->truck?->plate;
            $fuelDate = $record->fuel_date?->toDateString();

            $message = match (true) {
                $truckPlate !== null && $fuelDate !== null => sprintf('Fuel record for truck %s on %s was created.', $truckPlate, $fuelDate),
                $truckPlate !== null => sprintf('Fuel record for truck %s was created.', $truckPlate),
                $fuelDate !== null => sprintf('A fuel record dated %s was created.', $fuelDate),
                default => 'A fuel record was created.',
            };

            $this->dispatcher->dispatch(NotificationType::FUEL_RECORD_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new FuelRecordLifecycleNotification(
                    $type,
                    'Fuel Record Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof FuelRecordUpdated) {
            $record = $event->fuelRecord->loadMissing(['truck', 'driver']);

            $payload = [
                'fuel_record_id' => $record->id,
                'fuel_date' => $record->fuel_date?->toDateString(),
                'fuel_type' => $record->fuel_type,
                'fuel_quantity_liters' => $record->fuel_quantity_liters,
                'total_cost' => $record->total_cost,
                'truck' => $this->truckPayload($record->truck?->id, $record->truck?->plate),
                'driver' => $this->driverPayload($record->driver?->id, $record->driver?->name),
                'changes' => $event->changes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $truckPlate = $record->truck?->plate;
            $fuelDate = $record->fuel_date?->toDateString();

            $message = match (true) {
                $truckPlate !== null && $fuelDate !== null => sprintf('Fuel record for truck %s on %s was updated.', $truckPlate, $fuelDate),
                $truckPlate !== null => sprintf('Fuel record for truck %s was updated.', $truckPlate),
                $fuelDate !== null => sprintf('A fuel record dated %s was updated.', $fuelDate),
                default => 'A fuel record was updated.',
            };

            $this->dispatcher->dispatch(NotificationType::FUEL_RECORD_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new FuelRecordLifecycleNotification(
                    $type,
                    'Fuel Record Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof FuelRecordDeleted) {
            $payload = [
                'fuel_record_id' => $event->fuelRecordId,
                'receipt_number' => $event->receiptNumber,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor?->name, $event->actor?->id),
            ];

            $message = $event->receiptNumber !== null
                ? sprintf('Fuel record %s was deleted.', $event->receiptNumber)
                : 'A fuel record was deleted.';

            $this->dispatcher->dispatch(NotificationType::FUEL_RECORD_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new FuelRecordLifecycleNotification(
                    $type,
                    'Fuel Record Deleted',
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
    private function truckPayload(?int $id, ?string $plate): array
    {
        return array_filter([
            'id' => $id,
            'plate' => $plate,
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

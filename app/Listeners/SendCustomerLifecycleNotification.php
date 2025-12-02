<?php

namespace App\Listeners;

use App\Events\CustomerCreated;
use App\Events\CustomerDeleted;
use App\Events\CustomerUpdated;
use App\Models\Customer;
use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\CustomerLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendCustomerLifecycleNotification implements ShouldQueue
{
    use InteractsWithQueue;

    public string $queue = 'notifications';

    public bool $afterCommit = true;

    public function __construct(private readonly NotificationDispatcher $dispatcher) {}

    public function handle(object $event): void
    {
        if ($event instanceof CustomerCreated) {
            $customer = $event->customer->loadCount('operations');

            $payload = $this->customerPayload($customer);
            $payload['actor'] = $this->actorPayload($event->actor);

            $label = $this->customerLabel($customer->name, $customer->id);
            $message = sprintf('Customer %s was created.', $label);

            $this->dispatcher->dispatch(NotificationType::CUSTOMER_CREATED, function (NotificationType $type) use ($payload, $message) {
                return new CustomerLifecycleNotification(
                    $type,
                    'Customer Created',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof CustomerUpdated) {
            $customer = $event->customer->loadCount('operations');

            $payload = $this->customerPayload($customer);
            $payload['actor'] = $this->actorPayload($event->actor);
            $payload['changes'] = $event->changes;

            $label = $this->customerLabel($customer->name, $customer->id);
            $message = sprintf('Customer %s was updated.', $label);

            $this->dispatcher->dispatch(NotificationType::CUSTOMER_UPDATED, function (NotificationType $type) use ($payload, $message) {
                return new CustomerLifecycleNotification(
                    $type,
                    'Customer Updated',
                    $message,
                    $payload,
                );
            });

            return;
        }

        if ($event instanceof CustomerDeleted) {
            $label = $this->customerLabel($event->customerName, $event->customerId);

            $payload = [
                'customer_id' => $event->customerId,
                'name' => $event->customerName,
                'attributes' => $event->attributes,
                'actor' => $this->actorPayload($event->actor),
            ];

            $message = sprintf('Customer %s was deleted.', $label);

            $this->dispatcher->dispatch(NotificationType::CUSTOMER_DELETED, function (NotificationType $type) use ($payload, $message) {
                return new CustomerLifecycleNotification(
                    $type,
                    'Customer Deleted',
                    $message,
                    $payload,
                );
            });
        }
    }

    /**
     * @return array<string, mixed>
     */
    private function customerPayload(Customer $customer): array
    {
        $metrics = array_filter([
            'operations' => $customer->operations_count ?? null,
        ], static fn ($value) => $value !== null);

        return array_filter([
            'customer_id' => $customer->id,
            'name' => $customer->name,
            'contact_person' => $customer->contact_person,
            'phone' => $customer->phone,
            'email' => $customer->email,
            'address' => $customer->address,
            'status' => $customer->status,
            'metrics' => $metrics,
        ], static fn ($value) => $value !== null && $value !== []);
    }

    private function customerLabel(?string $name, int $fallbackId): string
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

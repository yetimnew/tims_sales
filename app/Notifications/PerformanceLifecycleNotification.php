<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class PerformanceLifecycleNotification extends Notification implements ChannelAwareNotification
{
    use Queueable;

    /**
     * @param  array<string, mixed>  $payload
     */
    public function __construct(
        private readonly NotificationType $type,
        private readonly string $title,
        private readonly string $message,
        private readonly array $payload = [],
    ) {
        $this->afterCommit();
    }

    /**
     * @var array<int, string>
     */
    private array $channels = [];

    public function withChannels(array $channels): static
    {
        $this->channels = array_values(array_unique($channels));

        return $this;
    }

    public function via(object $notifiable): array
    {
        return $this->channels ?: ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject($this->title)
            ->line($this->message);

        $reference = $this->payload['reference'] ?? null;
        $status = $this->payload['status'] ?? null;
        $loadPhase = $this->payload['load_phase'] ?? null;
        $loadCompletion = $this->payload['load_completion'] ?? null;
        $dispatchDate = $this->payload['dispatch_date'] ?? null;
        $returnedDate = $this->payload['returned_date'] ?? null;
        $isReturned = $this->payload['is_returned'] ?? null;
        $metrics = $this->payload['metrics'] ?? [];
        $operation = $this->payload['operation'] ?? [];
        $driverTruck = $this->payload['driver_truck'] ?? [];
        $route = $this->payload['route'] ?? [];
        $author = $this->payload['author'] ?? [];

        if ($reference !== null) {
            $mail->line('Performance: '.$reference);
        }

        if ($status !== null) {
            $mail->line('Status: '.Str::headline((string) $status));
        }

        if ($loadPhase !== null) {
            $mail->line('Load Phase: '.Str::headline((string) $loadPhase));
        }

        if ($loadCompletion !== null) {
            $mail->line('Load Completion: '.$loadCompletion.'%');
        }

        if ($dispatchDate !== null) {
            $mail->line('Dispatch Date: '.$dispatchDate);
        }

        if ($returnedDate !== null) {
            $mail->line('Returned Date: '.$returnedDate);
        }

        if ($isReturned !== null) {
            $mail->line('Returned: '.($isReturned ? 'Yes' : 'No'));
        }

        if (is_array($operation) && $operation !== []) {
            $mail->line('Operation Reference: '.($operation['reference'] ?? 'N/A'));

            if (isset($operation['customer']['name'])) {
                $mail->line('Customer: '.$operation['customer']['name']);
            }
        }

        if (is_array($driverTruck) && $driverTruck !== []) {
            if (isset($driverTruck['plate'])) {
                $mail->line('Truck Plate: '.$driverTruck['plate']);
            }

            if (isset($driverTruck['driver']['name'])) {
                $mail->line('Driver: '.$driverTruck['driver']['name']);
            }
        }

        if (is_array($route) && $route !== []) {
            $origin = $route['origin']['name'] ?? null;
            $destination = $route['destination']['name'] ?? null;

            if ($origin !== null || $destination !== null) {
                $mail->line('Route: '.trim(($origin ?? 'Unknown').' -> '.($destination ?? 'Unknown')));
            }
        }

        if (is_array($metrics) && $metrics !== []) {
            if (isset($metrics['tonnage'])) {
                $mail->line('Tonnage (MT): '.number_format((float) $metrics['tonnage'], 2));
            }

            if (isset($metrics['ton_km'])) {
                $mail->line('Ton KM: '.number_format((float) $metrics['ton_km'], 2));
            }

            if (isset($metrics['distance_with_cargo'])) {
                $mail->line('Distance With Cargo (KM): '.number_format((float) $metrics['distance_with_cargo'], 2));
            }

            if (isset($metrics['distance_without_cargo'])) {
                $mail->line('Distance Without Cargo (KM): '.number_format((float) $metrics['distance_without_cargo'], 2));
            }

            if (isset($metrics['fuel_cost']) || isset($metrics['perdiem_cost']) || isset($metrics['other_cost']) || isset($metrics['total_cost'])) {
                $mail->line('Cost Summary:');

                if (isset($metrics['fuel_cost'])) {
                    $mail->line('  Fuel: '.number_format((float) $metrics['fuel_cost'], 2).' ETB');
                }

                if (isset($metrics['perdiem_cost'])) {
                    $mail->line('  Per Diem: '.number_format((float) $metrics['perdiem_cost'], 2).' ETB');
                }

                if (isset($metrics['other_cost'])) {
                    $mail->line('  Other: '.number_format((float) $metrics['other_cost'], 2).' ETB');
                }

                if (isset($metrics['total_cost'])) {
                    $mail->line('  Total: '.number_format((float) $metrics['total_cost'], 2).' ETB');
                }
            }
        }

        if (is_array($author) && isset($author['name'])) {
            $mail->line('Recorded by: '.$author['name']);
        }

        $changes = $this->payload['changes'] ?? [];

        if (is_array($changes) && $changes !== []) {
            $mail->line('Changes:');

            foreach ($changes as $attribute => $diff) {
                $old = $diff['old'] ?? null;
                $new = $diff['new'] ?? null;

                $mail->line(sprintf('%s: %s -> %s', Str::headline((string) $attribute), $this->formatChangeValue($old), $this->formatChangeValue($new)));
            }
        }

        $actorName = $this->payload['actor']['name'] ?? null;

        if ($actorName !== null) {
            $mail->line('Performed by: '.$actorName);
        }

        return $mail;
    }

    public function toArray(object $notifiable): array
    {
        return $this->basePayload();
    }

    public function toDatabase(object $notifiable): array
    {
        return $this->basePayload();
    }

    public function toBroadcast(object $notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->basePayload());
    }

    /**
     * @return array<string, mixed>
     */
    private function basePayload(): array
    {
        return [
            'type' => $this->type->key,
            'title' => $this->title,
            'message' => $this->message,
            'payload' => $this->payload,
        ];
    }

    private function formatChangeValue(mixed $value): string
    {
        if ($value === null || $value === '') {
            return 'N/A';
        }

        if (is_array($value)) {
            return json_encode($value, JSON_UNESCAPED_SLASHES) ?: '[array]';
        }

        if (is_bool($value)) {
            return $value ? 'true' : 'false';
        }

        return (string) $value;
    }
}

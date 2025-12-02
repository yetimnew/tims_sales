<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class OutsourcePerformanceLifecycleNotification extends Notification implements ChannelAwareNotification, ShouldQueue
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

        $tripNumber = $this->payload['trip_number'] ?? null;
        $status = $this->payload['status'] ?? null;
        $dispatchDate = $this->payload['dispatch_date'] ?? null;
        $outsourceName = $this->payload['outsource']['name'] ?? null;
        $fromPlace = $this->payload['route']['from']['name'] ?? null;
        $toPlace = $this->payload['route']['to']['name'] ?? null;
        $metrics = $this->payload['metrics'] ?? [];

        if ($tripNumber !== null) {
            $mail->line('Trip Number: '.$tripNumber);
        }

        if ($outsourceName !== null) {
            $mail->line('Vendor: '.$outsourceName);
        }

        if ($dispatchDate !== null) {
            $mail->line('Dispatch Date: '.$dispatchDate);
        }

        if ($status !== null) {
            $mail->line('Status: '.ucfirst((string) $status));
        }

        if ($fromPlace !== null || $toPlace !== null) {
            $mail->line(sprintf('Route: %s → %s', $fromPlace ?? 'N/A', $toPlace ?? 'N/A'));
        }

        if (is_array($metrics)) {
            if (isset($metrics['distance_km'])) {
                $mail->line('Distance: '.number_format((float) $metrics['distance_km'], 2).' km');
            }

            if (isset($metrics['cargo_volume_mt'])) {
                $mail->line('Cargo: '.number_format((float) $metrics['cargo_volume_mt'], 2).' MT');
            }

            if (isset($metrics['tonkm'])) {
                $mail->line('Ton-Km: '.number_format((float) $metrics['tonkm'], 2));
            }

            if (isset($metrics['cost'])) {
                $mail->line('Cost: '.number_format((float) $metrics['cost'], 2));
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
}

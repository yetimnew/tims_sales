<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class OperationLifecycleNotification extends Notification implements ChannelAwareNotification
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
        $cargoServiceType = $this->payload['cargo_service_type'] ?? null;
        $closed = $this->payload['closed'] ?? null;
        $customerName = $this->payload['customer']['name'] ?? null;
        $destinationName = $this->payload['destination']['name'] ?? null;
        $metrics = $this->payload['metrics'] ?? [];

        if ($reference !== null) {
            $mail->line('Operation: '.$reference);
        }

        if ($customerName !== null) {
            $mail->line('Customer: '.$customerName);
        }

        if ($status !== null) {
            $mail->line('Status: '.Str::headline((string) $status));
        }

        if ($cargoServiceType !== null) {
            $mail->line('Service Type: '.Str::headline((string) $cargoServiceType));
        }

        if ($destinationName !== null) {
            $mail->line('Destination: '.$destinationName);
        }

        if ($closed !== null) {
            $mail->line('Closed: '.($closed ? 'Yes' : 'No'));
        }

        if (is_array($metrics) && $metrics !== []) {
            if (isset($metrics['performances'])) {
                $mail->line('Company Trips: '.(int) $metrics['performances']);
            }

            if (isset($metrics['outsource_performances'])) {
                $mail->line('Vendor Trips: '.(int) $metrics['outsource_performances']);
            }

            if (isset($metrics['planned_volume'])) {
                $mail->line('Planned Volume (MT): '.number_format((float) $metrics['planned_volume'], 2));
            }

            if (isset($metrics['planned_distance'])) {
                $mail->line('Planned Distance (KM): '.number_format((float) $metrics['planned_distance'], 2));
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

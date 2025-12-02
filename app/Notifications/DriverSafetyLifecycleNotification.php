<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DriverSafetyLifecycleNotification extends Notification implements ChannelAwareNotification, ShouldQueue
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

        $driverName = $this->payload['driver']['name'] ?? null;
        $incidentType = $this->payload['incident_type'] ?? null;
        $severity = $this->payload['severity'] ?? null;
        $incidentDate = $this->payload['incident_date'] ?? null;

        if ($driverName !== null) {
            $mail->line('Driver: '.$driverName);
        }

        if ($incidentType !== null) {
            $mail->line('Incident Type: '.ucfirst((string) $incidentType));
        }

        if ($severity !== null) {
            $mail->line('Severity: '.ucfirst((string) $severity));
        }

        if ($incidentDate !== null) {
            $mail->line('Incident Date: '.$incidentDate);
        }

        $actorName = $this->payload['actor']['name'] ?? null;

        if ($actorName !== null) {
            $mail->line('Reported by: '.$actorName);
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

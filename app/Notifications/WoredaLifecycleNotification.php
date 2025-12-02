<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class WoredaLifecycleNotification extends Notification implements ChannelAwareNotification, ShouldQueue
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

        $name = $this->payload['name'] ?? null;
        $code = $this->payload['code'] ?? null;
        $status = $this->payload['status'] ?? null;
        $zoneName = $this->payload['zone']['name'] ?? null;

        if ($name !== null) {
            $mail->line('Woreda: '.$name);
        }

        if ($code !== null) {
            $mail->line('Code: '.$code);
        }

        if ($zoneName !== null) {
            $mail->line('Zone: '.$zoneName);
        }

        if ($status !== null) {
            $mail->line('Status: '.ucfirst((string) $status));
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

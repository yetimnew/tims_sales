<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class CustomerLifecycleNotification extends Notification implements ChannelAwareNotification
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
        $contactPerson = $this->payload['contact_person'] ?? null;
        $phone = $this->payload['phone'] ?? null;
        $email = $this->payload['email'] ?? null;
        $address = $this->payload['address'] ?? null;
        $status = $this->payload['status'] ?? null;
        $metrics = $this->payload['metrics'] ?? [];

        if ($name !== null) {
            $mail->line('Customer: '.$name);
        }

        if ($contactPerson !== null) {
            $mail->line('Contact Person: '.$contactPerson);
        }

        if ($phone !== null) {
            $mail->line('Phone: '.$phone);
        }

        if ($email !== null) {
            $mail->line('Email: '.$email);
        }

        if ($address !== null) {
            $mail->line('Address: '.$address);
        }

        if ($status !== null) {
            $mail->line('Status: '.Str::headline((string) $status));
        }

        if (is_array($metrics) && $metrics !== []) {
            if (isset($metrics['operations'])) {
                $mail->line('Associated Operations: '.(int) $metrics['operations']);
            }
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

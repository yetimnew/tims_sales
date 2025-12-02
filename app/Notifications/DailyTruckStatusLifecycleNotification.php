<?php

namespace App\Notifications;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Str;

class DailyTruckStatusLifecycleNotification extends Notification implements ChannelAwareNotification
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

        $truck = $this->payload['truck'] ?? [];
        $status = $this->payload['status'] ?? [];
        $statusDate = $this->payload['status_date'] ?? null;
        $notes = $this->payload['notes'] ?? null;
        $changedBy = $this->payload['changed_by']['name'] ?? null;

        if (is_array($truck) && $truck !== []) {
            $identifier = $truck['plate'] ?? (isset($truck['id']) ? '#'.$truck['id'] : null);

            if ($identifier !== null) {
                $mail->line('Truck: '.$identifier);
            }
        }

        if (is_array($status) && $status !== []) {
            if (isset($status['name'])) {
                $mail->line('Status: '.$status['name']);
            }

            if (isset($status['status_type']['name'])) {
                $mail->line('Status Type: '.$status['status_type']['name']);
            }
        }

        if ($statusDate !== null) {
            $mail->line('Effective Date: '.$statusDate);
        }

        if ($notes !== null && $notes !== '') {
            $mail->line('Notes: '.$notes);
        }

        if ($changedBy !== null) {
            $mail->line('Recorded By: '.$changedBy);
        }

        $actorName = $this->payload['actor']['name'] ?? null;

        if ($actorName !== null) {
            $mail->line('Performed by: '.$actorName);
        }

        $changes = $this->payload['changes'] ?? [];

        if (is_array($changes) && $changes !== []) {
            $mail->line('Changes:');

            foreach ($changes as $attribute => $diff) {
                $old = $diff['old'] ?? null;
                $new = $diff['new'] ?? null;

                if ($attribute === 'status') {
                    $mail->line(sprintf(
                        'Status: %s -> %s',
                        $this->formatStatusSnapshot($old),
                        $this->formatStatusSnapshot($new)
                    ));

                    continue;
                }

                $mail->line(sprintf(
                    '%s: %s -> %s',
                    Str::headline((string) $attribute),
                    $this->formatChangeValue($old),
                    $this->formatChangeValue($new)
                ));
            }
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

    private function formatStatusSnapshot(mixed $snapshot): string
    {
        if (! is_array($snapshot) || $snapshot === []) {
            return 'N/A';
        }

        $name = $snapshot['name'] ?? null;
        $typeName = $snapshot['status_type']['name'] ?? null;

        if ($name === null && $typeName === null) {
            $id = $snapshot['id'] ?? null;

            return $id !== null ? '#'.$id : 'N/A';
        }

        if ($typeName === null) {
            return (string) $name;
        }

        if ($name === null) {
            return $typeName;
        }

        return sprintf('%s (%s)', $name, $typeName);
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

<?php

namespace App\Services;

use App\Contracts\ChannelAwareNotification;
use App\Models\NotificationType;
use Closure;
use Illuminate\Notifications\Notification as IlluminateNotification;
use Illuminate\Support\Facades\Notification;

class NotificationDispatcher
{
    public function __construct(private readonly NotificationPreferenceService $preferences) {}

    /**
     * @param  Closure(NotificationType): (IlluminateNotification&ChannelAwareNotification)  $factory
     */
    public function dispatch(string $notificationKey, Closure $factory): void
    {
        $type = $this->preferences->resolveType($notificationKey);

        if ($type === null) {
            return;
        }

        $recipients = $this->preferences->usersFor($type);

        if ($recipients->isEmpty()) {
            return;
        }

        foreach ($recipients as $user) {
            /** @var \App\Models\User $user */
            $channels = $this->preferences->channelsFor($user, $type);

            if ($channels === []) {
                continue;
            }

            $notification = $factory($type)->withChannels($channels);

            Notification::send($user, $notification);
        }
    }
}

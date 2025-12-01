<?php

namespace App\Services;

use App\Models\NotificationType;
use App\Models\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class NotificationPreferenceService
{
    /**
     * Resolve a notification type using its unique key.
     */
    public function resolveType(string $key): ?NotificationType
    {
        $cacheKey = sprintf('notifications.types.%s', $key);

        return Cache::remember($cacheKey, now()->addMinutes(10), fn () => NotificationType::query()->where('key', $key)->first());
    }

    /**
     * Retrieve the users that have been granted access to the given notification type.
     *
     * @return Collection<int, User>
     */
    public function usersFor(NotificationType $type): Collection
    {
        return User::query()
            ->with(['notificationSettings' => function ($query) use ($type) {
                $query->where('notification_type_id', $type->id);
            }])
            ->whereHas('notificationSettings', function ($query) use ($type) {
                $query->where('notification_type_id', $type->id);
            })
            ->get();
    }

    /**
     * Determine which channels are enabled for the provided user and notification type.
     *
     * @return array<int, string>
     */
    public function channelsFor(User $user, NotificationType $type): array
    {
        $user->loadMissing(['notificationSettings' => function ($query) use ($type) {
            $query->where('notification_type_id', $type->id);
        }]);

        $setting = $user->notificationSettings
            ->firstWhere('notification_type_id', $type->id);

        if ($setting === null) {
            // Fallback: if no explicit setting exists, default to database channel for core managers
            if (
                $user->hasRole('admin')
                || $user->can('trucks.view')
                || $user->can('drivers.view')
            ) {
                return ['database'];
            }

            return [];
        }

        $channels = [];

        if ($setting->in_app_enabled) {
            // In-app experiences rely on stored notifications; broadcast is optional
            $channels[] = 'database';

            if (in_array(config('broadcasting.default'), ['pusher', 'reverb'], true)) {
                $channels[] = 'broadcast';
            }
        }

        if ($setting->email_enabled) {
            $channels[] = 'mail';
        }

        return array_values(array_unique($channels));
    }
}

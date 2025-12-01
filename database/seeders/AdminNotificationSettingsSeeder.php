<?php

namespace Database\Seeders;

use App\Models\NotificationType;
use App\Models\User;
use App\Models\UserNotificationSetting;
use Illuminate\Database\Seeder;

class AdminNotificationSettingsSeeder extends Seeder
{
    public function run(): void
    {
        $keys = [
            NotificationType::TRUCK_CREATED,
            NotificationType::TRUCK_UPDATED,
            NotificationType::TRUCK_DELETED,
            NotificationType::DRIVER_CREATED,
            NotificationType::DRIVER_UPDATED,
            NotificationType::DRIVER_DELETED,
        ];

        $types = NotificationType::query()
            ->whereIn('key', $keys)
            ->get(['id', 'key']);

        if ($types->isEmpty()) {
            return;
        }

        $admins = User::query()
            ->whereHas('roles', fn ($q) => $q->where('name', 'admin'))
            ->get(['id']);

        if ($admins->isEmpty()) {
            // Fallback: include users with trucks.view permission
            $admins = User::query()
                ->whereHas('permissions', fn ($q) => $q->where('name', 'trucks.view'))
                ->get(['id']);
        }

        foreach ($admins as $user) {
            foreach ($types as $type) {
                UserNotificationSetting::updateOrCreate(
                    [
                        'user_id' => $user->id,
                        'notification_type_id' => $type->id,
                    ],
                    [
                        'in_app_enabled' => true,
                        'email_enabled' => $type->key === NotificationType::TRUCK_DELETED
                            || $type->key === NotificationType::DRIVER_DELETED,
                    ],
                );
            }
        }
    }
}

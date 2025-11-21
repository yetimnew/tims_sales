<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\NotificationPreferenceUpdateRequest;
use App\Models\UserNotificationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceController extends Controller
{
    public function edit(Request $request): Response
    {
        $user = $request->user()->load([
            'notificationSettings' => static function ($query) {
                $query->with(['type:id,key,name,description', 'assignedBy:id,name']);
            },
        ]);

        $preferences = $user->notificationSettings
            ->filter(static fn (UserNotificationSetting $setting) => $setting->type !== null)
            ->sortBy(static fn (UserNotificationSetting $setting) => strtolower($setting->type->name))
            ->values()
            ->map(static function (UserNotificationSetting $setting): array {
                return [
                    'type_id' => $setting->notification_type_id,
                    'key' => $setting->type->key,
                    'name' => $setting->type->name,
                    'description' => $setting->type->description,
                    'in_app_enabled' => $setting->in_app_enabled,
                    'email_enabled' => $setting->email_enabled,
                    'assigned_by' => $setting->assignedBy?->only(['id', 'name']),
                    'updated_at' => $setting->updated_at?->toIso8601String(),
                ];
            });

        return Inertia::render('settings/notifications', [
            'preferences' => $preferences,
        ]);
    }

    public function update(NotificationPreferenceUpdateRequest $request): RedirectResponse
    {
        $user = $request->user();
        $validated = $request->validated();
        $preferences = collect($validated['preferences'] ?? []);

        $existing = $user->notificationSettings()
            ->get()
            ->keyBy('notification_type_id');

        foreach ($preferences as $preference) {
            $typeId = (int) $preference['type_id'];

            /** @var UserNotificationSetting|null $setting */
            $setting = $existing->get($typeId);

            if ($setting === null) {
                continue;
            }

            $setting->forceFill([
                'in_app_enabled' => (bool) $preference['in_app_enabled'],
                'email_enabled' => (bool) $preference['email_enabled'],
            ])->save();
        }

        return to_route('notification-preferences.edit')
            ->with('success', 'Notification preferences were updated.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\NotificationPreferenceAdminUpdateRequest;
use App\Models\NotificationType;
use App\Models\User;
use App\Models\UserNotificationSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class NotificationPreferenceAdminController extends Controller
{
    public function index(Request $request): Response
    {
        $search = (string) $request->input('search', '');

        $users = User::query()
            ->with([
                'notificationSettings.type:id,key,name,description',
                'notificationSettings.assignedBy:id,name',
                'roles:id,name',
            ])
            ->when($search !== '', static function ($query) use ($search) {
                $query->where(static function ($nested) use ($search) {
                    $nested->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->orderBy('name')
            ->get();

        $types = NotificationType::query()
            ->orderBy('name')
            ->get(['id', 'key', 'name', 'description', 'default_in_app', 'default_email'])
            ->map(static function (NotificationType $type): array {
                $categorySlug = Str::before($type->key, '.');
                $categoryName = Str::of($categorySlug)
                    ->replace(['_', '-'], ' ')
                    ->squish()
                    ->headline()
                    ->value();

                return [
                    'id' => $type->id,
                    'key' => $type->key,
                    'name' => $type->name,
                    'description' => $type->description,
                    'default_in_app' => $type->default_in_app,
                    'default_email' => $type->default_email,
                    'category' => $categoryName,
                    'category_slug' => $categorySlug,
                ];
            });

        $userPayload = $users->map(static function (User $user): array {
            $preferences = $user->notificationSettings
                ->filter(static fn (UserNotificationSetting $setting) => $setting->type !== null)
                ->sortBy(static fn (UserNotificationSetting $setting) => strtolower($setting->type->name))
                ->values()
                ->map(static function (UserNotificationSetting $setting): array {
                    $categorySlug = Str::before($setting->type->key, '.');
                    $categoryName = Str::of($categorySlug)
                        ->replace(['_', '-'], ' ')
                        ->squish()
                        ->headline()
                        ->value();

                    return [
                        'type_id' => $setting->notification_type_id,
                        'key' => $setting->type->key,
                        'name' => $setting->type->name,
                        'description' => $setting->type->description,
                        'in_app_enabled' => $setting->in_app_enabled,
                        'email_enabled' => $setting->email_enabled,
                        'assigned_by' => $setting->assignedBy?->only(['id', 'name']),
                        'updated_at' => $setting->updated_at?->toIso8601String(),
                        'category' => $categoryName,
                        'category_slug' => $categorySlug,
                    ];
                });

            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->pluck('name')->all(),
                'preferences' => $preferences,
            ];
        })->values();

        return Inertia::render('Notifications/Preferences', [
            'filters' => [
                'search' => $search,
                'selected_user' => $request->input('selected_user'),
            ],
            'types' => $types,
            'users' => $userPayload,
        ]);
    }

    public function update(NotificationPreferenceAdminUpdateRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $preferences = collect($validated['preferences'] ?? []);

        $existing = $user->notificationSettings()->get()->keyBy('notification_type_id');

        foreach ($preferences as $preference) {
            $typeId = (int) $preference['type_id'];
            $inApp = (bool) $preference['in_app_enabled'];
            $email = (bool) $preference['email_enabled'];
            $remove = (bool) ($preference['remove'] ?? false);

            /** @var UserNotificationSetting|null $setting */
            $setting = $existing->get($typeId);

            if ($setting === null) {
                if ($remove || (! $inApp && ! $email)) {
                    continue;
                }

                $user->notificationSettings()->create([
                    'notification_type_id' => $typeId,
                    'assigned_by' => $request->user()->id,
                    'in_app_enabled' => $inApp,
                    'email_enabled' => $email,
                ]);

                continue;
            }

            if ($remove || (! $inApp && ! $email)) {
                $setting->delete();

                continue;
            }

            $setting->forceFill([
                'in_app_enabled' => $inApp,
                'email_enabled' => $email,
                'assigned_by' => $request->user()->id,
            ])->save();
        }

        return to_route('notifications.preferences.index', array_filter([
            'search' => $request->input('search'),
            'selected_user' => $user->id,
        ]))->with('success', 'User notification preferences were updated.');
    }
}

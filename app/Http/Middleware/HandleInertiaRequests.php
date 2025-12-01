<?php

namespace App\Http\Middleware;

use App\Models\User;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        $user = $request->user();
        $userPayload = $this->resolveUserPayload($user);
        $permissions = $user ? $this->resolvePermissions($user, $request) : [];

        // Resolve notifications summary for header bell
        $notifications = $this->resolveNotificationsSummary($user);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $userPayload,
                'permissions' => $permissions,
            ],
            'notifications' => $notifications,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            // Add flash messages and errors
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }

    private function resolveUserPayload(?User $user): ?array
    {
        if ($user === null) {
            return null;
        }

        return [
            'id' => $user->getKey(),
            'name' => $user->name,
            'email' => $user->email,
            'avatar' => $user->avatar ?? null,
            'email_verified_at' => $user->email_verified_at?->toIso8601String(),
            'two_factor_enabled' => $user->two_factor_secret !== null,
        ];
    }

    private function resolvePermissions(User $user, Request $request): array
    {
        $effectivePermissions = $user->getAllPermissions()->pluck('name');

        $routeName = $request->route()?->getName();
        $prefixes = $routeName ? $this->permissionPrefixesForRoute($routeName) : null;

        if ($prefixes === null) {
            return $effectivePermissions->values()->all();
        }

        return $effectivePermissions
            ->filter(fn (string $permission) => Str::startsWith($permission, $prefixes))
            ->values()
            ->all();
    }

    /**
     * @return array<int, string>|null
     */
    private function permissionPrefixesForRoute(string $routeName): ?array
    {
        $map = [
            'dashboard' => ['dashboard.', 'analytics.'],
            'analytics.cockpit' => ['analytics.'],
            'trucks.index' => ['trucks.'],
            'trucks.create' => ['trucks.'],
            'trucks.store' => ['trucks.'],
            'trucks.show' => ['trucks.'],
            'trucks.edit' => ['trucks.'],
            'trucks.update' => ['trucks.'],
            'trucks.destroy' => ['trucks.'],
            'trucks.deactivate' => ['trucks.'],
            'trucks.export' => ['trucks.'],
            'trucks.free' => ['trucks.'],
        ];

        return $map[$routeName] ?? null;
    }

    /**
     * @return array{unread_count:int, recent: array<int, array<string, mixed>>}
     */
    private function resolveNotificationsSummary(?User $user): array
    {
        if ($user === null) {
            return [
                'unread_count' => 0,
                'recent' => [],
            ];
        }

        $unreadCount = (int) $user->unreadNotifications()->count();

        $recent = $user->notifications()
            ->latest()
            ->limit(8)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'read_at' => $notification->read_at?->toIso8601String(),
                    'created_at' => $notification->created_at?->toIso8601String(),
                    'data' => $notification->data,
                ];
            })
            ->values()
            ->all();

        return [
            'unread_count' => $unreadCount,
            'recent' => $recent,
        ];
    }
}

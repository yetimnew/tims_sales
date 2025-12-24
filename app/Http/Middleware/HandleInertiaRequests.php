<?php

namespace App\Http\Middleware;

use App\Models\User;
use App\Support\NotificationFeedBuilder;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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

        $effectivePermissions = $user
            ? $user->getAllPermissions()->pluck('name')
            : collect();

        $scopedPermissions = $user
            ? $this->filterPermissionsForRequest($effectivePermissions, $request)
            : collect();

        // Resolve notifications summary for header bell
        $notifications = $this->resolveNotificationsSummary($user);

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $userPayload,
                'permissions' => $scopedPermissions->values()->all(),
                'all_permissions' => $effectivePermissions->values()->all(),
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

    private function filterPermissionsForRequest(Collection $permissions, Request $request): Collection
    {
        $routeName = $request->route()?->getName();
        $prefixes = $routeName ? $this->permissionPrefixesForRoute($routeName) : null;

        if ($prefixes === null) {
            return $permissions->values();
        }

        return $permissions
            ->filter(fn (string $permission) => Str::startsWith($permission, $prefixes))
            ->values();
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

        $builder = app(NotificationFeedBuilder::class);

        return $builder->summary($user, 8);
    }
}

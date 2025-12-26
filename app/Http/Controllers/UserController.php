<?php

namespace App\Http\Controllers;

use App\Events\UserCreated;
use App\Events\UserDeleted;
use App\Events\UserUpdated;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\NotificationType;
use App\Models\User;
use Carbon\CarbonInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends BaseResourceController
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $perPageOptions = [10, 15, 25, 50];

        $search = trim((string) $request->input('search', ''));
        $role = trim((string) $request->input('role', ''));
        $status = trim((string) $request->input('status', ''));

        $usersQuery = User::query()
            ->with('roles');

        if ($search !== '') {
            $usersQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        if ($role !== '' && $role !== 'all') {
            $usersQuery->whereHas('roles', static function ($roleQuery) use ($role) {
                $roleQuery->where('name', $role);
            });
        }

        if ($status !== '' && $status !== 'all') {
            if ($status === 'verified') {
                $usersQuery->whereNotNull('email_verified_at');
            } elseif ($status === 'pending') {
                $usersQuery->whereNull('email_verified_at');
            }
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'email', 'created_at', 'email_verified_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $usersQuery->orderBy($sort, $direction);

        $perPage = (int) $request->input('per_page', 15);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 15;
        }

        $users = $usersQuery
            ->paginate($perPage)
            ->withQueryString();

        // Cache role options (1 hour) - changes when roles are added/removed
        $roleOptions = Cache::remember('users.role_options', 3600, function () {
            return Role::query()
                ->orderBy('name')
                ->get(['name', 'guard_name'])
                ->map(static fn (Role $roleModel) => [
                    'label' => Str::headline($roleModel->name),
                    'value' => $roleModel->name,
                    'guard' => $roleModel->guard_name,
                ])
                ->values()
                ->all();
        });

        $statusOptions = [
            ['label' => 'All statuses', 'value' => 'all'],
            ['label' => 'Verified', 'value' => 'verified'],
            ['label' => 'Pending', 'value' => 'pending'],
        ];

        $filteredQuery = clone $usersQuery;

        $stats = [
            'totalUsers' => (clone $filteredQuery)->count(),
            'verifiedUsers' => (clone $filteredQuery)->whereNotNull('email_verified_at')->count(),
            'pendingUsers' => (clone $filteredQuery)->whereNull('email_verified_at')->count(),
            'adminUsers' => (clone $filteredQuery)->whereHas('roles', static fn ($query) => $query->where('name', 'admin'))->count(),
            'managerUsers' => (clone $filteredQuery)->whereHas('roles', static fn ($query) => $query->where('name', 'manager'))->count(),
        ];

        $filters = [
            'search' => $search !== '' ? $search : null,
            'role' => $role !== '' ? $role : null,
            'status' => $status !== '' ? $status : null,
            'sort' => $sort,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $filters,
            'roleOptions' => $roleOptions,
            'statusOptions' => $statusOptions,
            'perPageOptions' => $perPageOptions,
            'stats' => $stats,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Cache roles (1 hour) - changes when roles are added/removed
        $roles = Cache::remember('users.create_roles', 3600, function () {
            return Role::all();
        });

        // Cache notification types (1 hour) - rarely changes
        $notificationTypes = Cache::remember('users.create_notification_types', 3600, function () {
            return NotificationType::query()
                ->orderBy('name')
                ->get(['id', 'key', 'name', 'description', 'default_in_app', 'default_email']);
        });

        return Inertia::render('Users/Create', [
            'roles' => $roles,
            'notificationTypes' => $notificationTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        try {
            $validated = $request->validated();
            $preferencesInput = $validated['notification_preferences'] ?? [];

            if ($validated['role'] === 'admin') {
                $preferencesInput = NotificationType::query()
                    ->orderBy('id')
                    ->get(['id'])
                    ->map(static fn (NotificationType $type) => [
                        'type_id' => $type->id,
                        'in_app_enabled' => true,
                        'email_enabled' => true,
                    ])
                    ->all();
            }
            unset($validated['notification_preferences']);

            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);

            // Assign role to user
            $role = Role::where('name', $validated['role'])->first();
            if ($role) {
                $user->assignRole($role);
            }

            $preferences = collect($preferencesInput)
                ->map(static function (array $preference): array {
                    return [
                        'type_id' => (int) $preference['type_id'],
                        'in_app_enabled' => (bool) $preference['in_app_enabled'],
                        'email_enabled' => (bool) $preference['email_enabled'],
                    ];
                })
                ->unique('type_id')
                ->filter(static function (array $preference) use ($validated): bool {
                    if ($validated['role'] === 'admin') {
                        return true;
                    }

                    return $preference['in_app_enabled'] || $preference['email_enabled'];
                });

            foreach ($preferences as $preference) {
                $user->notificationSettings()->create([
                    'notification_type_id' => $preference['type_id'],
                    'assigned_by' => $request->user()->id,
                    'in_app_enabled' => $preference['in_app_enabled'],
                    'email_enabled' => $preference['email_enabled'],
                ]);
            }

            // Clear cached role options when user is created
            Cache::forget('users.role_options');
            Cache::forget('users.create_roles');
            Cache::forget('users.create_notification_types');
            Cache::forget('activity_logs.filter_options');

            // Dispatch event for audit trail
            event(new UserCreated($user, Auth::user()));

            return redirect()->route('users.index')
                ->with('success', sprintf('User %s created successfully.', $user->name));

        } catch (Exception $e) {
            $this->logError('store', 'User', $e, [
                'created_by' => Auth::id(),
                'email' => $request->input('email'),
            ]);

            $message = 'Failed to create user. Please try again.';

            return back()
                ->withErrors(['error' => $message])
                ->with('error', $message);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        $user->load('roles');

        // Get activity logs using base controller method
        $activityLogs = $this->getActivityLogs($user);

        return Inertia::render('Users/Show', [
            'user' => $user,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(User $user): Response
    {
        $user->load('roles');
        // Cache roles (1 hour) - changes when roles are added/removed
        $roles = Cache::remember('users.create_roles', 3600, function () {
            return Role::all();
        });

        return Inertia::render('Users/Edit', [
            'user' => $user,
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateUserRequest $request, User $user)
    {
        try {
            $validated = $request->validated();

            if (! empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $oldRole = $user->roles->first()?->name;
            $newRole = $validated['role'];

            $original = $this->normalizeAttributes($user->getOriginal());

            $user->update($validated);

            // Sync role
            $role = Role::where('name', $validated['role'])->first();
            if ($role) {
                $user->syncRoles([$role]);
            }

            $changes = $this->formatChanges($original, $this->normalizeAttributes($user->getChanges()));

            // Clear related caches
            if (isset($changes['role'])) {
                Cache::forget('users.role_options');
                Cache::forget('users.create_roles');
            }

            // Only dispatch event if there were actual changes
            if (! empty($changes)) {
                event(new UserUpdated($user, $changes, Auth::user()));
            }

            return redirect()->route('users.index')
                ->with('success', sprintf('User %s updated successfully.', $user->name));

        } catch (Exception $e) {
            $this->logError('update', 'User', $e, [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'updated_by' => Auth::id(),
            ]);

            $message = 'Failed to update user. Please try again.';

            return back()
                ->withErrors(['error' => $message])
                ->with('error', $message);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        try {
            // Prevent deletion of the current user
            if ($user->id === Auth::id()) {
                $message = 'You cannot delete your own account.';

                return back()
                    ->withErrors(['error' => $message])
                    ->with('error', $message);
            }

            // Capture data before deletion for audit trail
            $attributes = $this->normalizeAttributes($user->toArray());
            $userRoles = $user->roles->pluck('name')->toArray();

            $user->delete();

            // Clear related caches
            Cache::forget('users.role_options');
            Cache::forget('users.create_roles');
            Cache::forget('activity_logs.filter_options');

            // Dispatch event with deleted data for audit trail
            event(new UserDeleted(
                $attributes['id'],
                $attributes['name'],
                [
                    'email' => $attributes['email'] ?? null,
                    'roles' => $userRoles,
                ],
                Auth::user(),
            ));

            return redirect()->route('users.index')
                ->with('success', sprintf('User %s deleted successfully.', $attributes['name']));

        } catch (Exception $e) {
            $this->logError('destroy', 'User', $e, [
                'user_id' => $user->id,
                'deleted_by' => Auth::id(),
            ]);

            $message = 'Failed to delete user. Please try again.';

            return back()
                ->withErrors(['error' => $message])
                ->with('error', $message);
        }
    }

    /**
     * Export users to CSV.
     */
    public function export(Request $request)
    {
        try {
            $query = User::query()->with('roles');

            $search = trim((string) $request->input('search', ''));
            $role = trim((string) $request->input('role', ''));
            $status = trim((string) $request->input('status', ''));

            if ($search !== '') {
                $query->where(function ($searchQuery) use ($search) {
                    $searchQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($role !== '' && $role !== 'all') {
                $query->whereHas('roles', static fn ($roleQuery) => $roleQuery->where('name', $role));
            }

            if ($status !== '' && $status !== 'all') {
                if ($status === 'verified') {
                    $query->whereNotNull('email_verified_at');
                } elseif ($status === 'pending') {
                    $query->whereNull('email_verified_at');
                }
            }

            if ($request->has('sort')) {
                $sort = $request->input('sort', 'name');
                $direction = $request->input('direction', 'asc');

                $allowedSorts = ['name', 'email', 'created_at', 'email_verified_at'];
                if (! in_array($sort, $allowedSorts, true)) {
                    $sort = 'name';
                }

                if (! in_array($direction, ['asc', 'desc'], true)) {
                    $direction = 'asc';
                }

                $query->orderBy($sort, $direction);
            }

            $users = $query->get();

            // Generate CSV
            $filename = 'users_'.now()->format('Y-m-d_H-i-s').'.csv';
            $handle = fopen('php://temp', 'r+');

            // Write header
            fputcsv($handle, [
                'ID',
                'Name',
                'Email',
                'Roles',
                'Email Verified',
                'Created At',
                'Updated At',
            ]);

            // Write data
            foreach ($users as $user) {
                fputcsv($handle, [
                    $user->id,
                    $user->name,
                    $user->email,
                    $user->roles->pluck('name')->join(', '),
                    $user->email_verified_at ? 'Yes' : 'No',
                    $user->created_at,
                    $user->updated_at,
                ]);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            // Log activity using Spatie Activity Log
            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties(['count' => count($users)])
                    ->log('exported users to CSV');
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', "attachment; filename=\"$filename\"");
        } catch (Exception $e) {
            Log::error('User export failed', [
                'error' => $e->getMessage(),
                'exported_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to export users. Please try again.']);
        }
    }

    /**
     * @param  array<string, mixed>  $original
     * @param  array<string, mixed>  $changes
     * @return array<string, array{old: mixed, new: mixed}>
     */
    protected function formatChanges(array $original, array $changes): array
    {
        $formatted = [];

        foreach ($changes as $attribute => $newValue) {
            $formatted[$attribute] = [
                'old' => $original[$attribute] ?? null,
                'new' => $newValue,
            ];
        }

        return $formatted;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    protected function normalizeAttributes(array $attributes): array
    {
        foreach ($attributes as $key => $value) {
            $attributes[$key] = $this->normalizeValue($value);
        }

        return $attributes;
    }

    protected function normalizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->normalizeValue($item);
            }

            return $value;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toIso8601String();
        }

        return $value;
    }
}

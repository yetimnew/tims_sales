<?php

namespace App\Http\Controllers;

use App\Events\UserCreated;
use App\Events\UserDeleted;
use App\Events\UserUpdated;
use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Carbon\CarbonInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = User::with('roles');

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'email', 'created_at', 'email_verified_at'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $users = $query->paginate(15);

        return Inertia::render('Users/Index', [
            'users' => $users,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $roles = Role::all();

        return Inertia::render('Users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreUserRequest $request)
    {
        try {
            $validated = $request->validated();
            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);

            // Assign role to user
            $role = Role::where('name', $validated['role'])->first();
            if ($role) {
                $user->assignRole($role);
            }

            // Log activity
            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $validated['role'],
                ])
                ->log('User created');

            Log::info('User created', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $validated['role'],
                'created_by' => Auth::id(),
            ]);

            event(new UserCreated($user, Auth::user()));

            return redirect()->route('users.index')
                ->with('success', 'User created successfully.');

        } catch (Exception $e) {
            Log::error('User creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'created_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create user. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user): Response
    {
        $user->load('roles');

        // Load activity logs for this user using Spatie Activity Log
        $activityLogs = \Spatie\Activitylog\Models\Activity::forSubject($user)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

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
        $roles = Role::all();

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

            // Log activity
            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $user->name,
                    'email' => $user->email,
                    'old_role' => $oldRole,
                    'new_role' => $newRole,
                ])
                ->log('User updated');

            Log::info('User updated', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'old_role' => $oldRole,
                'new_role' => $newRole,
                'updated_by' => Auth::id(),
            ]);

            if (! empty($changes)) {
                event(new UserUpdated($user, $changes, Auth::user()));
            }

            return redirect()->route('users.index')
                ->with('success', 'User updated successfully.');

        } catch (Exception $e) {
            Log::error('User update failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'updated_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update user. Please try again.']);
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
                return back()->withErrors(['error' => 'You cannot delete your own account.']);
            }

            $userData = $user->toArray();
            $userRoles = $user->roles->pluck('name')->toArray();

            // Log activity before deletion
            activity()
                ->performedOn($user)
                ->causedBy(Auth::user())
                ->withProperties([
                    'name' => $user->name,
                    'email' => $user->email,
                    'roles' => $userRoles,
                ])
                ->log('User deleted');

            $user->delete();

            Log::info('User deleted', [
                'user_id' => $user->id,
                'name' => $userData['name'],
                'email' => $userData['email'],
                'roles' => $userRoles,
                'deleted_by' => Auth::id(),
            ]);

            event(new UserDeleted(
                $userData['id'],
                $userData['name'],
                [
                    'email' => $userData['email'] ?? null,
                    'roles' => $userRoles,
                ],
                Auth::user(),
            ));

            return redirect()->route('users.index')
                ->with('success', 'User deleted successfully.');

        } catch (Exception $e) {
            Log::error('User deletion failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'deleted_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete user. Please try again.']);
        }
    }

    /**
     * Export users to CSV.
     */
    public function export(Request $request)
    {
        try {
            $query = User::with('roles');

            // Apply same search and sort as index
            if ($request->has('search') && ! empty($request->input('search'))) {
                $search = $request->input('search');
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            // Apply sorting
            if ($request->has('sort')) {
                $sort = $request->input('sort', 'name');
                $direction = $request->input('direction', 'asc');
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
    private function formatChanges(array $original, array $changes): array
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
    private function normalizeAttributes(array $attributes): array
    {
        foreach ($attributes as $key => $value) {
            $attributes[$key] = $this->normalizeValue($value);
        }

        return $attributes;
    }

    private function normalizeValue(mixed $value): mixed
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

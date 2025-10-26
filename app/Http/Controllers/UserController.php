<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreUserRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Spatie\Permission\Models\Role;
use Exception;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $users = User::with('roles')
            ->orderBy('name')
            ->paginate(15);

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
        return Inertia::render('Users/Show', [
            'user' => $user,
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

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $oldRole = $user->roles->first()?->name;
            $newRole = $validated['role'];

            $user->update($validated);

            // Sync role
            $role = Role::where('name', $validated['role'])->first();
            if ($role) {
                $user->syncRoles([$role]);
            }

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
    public function export()
    {
        try {
            $users = User::with('roles')->get();

            $filename = 'users_export_' . now()->format('Y-m-d_H-i-s') . '.csv';

            $headers = [
                'Content-Type' => 'text/csv',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
            ];

            $callback = function() use ($users) {
                $file = fopen('php://output', 'w');

                // CSV headers
                fputcsv($file, [
                    'ID',
                    'Name',
                    'Email',
                    'Roles',
                    'Email Verified',
                    'Created At',
                    'Updated At'
                ]);

                // CSV data
                foreach ($users as $user) {
                    fputcsv($file, [
                        $user->id,
                        $user->name,
                        $user->email,
                        $user->roles->pluck('name')->join(', '),
                        $user->email_verified_at ? 'Yes' : 'No',
                        $user->created_at->format('Y-m-d H:i:s'),
                        $user->updated_at->format('Y-m-d H:i:s'),
                    ]);
                }

                fclose($file);
            };

            // Log export activity
            activity()
                ->causedBy(Auth::user())
                ->withProperties([
                    'export_type' => 'users',
                    'total_records' => $users->count(),
                ])
                ->log('Users exported to CSV');

            Log::info('Users exported', [
                'total_records' => $users->count(),
                'exported_by' => Auth::id(),
            ]);

            return response()->stream($callback, 200, $headers);

        } catch (Exception $e) {
            Log::error('User export failed', [
                'error' => $e->getMessage(),
                'exported_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to export users. Please try again.']);
        }
    }
}




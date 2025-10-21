<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Exception;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $users = User::orderBy('name')
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
        return Inertia::render('Users/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users',
                'password' => 'required|string|min:8|confirmed',
            ]);

            $validated['password'] = Hash::make($validated['password']);

            $user = User::create($validated);

            Log::info('User created', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'created_by' => auth()->id(),
            ]);

            return redirect()->route('users.index')
                ->with('success', 'User created successfully.');

        } catch (Exception $e) {
            Log::error('User creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'created_by' => auth()->id(),
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
        return Inertia::render('Users/Edit', [
            'user' => $user,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'email' => 'required|string|email|max:255|unique:users,email,' . $user->id,
                'password' => 'nullable|string|min:8|confirmed',
            ]);

            if (!empty($validated['password'])) {
                $validated['password'] = Hash::make($validated['password']);
            } else {
                unset($validated['password']);
            }

            $user->update($validated);

            Log::info('User updated', [
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'updated_by' => auth()->id(),
            ]);

            return redirect()->route('users.index')
                ->with('success', 'User updated successfully.');

        } catch (Exception $e) {
            Log::error('User update failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'updated_by' => auth()->id(),
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
            if ($user->id === auth()->id()) {
                return back()->withErrors(['error' => 'You cannot delete your own account.']);
            }

            $userData = $user->toArray();
            $user->delete();

            Log::info('User deleted', [
                'user_id' => $user->id,
                'name' => $userData['name'],
                'email' => $userData['email'],
                'deleted_by' => auth()->id(),
            ]);

            return redirect()->route('users.index')
                ->with('success', 'User deleted successfully.');

        } catch (Exception $e) {
            Log::error('User deletion failed', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
                'deleted_by' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete user. Please try again.']);
        }
    }
}


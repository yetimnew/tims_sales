<?php

namespace App\Http\Controllers;

use App\Models\Outsource;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class OutsourceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $outsources = Outsource::withCount('outsourcePerformances')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Outsources/Index', [
            'outsources' => $outsources,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Outsources/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'description' => 'nullable|string|max:1000',
            ]);

            $outsource = Outsource::create($validated);

            Log::info('Outsource created', [
                'outsource_id' => $outsource->id,
                'name' => $outsource->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource created successfully.');

        } catch (Exception $e) {
            Log::error('Outsource creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create outsource. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Outsource $outsource): Response
    {
        $outsource->load(['outsourcePerformances']);

        return Inertia::render('Outsources/Show', [
            'outsource' => $outsource,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Outsource $outsource): Response
    {
        return Inertia::render('Outsources/Edit', [
            'outsource' => $outsource,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Outsource $outsource)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'contact_person' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:255',
                'address' => 'nullable|string|max:500',
                'description' => 'nullable|string|max:1000',
            ]);

            $outsource->update($validated);

            Log::info('Outsource updated', [
                'outsource_id' => $outsource->id,
                'name' => $outsource->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource updated successfully.');

        } catch (Exception $e) {
            Log::error('Outsource update failed', [
                'outsource_id' => $outsource->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update outsource. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Outsource $outsource)
    {
        try {
            // Check if outsource is being used in performances
            if ($outsource->outsourcePerformances()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete outsource that has performances.']);
            }

            $outsourceData = $outsource->toArray();
            $outsource->delete();

            Log::info('Outsource deleted', [
                'outsource_id' => $outsource->id,
                'name' => $outsourceData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('outsources.index')
                ->with('success', 'Outsource deleted successfully.');

        } catch (Exception $e) {
            Log::error('Outsource deletion failed', [
                'outsource_id' => $outsource->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete outsource. Please try again.']);
        }
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class WoredaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $woredas = Woreda::with(['zone'])
            ->withCount('places')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Woredas/Index', [
            'woredas' => $woredas,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $zones = Zone::orderBy('name')->get();

        return Inertia::render('Woredas/Create', [
            'zones' => $zones,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'zone_id' => 'required|exists:zones,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $woreda = Woreda::create($validated);

            Log::info('Woreda created', [
                'woreda_id' => $woreda->id,
                'name' => $woreda->name,
                'zone_id' => $woreda->zone_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda created successfully.');

        } catch (Exception $e) {
            Log::error('Woreda creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create woreda. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Woreda $woreda): Response
    {
        $woreda->load(['zone', 'places']);

        return Inertia::render('Woredas/Show', [
            'woreda' => $woreda,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Woreda $woreda): Response
    {
        $zones = Zone::orderBy('name')->get();

        return Inertia::render('Woredas/Edit', [
            'woreda' => $woreda,
            'zones' => $zones,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Woreda $woreda)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'zone_id' => 'required|exists:zones,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $woreda->update($validated);

            Log::info('Woreda updated', [
                'woreda_id' => $woreda->id,
                'name' => $woreda->name,
                'zone_id' => $woreda->zone_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda updated successfully.');

        } catch (Exception $e) {
            Log::error('Woreda update failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update woreda. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Woreda $woreda)
    {
        try {
            // Check if woreda is being used by places
            if ($woreda->places()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete woreda that has places.']);
            }

            $woredaData = $woreda->toArray();
            $woreda->delete();

            Log::info('Woreda deleted', [
                'woreda_id' => $woreda->id,
                'name' => $woredaData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda deleted successfully.');

        } catch (Exception $e) {
            Log::error('Woreda deletion failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete woreda. Please try again.']);
        }
    }
}


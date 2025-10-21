<?php

namespace App\Http\Controllers;

use App\Models\Place;
use App\Models\Woreda;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $places = Place::with(['woreda'])
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Places/Index', [
            'places' => $places,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $woredas = Woreda::orderBy('name')->get();

        return Inertia::render('Places/Create', [
            'woredas' => $woredas,
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
                'woreda_id' => 'required|exists:woredas,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $place = Place::create($validated);

            Log::info('Place created', [
                'place_id' => $place->id,
                'name' => $place->name,
                'woreda_id' => $place->woreda_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('places.index')
                ->with('success', 'Place created successfully.');

        } catch (Exception $e) {
            Log::error('Place creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create place. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Place $place): Response
    {
        $place->load(['woreda']);

        return Inertia::render('Places/Show', [
            'place' => $place,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Place $place): Response
    {
        $woredas = Woreda::orderBy('name')->get();

        return Inertia::render('Places/Edit', [
            'place' => $place,
            'woredas' => $woredas,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Place $place)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'woreda_id' => 'required|exists:woredas,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $place->update($validated);

            Log::info('Place updated', [
                'place_id' => $place->id,
                'name' => $place->name,
                'woreda_id' => $place->woreda_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('places.index')
                ->with('success', 'Place updated successfully.');

        } catch (Exception $e) {
            Log::error('Place update failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update place. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Place $place)
    {
        try {
            // Check if place is being used in performances or distances
            if ($place->performancesAsOrigin()->count() > 0 ||
                $place->performancesAsDestination()->count() > 0 ||
                $place->distancesAsOrigin()->count() > 0 ||
                $place->distancesAsDestination()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete place that is being used in performances or distances.']);
            }

            $placeData = $place->toArray();
            $place->delete();

            Log::info('Place deleted', [
                'place_id' => $place->id,
                'name' => $placeData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('places.index')
                ->with('success', 'Place deleted successfully.');

        } catch (Exception $e) {
            Log::error('Place deletion failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete place. Please try again.']);
        }
    }
}




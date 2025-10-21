<?php

namespace App\Http\Controllers;

use App\Models\Distance;
use App\Models\Place;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class DistanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $distances = Distance::with(['origin', 'destination'])
            ->orderBy('distance')
            ->paginate(15);

        return Inertia::render('Distances/Index', [
            'distances' => $distances,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $places = Place::orderBy('name')->get();

        return Inertia::render('Distances/Create', [
            'places' => $places,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'orgion_id' => 'required|exists:places,id',
                'destination_id' => 'required|exists:places,id|different:orgion_id',
                'distance' => 'required|numeric|min:0|max:9999.99',
                'route_type' => 'nullable|string|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:1',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'boolean',
                'route_notes' => 'nullable|string|max:1000',
            ]);

            $distance = Distance::create($validated);

            Log::info('Distance created', [
                'distance_id' => $distance->id,
                'origin_id' => $distance->orgion_id,
                'destination_id' => $distance->destination_id,
                'distance' => $distance->distance,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('distances.index')
                ->with('success', 'Distance created successfully.');

        } catch (Exception $e) {
            Log::error('Distance creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create distance. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Distance $distance): Response
    {
        $distance->load(['origin', 'destination']);

        return Inertia::render('Distances/Show', [
            'distance' => $distance,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Distance $distance): Response
    {
        $places = Place::orderBy('name')->get();

        return Inertia::render('Distances/Edit', [
            'distance' => $distance,
            'places' => $places,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Distance $distance)
    {
        try {
            $validated = $request->validate([
                'orgion_id' => 'required|exists:places,id',
                'destination_id' => 'required|exists:places,id|different:orgion_id',
                'distance' => 'required|numeric|min:0|max:9999.99',
                'route_type' => 'nullable|string|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:1',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'boolean',
                'route_notes' => 'nullable|string|max:1000',
            ]);

            $distance->update($validated);

            Log::info('Distance updated', [
                'distance_id' => $distance->id,
                'origin_id' => $distance->orgion_id,
                'destination_id' => $distance->destination_id,
                'distance' => $distance->distance,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('distances.index')
                ->with('success', 'Distance updated successfully.');

        } catch (Exception $e) {
            Log::error('Distance update failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update distance. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Distance $distance)
    {
        try {
            $distanceData = $distance->toArray();
            $distance->delete();

            Log::info('Distance deleted', [
                'distance_id' => $distance->id,
                'origin_id' => $distanceData['orgion_id'],
                'destination_id' => $distanceData['destination_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('distances.index')
                ->with('success', 'Distance deleted successfully.');

        } catch (Exception $e) {
            Log::error('Distance deletion failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete distance. Please try again.']);
        }
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class ZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $zones = Zone::with(['region'])
            ->withCount('woredas')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Zones/Index', [
            'zones' => $zones,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $regions = Region::orderBy('name')->get();

        return Inertia::render('Zones/Create', [
            'regions' => $regions,
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
                'region_id' => 'required|exists:regions,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $zone = Zone::create($validated);

            Log::info('Zone created', [
                'zone_id' => $zone->id,
                'name' => $zone->name,
                'region_id' => $zone->region_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('zones.index')
                ->with('success', 'Zone created successfully.');

        } catch (Exception $e) {
            Log::error('Zone creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create zone. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Zone $zone): Response
    {
        $zone->load(['region', 'woredas']);

        return Inertia::render('Zones/Show', [
            'zone' => $zone,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Zone $zone): Response
    {
        $regions = Region::orderBy('name')->get();

        return Inertia::render('Zones/Edit', [
            'zone' => $zone,
            'regions' => $regions,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Zone $zone)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'region_id' => 'required|exists:regions,id',
                'description' => 'nullable|string|max:1000',
            ]);

            $zone->update($validated);

            Log::info('Zone updated', [
                'zone_id' => $zone->id,
                'name' => $zone->name,
                'region_id' => $zone->region_id,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('zones.index')
                ->with('success', 'Zone updated successfully.');

        } catch (Exception $e) {
            Log::error('Zone update failed', [
                'zone_id' => $zone->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update zone. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Zone $zone)
    {
        try {
            // Check if zone is being used by woredas
            if ($zone->woredas()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete zone that has woredas.']);
            }

            $zoneData = $zone->toArray();
            $zone->delete();

            Log::info('Zone deleted', [
                'zone_id' => $zone->id,
                'name' => $zoneData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('zones.index')
                ->with('success', 'Zone deleted successfully.');

        } catch (Exception $e) {
            Log::error('Zone deletion failed', [
                'zone_id' => $zone->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete zone. Please try again.']);
        }
    }
}




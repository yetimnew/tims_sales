<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class RegionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $regions = Region::withCount('zones')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('Regions/Index', [
            'regions' => $regions,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Regions/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:regions',
                'description' => 'nullable|string|max:1000',
            ]);

            $region = Region::create($validated);

            Log::info('Region created', [
                'region_id' => $region->id,
                'name' => $region->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('regions.index')
                ->with('success', 'Region created successfully.');

        } catch (Exception $e) {
            Log::error('Region creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create region. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Region $region): Response
    {
        $region->load(['zones']);

        return Inertia::render('Regions/Show', [
            'region' => $region,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Region $region): Response
    {
        return Inertia::render('Regions/Edit', [
            'region' => $region,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Region $region)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:regions,name,' . $region->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $region->update($validated);

            Log::info('Region updated', [
                'region_id' => $region->id,
                'name' => $region->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('regions.index')
                ->with('success', 'Region updated successfully.');

        } catch (Exception $e) {
            Log::error('Region update failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update region. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Region $region)
    {
        try {
            // Check if region is being used by zones
            if ($region->zones()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete region that has zones.']);
            }

            $regionData = $region->toArray();
            $region->delete();

            Log::info('Region deleted', [
                'region_id' => $region->id,
                'name' => $regionData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('regions.index')
                ->with('success', 'Region deleted successfully.');

        } catch (Exception $e) {
            Log::error('Region deletion failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete region. Please try again.']);
        }
    }
}


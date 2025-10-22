<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class RegionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Region::withCount('zones');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'code', 'zones_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $regions = $query->paginate(15);

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

            Activity::performedOn($region)
                ->causedBy(auth()->user())
                ->log('created');

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

        $activityLogs = Activity::forSubject($region)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Regions/Show', [
            'region' => $region,
            'activityLogs' => $activityLogs,
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

            $oldData = $region->toArray();
            $region->update($validated);

            Activity::performedOn($region)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $region->toArray()])
                ->log('updated');

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

            Activity::performedOn($region)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $regionData])
                ->log('deleted');

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

    /**
     * Export regions to CSV
     */
    public function export(Request $request)
    {
        $query = Region::withCount('zones');

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'code', 'zones_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $regions = $query->get();

        // Generate CSV
        $filename = 'regions-' . date('Y-m-d-H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($regions) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, ['ID', 'Name', 'Code', 'Description', 'Zones Count', 'Created At']);

            // Data rows
            foreach ($regions as $region) {
                fputcsv($file, [
                    $region->id,
                    $region->name,
                    $region->code,
                    $region->description,
                    $region->zones_count,
                    $region->created_at,
                ]);
            }

            fclose($file);
        };

        // Log export activity
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($regions)])
            ->log('exported');

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Deactivate the specified region.
     */
    public function deactivate(Region $region)
    {
        try {
            $region->update(['status' => 'inactive']);

            return redirect()->route('regions.index')
                ->with('success', 'Region deactivated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to deactivate region. Please try again.']);
        }
    }

    /**
     * Get active regions.
     */
    public function activeRegions()
    {
        try {
            $activeRegions = Region::where('status', 'active')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeRegions,
                'count' => $activeRegions->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active regions'
            ], 500);
        }
    }
}




<?php

namespace App\Http\Controllers;

use App\Models\Zone;
use App\Models\Region;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class ZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Zone::with(['region'])->withCount('woredas');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('region', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'code', 'woredas_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $zones = $query->paginate(15);

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

            Activity::performedOn($zone)
                ->causedBy(auth()->user())
                ->log('created');

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

        $activityLogs = Activity::forSubject($zone)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Zones/Show', [
            'zone' => $zone,
            'activityLogs' => $activityLogs,
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

            $oldData = $zone->toArray();
            $zone->update($validated);

            Activity::performedOn($zone)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $zone->toArray()])
                ->log('updated');

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

            Activity::performedOn($zone)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $zoneData])
                ->log('deleted');

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

    /**
     * Export zones to CSV
     */
    public function export(Request $request)
    {
        $query = Zone::with(['region'])->withCount('woredas');

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('region', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'code', 'woredas_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $zones = $query->get();

        // Generate CSV
        $filename = 'zones-' . date('Y-m-d-H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($zones) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, ['ID', 'Name', 'Code', 'Region', 'Description', 'Woredas Count', 'Created At']);

            // Data rows
            foreach ($zones as $zone) {
                fputcsv($file, [
                    $zone->id,
                    $zone->name,
                    $zone->code,
                    $zone->region?->name ?? 'N/A',
                    $zone->description,
                    $zone->woredas_count,
                    $zone->created_at,
                ]);
            }

            fclose($file);
        };

        // Log export activity
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($zones)])
            ->log('exported');

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Deactivate the specified zone.
     */
    public function deactivate(Zone $zone)
    {
        try {
            $zone->update(['status' => 'inactive']);

            return redirect()->route('zones.index')
                ->with('success', 'Zone deactivated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to deactivate zone. Please try again.']);
        }
    }

    /**
     * Get active zones.
     */
    public function activeZones()
    {
        try {
            $activeZones = Zone::where('status', 'active')
                ->with('region')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeZones,
                'count' => $activeZones->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active zones'
            ], 500);
        }
    }
}




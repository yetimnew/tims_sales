<?php

namespace App\Http\Controllers;

use App\Events\ZoneCreated;
use App\Events\ZoneDeleted;
use App\Events\ZoneUpdated;
use App\Models\Region;
use App\Models\Zone;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Facades\Activity as ActivityLogger;
use Spatie\Activitylog\Models\Activity;

class ZoneController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Zone::with(['region'])->withCount('woredas');

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
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
        $allowedSorts = ['name', 'code', 'woredas_count', 'created_at', 'population', 'accessibility_score', 'area_km2'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $metricsQuery = clone $query;

        $zones = $query->paginate(15)->withQueryString();

        // Cache metrics only when no filters applied (1 hour)
        $search = $request->input('search');
        $cacheKey = 'zones.metrics';
        if (empty($search)) {
            $metrics = Cache::remember($cacheKey, 3600, function () use ($metricsQuery) {
                return [
                    'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
                    'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
                    'surveyedCount' => (clone $metricsQuery)->whereNotNull('infrastructure_notes')->count(),
                ];
            });
        } else {
            $metrics = [
                'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
                'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
                'surveyedCount' => (clone $metricsQuery)->whereNotNull('infrastructure_notes')->count(),
            ];
        }

        return Inertia::render('Zones/Index', [
            'zones' => $zones,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Cache regions list (1 hour) - changes when regions are added/removed
        $regions = Cache::remember('zones.create_regions', 3600, function () {
            return Region::orderBy('name')->get();
        });

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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('zones', 'code')->whereNull('deleted_at'),
                ],
                'region_id' => 'required|exists:regions,id',
                'status' => 'required|in:active,inactive',
                'description' => 'nullable|string|max:1000',
                'administrative_center' => 'nullable|string|max:255',
                'area_km2' => 'nullable|numeric|min:0|max:999999.99',
                'population' => 'nullable|integer|min:0',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'elevation_m' => 'nullable|numeric|min:-400|max:9000',
                'accessibility_score' => 'nullable|numeric|min:0|max:100',
                'infrastructure_notes' => 'nullable|string|max:2000',
                'climate_profile' => 'nullable|string|max:2000',
                'boundary_geojson' => 'nullable|json',
            ]);

            if ($request->has('boundary_geojson')) {
                $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                    ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                    : null;
            }

            $zone = Zone::create($validated);

            ActivityLogger::performedOn($zone)
                ->causedBy(Auth::user())
                ->log('created');

            event(new ZoneCreated($zone, Auth::user()));

            // Clear cached data
            Cache::forget('zones.metrics');
            Cache::forget('woredas.create_zones'); // Clear woredas create form cache

            return redirect()->route('zones.index')
                ->with('success', 'Zone created successfully.');

        } catch (Exception $e) {
            Log::error('Zone creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to create zone. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Zone $zone): Response
    {
        $zone->load([
            'region:id,name,status,boundary_geojson',
            'woredas:id,zone_id,name,status,population,boundary_geojson',
        ]);

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
        // Cache regions list (1 hour)
        $regions = Cache::remember('zones.create_regions', 3600, function () {
            return Region::orderBy('name')->get();
        });

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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('zones', 'code')->whereNull('deleted_at')->ignore($zone->id),
                ],
                'region_id' => 'required|exists:regions,id',
                'status' => 'required|in:active,inactive',
                'description' => 'nullable|string|max:1000',
                'administrative_center' => 'nullable|string|max:255',
                'area_km2' => 'nullable|numeric|min:0|max:999999.99',
                'population' => 'nullable|integer|min:0',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'elevation_m' => 'nullable|numeric|min:-400|max:9000',
                'accessibility_score' => 'nullable|numeric|min:0|max:100',
                'infrastructure_notes' => 'nullable|string|max:2000',
                'climate_profile' => 'nullable|string|max:2000',
                'boundary_geojson' => 'nullable|json',
            ]);

            if ($request->has('boundary_geojson')) {
                $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                    ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                    : null;
            }

            $original = $zone->getOriginal();
            $zone->fill($validated);

            $dirty = $zone->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $zone->save();

            ActivityLogger::performedOn($zone)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $original, 'new' => $zone->toArray()])
                ->log('updated');

            if ($changes !== []) {
                event(new ZoneUpdated($zone->fresh('region'), $changes, Auth::user()));
            }

            // Clear cached data
            Cache::forget('zones.metrics');
            Cache::forget('woredas.create_zones'); // Clear woredas create form cache

            return redirect()->route('zones.index')
                ->with('success', 'Zone updated successfully.');

        } catch (Exception $e) {
            Log::error('Zone update failed', [
                'zone_id' => $zone->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to update zone. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
                $errorMessage = 'Cannot delete zone that has woredas.';

                return back()
                    ->withErrors(['error' => $errorMessage])
                    ->with('error', $errorMessage);
            }

            $zoneId = $zone->getKey();
            $zoneName = $zone->name;
            $regionId = $zone->region_id;
            $zoneData = $zone->toArray();
            $zone->delete();

            ActivityLogger::performedOn($zone)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $zoneData])
                ->log('deleted');

            event(new ZoneDeleted($zoneId, $zoneName, $regionId, $zoneData, Auth::user()));

            // Clear cached data
            Cache::forget('zones.metrics');
            Cache::forget('woredas.create_zones'); // Clear woredas create form cache

            return redirect()->route('zones.index')
                ->with('success', 'Zone deleted successfully.');

        } catch (Exception $e) {
            Log::error('Zone deletion failed', [
                'zone_id' => $zone->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to delete zone. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Deactivate the specified zone.
     */
    public function deactivate(Zone $zone)
    {
        try {
            $zone->update(['status' => 'inactive']);

            // Clear cached data
            Cache::forget('zones.metrics');

            return redirect()->route('zones.index')
                ->with('success', 'Zone deactivated successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to deactivate zone. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Get active zones.
     */
    public function activeZones()
    {
        try {
            $activeZones = Zone::active()
                ->with('region')
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeZones,
                'count' => $activeZones->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active zones',
            ], 500);
        }
    }
}

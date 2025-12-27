<?php

namespace App\Http\Controllers;

use App\Events\RegionCreated;
use App\Events\RegionDeleted;
use App\Events\RegionUpdated;
use App\Models\Region;
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

class RegionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');

        $perPageOptions = [10, 15, 25, 50];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        $regionsQuery = Region::query()->withCount('zones');
        $metricsQuery = Region::query();

        if ($search !== '') {
            $applySearch = static function ($query) use ($search) {
                $query->where(function ($inner) use ($search) {
                    $inner->where('name', 'like', "%{$search}%")
                        ->orWhere('code', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%");
                });
            };

            $applySearch($regionsQuery);
            $applySearch($metricsQuery);
        }

        if (in_array($status, ['active', 'inactive'], true)) {
            $regionsQuery->where('status', $status);
            $metricsQuery->where('status', $status);
        }

        if (in_array($request->input('status'), ['active', 'inactive'], true)) {
            $query->where('status', $request->input('status'));
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $allowedSorts = ['name', 'code', 'status', 'zones_count', 'population', 'accessibility_score', 'area_km2', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $regionsQuery->orderBy($sort, $direction);

        $regions = $regionsQuery->paginate($perPage)->withQueryString();

        // Cache metrics only when no filters applied (1 hour) - changes when regions are added/removed/updated
        $cacheKey = 'regions.metrics';
        if ($search === '' && empty($status)) {
            $metrics = Cache::remember($cacheKey, 3600, function () use ($metricsQuery) {
                $metricsBaseQuery = clone $metricsQuery;

                return [
                    'total' => (clone $metricsBaseQuery)->count(),
                    'active' => (clone $metricsBaseQuery)->where('status', 'active')->count(),
                    'inactive' => (clone $metricsBaseQuery)->where('status', 'inactive')->count(),
                    'totalPopulation' => (int) ((clone $metricsBaseQuery)->sum('population') ?? 0),
                    'averageAccessibility' => round((float) (((clone $metricsBaseQuery)->avg('accessibility_score')) ?? 0), 2),
                    'surveyedCount' => (clone $metricsBaseQuery)->whereNotNull('last_surveyed_at')->count(),
                    'totalZones' => (int) (clone $metricsBaseQuery)->withCount('zones')->get()->sum('zones_count'),
                ];
            });
        } else {
            // Calculate metrics without cache when filters are applied
            $metricsBaseQuery = clone $metricsQuery;
            $metrics = [
                'total' => (clone $metricsBaseQuery)->count(),
                'active' => (clone $metricsBaseQuery)->where('status', 'active')->count(),
                'inactive' => (clone $metricsBaseQuery)->where('status', 'inactive')->count(),
                'totalPopulation' => (int) ((clone $metricsBaseQuery)->sum('population') ?? 0),
                'averageAccessibility' => round((float) (((clone $metricsBaseQuery)->avg('accessibility_score')) ?? 0), 2),
                'surveyedCount' => (clone $metricsBaseQuery)->whereNotNull('last_surveyed_at')->count(),
                'totalZones' => (int) (clone $metricsBaseQuery)->withCount('zones')->get()->sum('zones_count'),
            ];
        }

        $filters = [
            'search' => $search !== '' ? $search : null,
            'status' => $status ?: null,
            'sort' => $sort,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        $statusOptions = [
            ['label' => 'Active', 'value' => 'active'],
            ['label' => 'Inactive', 'value' => 'inactive'],
        ];

        return Inertia::render('Regions/Index', [
            'regions' => $regions,
            'metrics' => $metrics,
            'filters' => $filters,
            'statusOptions' => $statusOptions,
            'perPageOptions' => $perPageOptions,
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
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name',
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('regions', 'code')->whereNull('deleted_at'),
            ],
            'status' => 'nullable|in:active,inactive',
            'description' => 'nullable|string|max:1000',
            'capital' => 'nullable|string|max:255',
            'area_km2' => 'nullable|numeric|min:0|max:999999.99',
            'population' => 'nullable|integer|min:0',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'elevation_m' => 'nullable|numeric|min:-400|max:9000',
            'accessibility_score' => 'nullable|numeric|min:0|max:100',
            'last_surveyed_at' => 'nullable|date',
            'infrastructure_notes' => 'nullable|string|max:2000',
            'climate_profile' => 'nullable|string|max:2000',
            'boundary_geojson' => 'nullable|json',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        if ($request->has('boundary_geojson')) {
            $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                : null;
        }

        try {
            $region = Region::create($validated);

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->log('created');

            event(new RegionCreated($region, Auth::user()));

            // Clear cached data
            Cache::forget('regions.metrics');
            Cache::forget('zones.create_regions'); // Clear zones create form cache

            return redirect()->route('regions.index')
                ->with('success', 'Region created successfully.');
        } catch (Exception $e) {
            Log::error('Region creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to create region. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Region $region): Response
    {
        $region->load([
            'zones' => static function ($query): void {
                $query->select('id', 'region_id', 'name', 'status', 'boundary_geojson')
                    ->with(['woredas' => static function ($woredaQuery): void {
                        $woredaQuery->select('id', 'zone_id', 'name', 'status', 'boundary_geojson');
                    }]);
            },
        ]);

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
        $validated = $request->validate([
            'name' => 'required|string|max:255|unique:regions,name,'.$region->id,
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('regions', 'code')->whereNull('deleted_at')->ignore($region->id),
            ],
            'status' => 'nullable|in:active,inactive',
            'description' => 'nullable|string|max:1000',
            'capital' => 'nullable|string|max:255',
            'area_km2' => 'nullable|numeric|min:0|max:999999.99',
            'population' => 'nullable|integer|min:0',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'elevation_m' => 'nullable|numeric|min:-400|max:9000',
            'accessibility_score' => 'nullable|numeric|min:0|max:100',
            'last_surveyed_at' => 'nullable|date',
            'infrastructure_notes' => 'nullable|string|max:2000',
            'climate_profile' => 'nullable|string|max:2000',
            'boundary_geojson' => 'nullable|json',
        ]);

        $validated['status'] = $validated['status'] ?? $region->status ?? 'active';

        if ($request->has('boundary_geojson')) {
            $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                : null;
        }

        try {
            $original = $region->getOriginal();

            $region->fill($validated);

            $dirty = $region->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $region->save();

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $original, 'new' => $region->toArray()])
                ->log('updated');

            if ($changes !== []) {
                event(new RegionUpdated($region->fresh(), $changes, Auth::user()));
            }

            // Clear cached data
            Cache::forget('regions.metrics');
            Cache::forget('zones.create_regions'); // Clear zones create form cache

            return redirect()->route('regions.index')
                ->with('success', 'Region updated successfully.');
        } catch (Exception $e) {
            Log::error('Region update failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to update region. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
                $errorMessage = 'Cannot delete region that has zones.';

                return back()
                    ->withErrors(['error' => $errorMessage])
                    ->with('error', $errorMessage);
            }

            $regionId = $region->getKey();
            $regionName = $region->name;
            $regionData = $region->toArray();
            $region->delete();

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $regionData])
                ->log('deleted');

            event(new RegionDeleted($regionId, $regionName, $regionData, Auth::user()));

            // Clear cached data
            Cache::forget('regions.metrics');
            Cache::forget('zones.create_regions'); // Clear zones create form cache

            return redirect()->route('regions.index')
                ->with('success', 'Region deleted successfully.');

        } catch (Exception $e) {
            Log::error('Region deletion failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to delete region. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Deactivate the specified region.
     */
    public function deactivate(Region $region)
    {
        try {
            $region->update(['status' => 'inactive']);

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->log('regions.deactivated');

            return redirect()->route('regions.index')
                ->with('success', 'Region deactivated successfully.');
        } catch (Exception $e) {
            Log::error('Region deactivation failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to deactivate region. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Get active regions.
     */
    public function activeRegions()
    {
        try {
            $activeRegions = Region::active()
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeRegions,
                'count' => $activeRegions->count(),
            ]);
        } catch (Exception $e) {
            Log::error('Failed to retrieve active regions', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active regions',
            ], 500);
        }
    }
}

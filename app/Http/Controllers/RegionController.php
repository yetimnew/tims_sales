<?php

namespace App\Http\Controllers;

use App\Models\Region;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        try {
            $region = Region::create($validated);

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->log('created');

            return redirect()->route('regions.index')
                ->with('success', 'Region created successfully.');
        } catch (Exception $e) {
            Log::error('Region creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
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
        ]);

        $validated['status'] = $validated['status'] ?? $region->status ?? 'active';

        try {
            $oldData = $region->toArray();
            $region->update($validated);

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $oldData, 'new' => $region->toArray()])
                ->log('updated');

            return redirect()->route('regions.index')
                ->with('success', 'Region updated successfully.');
        } catch (Exception $e) {
            Log::error('Region update failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
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

            ActivityLogger::performedOn($region)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $regionData])
                ->log('deleted');

            return redirect()->route('regions.index')
                ->with('success', 'Region deleted successfully.');

        } catch (Exception $e) {
            Log::error('Region deletion failed', [
                'region_id' => $region->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
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
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        if (in_array($request->input('status'), ['active', 'inactive'], true)) {
            $query->where('status', $request->input('status'));
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'code', 'zones_count', 'created_at'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $regions = $query->get();

        $filename = 'regions-'.now()->format('Y-m-d-H-i-s').'.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = static function () use ($regions) {
            $handle = fopen('php://output', 'w');

            fwrite($handle, "\xEF\xBB\xBF");

            fputcsv($handle, [
                'ID',
                'Name',
                'Code',
                'Status',
                'Capital',
                'Area (km²)',
                'Population',
                'Latitude',
                'Longitude',
                'Elevation (m)',
                'Accessibility Score',
                'Last Surveyed At',
                'Description',
                'Infrastructure Notes',
                'Climate Profile',
                'Zones Count',
                'Created At',
            ]);

            foreach ($regions as $region) {
                fputcsv($handle, [
                    $region->id,
                    $region->name,
                    $region->code,
                    $region->status,
                    $region->capital,
                    $region->area_km2,
                    $region->population,
                    $region->latitude,
                    $region->longitude,
                    $region->elevation_m,
                    $region->accessibility_score,
                    optional($region->last_surveyed_at)->toDateString(),
                    $region->description,
                    $region->infrastructure_notes,
                    $region->climate_profile,
                    $region->zones_count,
                    optional($region->created_at)->toDateTimeString(),
                ]);
            }

            fclose($handle);
        };

        ActivityLogger::causedBy(Auth::user())
            ->withProperties(['count' => $regions->count()])
            ->log('regions.exported');

        return response()->stream($callback, 200, $headers);
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

            return back()->withErrors(['error' => 'Failed to deactivate region. Please try again.']);
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

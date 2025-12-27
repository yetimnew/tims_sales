<?php

namespace App\Http\Controllers;

use App\Events\WoredaCreated;
use App\Events\WoredaDeleted;
use App\Events\WoredaUpdated;
use App\Models\Woreda;
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

class WoredaController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Woreda::with(['zone'])->withCount('places');

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('zone', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'code', 'places_count', 'created_at', 'population', 'accessibility_score', 'area_km2'];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $metricsQuery = clone $query;

        $woredas = $query->paginate(15)->withQueryString();

        // Cache metrics only when no filters applied (1 hour)
        $search = $request->input('search');
        $cacheKey = 'woredas.metrics';
        if (empty($search)) {
            $metrics = Cache::remember($cacheKey, 3600, function () use ($metricsQuery) {
                return [
                    'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
                    'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
                    'roadNoteCount' => (clone $metricsQuery)->whereNotNull('road_quality_notes')->count(),
                ];
            });
        } else {
            $metrics = [
                'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
                'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
                'roadNoteCount' => (clone $metricsQuery)->whereNotNull('road_quality_notes')->count(),
            ];
        }

        return Inertia::render('Woredas/Index', [
            'woredas' => $woredas,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Cache zones list (1 hour) - changes when zones are added/removed
        $zones = Cache::remember('woredas.create_zones', 3600, function () {
            return Zone::orderBy('name')->get();
        });

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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('woredas', 'code')->whereNull('deleted_at'),
                ],
                'zone_id' => 'required|exists:zones,id',
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
                'road_quality_notes' => 'nullable|string|max:2000',
                'boundary_geojson' => 'nullable|json',
            ]);

            if ($request->has('boundary_geojson')) {
                $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                    ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                    : null;
            }

            $woreda = Woreda::create($validated);

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->log('created');

            event(new WoredaCreated($woreda, Auth::user()));

            // Clear cached data
            Cache::forget('woredas.metrics');
            Cache::forget('places.create_woredas'); // Clear places create form cache

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda created successfully.');

        } catch (Exception $e) {
            Log::error('Woreda creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to create woreda. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Woreda $woreda): Response
    {
        $woreda->load([
            'zone:id,name,status,boundary_geojson,region_id',
            'zone.region:id,name,status,boundary_geojson',
            'places:id,woreda_id,name,status,is_logistics_hub',
        ]);

        $activityLogs = Activity::forSubject($woreda)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Woredas/Show', [
            'woreda' => $woreda,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Woreda $woreda): Response
    {
        // Cache zones list (1 hour)
        $zones = Cache::remember('woredas.create_zones', 3600, function () {
            return Zone::orderBy('name')->get();
        });

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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('woredas', 'code')->whereNull('deleted_at')->ignore($woreda->id),
                ],
                'zone_id' => 'required|exists:zones,id',
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
                'road_quality_notes' => 'nullable|string|max:2000',
                'boundary_geojson' => 'nullable|json',
            ]);

            if ($request->has('boundary_geojson')) {
                $validated['boundary_geojson'] = $request->filled('boundary_geojson')
                    ? json_decode((string) $request->string('boundary_geojson')->toString(), true)
                    : null;
            }

            $original = $woreda->getOriginal();
            $woreda->fill($validated);

            $dirty = $woreda->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $woreda->save();

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $original, 'new' => $woreda->toArray()])
                ->log('updated');

            if ($changes !== []) {
                event(new WoredaUpdated($woreda->fresh('zone'), $changes, Auth::user()));
            }

            // Clear cached data
            Cache::forget('woredas.metrics');
            Cache::forget('places.create_woredas'); // Clear places create form cache

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda updated successfully.');

        } catch (Exception $e) {
            Log::error('Woreda update failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to update woreda. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
                $errorMessage = 'Cannot delete woreda that has places.';

                return back()
                    ->withErrors(['error' => $errorMessage])
                    ->with('error', $errorMessage);
            }

            $woredaId = $woreda->getKey();
            $woredaName = $woreda->name;
            $zoneId = $woreda->zone_id;
            $woredaData = $woreda->toArray();
            $woreda->delete();

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $woredaData])
                ->log('deleted');

            event(new WoredaDeleted($woredaId, $woredaName, $zoneId, $woredaData, Auth::user()));

            // Clear cached data
            Cache::forget('woredas.metrics');
            Cache::forget('places.create_woredas'); // Clear places create form cache

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda deleted successfully.');

        } catch (Exception $e) {
            Log::error('Woreda deletion failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to delete woreda. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Deactivate the specified woreda.
     */
    public function deactivate(Woreda $woreda)
    {
        try {
            $woreda->update(['status' => 'inactive']);

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda deactivated successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to deactivate woreda. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Get active woredas.
     */
    public function activeWoredas()
    {
        try {
            $activeWoredas = Woreda::active()
                ->with(['zone.region'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeWoredas,
                'count' => $activeWoredas->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active woredas',
            ], 500);
        }
    }
}

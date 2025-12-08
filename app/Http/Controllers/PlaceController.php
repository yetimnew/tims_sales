<?php

namespace App\Http\Controllers;

use App\Events\PlaceCreated;
use App\Events\PlaceDeleted;
use App\Events\PlaceUpdated;
use App\Models\Place;
use App\Models\Woreda;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Facades\Activity as ActivityLogger;
use Spatie\Activitylog\Models\Activity;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Place::with(['woreda.zone.region'])->withCount(['originPerformances', 'destinationPerformances']);

        // Handle search
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhereHas('woreda', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('woreda.zone', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('woreda.zone.region', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = [
            'name',
            'code',
            'origin_performances_count',
            'destination_performances_count',
            'created_at',
            'population',
            'accessibility_score',
            'is_logistics_hub',
        ];
        if (! in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $metricsQuery = clone $query;

        $places = $query->paginate(15)->withQueryString();

        $metrics = [
            'hubCount' => (clone $metricsQuery)->where('is_logistics_hub', true)->count(),
            'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
            'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
        ];

        return Inertia::render('Places/Index', [
            'places' => $places,
            'metrics' => $metrics,
        ]);
    }

    /**
     * Provide lightweight search results for place lookups.
     */
    public function search(Request $request): JsonResponse
    {
        $search = trim((string) $request->input('search'));
        $limit = (int) $request->input('limit', 20);

        if ($limit <= 0) {
            $limit = 20;
        }

        $limit = min($limit, 50);

        $rawSelected = $request->input('selected', []);
        $selectedIds = collect(is_array($rawSelected) ? $rawSelected : [$rawSelected])
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn (int $id) => $id > 0)
            ->unique()
            ->values();

        $baseQuery = Place::query()
            ->select(['id', 'name', 'code', 'woreda_id', 'status'])
            ->with([
                'woreda:id,name,zone_id',
                'woreda.zone:id,name,region_id',
                'woreda.zone.region:id,name',
            ])
            ->where('status', 'active');

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhereHas('woreda', static function ($woredaQuery) use ($search) {
                        $woredaQuery->where('name', 'like', "%{$search}%")
                            ->orWhereHas('zone', static function ($zoneQuery) use ($search) {
                                $zoneQuery->where('name', 'like', "%{$search}%")
                                    ->orWhereHas('region', static function ($regionQuery) use ($search) {
                                        $regionQuery->where('name', 'like', "%{$search}%");
                                    });
                            });
                    });
            });
        }

        $places = (clone $baseQuery)
            ->orderBy('name')
            ->limit($limit + 1)
            ->get();

        $hasMore = $places->count() > $limit;

        if ($hasMore) {
            $places = $places->take($limit);
        }

        $missingSelectedIds = $selectedIds->diff($places->pluck('id'));

        if ($missingSelectedIds->isNotEmpty()) {
            $selectedPlaces = Place::query()
                ->select(['id', 'name', 'code', 'woreda_id', 'status'])
                ->with([
                    'woreda:id,name,zone_id',
                    'woreda.zone:id,name,region_id',
                    'woreda.zone.region:id,name',
                ])
                ->whereIn('id', $missingSelectedIds)
                ->get();

            $places = $places->concat($selectedPlaces);
        }

        $places = $places
            ->unique('id')
            ->sortBy(static fn (Place $place) => Str::lower((string) $place->name))
            ->values();

        return response()->json([
            'data' => $places->map(static fn (Place $place) => [
                'id' => $place->id,
                'name' => $place->name,
                'code' => $place->code,
                'woreda' => $place->woreda ? [
                    'id' => $place->woreda->id,
                    'name' => $place->woreda->name,
                    'zone' => $place->woreda->zone ? [
                        'id' => $place->woreda->zone->id,
                        'name' => $place->woreda->zone->name,
                        'region' => $place->woreda->zone->region ? [
                            'id' => $place->woreda->zone->region->id,
                            'name' => $place->woreda->zone->region->name,
                        ] : null,
                    ] : null,
                ] : null,
            ]),
            'has_more' => $hasMore,
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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('places', 'code')->whereNull('deleted_at'),
                ],
                'woreda_id' => 'required|exists:woredas,id',
                'status' => 'required|in:active,inactive',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'elevation_m' => 'nullable|numeric|min:-400|max:9000',
                'population' => 'nullable|integer|min:0',
                'is_logistics_hub' => 'nullable|boolean',
                'accessibility_score' => 'nullable|numeric|min:0|max:100',
                'description' => 'nullable|string|max:1000',
                'infrastructure_notes' => 'nullable|string|max:2000',
                'road_quality_notes' => 'nullable|string|max:2000',
            ]);

            $place = Place::create($validated);

            ActivityLogger::performedOn($place)
                ->causedBy(Auth::user())
                ->log('created');

            event(new PlaceCreated($place->loadMissing('woreda.zone'), Auth::user()));

            return redirect()->route('places.index')
                ->with('success', 'Place created successfully.');

        } catch (Exception $e) {
            Log::error('Place creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create place. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Place $place): Response
    {
        $place->load(['woreda.zone.region']);

        $activityLogs = Activity::forSubject($place)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Places/Show', [
            'place' => $place,
            'activityLogs' => $activityLogs,
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
                'code' => [
                    'nullable',
                    'string',
                    'max:50',
                    Rule::unique('places', 'code')->whereNull('deleted_at')->ignore($place->id),
                ],
                'woreda_id' => 'required|exists:woredas,id',
                'status' => 'required|in:active,inactive',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'elevation_m' => 'nullable|numeric|min:-400|max:9000',
                'population' => 'nullable|integer|min:0',
                'is_logistics_hub' => 'nullable|boolean',
                'accessibility_score' => 'nullable|numeric|min:0|max:100',
                'description' => 'nullable|string|max:1000',
                'infrastructure_notes' => 'nullable|string|max:2000',
                'road_quality_notes' => 'nullable|string|max:2000',
            ]);

            $original = $place->getOriginal();
            $place->fill($validated);

            $dirty = $place->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $place->save();

            ActivityLogger::performedOn($place)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $original, 'new' => $place->toArray()])
                ->log('updated');

            if ($changes !== []) {
                event(new PlaceUpdated($place->fresh('woreda.zone'), $changes, Auth::user()));
            }

            return redirect()->route('places.index')
                ->with('success', 'Place updated successfully.');

        } catch (Exception $e) {
            Log::error('Place update failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
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
            // Check for related records that prevent deletion

            // Check if place is used as origin in performances
            if ($place->originPerformances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as origin in '.$place->originPerformances()->count().' performance record(s). Please remove all related performances first.',
                ]);
            }

            // Check if place is used as destination in performances
            if ($place->destinationPerformances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as destination in '.$place->destinationPerformances()->count().' performance record(s). Please remove all related performances first.',
                ]);
            }

            // Check if place is used as origin in distances
            if ($place->fromDistances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as origin in '.$place->fromDistances()->count().' distance record(s). Please remove all related distances first.',
                ]);
            }

            // Check if place is used as destination in distances
            if ($place->toDistances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as destination in '.$place->toDistances()->count().' distance record(s). Please remove all related distances first.',
                ]);
            }

            $placeId = $place->getKey();
            $placeName = $place->name;
            $woredaId = $place->woreda_id;
            $placeData = $place->toArray();
            $place->delete();

            ActivityLogger::performedOn($place)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $placeData])
                ->log('deleted');

            event(new PlaceDeleted($placeId, $placeName, $woredaId, $placeData, Auth::user()));

            return redirect()->route('places.index')
                ->with('success', 'Place deleted successfully.');

        } catch (Exception $e) {
            Log::error('Place deletion failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete place. Please try again.']);
        }
    }

    /**
     * Deactivate the specified place.
     */
    public function deactivate(Place $place)
    {
        try {
            $place->update(['status' => 'inactive']);

            return redirect()->route('places.index')
                ->with('success', 'Place deactivated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to deactivate place. Please try again.']);
        }
    }

    /**
     * Get active places.
     */
    public function activePlaces()
    {
        try {
            $activePlaces = Place::active()
                ->with(['woreda.zone.region'])
                ->orderBy('name')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activePlaces,
                'count' => $activePlaces->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active places',
            ], 500);
        }
    }
}

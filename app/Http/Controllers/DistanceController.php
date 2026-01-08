<?php

namespace App\Http\Controllers;

use App\Events\DistanceCreated;
use App\Events\DistanceDeleted;
use App\Events\DistanceUpdated;
use App\Models\Distance;
use App\Models\Place;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Facades\Activity as ActivityLogger;
use Spatie\Activitylog\Models\Activity;

class DistanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Distance::with(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region']);

        // Search functionality
        if ($request->filled('search')) {
            $search = $request->get('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('fromPlace', function ($placeQuery) use ($search) {
                    $placeQuery->where('name', 'like', "%{$search}%");
                })
                    ->orWhereHas('toPlace', function ($placeQuery) use ($search) {
                        $placeQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhere('route_description', 'like', "%{$search}%")
                    ->orWhere('route_notes', 'like', "%{$search}%");

                if (Schema::hasColumn('distances', 'origin_name')) {
                    $q->orWhere('origin_name', 'like', "%{$search}%");
                }

                if (Schema::hasColumn('distances', 'destination_name')) {
                    $q->orWhere('destination_name', 'like', "%{$search}%");
                }
            });
        }

        // Advanced filters
        if ($request->filled('routeType') && $request->get('routeType') !== 'all') {
            $query->where('route_type', $request->get('routeType'));
        }
        if ($request->filled('region')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('fromPlace.woreda.zone.region', function ($regionQuery) use ($request) {
                    $regionQuery->where('name', 'like', "%{$request->get('region')}%");
                })
                    ->orWhereHas('toPlace.woreda.zone.region', function ($regionQuery) use ($request) {
                        $regionQuery->where('name', 'like', "%{$request->get('region')}%");
                    });
            });
        }
        if ($request->filled('zone')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('fromPlace.woreda.zone', function ($zoneQuery) use ($request) {
                    $zoneQuery->where('name', 'like', "%{$request->get('zone')}%");
                })
                    ->orWhereHas('toPlace.woreda.zone', function ($zoneQuery) use ($request) {
                        $zoneQuery->where('name', 'like', "%{$request->get('zone')}%");
                    });
            });
        }
        if ($request->filled('woreda')) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('fromPlace.woreda', function ($woredaQuery) use ($request) {
                    $woredaQuery->where('name', 'like', "%{$request->get('woreda')}%");
                })
                    ->orWhereHas('toPlace.woreda', function ($woredaQuery) use ($request) {
                        $woredaQuery->where('name', 'like', "%{$request->get('woreda')}%");
                    });
            });
        }

        // Sorting
        $sortColumn = $request->get('sort', 'distance_km');
        $sortDirection = $request->get('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSortColumns = ['id', 'distance_km', 'estimated_time_hours', 'route_type', 'average_speed_kmph', 'road_quality_index'];
        if (! in_array($sortColumn, $allowedSortColumns)) {
            $sortColumn = 'distance_km';
        }

        $query->orderBy($sortColumn, $sortDirection);

        $metricsQuery = clone $query;

        $formatPlace = static function (?Place $place): ?array {
            if ($place === null) {
                return null;
            }

            return [
                'id' => $place->id,
                'name' => $place->name,
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
            ];
        };

        $distances = $query
            ->paginate(15)
            ->withQueryString()
            ->through(function (Distance $distance) use ($formatPlace) {
                return [
                    'id' => $distance->id,
                    'status' => $distance->status,
                    'distance_km' => $distance->distance_km,
                    'estimated_time_hours' => $distance->estimated_time_hours,
                    'route_type' => $distance->route_type,
                    'average_speed_kmph' => $distance->average_speed_kmph,
                    'road_quality_index' => $distance->road_quality_index,
                    'toll_road' => $distance->toll_road,
                    'restricted_for_heavy_vehicles' => $distance->restricted_for_heavy_vehicles,
                    'from_place' => $formatPlace($distance->fromPlace),
                    'to_place' => $formatPlace($distance->toPlace),
                ];
            });

        // Cache metrics only when no filters applied (1 hour)
        $search = $request->get('search');
        $cacheKey = 'distances.metrics';
        if (empty($search) && ! $request->filled('routeType') && ! $request->filled('region') &&
            ! $request->filled('zone') && ! $request->filled('woreda')) {
            $metrics = Cache::remember($cacheKey, 3600, function () use ($metricsQuery) {
                return [
                    'averageSpeed' => round((float) (((clone $metricsQuery)->avg('average_speed_kmph')) ?? 0), 2),
                    'averageRoadQuality' => round((float) (((clone $metricsQuery)->avg('road_quality_index')) ?? 0), 2),
                    'seasonalConstraintCount' => (clone $metricsQuery)->whereNotNull('seasonality_notes')->count(),
                ];
            });
        } else {
            $metrics = [
                'averageSpeed' => round((float) (((clone $metricsQuery)->avg('average_speed_kmph')) ?? 0), 2),
                'averageRoadQuality' => round((float) (((clone $metricsQuery)->avg('road_quality_index')) ?? 0), 2),
                'seasonalConstraintCount' => (clone $metricsQuery)->whereNotNull('seasonality_notes')->count(),
            ];
        }

        $filters = [
            'search' => $request->get('search'),
            'routeType' => $request->get('routeType', 'all'),
            'region' => $request->get('region'),
            'zone' => $request->get('zone'),
            'woreda' => $request->get('woreda'),
            'sort' => $sortColumn,
            'direction' => $sortDirection,
        ];

        return Inertia::render('Distances/Index', [
            'distances' => $distances,
            'metrics' => $metrics,
            'filters' => $filters,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        // Cache places list (1 hour) - changes when places are added/removed
        $places = Cache::remember('distances.create_places', 3600, function () {
            return Place::orderBy('name')->get();
        });

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
                'from_place_id' => 'required|exists:places,id',
                'to_place_id' => 'required|exists:places,id|different:from_place_id',
                'distance_km' => 'required|numeric|min:0',
                'status' => 'required|in:active,inactive',
                'estimated_time_hours' => 'required|numeric|min:0',
                'route_description' => 'nullable|string|max:1000',
                'route_type' => 'nullable|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:0',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'nullable|boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'nullable|boolean',
                'route_notes' => 'nullable|string|max:2000',
                'average_speed_kmph' => 'nullable|numeric|min:0|max:200',
                'typical_delay_minutes' => 'nullable|integer|min:0',
                'road_quality_index' => 'nullable|numeric|min:0|max:10',
                'seasonality_notes' => 'nullable|string|max:2000',
                'safety_notes' => 'nullable|string|max:2000',
            ]);

            // Set default values if not provided
            $validated['route_type'] = $validated['route_type'] ?? 'primary';
            $validated['road_condition_factor'] = $validated['road_condition_factor'] ?? 1.0;
            $validated['toll_road'] = $validated['toll_road'] ?? false;
            $validated['restricted_for_heavy_vehicles'] = $validated['restricted_for_heavy_vehicles'] ?? false;
            $validated['average_speed_kmph'] = $validated['average_speed_kmph'] ?? null;
            $validated['road_quality_index'] = $validated['road_quality_index'] ?? null;

            $distance = Distance::create($validated);

            ActivityLogger::performedOn($distance)
                ->causedBy(Auth::user())
                ->log('created');

            event(new DistanceCreated($distance->loadMissing(['fromPlace', 'toPlace']), Auth::user()));

            // Clear cached data
            Cache::forget('distances.metrics');

            return redirect()->route('distances.index')
                ->with('success', 'Distance created successfully.');

        } catch (Exception $e) {
            Log::error('Distance creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to create distance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Distance $distance): Response
    {
        $distance->load(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region']);

        $activityLogs = Activity::forSubject($distance)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Distances/Show', [
            'distance' => $distance,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Distance $distance): Response
    {
        // Cache places list (1 hour)
        $places = Cache::remember('distances.create_places', 3600, function () {
            return Place::orderBy('name')->get();
        });

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
                'from_place_id' => 'required|exists:places,id',
                'to_place_id' => 'required|exists:places,id|different:from_place_id',
                'distance_km' => 'required|numeric|min:0',
                'status' => 'required|in:active,inactive',
                'estimated_time_hours' => 'required|numeric|min:0',
                'route_description' => 'nullable|string|max:1000',
                'route_type' => 'nullable|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:0',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'nullable|boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'nullable|boolean',
                'route_notes' => 'nullable|string|max:2000',
                'average_speed_kmph' => 'nullable|numeric|min:0|max:200',
                'typical_delay_minutes' => 'nullable|integer|min:0',
                'road_quality_index' => 'nullable|numeric|min:0|max:10',
                'seasonality_notes' => 'nullable|string|max:2000',
                'safety_notes' => 'nullable|string|max:2000',
            ]);

            $original = $distance->getOriginal();

            $distance->fill($validated);

            $dirty = $distance->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $distance->save();

            ActivityLogger::performedOn($distance)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $original, 'new' => $distance->toArray()])
                ->log('updated');

            if ($changes !== []) {
                event(new DistanceUpdated($distance->fresh(['fromPlace', 'toPlace']), $changes, Auth::user()));
            }

            // Clear cached data
            Cache::forget('distances.metrics');

            return redirect()->route('distances.index')
                ->with('success', 'Distance updated successfully.');

        } catch (Exception $e) {
            Log::error('Distance update failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to update distance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Distance $distance)
    {
        try {
            $distanceId = $distance->getKey();
            $fromPlaceId = $distance->from_place_id;
            $toPlaceId = $distance->to_place_id;
            $distanceData = $distance->toArray();
            $distance->delete();

            ActivityLogger::performedOn($distance)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $distanceData])
                ->log('deleted');

            event(new DistanceDeleted($distanceId, $fromPlaceId, $toPlaceId, $distanceData, Auth::user()));

            // Clear cached data
            Cache::forget('distances.metrics');

            return redirect()->route('distances.index')
                ->with('success', 'Distance deleted successfully.');

        } catch (Exception $e) {
            Log::error('Distance deletion failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            $errorMessage = 'Failed to delete distance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Deactivate the specified distance.
     */
    public function deactivate(Distance $distance)
    {
        try {
            $distance->update(['status' => 'inactive']);

            return redirect()->route('distances.index')
                ->with('success', 'Distance deactivated successfully.');

        } catch (Exception $e) {
            $errorMessage = 'Failed to deactivate distance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Get active distances.
     */
    public function activeDistances()
    {
        try {
            $activeDistances = Distance::active()
                ->with(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region'])
                ->orderBy('distance_km')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeDistances,
                'count' => $activeDistances->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active distances',
            ], 500);
        }
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Distance;
use App\Models\Place;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Exception;

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
            });
        }

        // Advanced filters
        if ($request->filled('distanceMin')) {
            $query->where('distance_km', '>=', $request->get('distanceMin'));
        }
        if ($request->filled('distanceMax')) {
            $query->where('distance_km', '<=', $request->get('distanceMax'));
        }
        if ($request->filled('timeMin')) {
            $query->where('estimated_time_hours', '>=', $request->get('timeMin'));
        }
        if ($request->filled('timeMax')) {
            $query->where('estimated_time_hours', '<=', $request->get('timeMax'));
        }
        if ($request->filled('routeType') && $request->get('routeType') !== 'all') {
            $query->where('route_type', $request->get('routeType'));
        }
        if ($request->filled('tollRoad') && $request->get('tollRoad') !== 'all') {
            $query->where('toll_road', $request->get('tollRoad') === 'true');
        }
        if ($request->filled('heavyVehicleRestricted') && $request->get('heavyVehicleRestricted') !== 'all') {
            $query->where('restricted_for_heavy_vehicles', $request->get('heavyVehicleRestricted') === 'true');
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

        // Sorting
        $sortColumn = $request->get('sort', 'distance_km');
        $sortDirection = $request->get('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSortColumns = ['id', 'distance_km', 'estimated_time_hours', 'route_type', 'created_at'];
        if (!in_array($sortColumn, $allowedSortColumns)) {
            $sortColumn = 'distance_km';
        }

        $query->orderBy($sortColumn, $sortDirection);

        $distances = $query->paginate(15);

        return Inertia::render('Distances/Index', [
            'distances' => $distances,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $places = Place::orderBy('name')->get();

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
                'estimated_time_hours' => 'required|numeric|min:0',
                'route_description' => 'nullable|string|max:1000',
                'route_type' => 'nullable|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:0',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'nullable|boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'nullable|boolean',
                'route_notes' => 'nullable|string|max:2000',
            ]);

            // Set default values if not provided
            $validated['route_type'] = $validated['route_type'] ?? 'primary';
            $validated['road_condition_factor'] = $validated['road_condition_factor'] ?? 1.0;
            $validated['toll_road'] = $validated['toll_road'] ?? false;
            $validated['restricted_for_heavy_vehicles'] = $validated['restricted_for_heavy_vehicles'] ?? false;

            $distance = Distance::create($validated);

            return redirect()->route('distances.index')
                ->with('success', 'Distance created successfully.');

        } catch (Exception $e) {
            Log::error('Distance creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create distance. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Distance $distance): Response
    {
        $distance->load(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region']);

        return Inertia::render('Distances/Show', [
            'distance' => $distance,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Distance $distance): Response
    {
        $places = Place::orderBy('name')->get();

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
                'estimated_time_hours' => 'required|numeric|min:0',
                'route_description' => 'nullable|string|max:1000',
                'route_type' => 'nullable|in:primary,secondary,alternative',
                'estimated_travel_time_minutes' => 'nullable|integer|min:0',
                'road_condition_factor' => 'nullable|numeric|min:0.5|max:2.0',
                'toll_road' => 'nullable|boolean',
                'toll_cost' => 'nullable|numeric|min:0',
                'restricted_for_heavy_vehicles' => 'nullable|boolean',
                'route_notes' => 'nullable|string|max:2000',
            ]);

            $distance->update($validated);

            return redirect()->route('distances.index')
                ->with('success', 'Distance updated successfully.');

        } catch (Exception $e) {
            Log::error('Distance update failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update distance. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Distance $distance)
    {
        try {
            $distance->delete();

            return redirect()->route('distances.index')
                ->with('success', 'Distance deleted successfully.');

        } catch (Exception $e) {
            Log::error('Distance deletion failed', [
                'distance_id' => $distance->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete distance. Please try again.']);
        }
    }

    /**
     * Export distances to CSV.
     */
    public function export(Request $request)
    {
        $query = Distance::with(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region']);

        // Apply search if provided
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('distance_km', 'like', "%{$search}%")
                    ->orWhere('estimated_time_hours', 'like', "%{$search}%")
                    ->orWhereHas('fromPlace', function ($placeQuery) use ($search) {
                        $placeQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('toPlace', function ($placeQuery) use ($search) {
                        $placeQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'distance_km');
            $direction = $request->input('direction', 'asc');
            $query = $query->orderBy($sort, $direction);
        }

        $distances = $query->get();

        // Generate CSV
        $filename = 'distances_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'From Place',
            'To Place',
            'Distance (KM)',
            'Estimated Time (Hours)',
            'From Region',
            'To Region',
            'Created At',
            'Updated At'
        ]);

        // Write data
        foreach ($distances as $distance) {
            fputcsv($handle, [
                $distance->id,
                $distance->fromPlace?->name ?? 'N/A',
                $distance->toPlace?->name ?? 'N/A',
                $distance->distance_km,
                $distance->estimated_time_hours,
                $distance->fromPlace?->woreda?->zone?->region?->name ?? 'N/A',
                $distance->toPlace?->woreda?->zone?->region?->name ?? 'N/A',
                $distance->created_at,
                $distance->updated_at
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log the export activity
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($distances)])
                ->log('exported distances to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
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
            return back()->withErrors(['error' => 'Failed to deactivate distance. Please try again.']);
        }
    }

    /**
     * Get active distances.
     */
    public function activeDistances()
    {
        try {
            $activeDistances = Distance::where('status', 'active')
                ->with(['fromPlace.woreda.zone.region', 'toPlace.woreda.zone.region'])
                ->orderBy('distance_km')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activeDistances,
                'count' => $activeDistances->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active distances'
            ], 500);
        }
    }
}




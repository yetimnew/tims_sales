<?php

namespace App\Http\Controllers;

use App\Models\Place;
use App\Models\Woreda;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Place::with(['woreda.zone.region'])->withCount(['originPerformances', 'destinationPerformances']);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
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
        $allowedSorts = ['name', 'code', 'origin_performances_count', 'destination_performances_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $places = $query->paginate(15);

        return Inertia::render('Places/Index', [
            'places' => $places,
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
                'woreda_id' => 'required|exists:woredas,id',
                'status' => 'required|in:active,inactive',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'description' => 'nullable|string|max:1000',
            ]);

            $place = Place::create($validated);

            Activity::performedOn($place)
                ->causedBy(auth()->user())
                ->log('created');

            return redirect()->route('places.index')
                ->with('success', 'Place created successfully.');

        } catch (Exception $e) {
            Log::error('Place creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
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
                'woreda_id' => 'required|exists:woredas,id',
                'status' => 'required|in:active,inactive',
                'latitude' => 'nullable|numeric|between:-90,90',
                'longitude' => 'nullable|numeric|between:-180,180',
                'description' => 'nullable|string|max:1000',
            ]);

            $oldData = $place->toArray();
            $place->update($validated);

            Activity::performedOn($place)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $place->toArray()])
                ->log('updated');

            return redirect()->route('places.index')
                ->with('success', 'Place updated successfully.');

        } catch (Exception $e) {
            Log::error('Place update failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
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
                    'error' => 'You are not allowed to delete this place. It is used as origin in ' . $place->originPerformances()->count() . ' performance record(s). Please remove all related performances first.'
                ]);
            }

            // Check if place is used as destination in performances
            if ($place->destinationPerformances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as destination in ' . $place->destinationPerformances()->count() . ' performance record(s). Please remove all related performances first.'
                ]);
            }

            // Check if place is used as origin in distances
            if ($place->fromDistances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as origin in ' . $place->fromDistances()->count() . ' distance record(s). Please remove all related distances first.'
                ]);
            }

            // Check if place is used as destination in distances
            if ($place->toDistances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this place. It is used as destination in ' . $place->toDistances()->count() . ' distance record(s). Please remove all related distances first.'
                ]);
            }

            $placeData = $place->toArray();
            $place->delete();

            Activity::performedOn($place)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $placeData])
                ->log('deleted');

            return redirect()->route('places.index')
                ->with('success', 'Place deleted successfully.');

        } catch (Exception $e) {
            Log::error('Place deletion failed', [
                'place_id' => $place->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete place. Please try again.']);
        }
    }

    /**
     * Export places to CSV
     */
    public function export(Request $request)
    {
        $query = Place::with(['woreda.zone.region'])->withCount(['originPerformances', 'destinationPerformances']);

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
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

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'code', 'origin_performances_count', 'destination_performances_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $places = $query->get();

        // Generate CSV
        $filename = 'places-' . date('Y-m-d-H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($places) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, ['ID', 'Name', 'Code', 'Status', 'Woreda', 'Zone', 'Region', 'Latitude', 'Longitude', 'Origin Performances', 'Destination Performances', 'Description', 'Created At']);

            // Data rows
            foreach ($places as $place) {
                fputcsv($file, [
                    $place->id,
                    $place->name,
                    $place->code,
                    $place->status,
                    $place->woreda?->name ?? 'N/A',
                    $place->woreda?->zone?->name ?? 'N/A',
                    $place->woreda?->zone?->region?->name ?? 'N/A',
                    $place->latitude,
                    $place->longitude,
                    $place->origin_performances_count,
                    $place->destination_performances_count,
                    $place->description,
                    $place->created_at,
                ]);
            }

            fclose($file);
        };

        // Log export activity
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($places)])
            ->log('exported');

        return response()->stream($callback, 200, $headers);
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
                'count' => $activePlaces->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active places'
            ], 500);
        }
    }
}




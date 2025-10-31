<?php

namespace App\Http\Controllers;

use App\Models\Place;
use App\Models\Woreda;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Exception;

class PlaceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $places = Place::with(['woreda'])
            ->orderBy('name')
            ->paginate(15);

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
                'description' => 'nullable|string|max:1000',
            ]);

            $place = Place::create($validated);

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
        $place->load(['woreda']);

        return Inertia::render('Places/Show', [
            'place' => $place,
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
                'description' => 'nullable|string|max:1000',
            ]);

            $place->update($validated);

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

            $place->delete();

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
     * Export places to CSV.
     */
    public function export(Request $request)
    {
        $query = Place::with(['woreda.zone.region']);

        // Apply search if provided
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'name');
            $direction = $request->input('direction', 'asc');
            $query = $query->orderBy($sort, $direction);
        }

        $places = $query->get();

        // Generate CSV
        $filename = 'places_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Name',
            'Code',
            'Woreda',
            'Zone',
            'Region',
            'Description',
            'Created At',
            'Updated At'
        ]);

        // Write data
        foreach ($places as $place) {
            fputcsv($handle, [
                $place->id,
                $place->name,
                $place->code,
                $place->woreda?->name ?? 'N/A',
                $place->woreda?->zone?->name ?? 'N/A',
                $place->woreda?->zone?->region?->name ?? 'N/A',
                $place->description,
                $place->created_at,
                $place->updated_at
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log the export activity
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($places)])
                ->log('exported places to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
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
            $activePlaces = Place::where('status', 'active')
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




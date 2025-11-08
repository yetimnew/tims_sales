<?php

namespace App\Http\Controllers;

use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Exception;
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
        if ($request->has('search') && !empty($request->input('search'))) {
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
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $metricsQuery = clone $query;

        $woredas = $query->paginate(15)->withQueryString();

        $metrics = [
            'totalPopulation' => (int) ((clone $metricsQuery)->sum('population') ?? 0),
            'averageAccessibility' => round((float) (((clone $metricsQuery)->avg('accessibility_score')) ?? 0), 2),
            'roadNoteCount' => (clone $metricsQuery)->whereNotNull('road_quality_notes')->count(),
        ];

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
        $zones = Zone::orderBy('name')->get();

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
            ]);

            $woreda = Woreda::create($validated);

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->log('created');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda created successfully.');

        } catch (Exception $e) {
            Log::error('Woreda creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create woreda. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Woreda $woreda): Response
    {
        $woreda->load(['zone', 'places']);

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
        $zones = Zone::orderBy('name')->get();

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
            ]);

            $oldData = $woreda->toArray();
            $woreda->update($validated);

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->withProperties(['old' => $oldData, 'new' => $woreda->toArray()])
                ->log('updated');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda updated successfully.');

        } catch (Exception $e) {
            Log::error('Woreda update failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update woreda. Please try again.']);
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
                return back()->withErrors(['error' => 'Cannot delete woreda that has places.']);
            }

            $woredaData = $woreda->toArray();
            $woreda->delete();

            ActivityLogger::performedOn($woreda)
                ->causedBy(Auth::user())
                ->withProperties(['deleted' => $woredaData])
                ->log('deleted');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda deleted successfully.');

        } catch (Exception $e) {
            Log::error('Woreda deletion failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete woreda. Please try again.']);
        }
    }

    /**
     * Export woredas to CSV
     */
    public function export(Request $request)
    {
        $query = Woreda::with(['zone'])->withCount('places');

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
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

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'code', 'places_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $woredas = $query->get();

        // Generate CSV
        $filename = 'woredas-' . date('Y-m-d-H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($woredas) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, [
                'ID',
                'Name',
                'Code',
                'Status',
                'Zone',
                'Administrative Center',
                'Area (km²)',
                'Population',
                'Latitude',
                'Longitude',
                'Elevation (m)',
                'Accessibility Score',
                'Description',
                'Infrastructure Notes',
                'Road Quality Notes',
                'Places Count',
                'Created At'
            ]);

            // Data rows
            foreach ($woredas as $woreda) {
                fputcsv($file, [
                    $woreda->id,
                    $woreda->name,
                    $woreda->code,
                    $woreda->status,
                    $woreda->zone?->name ?? 'N/A',
                    $woreda->administrative_center,
                    $woreda->area_km2,
                    $woreda->population,
                    $woreda->latitude,
                    $woreda->longitude,
                    $woreda->elevation_m,
                    $woreda->accessibility_score,
                    $woreda->description,
                    $woreda->infrastructure_notes,
                    $woreda->road_quality_notes,
                    $woreda->places_count,
                    $woreda->created_at,
                ]);
            }

            fclose($file);
        };

        // Log export activity
        ActivityLogger::causedBy(Auth::user())
            ->withProperties(['count' => count($woredas)])
            ->log('exported');

        return response()->stream($callback, 200, $headers);
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
            return back()->withErrors(['error' => 'Failed to deactivate woreda. Please try again.']);
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
                'count' => $activeWoredas->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active woredas'
            ], 500);
        }
    }
}




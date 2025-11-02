<?php

namespace App\Http\Controllers;

use App\Models\Woreda;
use App\Models\Zone;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

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
        $allowedSorts = ['name', 'code', 'places_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $woredas = $query->paginate(15);

        return Inertia::render('Woredas/Index', [
            'woredas' => $woredas,
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
                'zone_id' => 'required|exists:zones,id',
                'status' => 'required|in:active,inactive',
                'description' => 'nullable|string|max:1000',
            ]);

            $woreda = Woreda::create($validated);

            Activity::performedOn($woreda)
                ->causedBy(auth('sanctum')->user())
                ->log('created');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda created successfully.');

        } catch (Exception $e) {
            Log::error('Woreda creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
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
                'zone_id' => 'required|exists:zones,id',
                'status' => 'required|in:active,inactive',
                'description' => 'nullable|string|max:1000',
            ]);

            $oldData = $woreda->toArray();
            $woreda->update($validated);

            Activity::performedOn($woreda)
                ->causedBy(auth('sanctum')->user())
                ->withProperties(['old' => $oldData, 'new' => $woreda->toArray()])
                ->log('updated');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda updated successfully.');

        } catch (Exception $e) {
            Log::error('Woreda update failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
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

            Activity::performedOn($woreda)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $woredaData])
                ->log('deleted');

            return redirect()->route('woredas.index')
                ->with('success', 'Woreda deleted successfully.');

        } catch (Exception $e) {
            Log::error('Woreda deletion failed', [
                'woreda_id' => $woreda->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
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
            fputcsv($file, ['ID', 'Name', 'Code', 'Zone', 'Description', 'Places Count', 'Created At']);

            // Data rows
            foreach ($woredas as $woreda) {
                fputcsv($file, [
                    $woreda->id,
                    $woreda->name,
                    $woreda->code,
                    $woreda->zone?->name ?? 'N/A',
                    $woreda->description,
                    $woreda->places_count,
                    $woreda->created_at,
                ]);
            }

            fclose($file);
        };

        // Log export activity
        Activity::causedBy(auth()->user())
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




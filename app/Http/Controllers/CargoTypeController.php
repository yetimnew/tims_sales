<?php

namespace App\Http\Controllers;

use App\Models\CargoType;
use App\Http\Requests\StoreCargoTypeRequest;
use App\Http\Requests\UpdateCargoTypeRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\Activitylog\Models\Activity;

class CargoTypeController extends Controller
{
    /**
     * Display a listing of cargo types.
     */
    public function index(Request $request): Response
    {
        $query = CargoType::query();

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('handling_requirements', 'like', "%{$search}%")
                    ->orWhere('safety_requirements', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'category', 'weight_per_cubic_meter', 'requires_special_equipment', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $cargoTypes = $query->paginate(15);

        return Inertia::render('CargoTypes/Index', [
            'cargoTypes' => $cargoTypes,
        ]);
    }

    /**
     * Show the form for creating a new cargo type.
     */
    public function create(): Response
    {
        return Inertia::render('CargoTypes/Create');
    }

    /**
     * Store a newly created cargo type.
     */
    public function store(StoreCargoTypeRequest $request)
    {
        try {
            $validated = $request->validated();

            $cargoType = CargoType::create($validated);

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create cargo type. Please try again.']);
        }
    }

    /**
     * Display the specified cargo type.
     */
    public function show(CargoType $cargoType): Response
    {
        $cargoType->load('performances');

        $activityLogs = Activity::forSubject($cargoType)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('CargoTypes/Show', [
            'cargoType' => $cargoType,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified cargo type.
     */
    public function edit(CargoType $cargoType): Response
    {
        return Inertia::render('CargoTypes/Edit', [
            'cargoType' => $cargoType,
        ]);
    }

    /**
     * Update the specified cargo type.
     */
    public function update(UpdateCargoTypeRequest $request, CargoType $cargoType)
    {
        try {
            $validated = $request->validated();
            $cargoType->update($validated);

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update cargo type. Please try again.']);
        }
    }

    /**
     * Remove the specified cargo type.
     */
    public function destroy(CargoType $cargoType)
    {
        try {
            // Check if cargo type is being used in performances
            if ($cargoType->performances()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete cargo type that is being used in performances.']);
            }

            $cargoType->delete();

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete cargo type. Please try again.']);
        }
    }

    /**
     * Get cargo type statistics.
     */
    public function statistics()
    {
        try {
            $statistics = [
                'total_types' => CargoType::count(),
                'construction_types' => CargoType::where('category', 'Construction')->count(),
                'agricultural_types' => CargoType::where('category', 'Agricultural')->count(),
                'industrial_types' => CargoType::where('category', 'Industrial')->count(),
                'special_equipment_types' => CargoType::where('requires_special_equipment', true)->count(),
                'most_used_type' => CargoType::withCount('performances')
                    ->orderBy('performances_count', 'desc')
                    ->first(),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get cargo type statistics', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cargo type statistics'
            ], 500);
        }
    }

    /**
     * Get cargo types by category.
     */
    public function byCategory(Request $request)
    {
        try {
            $category = $request->get('category');

            $query = CargoType::query();

            if ($category) {
                $query->where('category', $category);
            }

            $cargoTypes = $query->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data' => $cargoTypes,
                'count' => $cargoTypes->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get cargo types by category', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cargo types by category'
            ], 500);
        }
    }

    /**
     * Export cargo types to CSV
     */
    public function export(Request $request)
    {
        $query = CargoType::query();

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhere('handling_requirements', 'like', "%{$search}%")
                    ->orWhere('safety_requirements', 'like', "%{$search}%");
            });
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        $allowedSorts = ['name', 'category', 'weight_per_cubic_meter', 'requires_special_equipment', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $cargoTypes = $query->get();

        // Generate CSV
        $filename = 'cargo-types-' . date('Y-m-d-H-i-s') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($cargoTypes) {
            $file = fopen('php://output', 'w');

            // Add BOM for UTF-8
            fwrite($file, "\xEF\xBB\xBF");

            // Header row
            fputcsv($file, ['ID', 'Name', 'Category', 'Weight per m³', 'Handling Requirements', 'Safety Requirements', 'Special Equipment', 'Created At']);

            // Data rows
            foreach ($cargoTypes as $cargoType) {
                fputcsv($file, [
                    $cargoType->id,
                    $cargoType->name,
                    $cargoType->category,
                    $cargoType->weight_per_cubic_meter,
                    $cargoType->handling_requirements,
                    $cargoType->safety_requirements,
                    $cargoType->requires_special_equipment ? 'Yes' : 'No',
                    $cargoType->created_at,
                ]);
            }

            fclose($file);
        };

        // No activity logging for export - it's a non-model operation
        // Access is already tracked through permissions

        return response()->stream($callback, 200, $headers);
    }
}




<?php

namespace App\Http\Controllers;

use App\Enums\CargoCategory;
use App\Events\CargoTypeCreated;
use App\Events\CargoTypeDeleted;
use App\Events\CargoTypeUpdated;
use App\Http\Requests\StoreCargoTypeRequest;
use App\Http\Requests\UpdateCargoTypeRequest;
use App\Models\CargoType;
use App\Services\CargoTypes\CargoTypeIndexService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class CargoTypeController extends Controller
{
    public function __construct(private CargoTypeIndexService $cargoTypeIndexService) {}

    /**
     * Display a listing of cargo types.
     */
    public function index(Request $request): Response
    {
        $result = $this->cargoTypeIndexService->getIndexResult($request);

        return Inertia::render('CargoTypes/Index', $result->toInertia());
    }

    /**
     * Show the form for creating a new cargo type.
     */
    public function create(): Response
    {
        return Inertia::render('CargoTypes/Create', [
            'categories' => CargoCategory::options(),
        ]);
    }

    /**
     * Store a newly created cargo type.
     */
    public function store(StoreCargoTypeRequest $request)
    {
        try {
            $validated = $request->validated();

            $cargoType = CargoType::create($validated);

            event(new CargoTypeCreated($cargoType, Auth::user()));

            // Clear cached category options
            Cache::forget('cargo_types.category_options');

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
            'categories' => CargoCategory::options(),
        ]);
    }

    /**
     * Update the specified cargo type.
     */
    public function update(UpdateCargoTypeRequest $request, CargoType $cargoType)
    {
        try {
            $validated = $request->validated();

            $original = $cargoType->getOriginal();

            $cargoType->fill($validated);

            $dirty = $cargoType->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $cargoType->save();

            if ($changes !== []) {
                event(new CargoTypeUpdated($cargoType->fresh(), $changes, Auth::user()));
            }

            // Clear cached category options if category changed
            if (isset($changes['category'])) {
                Cache::forget('cargo_types.category_options');
            }

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

            $cargoTypeId = $cargoType->getKey();
            $name = $cargoType->name;
            $attributes = $cargoType->getAttributes();

            $cargoType->delete();

            event(new CargoTypeDeleted($cargoTypeId, $name, $attributes, Auth::user()));

            // Clear cached category options
            Cache::forget('cargo_types.category_options');

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
                'construction_types' => CargoType::where('category', CargoCategory::Construction->value)->count(),
                'agricultural_types' => CargoType::where('category', CargoCategory::Agricultural->value)->count(),
                'industrial_types' => CargoType::where('category', CargoCategory::Industrial->value)->count(),
                'special_equipment_types' => CargoType::where('requires_special_equipment', true)->count(),
                'most_used_type' => CargoType::withCount('performances')
                    ->orderBy('performances_count', 'desc')
                    ->first(),
            ];

            return response()->json([
                'success' => true,
                'data' => $statistics,
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get cargo type statistics', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cargo type statistics',
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

            $enumCategory = is_string($category) ? CargoCategory::tryFrom($category) : null;

            if ($enumCategory) {
                $query->where('category', $enumCategory->value);
            }

            $cargoTypes = $query->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data' => $cargoTypes,
                'count' => $cargoTypes->count(),
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get cargo types by category', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cargo types by category',
            ], 500);
        }
    }

    /**
     * Export cargo types to CSV
     */
    public function export(Request $request)
    {
        $filters = $this->cargoTypeIndexService->resolveFilters($request);

        $query = CargoType::query();

        if ($filters->search !== null) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', "%{$filters->search}%")
                    ->orWhere('category', 'like', "%{$filters->search}%")
                    ->orWhere('handling_requirements', 'like', "%{$filters->search}%")
                    ->orWhere('safety_requirements', 'like', "%{$filters->search}%");
            });
        }

        if ($filters->category !== null) {
            $enumCategory = CargoCategory::tryFrom($filters->category);
            $query->where('category', $enumCategory?->value ?? $filters->category);
        }

        if ($filters->requiresSpecialEquipment !== null) {
            $query->where('requires_special_equipment', $filters->requiresSpecialEquipment === '1');
        }

        $query->orderBy($filters->sort, $filters->direction);

        $cargoTypes = $query->get();

        // Generate CSV
        $filename = 'cargo-types-'.date('Y-m-d-H-i-s').'.csv';
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
                    $cargoType->category instanceof CargoCategory ? $cargoType->category->value : $cargoType->category,
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

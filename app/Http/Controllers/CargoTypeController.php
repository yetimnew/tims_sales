<?php

namespace App\Http\Controllers;

use App\Models\CargoType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class CargoTypeController extends Controller
{
    /**
     * Display a listing of cargo types.
     */
    public function index(): Response
    {
        $cargoTypes = CargoType::orderBy('name')->paginate(15);

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
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:cargo_types',
                'category' => 'required|string|in:Construction,Agricultural,Industrial',
                'weight_per_cubic_meter' => 'nullable|numeric|min:0|max:9999.99',
                'handling_requirements' => 'nullable|string|max:2000',
                'safety_requirements' => 'nullable|string|max:2000',
                'requires_special_equipment' => 'boolean',
            ]);

            $cargoType = CargoType::create($validated);

            Log::info('Cargo type created', [
                'cargo_type_id' => $cargoType->id,
                'name' => $cargoType->name,
                'category' => $cargoType->category,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type created successfully.');

        } catch (Exception $e) {
            Log::error('Cargo type creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create cargo type. Please try again.']);
        }
    }

    /**
     * Display the specified cargo type.
     */
    public function show(CargoType $cargoType): Response
    {
        $cargoType->load('performances');

        return Inertia::render('CargoTypes/Show', [
            'cargoType' => $cargoType,
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
    public function update(Request $request, CargoType $cargoType)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:cargo_types,name,' . $cargoType->id,
                'category' => 'required|string|in:Construction,Agricultural,Industrial',
                'weight_per_cubic_meter' => 'nullable|numeric|min:0|max:9999.99',
                'handling_requirements' => 'nullable|string|max:2000',
                'safety_requirements' => 'nullable|string|max:2000',
                'requires_special_equipment' => 'boolean',
            ]);

            $cargoType->update($validated);

            Log::info('Cargo type updated', [
                'cargo_type_id' => $cargoType->id,
                'name' => $cargoType->name,
                'category' => $cargoType->category,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type updated successfully.');

        } catch (Exception $e) {
            Log::error('Cargo type update failed', [
                'cargo_type_id' => $cargoType->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

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

            $cargoTypeData = $cargoType->toArray();
            $cargoType->delete();

            Log::info('Cargo type deleted', [
                'cargo_type_id' => $cargoType->id,
                'name' => $cargoTypeData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('cargo-types.index')
                ->with('success', 'Cargo type deleted successfully.');

        } catch (Exception $e) {
            Log::error('Cargo type deletion failed', [
                'cargo_type_id' => $cargoType->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

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
                'user_id' => auth()->id(),
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
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve cargo types by category'
            ], 500);
        }
    }
}


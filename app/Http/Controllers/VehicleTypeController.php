<?php

namespace App\Http\Controllers;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class VehicleTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $vehicleTypes = VehicleType::withCount('trucks')
            ->orderBy('name')
            ->paginate(15);

        return Inertia::render('VehicleTypes/Index', [
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('VehicleTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes',
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicleType = VehicleType::create($validated);

            Log::info('Vehicle type created', [
                'vehicle_type_id' => $vehicleType->id,
                'name' => $vehicleType->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type created successfully.');

        } catch (Exception $e) {
            Log::error('Vehicle type creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create vehicle type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleType $vehicleType): Response
    {
        $vehicleType->load(['trucks' => function ($query) {
            $query->with('drivers')->paginate(10);
        }]);

        return Inertia::render('VehicleTypes/Show', [
            'vehicleType' => $vehicleType,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VehicleType $vehicleType): Response
    {
        return Inertia::render('VehicleTypes/Edit', [
            'vehicleType' => $vehicleType,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleType $vehicleType)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes,name,' . $vehicleType->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicleType->update($validated);

            Log::info('Vehicle type updated', [
                'vehicle_type_id' => $vehicleType->id,
                'name' => $vehicleType->name,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type updated successfully.');

        } catch (Exception $e) {
            Log::error('Vehicle type update failed', [
                'vehicle_type_id' => $vehicleType->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update vehicle type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleType $vehicleType)
    {
        try {
            // Check if vehicle type is being used by trucks
            if ($vehicleType->trucks()->count() > 0) {
                return back()->withErrors(['error' => 'Cannot delete vehicle type that is being used by trucks.']);
            }

            $vehicleTypeData = $vehicleType->toArray();
            $vehicleType->delete();

            Log::info('Vehicle type deleted', [
                'vehicle_type_id' => $vehicleType->id,
                'name' => $vehicleTypeData['name'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type deleted successfully.');

        } catch (Exception $e) {
            Log::error('Vehicle type deletion failed', [
                'vehicle_type_id' => $vehicleType->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete vehicle type. Please try again.']);
        }
    }
}


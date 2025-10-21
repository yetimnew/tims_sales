<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\VehicleType;
use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Services\TruckAssignmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class TruckController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $trucks = Truck::with('vehicleType')
            ->paginate(15);

        return Inertia::render('Trucks/Index', [
            'trucks' => $trucks,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $vehicleTypes = VehicleType::all();

        return Inertia::render('Trucks/Create', [
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreTruckRequest $request)
    {
        try {
            $truck = Truck::create($request->validated());

            Log::info('Truck created', [
                'truck_id' => $truck->id,
                'plate' => $truck->plate,
                'vehecletype_id' => $truck->vehecletype_id,
                'user_id' => auth()->id(),
                'ip_address' => $request->ip(),
                'user_agent' => $request->userAgent(),
            ]);

            return redirect()->route('trucks.index')
                ->with('success', 'Truck created successfully.');

        } catch (Exception $e) {
            Log::error('Truck creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'user_id' => auth()->id(),
                'ip_address' => $request->ip(),
            ]);

            return back()->withErrors(['error' => 'Failed to create truck. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Truck $truck): Response
    {
        $truck->load(['vehecletype', 'drivers', 'performances']);

        return Inertia::render('Trucks/Show', [
            'truck' => $truck,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Truck $truck): Response
    {
        $vehicleTypes = VehicleType::all();

        return Inertia::render('Trucks/Edit', [
            'truck' => $truck,
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTruckRequest $request, Truck $truck)
    {
        try {
            $oldData = $truck->toArray();
            $truck->update($request->validated());

            Log::info('Truck updated', [
                'truck_id' => $truck->id,
                'plate' => $truck->plate,
                'old_data' => $oldData,
                'new_data' => $truck->toArray(),
                'user_id' => auth()->id(),
                'ip_address' => $request->ip(),
            ]);

            return redirect()->route('trucks.index')
                ->with('success', 'Truck updated successfully.');

        } catch (Exception $e) {
            Log::error('Truck update failed', [
                'truck_id' => $truck->id,
                'error' => $e->getMessage(),
                'data' => $request->validated(),
                'user_id' => auth()->id(),
                'ip_address' => $request->ip(),
            ]);

            return back()->withErrors(['error' => 'Failed to update truck. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Truck $truck)
    {
        try {
            $truckData = $truck->toArray();
            $truck->delete();

            Log::info('Truck deleted', [
                'truck_id' => $truck->id,
                'plate' => $truckData['plate'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('trucks.index')
                ->with('success', 'Truck deleted successfully.');

        } catch (Exception $e) {
            Log::error('Truck deletion failed', [
                'truck_id' => $truck->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete truck. Please try again.']);
        }
    }

    /**
     * Deactivate the specified truck.
     */
    public function deactivate(Truck $truck)
    {
        $truck->update(['status' => 'inactive']);

        return redirect()->route('trucks.index')
            ->with('success', 'Truck deactivated successfully.');
    }

    /**
     * Get free trucks (not assigned to any driver).
     */
    public function freeTrucks()
    {
        try {
            $assignmentService = new TruckAssignmentService();
            $freeTrucks = $assignmentService->getAvailableTrucks();

            return response()->json([
                'success' => true,
                'data' => $freeTrucks,
                'count' => $freeTrucks->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get free trucks', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve free trucks'
            ], 500);
        }
    }
}

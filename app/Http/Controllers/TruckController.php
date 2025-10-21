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
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class TruckController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Truck::with('vehicleType');

        // Handle search
        $vehicles = $query;

        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');

            // Search in truck fields
            $vehicles = $vehicles->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });

            // Also search in related vehicle type by filtering after retrieval
            $vehicleTypeIds = VehicleType::where('name', 'like', "%{$search}%")
                ->pluck('id')
                ->toArray();

            if (!empty($vehicleTypeIds)) {
                $vehicles = $vehicles->orWhereIn('vehecletype_id', $vehicleTypeIds);
            }
        }

        $query = $vehicles;

        // Handle sorting
        $sort = $request->input('sort', 'plate');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['plate', 'chasisNumber', 'engineNumber', 'serviceIntervalKM', 'purchasePrice', 'status', 'created_at', 'vehicleType'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'plate';
        }

        // Handle sorting by vehicle type
        if ($sort === 'vehicleType') {
            // Use leftJoin to avoid filtering out trucks without vehicle types
            $query->leftJoin('vehicle_types', 'trucks.vehecletype_id', '=', 'vehicle_types.id')
                ->select('trucks.*')
                ->orderBy('vehicle_types.name', $direction)
                ->distinct();
        } else {
            $query->orderBy($sort, $direction);
        }

        $trucks = $query->paginate(15);

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

            // Log activity using Spatie Activity Log
            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->log('created');

            return redirect()->route('trucks.index')
                ->with('success', 'Truck created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create truck. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Truck $truck): Response
    {
        $truck->load(['vehicleType', 'drivers', 'performances']);

        // Load activity logs for this truck using Spatie Activity Log
        $activityLogs = Activity::forSubject($truck)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Trucks/Show', [
            'truck' => $truck,
            'activityLogs' => $activityLogs,
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

            // Log activity using Spatie Activity Log
            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $truck->toArray()])
                ->log('updated');

            return redirect()->route('trucks.index')
                ->with('success', 'Truck updated successfully.');

        } catch (Exception $e) {
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

            // Log activity before deletion
            Activity::performedOn($truck)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $truckData])
                ->log('deleted');

            $truck->delete();

            return redirect()->route('trucks.index')
                ->with('success', 'Truck deleted successfully.');

        } catch (Exception $e) {
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve free trucks'
            ], 500);
        }
    }

    /**
     * Export trucks to CSV
     */
    public function export(Request $request)
    {
        $query = Truck::with('vehicleType');

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query = $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });

            $vehicleTypeIds = VehicleType::where('name', 'like', "%{$search}%")
                ->pluck('id')
                ->toArray();

            if (!empty($vehicleTypeIds)) {
                $query = $query->orWhereIn('vehecletype_id', $vehicleTypeIds);
            }
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'plate');
            $direction = $request->input('direction', 'asc');
            $query = $query->orderBy($sort, $direction);
        }

        $trucks = $query->get();

        // Generate CSV
        $filename = 'trucks_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Plate',
            'Vehicle Type',
            'Chassis Number',
            'Engine Number',
            'Tyre Size',
            'Service Interval (KM)',
            'Purchase Price',
            'Production Date',
            'Service Start Date',
            'Status',
            'Created At',
            'Updated At'
        ]);

        // Write data
        foreach ($trucks as $truck) {
            fputcsv($handle, [
                $truck->id,
                $truck->plate,
                $truck->vehicleType?->name ?? 'N/A',
                $truck->chasisNumber ?? 'N/A',
                $truck->engineNumber ?? 'N/A',
                $truck->tyreSyze ?? 'N/A',
                $truck->serviceIntervalKM ?? 'N/A',
                $truck->purchasePrice ?? 'N/A',
                $truck->productionDate ?? 'N/A',
                $truck->serviceStartDate ?? 'N/A',
                $truck->status,
                $truck->created_at,
                $truck->updated_at
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log activity using Spatie Activity Log
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($trucks)])
            ->log('exported');

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"$filename\"");
    }
}

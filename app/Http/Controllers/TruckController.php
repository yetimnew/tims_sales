<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\DailyTruckStatus;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\VehicleType;
use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Services\TruckAssignmentService;
use Illuminate\Support\Facades\Auth;
use Exception;
use Spatie\Activitylog\Models\Activity;

class TruckController extends Controller
{
    /**
     * Show per-truck status history (timeline).
     */
    public function statusHistory(Request $request, Truck $truck): Response
    {
        $query = DailyTruckStatus::with(['status', 'changedBy'])
            ->where('truck_id', $truck->id)
            ->orderByDesc('status_date')
            ->orderByDesc('created_at');

        if ($request->filled('from')) {
            $query->where('status_date', '>=', $request->input('from'));
        }
        if ($request->filled('to')) {
            $query->where('status_date', '<=', $request->input('to'));
        }

        $history = $query->paginate(20)->withQueryString();

        return Inertia::render('Status/StatusHistory', [
            'truck' => $truck->only(['id', 'plate']) + [
                'vehicleType' => $truck->relationLoaded('vehicleType') ? $truck->vehicleType : $truck->vehicleType()->first(['id','name'])
            ],
            'history' => $history,
            'filters' => [
                'from' => $request->input('from'),
                'to' => $request->input('to'),
            ],
        ]);
    }
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Truck::with('vehicleType');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });

            // Also search in related vehicle type
            $vehicleTypeIds = VehicleType::where('name', 'like', "%{$search}%")
                ->pluck('id')
                ->toArray();

            if (!empty($vehicleTypeIds)) {
                $query->orWhereIn('vehecletype_id', $vehicleTypeIds);
            }
        }

        // Handle sorting
        $sort = $request->input('sort', 'plate');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['plate', 'chasisNumber', 'engineNumber', 'serviceIntervalKM', 'purchasePrice', 'status', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'plate';
        }

        $query->orderBy($sort, $direction);

        $trucks = $query->paginate(10);

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
        $truck->load([
            'vehicleType',
            'drivers',
            'performances',
            'driverTrucks' => function($query) {
                $query->with('driver')->orderBy('date_recived', 'desc');
            }
        ]);

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
            $truck->update($request->validated());

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
            // Check for related records that prevent deletion

            // Check if truck has performances
            if ($truck->performances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->performances()->count() . ' performance record(s). Please remove all performance records first.'
                ]);
            }

            // Check if truck has maintenance records
            if ($truck->maintenanceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->maintenanceRecords()->count() . ' maintenance record(s). Please remove all maintenance records first.'
                ]);
            }

            // Check if truck has fuel records
            if ($truck->fuelRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->fuelRecords()->count() . ' fuel record(s). Please remove all fuel records first.'
                ]);
            }

            // Check if truck has fuel consumption analysis
            if ($truck->fuelConsumptionAnalysis()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->fuelConsumptionAnalysis()->count() . ' fuel consumption analysis record(s). Please remove all fuel consumption analysis records first.'
                ]);
            }

            // Check if truck has financial records
            if ($truck->financialRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->financialRecords()->count() . ' financial record(s). Please remove all financial records first.'
                ]);
            }

            // Check if truck has insurance records
            if ($truck->insuranceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->insuranceRecords()->count() . ' insurance record(s). Please remove all insurance records first.'
                ]);
            }

            // Check if truck has route plans
            if ($truck->routePlans()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->routePlans()->count() . ' route plan(s). Please remove all route plans first.'
                ]);
            }

            // Check if truck has daily statuses
            if ($truck->dailyStatuses()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It has ' . $truck->dailyStatuses()->count() . ' daily status record(s). Please remove all daily status records first.'
                ]);
            }

            // Check if truck is currently assigned to drivers
            if ($truck->drivers()->wherePivot('status', 'active')->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this truck. It is currently assigned to ' . $truck->drivers()->wherePivot('status', 'active')->count() . ' active driver(s). Please unassign all drivers first.'
                ]);
            }

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
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($trucks)])
                ->log('exported trucks to CSV');
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"$filename\"");
    }
}

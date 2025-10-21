<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\MaintenanceType;
use App\Models\VehicleMaintenanceRecord;
use App\Services\MaintenanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class MaintenanceController extends Controller
{
    protected $maintenanceService;

    public function __construct(MaintenanceService $maintenanceService)
    {
        $this->maintenanceService = $maintenanceService;
    }

    /**
     * Display a listing of maintenance records.
     */
    public function index(): Response
    {
        $maintenanceRecords = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic'])
            ->orderBy('scheduled_date', 'desc')
            ->paginate(15);

        $statistics = $this->maintenanceService->getMaintenanceStatistics();

        return Inertia::render('Maintenance/Index', [
            'maintenanceRecords' => $maintenanceRecords,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Show the form for creating a new maintenance record.
     */
    public function create(): Response
    {
        $trucks = Truck::where('status', 'active')->get();
        $maintenanceTypes = MaintenanceType::where('is_active', true)->get();

        return Inertia::render('Maintenance/Create', [
            'trucks' => $trucks,
            'maintenanceTypes' => $maintenanceTypes,
        ]);
    }

    /**
     * Store a newly created maintenance record.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'maintenance_type_id' => 'required|exists:maintenance_types,id',
                'scheduled_date' => 'required|date|after_or_equal:today',
                'description' => 'nullable|string|max:1000',
                'assigned_mechanic_id' => 'nullable|exists:users,id',
            ]);

            $maintenance = $this->maintenanceService->scheduleMaintenance(
                $validated['truck_id'],
                $validated['maintenance_type_id'],
                $validated
            );

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance scheduled successfully.');

        } catch (Exception $e) {
            Log::error('Maintenance scheduling failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to schedule maintenance. Please try again.']);
        }
    }

    /**
     * Display the specified maintenance record.
     */
    public function show(VehicleMaintenanceRecord $maintenance): Response
    {
        $maintenance->load(['truck', 'maintenanceType', 'assignedMechanic', 'user']);

        return Inertia::render('Maintenance/Show', [
            'maintenance' => $maintenance,
        ]);
    }

    /**
     * Show the form for editing the specified maintenance record.
     */
    public function edit(VehicleMaintenanceRecord $maintenance): Response
    {
        $trucks = Truck::where('status', 'active')->get();
        $maintenanceTypes = MaintenanceType::where('is_active', true)->get();

        return Inertia::render('Maintenance/Edit', [
            'maintenance' => $maintenance,
            'trucks' => $trucks,
            'maintenanceTypes' => $maintenanceTypes,
        ]);
    }

    /**
     * Update the specified maintenance record.
     */
    public function update(Request $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            $validated = $request->validate([
                'truck_id' => 'required|exists:trucks,id',
                'maintenance_type_id' => 'required|exists:maintenance_types,id',
                'scheduled_date' => 'required|date',
                'completed_date' => 'nullable|date|after_or_equal:scheduled_date',
                'odometer_reading' => 'nullable|integer|min:0',
                'cost' => 'nullable|numeric|min:0',
                'description' => 'nullable|string|max:1000',
                'work_performed' => 'nullable|string|max:2000',
                'parts_replaced' => 'nullable|string|max:2000',
                'service_provider' => 'nullable|string|max:255',
                'status' => 'required|string|in:scheduled,in_progress,completed,overdue',
                'assigned_mechanic_id' => 'nullable|exists:users,id',
            ]);

            $maintenance->update($validated);

            Log::info('Maintenance record updated', [
                'maintenance_id' => $maintenance->id,
                'truck_id' => $maintenance->truck_id,
                'status' => $maintenance->status,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record updated successfully.');

        } catch (Exception $e) {
            Log::error('Maintenance update failed', [
                'maintenance_id' => $maintenance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update maintenance record. Please try again.']);
        }
    }

    /**
     * Complete the specified maintenance record.
     */
    public function complete(Request $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            $validated = $request->validate([
                'completed_date' => 'nullable|date|after_or_equal:scheduled_date',
                'odometer_reading' => 'nullable|integer|min:0',
                'cost' => 'nullable|numeric|min:0',
                'work_performed' => 'nullable|string|max:2000',
                'parts_replaced' => 'nullable|string|max:2000',
                'service_provider' => 'nullable|string|max:255',
            ]);

            $this->maintenanceService->completeMaintenance($maintenance->id, $validated);

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance completed successfully.');

        } catch (Exception $e) {
            Log::error('Maintenance completion failed', [
                'maintenance_id' => $maintenance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to complete maintenance. Please try again.']);
        }
    }

    /**
     * Remove the specified maintenance record.
     */
    public function destroy(VehicleMaintenanceRecord $maintenance)
    {
        try {
            $maintenanceData = $maintenance->toArray();
            $maintenance->delete();

            Log::info('Maintenance record deleted', [
                'maintenance_id' => $maintenance->id,
                'truck_id' => $maintenanceData['truck_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record deleted successfully.');

        } catch (Exception $e) {
            Log::error('Maintenance deletion failed', [
                'maintenance_id' => $maintenance->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete maintenance record. Please try again.']);
        }
    }

    /**
     * Get overdue maintenance.
     */
    public function overdue()
    {
        try {
            $overdueMaintenance = $this->maintenanceService->getOverdueMaintenance();

            return response()->json([
                'success' => true,
                'data' => $overdueMaintenance,
                'count' => $overdueMaintenance->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get overdue maintenance', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve overdue maintenance'
            ], 500);
        }
    }

    /**
     * Get upcoming maintenance.
     */
    public function upcoming(Request $request)
    {
        try {
            $days = $request->get('days', 7);
            $upcomingMaintenance = $this->maintenanceService->getUpcomingMaintenance($days);

            return response()->json([
                'success' => true,
                'data' => $upcomingMaintenance,
                'count' => $upcomingMaintenance->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get upcoming maintenance', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve upcoming maintenance'
            ], 500);
        }
    }
}




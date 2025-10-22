<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\MaintenanceType;
use App\Models\VehicleMaintenanceRecord;
use App\Services\MaintenanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
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
    public function index(Request $request): Response
    {
        $query = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic']);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('truck', function ($q) use ($search) {
                        $q->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('maintenanceType', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'scheduled_date');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['scheduled_date', 'completed_date', 'cost', 'status', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'scheduled_date';
        }

        $query->orderBy($sort, $direction);

        $maintenanceRecords = $query->paginate(15);
        $statistics = $this->maintenanceService->getMaintenanceStatistics();

        return Inertia::render('Maintenance/Index', [
            'maintenanceRecords' => $maintenanceRecords,
            'statistics' => $statistics,
        ]);
    }

    /**
     * Export maintenance records to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleMaintenanceRecord::with(['truck', 'maintenanceType']);

        // Apply search filter if provided
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhereHas('truck', function ($q) use ($search) {
                        $q->where('plate', 'like', "%{$search}%");
                    })
                    ->orWhereHas('maintenanceType', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Apply sorting if provided
        $sort = $request->input('sort', 'scheduled_date');
        $direction = $request->input('direction', 'desc');
        $allowedSorts = ['scheduled_date', 'completed_date', 'cost', 'status', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $maintenanceRecords = $query->get();

        // Generate CSV
        $csvData = "Truck Plate,Maintenance Type,Scheduled Date,Completed Date,Status,Cost,Description\n";
        foreach ($maintenanceRecords as $record) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%s","%.2f","%s"' . "\n",
                $record->truck->plate ?? 'N/A',
                $record->maintenanceType->name ?? 'N/A',
                $record->scheduled_date,
                $record->completed_date ?? 'N/A',
                $record->status,
                $record->cost ?? 0,
                str_replace('"', '""', $record->description ?? '')
            );
        }

        // Log the export
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($maintenanceRecords)])
            ->log('exported');

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="maintenance-records.csv"');
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
     * Display the specified maintenance record.
     */
    public function show(VehicleMaintenanceRecord $maintenance): Response
    {
        $maintenance->load(['truck', 'maintenanceType', 'assignedMechanic', 'user']);

        // Load activity logs for this maintenance record using Spatie Activity Log
        $activityLogs = Activity::forSubject($maintenance)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Maintenance/Show', [
            'maintenance' => $maintenance,
            'activityLogs' => $activityLogs,
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
            return back()->withErrors(['error' => 'Failed to schedule maintenance. Please try again.']);
        }
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

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record updated successfully.');

        } catch (Exception $e) {
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
            return back()->withErrors(['error' => 'Failed to complete maintenance. Please try again.']);
        }
    }

    /**
     * Remove the specified maintenance record.
     */
    public function destroy(VehicleMaintenanceRecord $maintenance)
    {
        try {
            $maintenance->delete();

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record deleted successfully.');

        } catch (Exception $e) {
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
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve upcoming maintenance'
            ], 500);
        }
    }
}




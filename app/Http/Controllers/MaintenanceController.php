<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\MaintenanceType;
use App\Models\VehicleMaintenanceRecord;
use App\Services\MaintenanceService;
use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Http\Requests\Maintenance\CompleteMaintenanceRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Spatie\Activitylog\Models\Activity;

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

        // No activity logging for export - it's a non-model operation
        // Access is already tracked through permissions

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
    public function store(StoreMaintenanceRequest $request)
    {
        try {
            $validated = $request->validated();

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
    public function update(UpdateMaintenanceRequest $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            $validated = $request->validated();

            $this->maintenanceService->updateMaintenance($maintenance, $validated);

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update maintenance record. Please try again.']);
        }
    }

    /**
     * Complete the specified maintenance record.
     */
    public function complete(CompleteMaintenanceRequest $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            $validated = $request->validated();

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




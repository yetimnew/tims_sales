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
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Spatie\Activitylog\Models\Activity;

class MaintenanceController extends Controller
{
    protected $maintenanceService;

    public function __construct(MaintenanceService $maintenanceService)
    {
        $this->maintenanceService = $maintenanceService;
    }

    /**
     * Display high-level maintenance overview metrics.
     */
    public function overview(): Response
    {
        $statistics = $this->maintenanceService->getMaintenanceStatistics();

        $recentMaintenance = VehicleMaintenanceRecord::with(['truck', 'maintenanceType'])
            ->orderByDesc('scheduled_date')
            ->limit(6)
            ->get()
            ->map(fn (VehicleMaintenanceRecord $record) => $this->transformMaintenanceRecord($record))
            ->values();

        $upcomingMaintenance = $this->maintenanceService->getUpcomingMaintenance(14)
            ->take(6)
            ->map(fn (VehicleMaintenanceRecord $record) => $this->transformMaintenanceRecord($record))
            ->values();

        $overdueMaintenance = $this->maintenanceService->getOverdueMaintenance()
            ->take(6)
            ->map(fn (VehicleMaintenanceRecord $record) => $this->transformMaintenanceRecord($record))
            ->values();

        $costByType = VehicleMaintenanceRecord::select(
                'maintenance_type_id',
                DB::raw('COUNT(*) as total_records'),
                DB::raw('SUM(cost) as total_cost')
            )
            ->groupBy('maintenance_type_id')
            ->with('maintenanceType:id,name')
            ->orderByDesc(DB::raw('SUM(cost)'))
            ->limit(6)
            ->get()
            ->map(function ($row) {
                return [
                    'maintenance_type' => [
                        'id' => $row->maintenanceType->id ?? null,
                        'name' => $row->maintenanceType->name ?? 'Unknown',
                    ],
                    'total_records' => (int) $row->total_records,
                    'total_cost' => $row->total_cost ? (float) $row->total_cost : 0.0,
                ];
            })
            ->values();

        $statusBreakdown = VehicleMaintenanceRecord::select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($row) => [
                'status' => $row->status,
                'total' => (int) $row->total,
            ])
            ->values();

        return Inertia::render('Maintenance/Overview', [
            'statistics' => $statistics,
            'recentMaintenance' => $recentMaintenance,
            'upcomingMaintenance' => $upcomingMaintenance,
            'overdueMaintenance' => $overdueMaintenance,
            'costByType' => $costByType,
            'statusBreakdown' => $statusBreakdown,
            'timeWindowDays' => 14,
        ]);
    }

    /**
     * Display a listing of maintenance records.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $maintenanceTypeId = $request->input('maintenance_type');
        $sort = $request->input('sort', 'scheduled_date');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (!in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = ['scheduled_date', 'completed_date', 'cost', 'status', 'created_at'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'scheduled_date';
        }

        $baseQuery = VehicleMaintenanceRecord::query()->with(['truck', 'maintenanceType', 'assignedMechanic']);

        if ($search !== '') {
            $applySearch = static function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('description', 'like', "%{$search}%")
                        ->orWhereHas('truck', function ($truckQuery) use ($search) {
                            $truckQuery->where('plate', 'like', "%{$search}%");
                        })
                        ->orWhereHas('maintenanceType', function ($typeQuery) use ($search) {
                            $typeQuery->where('name', 'like', "%{$search}%");
                        })
                        ->orWhereHas('assignedMechanic', function ($mechanicQuery) use ($search) {
                            $mechanicQuery->where('name', 'like', "%{$search}%");
                        });
                });
            };

            $applySearch($baseQuery);
        }

        if (!empty($maintenanceTypeId)) {
            $baseQuery->where('maintenance_type_id', $maintenanceTypeId);
        }

        if (!empty($status) && $status !== 'all') {
            $baseQuery->where('status', $status);
        }

        $maintenanceRecords = (clone $baseQuery)
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $metricsQuery = clone $baseQuery;

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'scheduled' => (clone $metricsQuery)->where('status', 'scheduled')->count(),
            'in_progress' => (clone $metricsQuery)->where('status', 'in_progress')->count(),
            'completed' => (clone $metricsQuery)->where('status', 'completed')->count(),
            'overdue' => (clone $metricsQuery)->where('status', 'overdue')->count(),
            'total_cost' => (float) (clone $metricsQuery)->sum('cost'),
            'average_cost' => (float) (clone $metricsQuery)->avg('cost'),
        ];

        $statusOptions = VehicleMaintenanceRecord::query()
            ->select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($record) => [
                'label' => Str::of($record->status)->replace('_', ' ')->headline(),
                'value' => $record->status,
            ])->values();

        $maintenanceTypes = MaintenanceType::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Maintenance/Index', [
            'maintenanceRecords' => $maintenanceRecords,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'maintenance_type' => $maintenanceTypeId ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'statusOptions' => $statusOptions,
            'maintenanceTypeOptions' => $maintenanceTypes,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Display alert center for upcoming and overdue maintenance.
     */
    public function alerts(Request $request): Response
    {
        $days = (int) $request->input('days', 7);
        if ($days < 1) {
            $days = 1;
        }
        if ($days > 60) {
            $days = 60;
        }

        $overdue = $this->maintenanceService->getOverdueMaintenance()
            ->map(fn (VehicleMaintenanceRecord $record) => $this->transformMaintenanceRecord($record))
            ->values();

        $upcoming = $this->maintenanceService->getUpcomingMaintenance($days)
            ->map(fn (VehicleMaintenanceRecord $record) => $this->transformMaintenanceRecord($record))
            ->values();

        return Inertia::render('Maintenance/Alerts', [
            'overdueMaintenance' => $overdue,
            'upcomingMaintenance' => $upcoming,
            'filters' => [
                'days' => $days,
            ],
            'summary' => [
                'total_overdue' => $overdue->count(),
                'total_upcoming' => $upcoming->count(),
            ],
        ]);
    }

    /**
     * Export maintenance records to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic']);

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
                    })
                    ->orWhereHas('assignedMechanic', function ($mechanicQuery) use ($search) {
                        $mechanicQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if ($request->filled('maintenance_type')) {
            $query->where('maintenance_type_id', $request->input('maintenance_type'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
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

    /**
     * Normalize maintenance record payloads for the frontend.
     */
    protected function transformMaintenanceRecord(VehicleMaintenanceRecord $record): array
    {
        return [
            'id' => $record->id,
            'truck' => [
                'id' => optional($record->truck)->id,
                'plate' => optional($record->truck)->plate,
            ],
            'maintenance_type' => [
                'id' => optional($record->maintenanceType)->id,
                'name' => optional($record->maintenanceType)->name,
            ],
            'scheduled_date' => optional($record->scheduled_date)->toDateString(),
            'completed_date' => optional($record->completed_date)->toDateString(),
            'status' => $record->status,
            'cost' => $record->cost ? (float) $record->cost : null,
            'odometer_reading' => $record->odometer_reading,
            'description' => $record->description,
            'assigned_mechanic' => [
                'id' => optional($record->assignedMechanic)->id,
                'name' => optional($record->assignedMechanic)->name,
            ],
            'days_until_scheduled' => method_exists($record, 'getDaysUntilScheduledAttribute') ? $record->days_until_scheduled : null,
            'is_overdue' => method_exists($record, 'getIsOverdueAttribute') ? (bool) $record->is_overdue : false,
        ];
    }
}




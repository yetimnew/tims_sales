<?php

namespace App\Http\Controllers;

use App\Http\Requests\Maintenance\CompleteMaintenanceRequest;
use App\Http\Requests\Maintenance\StoreMaintenanceRequest;
use App\Http\Requests\Maintenance\UpdateMaintenanceRequest;
use App\Models\DriverTruck;
use App\Models\MaintenanceType;
use App\Models\NotificationType;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleMaintenanceRecord;
use App\Notifications\MaintenanceAlertNotification;
use App\Services\MaintenanceService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class MaintenanceController extends BaseResourceController
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

        $statusBreakdown = collect(['scheduled', 'in_progress', 'completed', 'overdue'])
            ->map(fn (string $computedStatus) => [
                'status' => $computedStatus,
                'total' => $this->countByComputedStatus(VehicleMaintenanceRecord::query(), $computedStatus),
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

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = ['scheduled_date', 'completed_date', 'cost', 'status', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
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

        if (! empty($maintenanceTypeId)) {
            $baseQuery->where('maintenance_type_id', $maintenanceTypeId);
        }

        $filteredQuery = clone $baseQuery;
        if (! empty($status) && $status !== 'all') {
            $this->applyComputedStatusFilter($filteredQuery, $status);
        }

        $maintenanceRecords = (clone $filteredQuery)
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $maintenanceRecords->setCollection(
            $maintenanceRecords->getCollection()->map(function (VehicleMaintenanceRecord $record) {
                return [
                    'id' => $record->id,
                    'scheduled_date' => optional($record->scheduled_date)->toDateString(),
                    'completed_date' => optional($record->completed_date)->toDateString(),
                    'status' => $record->computed_status,
                    'raw_status' => $record->status,
                    'is_overdue' => (bool) $record->is_overdue,
                    'cost' => $record->cost !== null ? (float) $record->cost : null,
                    'description' => $record->description,
                    'truck' => $record->truck ? [
                        'id' => $record->truck->id,
                        'plate' => $record->truck->plate,
                    ] : null,
                    'maintenanceType' => $record->maintenanceType ? [
                        'id' => $record->maintenanceType->id,
                        'name' => $record->maintenanceType->name,
                        'category' => $record->maintenanceType->category,
                    ] : null,
                    'assignedMechanic' => $record->assignedMechanic ? [
                        'id' => $record->assignedMechanic->id,
                        'name' => $record->assignedMechanic->name,
                    ] : null,
                ];
            })
        );

        $metricsQuery = clone $baseQuery;

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'scheduled' => $this->countByComputedStatus(clone $metricsQuery, 'scheduled'),
            'in_progress' => (clone $metricsQuery)->where('status', 'in_progress')->count(),
            'completed' => $this->countByComputedStatus(clone $metricsQuery, 'completed'),
            'overdue' => $this->countByComputedStatus(clone $metricsQuery, 'overdue'),
            'total_cost' => (float) (clone $metricsQuery)->sum('cost'),
            'average_cost' => (float) (clone $metricsQuery)->avg('cost'),
        ];

        $statusOptions = collect(['scheduled', 'in_progress', 'completed', 'overdue'])
            ->map(fn (string $option) => [
                'label' => Str::of($option)->replace('_', ' ')->headline(),
                'value' => $option,
            ])
            ->values();

        // Cache maintenance types (1 hour) - rarely changes
        $maintenanceTypes = Cache::remember('maintenance.maintenance_type_options', 3600, function () {
            return MaintenanceType::query()
                ->orderBy('name')
                ->get(['id', 'name']);
        });

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

    public function mobileRequests(Request $request): Response
    {
        $requestType = (string) $request->input('request_type', 'all');
        $requestStatus = (string) $request->input('request_status', 'pending');

        $query = VehicleMaintenanceRecord::query()
            ->with(['truck', 'maintenanceType', 'assignedMechanic'])
            ->where(function ($builder) {
                $builder
                    ->whereNotNull('driver_issue_reported_at')
                    ->orWhereNotNull('driver_service_requested_at');
            });

        if ($requestType === 'issue') {
            $query->whereNotNull('driver_issue_reported_at');
        } elseif ($requestType === 'service') {
            $query->whereNotNull('driver_service_requested_at');
        }

        if ($requestStatus === 'pending') {
            $query->where(function ($builder) {
                $builder
                    ->whereNull('mobile_request_status')
                    ->orWhere('mobile_request_status', 'pending');
            });
        } elseif (in_array($requestStatus, ['approved', 'rejected'], true)) {
            $query->where('mobile_request_status', $requestStatus);
        }

        $requests = $query
            ->orderByRaw('COALESCE(driver_service_requested_at, driver_issue_reported_at) desc')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (VehicleMaintenanceRecord $record) => $this->transformMobileRequestRecord($record));

        return Inertia::render('Maintenance/MobileRequests', [
            'requests' => $requests,
            'filters' => [
                'request_type' => $requestType,
                'request_status' => $requestStatus,
            ],
        ]);
    }

    public function approveMobileRequest(Request $request, VehicleMaintenanceRecord $maintenance)
    {
        $validated = $request->validate([
            'review_note' => ['nullable', 'string', 'max:1000'],
        ]);

        $maintenance->forceFill([
            'mobile_request_status' => 'approved',
            'mobile_request_reviewed_at' => now(),
            'mobile_request_reviewed_by_user_id' => Auth::id(),
            'mobile_request_review_note' => $validated['review_note'] ?? null,
        ])->save();

        $this->notifyAssignedDriversOfMobileRequestDecision($maintenance->fresh(['truck']), 'approved');

        return redirect()
            ->route('maintenance.mobile-requests')
            ->with('success', 'Mobile maintenance request approved.');
    }

    public function rejectMobileRequest(Request $request, VehicleMaintenanceRecord $maintenance)
    {
        $validated = $request->validate([
            'review_note' => ['required', 'string', 'max:1000'],
        ]);

        $maintenance->forceFill([
            'mobile_request_status' => 'rejected',
            'mobile_request_reviewed_at' => now(),
            'mobile_request_reviewed_by_user_id' => Auth::id(),
            'mobile_request_review_note' => $validated['review_note'],
        ])->save();

        $this->notifyAssignedDriversOfMobileRequestDecision($maintenance->fresh(['truck']), 'rejected');

        return redirect()
            ->route('maintenance.mobile-requests')
            ->with('success', 'Mobile maintenance request rejected.');
    }

    /**
     * Export maintenance records to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic']);

        // Apply search filter if provided
        if ($request->has('search') && ! empty($request->input('search'))) {
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
            $this->applyComputedStatusFilter($query, (string) $request->input('status'));
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
                '"%s","%s","%s","%s","%s","%.2f","%s"'."\n",
                $record->truck->plate ?? 'N/A',
                $record->maintenanceType->name ?? 'N/A',
                $record->scheduled_date,
                $record->completed_date ?? 'N/A',
                $record->computed_status,
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
        // Cache trucks list (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('maintenance.create_trucks', 3600, function () {
            return Truck::query()
                ->where('status', 'active')
                ->orderBy('plate')
                ->get()
                ->map(fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'model' => $truck->model,
                ])
                ->values();
        });

        // Cache maintenance types (1 hour) - changes when types are added/removed
        $maintenanceTypes = Cache::remember('maintenance.create_maintenance_types', 3600, function () {
            return MaintenanceType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (MaintenanceType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'category' => $type->category,
                ])
                ->values();
        });

        // Cache mechanics (1 hour) - changes when users/roles change
        $mechanics = Cache::remember('maintenance.create_mechanics', 3600, function () {
            $mechanics = User::query()
                ->whereHas('roles', fn ($query) => $query->where('name', 'mechanic'))
                ->orderBy('name')
                ->get(['id', 'name', 'email']);

            if ($mechanics->isEmpty()) {
                $mechanics = User::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'email']);
            }

            return $mechanics
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ])
                ->values();
        });

        $statusOptions = collect(['scheduled', 'in_progress', 'completed'])
            ->map(fn (string $status) => [
                'value' => $status,
                'label' => Str::of($status)->replace('_', ' ')->headline(),
            ])
            ->values();

        return Inertia::render('Maintenance/Create', [
            'trucks' => $trucks,
            'maintenanceTypes' => $maintenanceTypes,
            'mechanics' => $mechanics,
            'statusOptions' => $statusOptions,
        ]);
    }

    /**
     * Display the specified maintenance record.
     */
    public function show(VehicleMaintenanceRecord $maintenance): Response
    {
        $maintenance->load(['truck', 'maintenanceType', 'assignedMechanic', 'user']);

        // Get activity logs using base controller method
        $activityLogs = $this->getActivityLogs($maintenance);

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
        // Cache trucks list (1 hour) - changes when trucks are added/removed
        $trucks = Cache::remember('maintenance.create_trucks', 3600, function () {
            return Truck::query()
                ->where('status', 'active')
                ->orderBy('plate')
                ->get()
                ->map(fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'model' => $truck->model,
                ])
                ->values();
        });

        // Cache maintenance types (1 hour) - changes when types are added/removed
        $maintenanceTypes = Cache::remember('maintenance.create_maintenance_types', 3600, function () {
            return MaintenanceType::query()
                ->where('is_active', true)
                ->orderBy('name')
                ->get()
                ->map(fn (MaintenanceType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'category' => $type->category,
                ])
                ->values();
        });

        // Cache mechanics (1 hour) - changes when users/roles change
        $mechanics = Cache::remember('maintenance.create_mechanics', 3600, function () {
            $mechanics = User::query()
                ->whereHas('roles', fn ($query) => $query->where('name', 'mechanic'))
                ->orderBy('name')
                ->get(['id', 'name', 'email']);

            if ($mechanics->isEmpty()) {
                $mechanics = User::query()
                    ->orderBy('name')
                    ->get(['id', 'name', 'email']);
            }

            return $mechanics
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ])
                ->values();
        });

        $statusOptions = collect(['scheduled', 'in_progress', 'completed'])
            ->map(fn (string $status) => [
                'value' => $status,
                'label' => Str::of($status)->replace('_', ' ')->headline(),
            ])
            ->values();

        return Inertia::render('Maintenance/Edit', [
            'maintenance' => $maintenance->loadMissing(['truck', 'maintenanceType', 'assignedMechanic']),
            'trucks' => $trucks,
            'maintenanceTypes' => $maintenanceTypes,
            'mechanics' => $mechanics,
            'statusOptions' => $statusOptions,
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

            // Clear all related caches systematically
            Cache::forget('maintenance.status_options');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('reports.maintenance.status_options');
            Cache::forget('reports.maintenance.service_provider_options');

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance scheduled successfully.');

        } catch (Exception $e) {
            $this->logError('store', 'Maintenance', $e, [
                'truck_id' => $request->input('truck_id'),
                'maintenance_type_id' => $request->input('maintenance_type_id'),
            ]);

            $errorMessage = 'Failed to schedule maintenance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Update the specified maintenance record.
     */
    public function update(UpdateMaintenanceRequest $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            // Capture original values before update
            $original = $this->normalizeAttributes($maintenance->getOriginal());

            $this->maintenanceService->updateMaintenance($maintenance, $request->validated());

            // Format changes for audit trail
            $changes = $this->formatChanges($original, $this->normalizeAttributes($maintenance->getChanges()));

            // Clear related caches
            Cache::forget('maintenance.status_options');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('reports.maintenance.status_options');
            if (isset($changes['service_provider'])) {
                Cache::forget('reports.maintenance.service_provider_options');
            }

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance record updated successfully.');

        } catch (Exception $e) {
            $this->logError('update', 'Maintenance', $e);

            $errorMessage = 'Failed to update maintenance record. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Complete the specified maintenance record.
     */
    public function complete(CompleteMaintenanceRequest $request, VehicleMaintenanceRecord $maintenance)
    {
        try {
            $this->maintenanceService->completeMaintenance($maintenance->id, $request->validated());

            // Clear cached options (status changed to completed)
            Cache::forget('maintenance.status_options');
            Cache::forget('maintenance.maintenance_type_options');

            return redirect()->route('maintenance.index')
                ->with('success', 'Maintenance completed successfully.');

        } catch (Exception $e) {
            $this->logError('complete', 'Maintenance', $e);

            $errorMessage = 'Failed to complete maintenance. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Remove the specified maintenance record.
     */
    public function destroy(VehicleMaintenanceRecord $maintenance)
    {
        try {
            // Capture data before deletion for audit trail
            $truckPlate = $maintenance->truck?->plate ?? 'Unknown';
            $maintenanceType = $maintenance->maintenanceType?->name ?? 'Unknown';
            $attributes = $this->normalizeAttributes($maintenance->toArray());

            $maintenance->delete();

            // Clear related caches
            Cache::forget('maintenance.status_options');
            Cache::forget('maintenance.maintenance_type_options');
            Cache::forget('reports.maintenance.status_options');
            Cache::forget('reports.maintenance.service_provider_options');

            return redirect()->route('maintenance.index')
                ->with('success', sprintf('Maintenance record for %s deleted successfully.', $truckPlate));

        } catch (Exception $e) {
            $this->logError('destroy', 'Maintenance', $e);

            $errorMessage = 'Failed to delete maintenance record. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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
                'count' => $overdueMaintenance->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve overdue maintenance',
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
                'count' => $upcomingMaintenance->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve upcoming maintenance',
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
            'status' => $record->computed_status,
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

    protected function transformMobileRequestRecord(VehicleMaintenanceRecord $record): array
    {
        $requestType = $record->driver_service_requested_at !== null ? 'service' : 'issue';
        $requestTimestamp = $record->driver_service_requested_at ?? $record->driver_issue_reported_at;
        $requestMessage = $record->driver_service_requested_at !== null
            ? ($record->driver_service_request_notes ?: 'Service requested from mobile app.')
            : $record->driver_issue_report;

        return array_merge($this->transformMaintenanceRecord($record), [
            'request_type' => $requestType,
            'request_message' => $requestMessage,
            'request_created_at' => $requestTimestamp?->toIso8601String(),
            'driver_acknowledged_at' => $record->driver_acknowledged_at?->toIso8601String(),
            'mobile_request_status' => $record->mobile_request_status ?? 'pending',
            'mobile_request_reviewed_at' => $record->mobile_request_reviewed_at?->toIso8601String(),
            'mobile_request_review_note' => $record->mobile_request_review_note,
        ]);
    }

    protected function notifyAssignedDriversOfMobileRequestDecision(VehicleMaintenanceRecord $maintenance, string $decision): void
    {
        $notificationKey = $decision === 'approved'
            ? NotificationType::MAINTENANCE_REQUEST_APPROVED
            : NotificationType::MAINTENANCE_REQUEST_REJECTED;

        $notificationType = NotificationType::query()->where('key', $notificationKey)->first();

        if ($notificationType === null) {
            return;
        }

        $assignments = DriverTruck::query()
            ->with('driver.user')
            ->where('truck_id', $maintenance->truck_id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->get();

        $requestType = $maintenance->driver_service_requested_at !== null ? 'service request' : 'issue report';
        $title = $decision === 'approved'
            ? 'Maintenance Request Approved'
            : 'Maintenance Request Rejected';
        $message = $decision === 'approved'
            ? sprintf('Your maintenance %s was approved for truck %s.', $requestType, $maintenance->truck?->plate ?? 'N/A')
            : sprintf('Your maintenance %s was rejected for truck %s.', $requestType, $maintenance->truck?->plate ?? 'N/A');

        foreach ($assignments as $assignment) {
            $user = $assignment->driver?->user;

            if ($user === null) {
                continue;
            }

            $user->notify(
                (new MaintenanceAlertNotification(
                    $notificationType,
                    $title,
                    $message,
                    [
                        'maintenance_id' => $maintenance->id,
                        'truck_id' => $maintenance->truck_id,
                        'truck_plate' => $maintenance->truck?->plate,
                        'mobile_request_status' => $decision,
                        'mobile_request_review_note' => $maintenance->mobile_request_review_note,
                        'mobile_request_reviewed_at' => $maintenance->mobile_request_reviewed_at?->toIso8601String(),
                    ],
                ))->withChannels(['database'])
            );
        }
    }

    protected function applyComputedStatusFilter($query, string $status): void
    {
        $today = now()->toDateString();

        if ($status === 'overdue') {
            $query->overdue();

            return;
        }

        if ($status === 'scheduled') {
            $query
                ->whereIn('status', ['scheduled', 'overdue'])
                ->whereNull('completed_date')
                ->whereDate('scheduled_date', '>=', $today);

            return;
        }

        if ($status === 'completed') {
            $query->where(function ($completedQuery) {
                $completedQuery->where('status', 'completed')
                    ->orWhereNotNull('completed_date');
            });

            return;
        }

        $query->where('status', $status);
    }

    protected function countByComputedStatus($query, string $status): int
    {
        $this->applyComputedStatusFilter($query, $status);

        return $query->count();
    }
}

<?php

namespace App\Http\Controllers;

use App\Events\TruckCreated;
use App\Events\TruckDeleted;
use App\Events\TruckUpdated;
use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Models\DailyTruckStatus;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Services\TruckAssignmentService;
use App\Services\TruckDeletionGuard;
use App\Services\TruckGradeService;
use App\Services\TruckMetricsService;
use Carbon\CarbonInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class TruckController extends Controller
{
    public function __construct(
        private TruckDeletionGuard $truckDeletionGuard,
        private TruckMetricsService $truckMetrics,
        private TruckGradeService $truckGrade,
    ) {}

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
                'vehicleType' => $truck->relationLoaded('vehicleType') ? $truck->vehicleType : $truck->vehicleType()->first(['id', 'name']),
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
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $vehicleTypeIdInput = $request->input('vehicle_type');
        $vehicleTypeId = ($vehicleTypeIdInput !== null && $vehicleTypeIdInput !== '') ? (int) $vehicleTypeIdInput : null;
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        $filtersSearch = $search !== '' ? $search : null;

        $trucksQuery = $this->truckMetrics->applyFilters(
            Truck::query()
                ->select([
                    'id',
                    'plate',
                    'status',
                    'vehicletype_id',
                    'chasisNumber',
                    'engineNumber',
                    'serviceIntervalKM',
                    'purchasePrice',
                    'productionDate',
                    'serviceStartDate',
                    'created_at',
                    'updated_at',
                ])
                ->with(['vehicleType:id,name']),
            $filtersSearch,
            $vehicleTypeId,
            $status,
        );

        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'desc');
        $allowedSorts = ['plate', 'chasisNumber', 'engineNumber', 'serviceIntervalKM', 'purchasePrice', 'status', 'created_at'];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        if (! in_array(strtolower((string) $direction), ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $trucksQuery->orderBy($sort, $direction);

        $trucks = $trucksQuery->paginate($perPage)->withQueryString();

        $trucks->setCollection(
            $trucks->getCollection()->map(function (Truck $truck) {
                return [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'status' => $truck->status,
                    'vehicletype_id' => $truck->vehicletype_id,
                    'vehicleType' => $truck->relationLoaded('vehicleType')
                        ? $truck->vehicleType?->only(['id', 'name'])
                        : $truck->vehicleType()->first(['id', 'name']),
                    'chasisNumber' => $truck->chasisNumber,
                    'engineNumber' => $truck->engineNumber,
                    'serviceIntervalKM' => $truck->serviceIntervalKM,
                    'purchasePrice' => $truck->purchasePrice,
                    'productionDate' => $truck->productionDate,
                    'serviceStartDate' => $truck->serviceStartDate,
                    'created_at' => $truck->created_at,
                    'updated_at' => $truck->updated_at,
                ];
            }),
        );

        $trucksData = $this->trimPagination($trucks);

        $statusOptions = Truck::query()
            ->select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($truck) => [
                'label' => Str::of($truck->status)->replace('_', ' ')->headline(),
                'value' => $truck->status,
            ])->values();

        $vehicleTypes = VehicleType::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Trucks/Index', [
            'trucks' => $trucksData,
            'metrics' => $this->truckMetrics->metrics($filtersSearch, $vehicleTypeId, $status),
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'vehicle_type' => $vehicleTypeId ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'statusOptions' => $statusOptions,
            'vehicleTypes' => $vehicleTypes,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    private function trimPagination(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
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

            $this->truckMetrics->clearCache();

            event(new TruckCreated($truck, Auth::user()));

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
        $truck->load(['vehicleType:id,name']);

        $driverAssignmentsQuery = $truck->driverTrucks();

        $recentDriverAssignments = (clone $driverAssignmentsQuery)
            ->with(['driver:id,name,driverid'])
            ->orderByDesc('date_recived')
            ->orderByDesc('created_at')
            ->limit(5)
            ->get([
                'id',
                'driver_id',
                'driverid',
                'truck_id',
                'date_recived',
                'date_detach',
                'is_attached',
                'status',
            ])
            ->map(function (DriverTruck $assignment): array {
                return [
                    'id' => $assignment->id,
                    'driver_id' => $assignment->driver_id,
                    'driverid' => $assignment->driverid,
                    'date_recived' => $assignment->date_recived?->toDateString(),
                    'date_detach' => $assignment->date_detach?->toDateString(),
                    'is_attached' => (bool) $assignment->is_attached,
                    'status' => $assignment->status,
                    'driver' => $assignment->driver ? [
                        'id' => $assignment->driver->id,
                        'name' => $assignment->driver->name,
                        'driverid' => $assignment->driver->driverid,
                    ] : null,
                ];
            })
            ->values()
            ->all();

        $driverAssignmentsCount = (clone $driverAssignmentsQuery)->count();

        $maintenanceQuery = $truck->maintenanceRecords();

        $recentMaintenanceRecords = (clone $maintenanceQuery)
            ->orderByDesc('scheduled_date')
            ->orderByDesc('created_at')
            ->limit(10)
            ->get([
                'id',
                'maintenance_type_id',
                'scheduled_date',
                'completed_date',
                'odometer_reading',
                'cost',
                'description',
                'service_provider',
                'status',
            ])
            ->map(function (VehicleMaintenanceRecord $record): array {
                return [
                    'id' => $record->id,
                    'maintenance_type_id' => $record->maintenance_type_id,
                    'scheduled_date' => $record->scheduled_date?->toDateString(),
                    'completed_date' => $record->completed_date?->toDateString(),
                    'odometer_reading' => $record->odometer_reading,
                    'cost' => $record->cost !== null ? (float) $record->cost : null,
                    'description' => $record->description,
                    'service_provider' => $record->service_provider,
                    'status' => $record->status,
                    'is_overdue' => $record->is_overdue,
                ];
            })
            ->values()
            ->all();

        $maintenanceSummary = [
            'total_records' => (clone $maintenanceQuery)->count(),
            'completed' => (clone $maintenanceQuery)->where('status', 'completed')->count(),
            'scheduled' => (clone $maintenanceQuery)->where('status', 'scheduled')->count(),
            'overdue' => (clone $maintenanceQuery)->where('status', 'scheduled')->where('scheduled_date', '<', now())->count(),
            'total_cost' => (float) ((clone $maintenanceQuery)->sum('cost') ?? 0),
        ];

        $performanceQuery = $truck->performances();

        $recentPerformanceRecords = (clone $performanceQuery)
            ->orderByDesc('performances.DateDispach')
            ->orderByDesc('performances.created_at')
            ->limit(10)
            ->get([
                'performances.id',
                'performances.driver_truck_id',
                'performances.DateDispach',
                'performances.DistanceWCargo',
                'performances.DistanceWOCargo',
                'performances.fuelInLitter',
                'performances.fuelInBirr',
                'performances.load_phase',
                'performances.comment',
                'performances.satus',
            ])
            ->map(function (Performance $performance): array {
                $distanceWithCargo = $performance->DistanceWCargo !== null ? (float) $performance->DistanceWCargo : null;
                $distanceWithoutCargo = $performance->DistanceWOCargo !== null ? (float) $performance->DistanceWOCargo : null;

                return [
                    'id' => $performance->id,
                    'driver_truck_id' => $performance->driver_truck_id,
                    'DateDispach' => $performance->DateDispach?->toDateString(),
                    'DistanceWCargo' => $distanceWithCargo,
                    'DistanceWOCargo' => $distanceWithoutCargo,
                    'fuelInLitter' => $performance->fuelInLitter !== null ? (float) $performance->fuelInLitter : null,
                    'fuelInBirr' => $performance->fuelInBirr !== null ? (float) $performance->fuelInBirr : null,
                    'load_phase' => $performance->load_phase,
                    'comment' => $performance->comment,
                    'satus' => $performance->satus,
                ];
            })
            ->values()
            ->all();

        $distanceWithCargoSum = (float) ((clone $performanceQuery)->sum('DistanceWCargo') ?? 0);
        $distanceWithoutCargoSum = (float) ((clone $performanceQuery)->sum('DistanceWOCargo') ?? 0);
        $totalDistance = round($distanceWithCargoSum + $distanceWithoutCargoSum, 2);
        $totalFuel = (float) ((clone $performanceQuery)->sum('fuelInLitter') ?? 0);
        $totalFuelCost = (float) ((clone $performanceQuery)->sum('fuelInBirr') ?? 0);
        $totalPerformanceRecords = (clone $performanceQuery)->count();

        $performanceSummary = [
            'total_records' => $totalPerformanceRecords,
            'total_distance_km' => $totalDistance,
            'total_fuel_liters' => round($totalFuel, 2),
            'fuel_cost_birr' => round($totalFuelCost, 2),
            'avg_distance_per_record' => $totalPerformanceRecords > 0 ? round($totalDistance / $totalPerformanceRecords, 2) : 0.0,
            'avg_fuel_efficiency_km_per_liter' => $totalFuel > 0 ? round($totalDistance / $totalFuel, 2) : null,
        ];

        $counts = [
            'drivers' => $truck->drivers()->distinct('drivers.id')->count('drivers.id'),
            'performances' => $performanceSummary['total_records'],
            'driverAssignments' => $driverAssignmentsCount,
            'maintenance' => $maintenanceSummary['total_records'],
        ];

        $rawActivityLogs = Activity::forSubject($truck)
            ->with('causer')
            ->latest()
            ->limit(50)
            ->get();

        $activityLogs = $this->transformActivityLogs($rawActivityLogs);

        $truckData = [
            'id' => $truck->id,
            'plate' => $truck->plate,
            'vehicletype_id' => $truck->vehicletype_id,
            'chasisNumber' => $truck->chasisNumber,
            'engineNumber' => $truck->engineNumber,
            'tyreSyze' => $truck->tyreSyze,
            'serviceIntervalKM' => $truck->serviceIntervalKM,
            'purchasePrice' => $truck->purchasePrice !== null ? (float) $truck->purchasePrice : null,
            'productionDate' => $truck->productionDate?->toDateString(),
            'serviceStartDate' => $truck->serviceStartDate?->toDateString(),
            'status' => $truck->status,
            'created_at' => $truck->created_at?->toIso8601String(),
            'updated_at' => $truck->updated_at?->toIso8601String(),
            'vehicleType' => $truck->vehicleType ? [
                'id' => $truck->vehicleType->id,
                'name' => $truck->vehicleType->name,
            ] : null,
            'drivers' => [],
            'driverTrucks' => $recentDriverAssignments,
            'maintenanceRecords' => $recentMaintenanceRecords,
            'performances' => $recentPerformanceRecords,
        ];

        return Inertia::render('Trucks/Show', [
            'truck' => $truckData,
            'activityLogs' => $activityLogs,
            'counts' => $counts,
            'performanceSummary' => $performanceSummary,
            'maintenanceSummary' => $maintenanceSummary,
            'gradeReport' => $this->truckGrade->grade($truck),
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Truck $truck): Response
    {
        $vehicleTypes = VehicleType::all();

        return Inertia::render('Trucks/Edit', [
            'truck' => [
                'id' => $truck->id,
                'plate' => $truck->plate,
                'vehicletype_id' => $truck->vehicletype_id,
                'chasisNumber' => $truck->chasisNumber,
                'engineNumber' => $truck->engineNumber,
                'tyreSyze' => $truck->tyreSyze,
                'serviceIntervalKM' => $truck->serviceIntervalKM,
                'purchasePrice' => $truck->purchasePrice,
                'productionDate' => $truck->productionDate?->format('Y-m-d'),
                'serviceStartDate' => $truck->serviceStartDate?->format('Y-m-d'),
                'status' => $truck->status,
            ],
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateTruckRequest $request, Truck $truck)
    {
        try {
            $original = $this->normalizeAttributes($truck->getOriginal());

            $truck->update($request->validated());

            $changes = $this->formatChanges($original, $this->normalizeAttributes($truck->getChanges()));

            $this->truckMetrics->clearCache();

            if (! empty($changes)) {
                event(new TruckUpdated($truck, $changes, Auth::user()));
            }

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
            $blockers = $this->truckDeletionGuard->blockers($truck);

            if (! empty($blockers)) {
                return back()->withErrors([
                    'error' => $blockers,
                ]);
            }

            $attributes = $this->normalizeAttributes($truck->toArray());
            $truckId = $truck->id;
            $plate = $truck->plate;

            $truck->delete();
            $this->truckDeletionGuard->clearCache($truck);
            $this->truckMetrics->clearCache();

            event(new TruckDeleted($truckId, $plate, $attributes, Auth::user()));

            return redirect()->route('trucks.index')
                ->with('success', 'Truck deleted successfully.');

        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to delete truck. Please try again.']);
        }
    }

    /**
     * Deactivate the specified truck.
     */
    public function deactivate(Truck $truck)
    {
        $truck->update(['status' => 'inactive']);
        $this->truckMetrics->clearCache();

        return redirect()->route('trucks.index')
            ->with('success', 'Truck deactivated successfully.');
    }

    /**
     * Get free trucks (not assigned to any driver).
     */
    public function freeTrucks()
    {
        try {
            $assignmentService = new TruckAssignmentService;
            $freeTrucks = $assignmentService->getAvailableTrucks();

            return response()->json([
                'success' => true,
                'data' => $freeTrucks,
                'count' => $freeTrucks->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve free trucks',
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
        if ($request->has('search') && ! empty($request->input('search'))) {
            $search = $request->input('search');
            $query = $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                    ->orWhere('chasisNumber', 'like', "%{$search}%")
                    ->orWhere('engineNumber', 'like', "%{$search}%");
            });

            $vehicleTypeIds = VehicleType::where('name', 'like', "%{$search}%")
                ->pluck('id')
                ->toArray();

            if (! empty($vehicleTypeIds)) {
                $query = $query->orWhereIn('vehicletype_id', $vehicleTypeIds);
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
        $filename = 'trucks_'.now()->format('Y-m-d_H-i-s').'.csv';
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
            'Updated At',
        ]);

        // Write data
        foreach ($trucks as $truck) {
            $purchasePrice = $truck->purchasePrice;
            $purchasePriceDisplay = $purchasePrice !== null && $purchasePrice !== '' && is_numeric($purchasePrice)
                ? 'ETB '.number_format((float) $purchasePrice, 2, '.', ',')
                : 'N/A';

            fputcsv($handle, [
                $truck->id,
                $truck->plate,
                $truck->vehicleType?->name ?? 'N/A',
                $truck->chasisNumber ?? 'N/A',
                $truck->engineNumber ?? 'N/A',
                $truck->tyreSyze ?? 'N/A',
                $truck->serviceIntervalKM ?? 'N/A',
                $purchasePriceDisplay,
                $truck->productionDate ?? 'N/A',
                $truck->serviceStartDate ?? 'N/A',
                $truck->status,
                $truck->created_at,
                $truck->updated_at,
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

    /**
     * @param  array<string, mixed>  $original
     * @param  array<string, mixed>  $changes
     * @return array<string, array{old: mixed, new: mixed}>
     */
    private function formatChanges(array $original, array $changes): array
    {
        $formatted = [];

        foreach ($changes as $attribute => $newValue) {
            $formatted[$attribute] = [
                'old' => $original[$attribute] ?? null,
                'new' => $newValue,
            ];
        }

        return $formatted;
    }

    /**
     * @param  array<string, mixed>  $attributes
     * @return array<string, mixed>
     */
    private function normalizeAttributes(array $attributes): array
    {
        foreach ($attributes as $key => $value) {
            $attributes[$key] = $this->normalizeValue($value);
        }

        return $attributes;
    }

    private function normalizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->normalizeValue($item);
            }

            return $value;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toIso8601String();
        }

        return $value;
    }
}

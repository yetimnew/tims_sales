<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreTruckRequest;
use App\Http\Requests\UpdateTruckRequest;
use App\Models\DailyTruckStatus;
use App\Models\Truck;
use App\Models\VehicleType;
use App\Services\TruckAssignmentService;
use App\Services\TruckDeletionGuard;
use App\Services\TruckMetricsService;
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
        );

        if (! empty($status) && $status !== 'all') {
            $trucksQuery->where('status', $status);
        }

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
            'metrics' => Inertia::lazy(fn () => $this->truckMetrics->metrics($filtersSearch, $vehicleTypeId)),
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
        // Eager load required relationships (order driver assignments by received date)
        $truck->load([
            'vehicleType',
            'drivers',
            'performances',
            'maintenanceRecords' => function ($query) {
                $query->orderByDesc('scheduled_date')->orderByDesc('created_at');
            },
            'driverTrucks' => function ($query) {
                $query->with('driver')->orderBy('date_recived', 'desc');
            },
        ]);

        // Limit activity logs to most recent 50 for payload efficiency, then normalize for the UI
        $rawActivityLogs = Activity::forSubject($truck)
            ->with('causer')
            ->latest()
            ->limit(50)
            ->get();

        $activityLogs = $this->transformActivityLogs($rawActivityLogs);

        // Performance summary metrics
        $totalDistance = ($truck->performances->sum('DistanceWCargo') ?? 0) + ($truck->performances->sum('DistanceWOCargo') ?? 0);
        $totalFuel = $truck->performances->sum('fuelInLitter') ?? 0;
        $performanceSummary = [
            'total_records' => $truck->performances->count(),
            'total_distance_km' => (float) $totalDistance,
            'total_fuel_liters' => (float) $totalFuel,
            'fuel_cost_birr' => (float) ($truck->performances->sum('fuelInBirr') ?? 0),
            'avg_distance_per_record' => $truck->performances->count() > 0 ? (float) round($totalDistance / $truck->performances->count(), 2) : 0.0,
            'avg_fuel_efficiency_km_per_liter' => $totalFuel > 0 ? (float) round($totalDistance / $totalFuel, 2) : null,
        ];

        // Maintenance summary metrics
        $maintenanceSummary = [
            'total_records' => $truck->maintenanceRecords->count(),
            'completed' => $truck->maintenanceRecords->where('status', 'completed')->count(),
            'scheduled' => $truck->maintenanceRecords->where('status', 'scheduled')->count(),
            'overdue' => $truck->maintenanceRecords->filter(fn ($r) => $r->is_overdue)->count(),
            'total_cost' => (float) ($truck->maintenanceRecords->sum('cost') ?? 0),
        ];

        // Related counts for quick frontend display
        $counts = [
            'drivers' => $truck->drivers->count(),
            'performances' => $truck->performances->count(),
            'driverAssignments' => $truck->driverTrucks->count(),
            'maintenance' => $truck->maintenanceRecords->count(),
        ];

        return Inertia::render('Trucks/Show', [
            'truck' => $truck,
            'activityLogs' => $activityLogs,
            'counts' => $counts,
            'performanceSummary' => $performanceSummary,
            'maintenanceSummary' => $maintenanceSummary,
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

            $this->truckMetrics->clearCache();

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

            $truck->delete();
            $this->truckDeletionGuard->clearCache($truck);
            $this->truckMetrics->clearCache();

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
}

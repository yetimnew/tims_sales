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
use App\Support\PerformanceRecordPresenter;
use Carbon\CarbonInterface;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
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
            ->with([
                'origin:id,name',
                'destination:id,name',
            ])
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
                'performances.tonkm',
                'performances.CargoVolumMT',
                'performances.cargo_weight_kg',
                'performances.is_returned',
                'performances.returned_date',
            ])
            ->map(function (Performance $performance): array {
                $distanceWithCargo = $performance->DistanceWCargo !== null ? (float) $performance->DistanceWCargo : null;
                $distanceWithoutCargo = $performance->DistanceWOCargo !== null ? (float) $performance->DistanceWOCargo : null;
                $totalTripDistance = null;

                if ($distanceWithCargo !== null || $distanceWithoutCargo !== null) {
                    $totalTripDistance = ($distanceWithCargo ?? 0.0) + ($distanceWithoutCargo ?? 0.0);
                }

                $tripDurationDays = null;

                if ($performance->DateDispach && $performance->returned_date) {
                    $tripDurationDays = $performance->DateDispach->diffInDays($performance->returned_date);
                }

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
                    'tonkm' => $performance->tonkm !== null ? (float) $performance->tonkm : null,
                    'cargo_volume_mt' => $performance->CargoVolumMT !== null ? (float) $performance->CargoVolumMT : null,
                    'cargo_weight_kg' => $performance->cargo_weight_kg !== null ? (float) $performance->cargo_weight_kg : null,
                    'cargo_weight_tons' => $performance->cargo_weight_kg !== null
                        ? round((float) $performance->cargo_weight_kg / 1000, 2)
                        : null,
                    'is_returned' => (bool) $performance->is_returned,
                    'returned_date' => $performance->returned_date?->toDateString(),
                    'total_distance_km' => $totalTripDistance !== null ? round($totalTripDistance, 2) : null,
                    'trip_duration_days' => $tripDurationDays,
                    'origin' => $performance->origin ? [
                        'id' => $performance->origin->id,
                        'name' => $performance->origin->name,
                    ] : null,
                    'destination' => $performance->destination ? [
                        'id' => $performance->destination->id,
                        'name' => $performance->destination->name,
                    ] : null,
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
        $completedTrips = (clone $performanceQuery)->where('is_returned', true)->count();
        $openTrips = (clone $performanceQuery)
            ->where(function ($query) {
                $query->whereNull('is_returned')
                    ->orWhere('is_returned', false);
            })
            ->count();
        $mainTripCount = (clone $performanceQuery)->where('load_phase', 'main')->count();
        $tonKilometerSum = (float) ((clone $performanceQuery)->sum('tonkm') ?? 0);
        $cargoWeightKgSum = (float) ((clone $performanceQuery)->sum('cargo_weight_kg') ?? 0);
        $cargoVolumeSum = (float) ((clone $performanceQuery)->sum('CargoVolumMT') ?? 0);

        $durationSamples = (clone $performanceQuery)
            ->where('is_returned', true)
            ->whereNotNull('DateDispach')
            ->whereNotNull('returned_date')
            ->get(['DateDispach', 'returned_date']);

        $durationTotalDays = 0.0;
        $durationCount = 0;

        foreach ($durationSamples as $sample) {
            if ($sample->DateDispach && $sample->returned_date) {
                $durationTotalDays += $sample->DateDispach->diffInDays($sample->returned_date);
                $durationCount++;
            }
        }

        $avgTripDurationDays = $durationCount > 0 ? round($durationTotalDays / $durationCount, 2) : null;
        $avgLoadedDistance = $mainTripCount > 0 ? round($distanceWithCargoSum / $mainTripCount, 2) : null;
        $avgEmptyDistance = $mainTripCount > 0 ? round($distanceWithoutCargoSum / $mainTripCount, 2) : null;
        $payloadTonsSum = round($cargoWeightKgSum / 1000, 2);

        $performanceSummary = [
            'total_records' => $totalPerformanceRecords,
            'main_trip_records' => $mainTripCount,
            'completed_trips' => $completedTrips,
            'open_trips' => $openTrips,
            'total_distance_km' => $totalDistance,
            'total_loaded_distance_km' => round($distanceWithCargoSum, 2),
            'total_empty_distance_km' => round($distanceWithoutCargoSum, 2),
            'total_fuel_liters' => round($totalFuel, 2),
            'fuel_cost_birr' => round($totalFuelCost, 2),
            'avg_distance_per_record' => $totalPerformanceRecords > 0 ? round($totalDistance / $totalPerformanceRecords, 2) : 0.0,
            'avg_trip_distance_km' => $totalPerformanceRecords > 0 ? round($totalDistance / $totalPerformanceRecords, 2) : 0.0,
            'avg_loaded_distance_km' => $avgLoadedDistance,
            'avg_empty_distance_km' => $avgEmptyDistance,
            'avg_fuel_efficiency_km_per_liter' => $totalFuel > 0 ? round($totalDistance / $totalFuel, 2) : null,
            'avg_trip_duration_days' => $avgTripDurationDays,
            'total_ton_km' => round($tonKilometerSum, 2),
            'avg_ton_km_per_trip' => $mainTripCount > 0 ? round($tonKilometerSum / $mainTripCount, 2) : null,
            'total_payload_tons' => $payloadTonsSum,
            'avg_payload_tons_per_trip' => $mainTripCount > 0 && $payloadTonsSum > 0 ? round($payloadTonsSum / $mainTripCount, 2) : null,
            'total_cargo_volume_mt' => round($cargoVolumeSum, 2),
            'avg_cargo_volume_mt_per_trip' => $mainTripCount > 0 && $cargoVolumeSum > 0 ? round($cargoVolumeSum / $mainTripCount, 2) : null,
            'trip_completion_rate' => $totalPerformanceRecords > 0 ? round($completedTrips / $totalPerformanceRecords, 4) : null,
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
     * Display performances for a specific truck-driver assignment pairing.
     */
    public function assignmentPerformances(Request $request, Truck $truck, DriverTruck $driverTruck): Response
    {
        if ((int) $driverTruck->truck_id !== $truck->id) {
            abort(404);
        }

        $driverTruck->loadMissing([
            'truck:id,plate,status,vehicletype_id',
            'driver:id,name,driverid',
        ]);

        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 25;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        $performanceBaseQuery = Performance::query()
            ->where('driver_truck_id', $driverTruck->id);

        $performancesPaginator = (clone $performanceBaseQuery)
            ->with([
                'origin:id,name',
                'destination:id,name',
                'operation:id,operationid,status',
                'driverTruck:id,driver_id,truck_id,driverid,plate,date_recived,date_detach,is_attached,status',
                'driverTruck.truck:id,plate',
                'driverTruck.driver:id,name,driverid',
            ])
            ->orderByDesc('DateDispach')
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        $performancesPaginator->setCollection(
            $performancesPaginator->getCollection()->map(fn (Performance $performance) => PerformanceRecordPresenter::present($performance))
        );

        $performances = $this->trimPagination($performancesPaginator);

        $distanceWithCargoSum = (float) ((clone $performanceBaseQuery)->sum('DistanceWCargo') ?? 0);
        $distanceWithoutCargoSum = (float) ((clone $performanceBaseQuery)->sum('DistanceWOCargo') ?? 0);
        $fuelLitersSum = (float) ((clone $performanceBaseQuery)->sum('fuelInLitter') ?? 0);
        $fuelCostSum = (float) ((clone $performanceBaseQuery)->sum('fuelInBirr') ?? 0);
        $cargoWeightKgSum = (float) ((clone $performanceBaseQuery)->sum('cargo_weight_kg') ?? 0);
        $cargoVolumeTonSum = (float) ((clone $performanceBaseQuery)->sum('CargoVolumMT') ?? 0);
        $tonKmSum = (float) ((clone $performanceBaseQuery)->sum('tonkm') ?? 0);
        $totalRecords = (clone $performanceBaseQuery)->count();
        $returnedTrips = (clone $performanceBaseQuery)->where('is_returned', 1)->count();

        $totalDistanceKm = round($distanceWithCargoSum + $distanceWithoutCargoSum, 2);

        $operationalCargoTons = 0.0;

        if ($cargoWeightKgSum > 0) {
            $operationalCargoTons = round($cargoWeightKgSum / 1000, 2);
        } elseif ($cargoVolumeTonSum > 0) {
            $operationalCargoTons = round($cargoVolumeTonSum, 2);
        }

        $avgFuelEfficiency = $fuelLitersSum > 0 ? round($totalDistanceKm / max($fuelLitersSum, 1), 2) : null;

        $firstDispatchRaw = (clone $performanceBaseQuery)->min('DateDispach');
        $lastDispatchRaw = (clone $performanceBaseQuery)->max('DateDispach');

        $summary = [
            'total_records' => $totalRecords,
            'returned_trips' => $returnedTrips,
            'active_trips' => max($totalRecords - $returnedTrips, 0),
            'total_distance_km' => $totalDistanceKm,
            'distance_with_cargo' => round($distanceWithCargoSum, 2),
            'distance_without_cargo' => round($distanceWithoutCargoSum, 2),
            'total_cargo_tonnage' => $operationalCargoTons,
            'total_ton_km' => round($tonKmSum, 2),
            'avg_fuel_efficiency' => $avgFuelEfficiency,
            'total_fuel_liters' => round($fuelLitersSum, 2),
            'total_fuel_cost' => round($fuelCostSum, 2),
            'first_dispatch' => $this->toCarbon($firstDispatchRaw)?->toDateString(),
            'last_dispatch' => $this->toCarbon($lastDispatchRaw)?->toDateString(),
        ];

        return Inertia::render('Trucks/AssignmentPerformances', [
            'truck' => [
                'id' => $truck->id,
                'plate' => $truck->plate,
                'status' => $truck->status,
                'vehicletype_id' => $truck->vehicletype_id,
            ],
            'assignment' => [
                'id' => $driverTruck->id,
                'driver_id' => $driverTruck->driver_id,
                'driverid' => $driverTruck->driverid,
                'truck_id' => $driverTruck->truck_id,
                'plate' => $driverTruck->truck?->plate ?? $driverTruck->plate,
                'status' => $driverTruck->status,
                'is_attached' => (bool) $driverTruck->is_attached,
                'date_recived' => $this->toCarbon($driverTruck->date_recived)?->toDateString(),
                'date_detach' => $this->toCarbon($driverTruck->date_detach)?->toDateString(),
                'driver' => $driverTruck->driver ? [
                    'id' => $driverTruck->driver->id,
                    'name' => $driverTruck->driver->name,
                    'driverid' => $driverTruck->driver->driverid,
                ] : null,
                'truck' => $driverTruck->truck ? [
                    'id' => $driverTruck->truck->id,
                    'plate' => $driverTruck->truck->plate,
                ] : null,
            ],
            'summary' => $summary,
            'performances' => $performances,
            'perPage' => $perPage,
            'perPageOptions' => $perPageOptions,
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

    private function toCarbon(null|string|Carbon $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Exception) {
            return null;
        }
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

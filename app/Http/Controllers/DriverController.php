<?php

namespace App\Http\Controllers;

use App\Events\DriverCreated;
use App\Events\DriverDeleted;
use App\Events\DriverUpdated;
use App\Http\Requests\StoreDriverRequest;
use App\Http\Requests\UpdateDriverRequest;
use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Services\DriverGradeService;
use App\Services\DriverMetricsService;
use App\Services\Drivers\DriverIndexService;
use App\Support\PerformanceRecordPresenter;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DriverController extends BaseResourceController
{
    public function __construct(
        private DriverMetricsService $driverMetrics,
        private DriverGradeService $driverGrade,
        private DriverIndexService $driverIndexService,
    ) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $result = $this->driverIndexService->getIndexResult($request);

        return Inertia::render('Drivers/Index', $result->toInertia());
    }

    /**
     * Export drivers to CSV.
     */
    public function export(Request $request)
    {
        try {
            $filters = $this->driverIndexService->resolveFilters($request);

            $driversQuery = $this->driverMetrics->applyFilters(
                Driver::query()->select([
                    'id',
                    'driverid',
                    'name',
                    'sex',
                    'birthdate',
                    'zone',
                    'woreda',
                    'kebele',
                    'housenumber',
                    'mobile',
                    'hireddate',
                    'status',
                    'created_at',
                    'updated_at',
                ]),
                $filters->search,
                $filters->sex,
                $filters->status,
            );

            $driversQuery->orderBy($filters->sort, $filters->direction);

            $drivers = $driversQuery->get();

            $filename = 'drivers_'.now()->format('Y-m-d_H-i-s').'.csv';
            $handle = fopen('php://temp', 'r+');

            fputcsv($handle, [
                'ID',
                'Driver ID',
                'Name',
                'Sex',
                'Birthdate',
                'Zone',
                'Woreda',
                'Kebele',
                'House Number',
                'Mobile',
                'Hire Date',
                'Status',
                'Created At',
                'Updated At',
            ]);

            foreach ($drivers as $driver) {
                fputcsv($handle, [
                    $driver->id,
                    $driver->driverid,
                    $driver->name,
                    $driver->sex,
                    $driver->birthdate?->toDateString(),
                    $driver->zone,
                    $driver->woreda,
                    $driver->kebele,
                    $driver->housenumber,
                    $driver->mobile,
                    $driver->hireddate?->toDateString(),
                    strtolower((string) ($driver->getRawOriginal('status') ?? $driver->status ?? '')),
                    $driver->created_at?->toDateTimeString(),
                    $driver->updated_at?->toDateTimeString(),
                ]);
            }

            rewind($handle);
            $csv = stream_get_contents($handle);
            fclose($handle);

            if (Auth::check()) {
                activity()
                    ->causedBy(Auth::user())
                    ->withProperties([
                        'count' => $drivers->count(),
                        'filters' => $filters->toQueryParameters(),
                    ])
                    ->log('exported drivers to CSV');
            }

            return response($csv, 200)
                ->header('Content-Type', 'text/csv; charset=UTF-8')
                ->header('Content-Disposition', "attachment; filename=\"{$filename}\"");
        } catch (Exception $e) {
            Log::error('Driver export failed', [
                'error' => $e->getMessage(),
                'filters' => $request->all(),
                'exported_by' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to export drivers. Please try again.']);
        }
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

    protected function toCarbon(null|string|\Illuminate\Support\Carbon $value): ?\Illuminate\Support\Carbon
    {
        if ($value instanceof \Illuminate\Support\Carbon) {
            return $value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        try {
            return \Illuminate\Support\Carbon::parse($value);
        } catch (Exception) {
            return null;
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Drivers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreDriverRequest $request)
    {
        try {
            $driver = Driver::create($request->validated());

            // Clear all related caches systematically
            $this->driverMetrics->clearCache();
            Cache::forget('drivers.status_options');
            Cache::forget('drivers.gender_options');
            Cache::forget('fuel_records.driver_options');
            Cache::forget('driver_safety.driver_options');
            Cache::forget('reports.performance_all.driver_options');
            Cache::forget('reports.performance_by_driver.driver_options');

            // Dispatch event for audit trail
            event(new DriverCreated($driver, Auth::user()));

            return redirect()->route('drivers.index')
                ->with('success', sprintf('Driver %s created successfully.', $driver->name));

        } catch (Exception $e) {
            $this->logError('store', 'Driver', $e, [
                'created_by' => Auth::id(),
                'driverid' => $request->input('driverid'),
            ]);

            return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Driver $driver): Response
    {
        $driver->load([
            'trucks',
            'performanceRecords',
            'safetyRecords',
            'fuelRecords',
            'driverTrucks' => function ($query) {
                $query->with(['truck:id,plate'])->orderBy('date_recived', 'desc');
            },
        ]);

        // Activity logs using base controller method
        $activityLogs = $this->getActivityLogs($driver, limit: 50);

        // Aggregated performance metrics from periodic performanceRecords
        $performanceRecords = $driver->performanceRecords;
        $performanceRecordSummary = [
            'total_records' => $performanceRecords->count(),
            'total_distance_km' => (float) $performanceRecords->sum('total_distance_km'),
            'total_trips' => (int) $performanceRecords->sum('total_trips'),
            'total_cargo_tonnage' => (float) $performanceRecords->sum('total_cargo_tonnage'),
            'avg_fuel_efficiency' => $performanceRecords->count() > 0 ? round((float) $performanceRecords->avg('fuel_efficiency'), 2) : null,
            'avg_customer_rating' => $performanceRecords->count() > 0 ? round((float) $performanceRecords->avg('customer_rating'), 2) : null,
            'safety_incidents' => (int) $performanceRecords->sum('safety_violations') + (int) $performanceRecords->sum('accidents'),
        ];

        // Safety summary from safetyRecords
        $safetyRecords = $driver->safetyRecords;
        $safetySummary = [
            'total_records' => $safetyRecords->count(),
            'accidents' => $safetyRecords->where('incident_type', 'accident')->count(),
            'violations' => $safetyRecords->where('incident_type', 'violation')->count(),
            'warnings' => $safetyRecords->where('incident_type', 'warning')->count(),
            'critical' => $safetyRecords->where('severity', 'critical')->count(),
            'major' => $safetyRecords->where('severity', 'major')->count(),
            'minor' => $safetyRecords->where('severity', 'minor')->count(),
            'total_damage_cost' => (float) $safetyRecords->sum('damage_cost'),
        ];

        // Recent operational performance data and real-time aggregates
        $performanceBaseQuery = Performance::query()
            ->whereHas('driverTruck', static function ($query) use ($driver) {
                $query->where('driver_id', $driver->id);
            });

        $recentPerformanceRecords = (clone $performanceBaseQuery)
            ->with([
                'origin:id,name',
                'destination:id,name',
                'driverTruck:id,driver_id,truck_id,driverid,plate,date_recived,date_detach,is_attached,status',
                'driverTruck.truck:id,plate',
                'driverTruck.driver:id,name,driverid',
                'operation:id,operationid,status',
            ])
            ->orderByDesc('DateDispach')
            ->orderByDesc('created_at')
            ->limit(15)
            ->get([
                'id',
                'driver_truck_id',
                'DateDispach',
                'DistanceWCargo',
                'DistanceWOCargo',
                'fuelInLitter',
                'fuelInBirr',
                'comment',
                'load_phase',
                'satus',
                'tonkm',
                'CargoVolumMT',
                'cargo_weight_kg',
                'is_returned',
                'returned_date',
            ])
            ->map(fn (Performance $performance) => PerformanceRecordPresenter::present($performance))
            ->values()
            ->all();

        $distanceWithCargoSum = (float) ((clone $performanceBaseQuery)->sum('DistanceWCargo') ?? 0);
        $distanceWithoutCargoSum = (float) ((clone $performanceBaseQuery)->sum('DistanceWOCargo') ?? 0);
        $totalDistanceKm = round($distanceWithCargoSum + $distanceWithoutCargoSum, 2);
        $fuelLitersSum = (float) ((clone $performanceBaseQuery)->sum('fuelInLitter') ?? 0);
        $fuelCostSum = (float) ((clone $performanceBaseQuery)->sum('fuelInBirr') ?? 0);
        $totalPerformanceRecords = (clone $performanceBaseQuery)->count();
        $cargoWeightKgSum = (float) ((clone $performanceBaseQuery)->sum('cargo_weight_kg') ?? 0);
        $cargoVolumeTonSum = (float) ((clone $performanceBaseQuery)->sum('CargoVolumMT') ?? 0);

        $operationalCargoTons = 0.0;

        if ($cargoWeightKgSum > 0) {
            $operationalCargoTons = round($cargoWeightKgSum / 1000, 2);
        } elseif ($cargoVolumeTonSum > 0) {
            $operationalCargoTons = round($cargoVolumeTonSum, 2);
        }

        $operationalSummary = [
            'total_records' => $totalPerformanceRecords,
            'total_distance_km' => $totalDistanceKm,
            'total_trips' => $totalPerformanceRecords,
            'total_cargo_tonnage' => $operationalCargoTons,
            'avg_fuel_efficiency' => $fuelLitersSum > 0 ? round($totalDistanceKm / max($fuelLitersSum, 1), 2) : null,
            'avg_customer_rating' => null,
            'safety_incidents' => $safetySummary['total_records'],
            'total_fuel_liters' => round($fuelLitersSum, 2),
            'total_fuel_cost' => round($fuelCostSum, 2),
        ];

        $performanceSummary = $operationalSummary;

        // Blend periodic summaries where available for richer context
        if ($performanceRecordSummary['total_records'] > 0) {
            $performanceSummary = array_merge($performanceSummary, [
                'total_trips' => max($performanceSummary['total_trips'], $performanceRecordSummary['total_trips']),
                'total_distance_km' => max($performanceSummary['total_distance_km'], round($performanceRecordSummary['total_distance_km'], 2)),
                'total_cargo_tonnage' => max($performanceSummary['total_cargo_tonnage'], round($performanceRecordSummary['total_cargo_tonnage'], 2)),
                'avg_customer_rating' => $performanceRecordSummary['avg_customer_rating'],
                'avg_fuel_efficiency' => $performanceSummary['avg_fuel_efficiency'] ?? $performanceRecordSummary['avg_fuel_efficiency'],
                'safety_incidents' => max($performanceSummary['safety_incidents'], $performanceRecordSummary['safety_incidents']),
            ]);
        }

        if ($performanceSummary['total_records'] === 0 && $performanceRecordSummary['total_records'] > 0) {
            $performanceSummary = array_merge($performanceSummary, [
                'total_records' => $performanceRecordSummary['total_records'],
                'total_trips' => $performanceRecordSummary['total_trips'],
                'total_distance_km' => round($performanceRecordSummary['total_distance_km'], 2),
                'total_cargo_tonnage' => round($performanceRecordSummary['total_cargo_tonnage'], 2),
                'avg_fuel_efficiency' => $performanceRecordSummary['avg_fuel_efficiency'],
                'avg_customer_rating' => $performanceRecordSummary['avg_customer_rating'],
                'safety_incidents' => $performanceRecordSummary['safety_incidents'],
            ]);
        }

        // General counts similar to truck counts
        $counts = [
            'trucks' => $driver->trucks->count(),
            'assignments' => $driver->driverTrucks->count(),
            'performances' => $performanceSummary['total_records'],
            'performance_records' => $performanceRecordSummary['total_records'],
            'safety_records' => $safetyRecords->count(),
            'fuel_records' => $driver->fuelRecords->count(),
        ];

        $driverData = [
            'id' => $driver->id,
            'driverid' => $driver->driverid,
            'name' => $driver->name,
            'sex' => strtolower((string) ($driver->getRawOriginal('sex') ?? $driver->sex ?? '')),
            'birthdate' => $driver->birthdate?->toDateString(),
            'zone' => $driver->zone,
            'woreda' => $driver->woreda,
            'kebele' => $driver->kebele,
            'housenumber' => $driver->housenumber,
            'mobile' => $driver->mobile,
            'hireddate' => $driver->hireddate?->toDateString(),
            'status' => strtolower((string) ($driver->getRawOriginal('status') ?? $driver->status ?? '')),
            'created_at' => $driver->created_at?->toIso8601String(),
            'updated_at' => $driver->updated_at?->toIso8601String(),
            'driverTrucks' => $driver->driverTrucks
                ->sortByDesc(static fn (DriverTruck $assignment) => $assignment->date_recived ?? $assignment->created_at)
                ->take(15)
                ->values()
                ->map(static function (DriverTruck $assignment): array {
                    return [
                        'id' => $assignment->id,
                        'driver_id' => $assignment->driver_id,
                        'driverid' => $assignment->driverid,
                        'truck_id' => $assignment->truck_id,
                        'plate' => $assignment->plate,
                        'date_recived' => $assignment->date_recived?->toDateString(),
                        'date_detach' => $assignment->date_detach?->toDateString(),
                        'is_attached' => (bool) $assignment->is_attached,
                        'status' => $assignment->status,
                        'truck' => $assignment->truck ? [
                            'id' => $assignment->truck->id,
                            'plate' => $assignment->truck->plate,
                        ] : null,
                    ];
                })
                ->all(),
            'performances' => $recentPerformanceRecords,
            'safetyRecords' => $driver->safetyRecords
                ->sortByDesc(static fn (DriverSafetyRecord $record) => $record->incident_date ?? $record->created_at)
                ->take(15)
                ->values()
                ->map(static function (DriverSafetyRecord $record): array {
                    return [
                        'id' => $record->id,
                        'incident_date' => $record->incident_date?->toDateString(),
                        'incident_type' => $record->incident_type,
                        'description' => $record->description,
                        'severity' => $record->severity,
                        'damage_cost' => $record->damage_cost !== null ? (float) $record->damage_cost : null,
                        'location' => $record->location,
                        'resolution' => $record->resolution,
                        'reported_by' => $record->reported_by,
                    ];
                })
                ->all(),
        ];

        return Inertia::render('Drivers/Show', [
            'driver' => $driverData,
            'activityLogs' => $activityLogs,
            'performanceSummary' => $performanceSummary,
            'safetySummary' => $safetySummary,
            'counts' => $counts,
            'gradeReport' => $this->driverGrade->grade($driver),
        ]);
    }

    /**
     * Display performances for a specific driver-truck assignment pairing.
     */
    public function assignmentPerformances(Request $request, Driver $driver, DriverTruck $driverTruck): Response
    {
        if ((int) $driverTruck->driver_id !== $driver->id) {
            abort(404);
        }

        $driverTruck->loadMissing(['truck:id,plate,status,vehicletype_id']);

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

        return Inertia::render('Drivers/AssignmentPerformances', [
            'driver' => [
                'id' => $driver->id,
                'name' => $driver->name,
                'driverid' => $driver->driverid,
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
    public function edit(Driver $driver): Response
    {
        $driver->refresh();

        return Inertia::render('Drivers/Edit', [
            'driver' => [
                'id' => $driver->id,
                'driverid' => $driver->driverid,
                'name' => $driver->name,
                'sex' => strtolower((string) $driver->getRawOriginal('sex') ?? ''),
                'birthdate' => $driver->birthdate?->format('Y-m-d'),
                'zone' => $driver->zone,
                'woreda' => $driver->woreda,
                'kebele' => $driver->kebele,
                'housenumber' => $driver->housenumber,
                'mobile' => $driver->mobile,
                'hireddate' => $driver->hireddate?->format('Y-m-d'),
                'status' => $driver->status,
            ],
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateDriverRequest $request, Driver $driver)
    {
        try {
            // Capture original values before update
            $original = $this->normalizeAttributes($driver->getOriginal());

            $driver->update($request->validated());

            // Format changes for audit trail
            $changes = $this->formatChanges($original, $this->normalizeAttributes($driver->getChanges()));

            // Clear related caches
            $this->driverMetrics->clearCache();
            Cache::forget('drivers.status_options');
            Cache::forget('drivers.gender_options');
            Cache::forget('fuel_records.driver_options');
            Cache::forget('driver_safety.driver_options');
            Cache::forget('reports.performance_all.driver_options');
            Cache::forget('reports.performance_by_driver.driver_options');

            // Only dispatch event if there were actual changes
            if (! empty($changes)) {
                event(new DriverUpdated($driver, $changes, Auth::user()));
            }

            return redirect()->route('drivers.index')
                ->with('success', sprintf('Driver %s updated successfully.', $driver->name));

        } catch (Exception $e) {
            $this->logError('update', 'Driver', $e);

            return back()->withErrors(['error' => 'Failed to update driver. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Driver $driver)
    {
        try {
            // Check for related records that prevent deletion

            // Check if driver has performances
            if ($driver->performances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->performances()->count().' performance record(s). Please remove all performance records first.',
                ]);
            }

            // Check if driver has performance records
            if ($driver->performanceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->performanceRecords()->count().' performance record(s). Please remove all performance records first.',
                ]);
            }

            // Check if driver has safety records
            if ($driver->safetyRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->safetyRecords()->count().' safety record(s). Please remove all safety records first.',
                ]);
            }

            // Check if driver has fuel records
            if ($driver->fuelRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->fuelRecords()->count().' fuel record(s). Please remove all fuel records first.',
                ]);
            }

            // Check if driver is currently assigned to active trucks
            if ($driver->trucks()->wherePivot('status', 'active')->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It is currently assigned to '.$driver->trucks()->wherePivot('status', 'active')->count().' active truck(s). Please unassign from all trucks first.',
                ]);
            }

            // Capture data before deletion for audit trail
            $attributes = $this->normalizeAttributes($driver->toArray());
            $driverId = $driver->id;
            $driverCode = $driver->driverid;
            $driverName = $driver->name;

            $driver->delete();

            // Clear related caches
            $this->driverMetrics->clearCache();
            Cache::forget('drivers.status_options');
            Cache::forget('drivers.gender_options');
            Cache::forget('fuel_records.driver_options');
            Cache::forget('driver_safety.driver_options');
            Cache::forget('reports.performance_all.driver_options');
            Cache::forget('reports.performance_by_driver.driver_options');

            // Dispatch event with deleted data for audit trail
            event(new DriverDeleted($driverId, $driverCode, $driverName, $attributes, Auth::user()));

            return redirect()->route('drivers.index')
                ->with('success', sprintf('Driver %s deleted successfully.', $driverName));

        } catch (Exception $e) {
            $this->logError('destroy', 'Driver', $e);

            return back()->withErrors(['error' => 'Failed to delete driver. Please try again.']);
        }
    }

    /**
     * Deactivate the specified driver.
     */
    public function deactivate(Driver $driver)
    {
        $driver->update(['status' => 'inactive']);

        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options'); // Clear cached status options

        return redirect()->route('drivers.index')
            ->with('success', 'Driver deactivated successfully.');
    }

    /**
     * Activate the specified driver.
     */
    public function activate(Driver $driver)
    {
        $driver->update(['status' => 'active']);

        $this->driverMetrics->clearCache();
        Cache::forget('drivers.status_options'); // Clear cached status options

        return redirect()->route('drivers.index')
            ->with('success', 'Driver activated successfully.');
    }
}

<?php

namespace App\Http\Controllers;

use App\Exports\Reports\DriverPerformanceExport;
use App\Exports\Reports\PerformanceAllExport;
use App\Exports\Reports\TruckPerformanceExport;
use App\Http\Requests\Reports\CustomerProfitabilityRequest;
use App\Http\Requests\Reports\FuelEfficiencyRequest;
use App\Http\Requests\Reports\MaintenancePerformanceRequest;
use App\Http\Requests\Reports\OutsourcePerformanceRequest;
use App\Http\Requests\Reports\PerformanceAllRequest;
use App\Http\Requests\Reports\PerformanceByDriverRequest;
use App\Http\Requests\Reports\PerformanceByTruckRequest;
use App\Http\Requests\Reports\TruckGradingReportRequest;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\MaintenanceType;
use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Status;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use App\Models\VehicleType;
use App\Services\Reports\CustomerProfitabilityReport;
use App\Services\Reports\FuelEfficiencyReport;
use App\Services\Reports\MaintenancePerformanceReport;
use App\Services\Reports\OutsourcePerformanceReport;
use App\Services\Reports\PerformanceAllReport;
use App\Services\Reports\TruckGradingReport;
use App\Services\Reports\TruckPerformanceReport;
use Dompdf\Dompdf;
use Dompdf\Options;
use Exception;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Maatwebsite\Excel\Facades\Excel;

class ReportController extends Controller
{
    public function __construct(
        private readonly PerformanceAllReport $performanceAllReport,
        private readonly TruckPerformanceReport $truckPerformanceReport,
        private readonly CustomerProfitabilityReport $customerProfitabilityReport,
        private readonly FuelEfficiencyReport $fuelEfficiencyReport,
        private readonly OutsourcePerformanceReport $outsourcePerformanceReport,
        private readonly MaintenancePerformanceReport $maintenancePerformanceReport,
        private readonly TruckGradingReport $truckGradingReport,
    ) {}

    /**
     * Display maintenance reports.
     */
    public function maintenance(MaintenancePerformanceRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->maintenancePerformanceReport->build($validated);

            $truckOptions = Truck::query()
                ->select('id', 'plate', 'status')
                ->orderBy('plate')
                ->get()
                ->map(static fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate' => $truck->plate ?? 'Truck #'.$truck->id,
                    'status' => $truck->status,
                ])
                ->values();

            $maintenanceTypeOptions = MaintenanceType::query()
                ->select('id', 'name', 'category')
                ->orderBy('name')
                ->get()
                ->map(static fn (MaintenanceType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                    'category' => $type->category,
                ])
                ->values();

            $statusOptions = VehicleMaintenanceRecord::query()
                ->select('status')
                ->whereNotNull('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter()
                ->values();

            $serviceProviderOptions = VehicleMaintenanceRecord::query()
                ->select('service_provider')
                ->whereNotNull('service_provider')
                ->distinct()
                ->orderBy('service_provider')
                ->pluck('service_provider')
                ->filter()
                ->values();

            return Inertia::render('Reports/Maintenance', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['truck_ids'],
                    'maintenance_type_ids' => $result['maintenance_type_ids'],
                    'statuses' => $result['statuses'],
                    'service_providers' => $result['service_providers'],
                ],
                'totals' => $result['totals'],
                'summary' => $result['summary'],
                'breakdown' => $result['breakdown'],
                'type_breakdown' => $result['type_breakdown'],
                'trend' => $result['trend'],
                'upcoming' => $result['upcoming'],
                'highlights' => $result['highlights'],
                'options' => [
                    'trucks' => $truckOptions,
                    'maintenance_types' => $maintenanceTypeOptions,
                    'statuses' => $statusOptions,
                    'service_providers' => $serviceProviderOptions,
                ],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate maintenance report.']);
        }
    }

    /**
     * Display fuel efficiency and cost report.
     */
    public function fuelEfficiency(FuelEfficiencyRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->fuelEfficiencyReport->build($request->validated());

            $trucks = Truck::query()
                ->select('id', 'plate', 'status')
                ->orderBy('plate')
                ->get()
                ->map(static fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate' => $truck->plate ?? 'Truck #'.$truck->id,
                    'status' => $truck->status,
                ])
                ->values();

            return Inertia::render('Reports/FuelEfficiency', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $result['truck_ids'],
                ],
                'totals' => $result['totals'],
                'summary' => $result['summary'],
                'breakdown' => $result['breakdown'],
                'trend' => $result['trend'],
                'highlights' => $result['highlights'],
                'trucks' => $trucks,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate fuel efficiency report.']);
        }
    }

    /**
     * Display customer profitability report (revenue, cost, margin per customer; lanes; trend).
     */
    public function customerProfitability(CustomerProfitabilityRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->customerProfitabilityReport->build($validated);

            $customerOptions = Customer::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(static fn (Customer $customer) => [
                    'id' => $customer->id,
                    'name' => $customer->name,
                ]);

            return Inertia::render('Reports/CustomerProfitability', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'customer_ids' => $result['customer_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'trend' => $result['trend'],
                'customers' => $customerOptions,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate customer profitability report.']);
        }
    }

    /**
     * Display truck grading leaderboard report.
     */
    public function truckGrading(TruckGradingReportRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->truckGradingReport->build($request->validated());

            return Inertia::render('Reports/TruckGrading', [
                'filters' => $result['filters'],
                'filterOptions' => $result['filter_options'],
                'paginator' => $result['paginator'],
                'latestCalculation' => $result['latest_calculation'],
                'perPageOptions' => $result['per_page_options'],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate truck grading report.']);
        }
    }

    /**
     * Display outsource vendor performance report (on-time %, cost differential, quality rate).
     */
    public function outsourcePerformanceReport(OutsourcePerformanceRequest $request): Response|RedirectResponse
    {
        try {
            $payload = $this->outsourcePerformanceReport->build($request->validated());

            $vendorOptions = Outsource::query()
                ->select(['id', 'name', 'status'])
                ->orderBy('name')
                ->get()
                ->map(static fn (Outsource $outsource) => [
                    'id' => $outsource->id,
                    'name' => $outsource->name,
                    'status' => $outsource->status,
                ])
                ->values()
                ->all();

            $statusOptions = OutsourcePerformance::query()
                ->select('status')
                ->whereNotNull('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter()
                ->values()
                ->all();

            return Inertia::render('Reports/OutsourcePerformance', [
                'filters' => [
                    'from' => $payload['resolved_from'],
                    'to' => $payload['resolved_to'],
                    'outsource_ids' => $payload['outsource_ids'],
                    'statuses' => $payload['statuses'],
                ],
                'options' => [
                    'vendors' => $vendorOptions,
                    'statuses' => $statusOptions,
                ],
                'baseline' => $payload['baseline'],
                'totals' => $payload['totals'],
                'summary' => $payload['summary'],
                'breakdown' => $payload['breakdown'],
                'trend' => $payload['trend'],
                'highlights' => $payload['highlights'],
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate outsource performance report.']);
        }
    }

    /**
     * Display operation profitability report (how profitable each operation is).
     */
    public function operationProfitability(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(6)->toDateString());
            $to = $request->input('to', now()->toDateString());
            $customerId = $request->input('customer_id');
            $regionId = $request->input('region_id');

            $query = Performance::with(['operation.customer', 'operation.region'])
                ->whereBetween('DateDispach', [$from, $to]);

            if ($customerId) {
                $query->whereHas('operation', function ($q) use ($customerId) {
                    $q->where('customer_id', $customerId);
                });
            }
            if ($regionId) {
                $query->whereHas('operation', function ($q) use ($regionId) {
                    $q->where('region_id', $regionId);
                });
            }

            $perfs = $query->get();

            // Aggregate by operation
            $ops = [];
            foreach ($perfs as $p) {
                $op = $p->operation;
                if (! $op) {
                    continue;
                }
                $opId = $op->id;
                if (! isset($ops[$opId])) {
                    $ops[$opId] = [
                        'operation_id' => $opId,
                        'code' => (string) ($op->id),
                        'customer_name' => $op->customer->name ?? 'N/A',
                        'region_name' => $op->region->name ?? 'N/A',
                        'revenue' => 0.0,
                        'cost' => 0.0,
                        'profit' => 0.0,
                        'trips' => 0,
                        'tonnage' => 0.0,
                        'total_km' => 0.0,
                    ];
                }
                $revenue = (float) ($op->tariff ?? 0) * (float) ($p->CargoVolumMT ?? 1);
                $cost = (float) ($p->fuelInBirr ?? 0) + (float) ($p->perdiem ?? 0) + (float) ($p->other ?? 0);
                $km = (float) ($p->DistanceWCargo ?? 0) + (float) ($p->DistanceWOCargo ?? 0);
                $ops[$opId]['revenue'] += $revenue;
                $ops[$opId]['cost'] += $cost;
                $ops[$opId]['profit'] += ($revenue - $cost);
                $ops[$opId]['trips'] += 1;
                $ops[$opId]['tonnage'] += (float) ($p->CargoVolumMT ?? 0);
                $ops[$opId]['total_km'] += $km;
            }

            $rows = [];
            foreach ($ops as $o) {
                $margin = $o['revenue'] > 0 ? round(($o['profit'] / $o['revenue']) * 100, 2) : null;
                $avgKmPerTrip = $o['trips'] > 0 ? $o['total_km'] / $o['trips'] : 0.0;
                $costPerKm = $o['total_km'] > 0 ? $o['cost'] / $o['total_km'] : null;
                $rows[] = [
                    'operation_id' => $o['operation_id'],
                    'code' => $o['code'],
                    'customer_name' => $o['customer_name'],
                    'region_name' => $o['region_name'],
                    'revenue' => round($o['revenue'], 2),
                    'cost' => round($o['cost'], 2),
                    'profit' => round($o['profit'], 2),
                    'margin_percent' => $margin,
                    'trips' => $o['trips'],
                    'tonnage' => round($o['tonnage'], 2),
                    'avg_km_per_trip' => round($avgKmPerTrip, 2),
                    'cost_per_km' => $costPerKm !== null ? round($costPerKm, 2) : null,
                ];
            }

            // Sort by highest profit
            usort($rows, fn ($a, $b) => $b['profit'] <=> $a['profit']);

            $totals = [
                'revenue' => array_sum(array_column($rows, 'revenue')),
                'cost' => array_sum(array_column($rows, 'cost')),
                'profit' => array_sum(array_column($rows, 'profit')),
                'operations' => count($rows),
            ];

            return Inertia::render('Reports/OperationProfitability', [
                'filters' => [
                    'from' => $from,
                    'to' => $to,
                    'customer_id' => $customerId,
                    'region_id' => $regionId,
                ],
                'totals' => $totals,
                'operations' => $rows,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate operation profitability report.']);
        }
    }

    /**
     * Display geographic heatmaps (trips/tonnage/revenue by geography).
     */
    public function geographyHeatmaps(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(6)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $perfs = Performance::with(['operation.customer', 'origin.woreda.zone.region'])
                ->whereBetween('DateDispach', [$from, $to])
                ->get();

            $byRegion = [];
            $byZone = [];
            $byWoreda = [];
            $byPlace = [];

            foreach ($perfs as $p) {
                $origin = $p->origin;
                $regionName = $origin?->woreda?->zone?->region?->name ?? 'Unknown';
                $zoneName = $origin?->woreda?->zone?->name ?? 'Unknown';
                $woredaName = $origin?->woreda?->name ?? 'Unknown';
                $placeName = $origin?->name ?? 'Unknown';
                $tonnage = (float) ($p->CargoVolumMT ?? 0);
                $revenue = (float) ($p->operation?->tariff ?? 0) * ($tonnage > 0 ? $tonnage : 1);

                // Region
                if (! isset($byRegion[$regionName])) {
                    $byRegion[$regionName] = ['name' => $regionName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byRegion[$regionName]['trips'] += 1;
                $byRegion[$regionName]['tonnage'] += $tonnage;
                $byRegion[$regionName]['revenue'] += $revenue;

                // Zone
                if (! isset($byZone[$zoneName])) {
                    $byZone[$zoneName] = ['name' => $zoneName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byZone[$zoneName]['trips'] += 1;
                $byZone[$zoneName]['tonnage'] += $tonnage;
                $byZone[$zoneName]['revenue'] += $revenue;

                // Woreda
                if (! isset($byWoreda[$woredaName])) {
                    $byWoreda[$woredaName] = ['name' => $woredaName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byWoreda[$woredaName]['trips'] += 1;
                $byWoreda[$woredaName]['tonnage'] += $tonnage;
                $byWoreda[$woredaName]['revenue'] += $revenue;

                // Place
                if (! isset($byPlace[$placeName])) {
                    $byPlace[$placeName] = ['name' => $placeName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byPlace[$placeName]['trips'] += 1;
                $byPlace[$placeName]['tonnage'] += $tonnage;
                $byPlace[$placeName]['revenue'] += $revenue;
            }

            // Convert to arrays and sort by revenue desc
            $regions = array_values($byRegion);
            usort($regions, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
            $zones = array_values($byZone);
            usort($zones, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
            $woredas = array_values($byWoreda);
            usort($woredas, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
            $places = array_values($byPlace);
            usort($places, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);

            // Trend by month at region level
            $trend = [];
            foreach ($perfs as $p) {
                $ym = $p->DateDispach?->format('Y-m');
                if (! $ym) {
                    continue;
                }
                $regionName = $p->origin?->woreda?->zone?->region?->name ?? 'Unknown';
                $revenue = (float) ($p->operation?->tariff ?? 0) * ((float) ($p->CargoVolumMT ?? 0) > 0 ? (float) $p->CargoVolumMT : 1);
                if (! isset($trend[$regionName])) {
                    $trend[$regionName] = [];
                }
                if (! isset($trend[$regionName][$ym])) {
                    $trend[$regionName][$ym] = 0.0;
                }
                $trend[$regionName][$ym] += $revenue;
            }
            $regionTrends = [];
            foreach ($trend as $region => $months) {
                krsort($months);
                $series = [];
                foreach ($months as $ym => $val) {
                    $series[] = ['month' => $ym, 'revenue' => round($val, 2)];
                }
                $regionTrends[] = ['region' => $region, 'series' => $series];
            }

            return Inertia::render('Reports/GeographyHeatmaps', [
                'filters' => ['from' => $from, 'to' => $to],
                'regions' => $regions,
                'zones' => $zones,
                'woredas' => $woredas,
                'places' => $places,
                'regionTrends' => $regionTrends,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate geographic heatmaps report.']);
        }
    }

    /**
     * Legacy-style: list recent performances with joins.
     */
    public function performanceAll(PerformanceAllRequest $request): Response|RedirectResponse
    {
        try {
            $result = $this->performanceAllReport->build($request->validated());

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()->all()
                : collect($result['rows'])->values()->all();

            $summary = $result['summary'];
            $highlights = $result['highlights'];

            $drivers = Driver::query()
                ->select('id', 'name', 'status')
                ->orderBy('name')
                ->get()
                ->map(static fn (Driver $driver) => [
                    'id' => $driver->id,
                    'name' => $driver->name ?? 'Unassigned',
                    'status' => $driver->status,
                ])
                ->values();

            $trucks = Truck::query()
                ->select('id', 'plate', 'status')
                ->orderBy('plate')
                ->get()
                ->map(static fn (Truck $truck) => [
                    'id' => $truck->id,
                    'name' => $truck->plate ?? '—',
                    'plate' => $truck->plate ?? '—',
                    'status' => $truck->status,
                ])
                ->values();

            $operations = Operation::query()
                ->select('id', 'operationid', 'status', 'customer_id')
                ->with('customer:id,name')
                ->orderBy('operationid')
                ->limit(300)
                ->get()
                ->map(static fn (Operation $operation) => [
                    'id' => $operation->id,
                    'code' => $operation->operationid ?? 'OP-'.$operation->id,
                    'status' => $operation->status,
                    'customer' => $operation->customer?->name,
                ])
                ->values();

            $destinations = Place::query()
                ->select('id', 'name', 'status')
                ->orderBy('name')
                ->limit(300)
                ->get()
                ->map(static fn (Place $place) => [
                    'id' => $place->id,
                    'name' => $place->name,
                    'status' => $place->status,
                ])
                ->values();

            return Inertia::render('Reports/PerformanceAll', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'driver_ids' => $result['filters']['driver_ids'],
                    'truck_ids' => $result['filters']['truck_ids'],
                    'operation_ids' => $result['filters']['operation_ids'],
                    'destination_ids' => $result['filters']['destination_ids'],
                    'limit' => $result['filters']['limit'],
                ],
                'rows' => $rows,
                'summary' => $summary,
                'highlights' => $highlights,
                'options' => [
                    'drivers' => $drivers,
                    'trucks' => $trucks,
                    'operations' => $operations,
                    'destinations' => $destinations,
                ],
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load performances.']);
        }
    }

    public function performanceAllExport(PerformanceAllRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), [
            'format' => $format,
        ]);

        $result = $this->performanceAllReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'performance_all_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportAllCsv(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportAllExcel(
                $this->performanceAllRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportAllPdf(
                $rows,
                $result['summary'],
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    public function performanceByDriver(PerformanceByDriverRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->buildDriverPerformance($validated);

            $drivers = Driver::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(static fn (Driver $driver) => [
                    'id' => $driver->id,
                    'name' => $driver->name ?? 'Unassigned',
                ]);

            return Inertia::render('Reports/PerformanceByDriver', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'driver_ids' => $result['driver_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'drivers' => $drivers,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate driver performance report.']);
        }
    }

    public function performanceByDriverExport(PerformanceByDriverRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->buildDriverPerformance($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']
            : collect($result['rows']);

        $filename = 'driver_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportDriverCsv(
                $this->driverRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportDriverExcel(
                $this->driverRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportDriverPdf(
                $rows,
                $result['summary'],
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.pdf'
            ),
            default => abort(404),
        };
    }

    /**
     * Build the driver performance dataset shared across web and export flows.
     */
    private function buildDriverPerformance(array $validated): array
    {
        $from = $validated['from'] ?? now()->subMonths(1)->toDateString();
        $to = $validated['to'] ?? now()->toDateString();
        $driverIds = $validated['driver_ids'] ?? [];

        $query = DB::table('performances')
            ->select(
                'driver_truck.driver_id as driver_id',
                DB::raw('MAX(drivers.name) as driver_name'),
                DB::raw('COUNT(performances.FOnumber) as trips'),
                DB::raw('SUM(performances.CargoVolumMT) as tonnage'),
                DB::raw('SUM(performances.DistanceWCargo) as distance_wcargo'),
                DB::raw('SUM(performances.DistanceWOCargo) as distance_wocargo'),
                DB::raw('SUM(performances.tonkm) as tonkm'),
                DB::raw('SUM(performances.fuelInBirr) as fuel_cost'),
                DB::raw('SUM(performances.perdiem) as perdiem'),
                DB::raw('SUM(performances.other) as other_cost'),
                DB::raw('SUM(performances.tonkm * operations.tariff) as revenue')
            )
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->leftJoin('drivers', 'drivers.id', '=', 'driver_truck.driver_id')
            ->leftJoin('operations', 'operations.id', '=', 'performances.operation_id')
            ->whereBetween('performances.DateDispach', [$from, $to])
            ->groupBy('driver_truck.driver_id');

        if (! empty($driverIds)) {
            $query->whereIn('driver_truck.driver_id', $driverIds);
        }

        $rows = collect($query->orderByDesc('trips')->get())
            ->map(static function ($row) {
                $distanceWithCargo = (float) $row->distance_wcargo;
                $distanceWithoutCargo = (float) $row->distance_wocargo;
                $distanceTotal = $distanceWithCargo + $distanceWithoutCargo;
                $fuelCost = (float) $row->fuel_cost;
                $perdiem = (float) $row->perdiem;
                $otherCost = (float) $row->other_cost;
                $expense = $fuelCost + $perdiem + $otherCost;
                $revenue = (float) $row->revenue;
                $profit = $revenue - $expense;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                return [
                    'driver_id' => $row->driver_id,
                    'driver_name' => $row->driver_name ?? 'Unassigned',
                    'trips' => (int) $row->trips,
                    'tonnage' => round((float) $row->tonnage, 2),
                    'ton_km' => round((float) $row->tonkm, 2),
                    'distance_wc' => round($distanceWithCargo, 2),
                    'distance_wo' => round($distanceWithoutCargo, 2),
                    'distance_total' => round($distanceTotal, 2),
                    'fuel_cost' => round($fuelCost, 2),
                    'perdiem' => round($perdiem, 2),
                    'other_cost' => round($otherCost, 2),
                    'expense' => round($expense, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                ];
            })
            ->values();

        $summaryRevenue = $rows->sum('revenue');

        $summary = [
            'trips' => $rows->sum('trips'),
            'tonnage' => round($rows->sum('tonnage'), 2),
            'ton_km' => round($rows->sum('ton_km'), 2),
            'distance_wc' => round($rows->sum('distance_wc'), 2),
            'distance_wo' => round($rows->sum('distance_wo'), 2),
            'distance_total' => round($rows->sum('distance_total'), 2),
            'fuel_cost' => round($rows->sum('fuel_cost'), 2),
            'perdiem' => round($rows->sum('perdiem'), 2),
            'other_cost' => round($rows->sum('other_cost'), 2),
            'expense' => round($rows->sum('expense'), 2),
            'revenue' => round($summaryRevenue, 2),
            'profit' => round($rows->sum('profit'), 2),
            'margin_percent' => $summaryRevenue > 0 ? round(($rows->sum('profit') / $summaryRevenue) * 100, 2) : null,
        ];

        return [
            'rows' => $rows,
            'summary' => $summary,
            'resolved_from' => $from,
            'resolved_to' => $to,
            'driver_ids' => $driverIds,
        ];
    }

    private function driverRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'driver_id' => null,
            'driver_name' => 'TOTAL',
            'trips' => $summary['trips'],
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    private function exportDriverCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Driver',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel Cost',
            'Perdiem',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance by Driver Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['driver_name'],
                    $row['trips'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportDriverExcel(Collection $rows, string $filename)
    {
        return Excel::download(new DriverPerformanceExport($rows), $filename);
    }

    private function exportDriverPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_by_driver_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function performanceAllRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'id' => null,
            'fo_number' => 'TOTAL',
            'dispatch_date' => null,
            'driver_name' => null,
            'truck_plate' => null,
            'vehicle_type' => null,
            'operation_code' => null,
            'customer_name' => null,
            'origin_name' => null,
            'destination_name' => null,
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_litres' => $summary['fuel_litres'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'work_on_going' => $summary['work_on_going'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    private function exportAllCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'FO Number',
            'Dispatch Date',
            'Driver',
            'Truck Plate',
            'Vehicle Type',
            'Operation',
            'Customer',
            'Origin',
            'Destination',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel (L)',
            'Fuel Cost',
            'Perdiem',
            'Work Ongoing',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance Report (All)']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['fo_number'],
                    $row['dispatch_date'],
                    $row['driver_name'],
                    $row['truck_plate'],
                    $row['vehicle_type'],
                    $row['operation_code'],
                    $row['customer_name'],
                    $row['origin_name'],
                    $row['destination_name'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_litres'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['work_on_going'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportAllExcel(Collection $rows, string $filename)
    {
        return Excel::download(new PerformanceAllExport($rows), $filename);
    }

    private function exportAllPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_all_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    /**
     * Legacy-style: performance aggregated by truck with date filters.
     */
    public function performanceByTruck(PerformanceByTruckRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->truckPerformanceReport->build($validated);

            $rows = $result['rows'] instanceof Collection
                ? $result['rows']->values()
                : collect($result['rows'])->values();

            $trucks = Truck::query()
                ->select('id', 'plate')
                ->orderBy('plate')
                ->get()
                ->map(static fn (Truck $truck) => [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                ])
                ->values();

            $vehicleTypes = VehicleType::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(static fn (VehicleType $type) => [
                    'id' => $type->id,
                    'name' => $type->name,
                ])
                ->values();

            $statuses = Truck::query()
                ->select('status')
                ->whereNotNull('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter(static fn ($status) => $status !== null && $status !== '')
                ->values()
                ->all();

            return Inertia::render('Reports/PerformanceByTruck', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $validated['truck_ids'] ?? [],
                    'vehicle_type_ids' => $validated['vehicle_type_ids'] ?? [],
                    'statuses' => $validated['statuses'] ?? [],
                ],
                'rows' => $rows,
                'summary' => $result['summary'],
                'trucks' => $trucks,
                'vehicleTypes' => $vehicleTypes,
                'statuses' => $statuses,
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate truck performance report.']);
        }
    }

    public function performanceByTruckExport(PerformanceByTruckRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->truckPerformanceReport->build($validated);
        $rows = $result['rows'] instanceof Collection
            ? $result['rows']->values()
            : collect($result['rows'])->values();

        $filename = 'truck_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportCsv($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.csv'),
            'xlsx' => $this->exportExcel($rows, $result['summary'], $filename.'.xlsx'),
            'pdf' => $this->exportPdf($rows, $result['summary'], $result['resolved_from'], $result['resolved_to'], $filename.'.pdf'),
            default => abort(404),
        };
    }

    private function exportCsv(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $headings = [
            'Plate',
            'Trips',
            'Tonnage (MT)',
            'Ton-KM',
            'Distance With Cargo (KM)',
            'Distance Without Cargo (KM)',
            'Total Distance (KM)',
            'Fuel (Litres)',
            'Fuel Cost',
            'Perdiem',
            'Work Ongoing',
            'Other Cost',
            'Total Expense',
            'Revenue',
            'Profit',
            'Margin %',
        ];

        $data = $this->rowsWithTotals($rows, $summary);

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($data, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Performance by Truck Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($data as $row) {
                fputcsv($handle, [
                    $row['plate'],
                    $row['trips'],
                    $row['tonnage'],
                    $row['ton_km'],
                    $row['distance_wc'],
                    $row['distance_wo'],
                    $row['distance_total'],
                    $row['fuel_litres'],
                    $row['fuel_cost'],
                    $row['perdiem'],
                    $row['work_on_going'],
                    $row['other_cost'],
                    $row['expense'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportExcel(Collection $rows, array $summary, string $filename)
    {
        $data = $this->rowsWithTotals($rows, $summary);

        return Excel::download(new TruckPerformanceExport($data), $filename);
    }

    private function exportPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_by_truck_pdf', [
            'rows' => $rows->all(),
            'summary' => $summary,
            'from' => $from,
            'to' => $to,
        ])->render();

        $dompdf->loadHtml($html);
        $dompdf->setPaper('A4', 'landscape');
        $dompdf->render();

        return HttpResponse::make($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ]);
    }

    private function rowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'plate' => 'TOTAL',
            'trips' => $summary['trips'],
            'tonnage' => $summary['tonnage'],
            'ton_km' => $summary['ton_km'],
            'distance_wc' => $summary['distance_wc'],
            'distance_wo' => $summary['distance_wo'],
            'distance_total' => $summary['distance_total'],
            'fuel_litres' => $summary['fuel_litres'],
            'fuel_cost' => $summary['fuel_cost'],
            'perdiem' => $summary['perdiem'],
            'work_on_going' => $summary['work_on_going'],
            'other_cost' => $summary['other_cost'],
            'expense' => $summary['expense'],
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
        ]);

        return $data->values();
    }

    /**
     * Legacy-style: performance aggregated by vehicle model (type).
     */
    public function performanceByModel(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(1)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $rows = DB::table('performances')
                ->select(
                    'trucks.vehicletype_id as vehicletype_id',
                    DB::raw('MAX(vehicletypes.name) as model'),
                    DB::raw('COUNT(performances.FOnumber) as trips'),
                    DB::raw('SUM(performances.CargoVolumMT) as tonnage'),
                    DB::raw('SUM(performances.DistanceWCargo) as distance_wcargo'),
                    DB::raw('SUM(performances.DistanceWOCargo) as distance_wocargo'),
                    DB::raw('SUM(performances.tonkm) as tonkm')
                )
                ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
                ->leftJoin('trucks', 'trucks.id', '=', 'driver_truck.truck_id')
                ->leftJoin('vehicletypes', 'vehicletypes.id', '=', 'trucks.vehicletype_id')
                ->whereBetween('performances.DateDispach', [$from, $to])
                ->groupBy('trucks.vehicletype_id')
                ->orderByDesc('tonkm')
                ->get();

            return Inertia::render('Reports/PerformanceByModel', [
                'filters' => ['from' => $from, 'to' => $to],
                'rows' => $rows,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate model performance report.']);
        }
    }

    /**
     * Legacy-style: status summary by date.
     */
    public function performanceByStatus(Request $request): Response|RedirectResponse
    {
        try {
            $date = $request->input('date', now()->toDateString());
            $rows = DB::table('statuses')
                ->select('statustypes.name as status_name', DB::raw('COUNT(statuses.id) as count'))
                ->join('statustypes', 'statustypes.id', '=', 'statuses.statustype_id')
                ->whereDate('statuses.registerddate', $date)
                ->groupBy('statustypes.name')
                ->orderBy('count', 'desc')
                ->get();

            $latest = DB::table('statuses')
                ->select('statuses.plate as plate', 'statustypes.name as status_name', 'statuses.registerddate')
                ->join('statustypes', 'statustypes.id', '=', 'statuses.statustype_id')
                ->whereDate('statuses.registerddate', $date)
                ->orderBy('statuses.statustype_id')
                ->get();

            return Inertia::render('Reports/PerformanceByStatus', [
                'date' => $date,
                'summary' => $rows,
                'latest' => $latest,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate status report.']);
        }
    }

    /**
     * Legacy-style: driver-truck attach/detach listing.
     */
    public function driverTruckAttachDetach(Request $request): Response|RedirectResponse
    {
        try {
            $rows = DB::table('driver_truck')
                ->select(
                    'driver_truck.id',
                    'drivers.name as driver_name',
                    'trucks.plate as truck_plate',
                    'driver_truck.assigned_date',
                    'driver_truck.unassigned_date',
                    'driver_truck.status as is_attached'
                )
                ->leftJoin('drivers', 'drivers.id', '=', 'driver_truck.driver_id')
                ->leftJoin('trucks', 'trucks.id', '=', 'driver_truck.truck_id')
                ->orderByDesc('driver_truck.created_at')
                ->get();

            return Inertia::render('Reports/DriverTruckAttachDetach', [
                'rows' => $rows,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load attach/detach report.']);
        }
    }
}

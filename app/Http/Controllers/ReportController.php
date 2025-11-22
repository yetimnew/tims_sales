<?php

namespace App\Http\Controllers;

use App\Exports\Reports\DriverPerformanceExport;
use App\Exports\Reports\OperationalComparisonExport;
use App\Exports\Reports\OperationPerformanceExport;
use App\Exports\Reports\TruckPerformanceExport;
use App\Http\Requests\Reports\CustomerProfitabilityRequest;
use App\Http\Requests\Reports\FuelEfficiencyRequest;
use App\Http\Requests\Reports\OperationalComparisonRequest;
use App\Http\Requests\Reports\OutsourcePerformanceRequest;
use App\Http\Requests\Reports\PerformanceByDriverRequest;
use App\Http\Requests\Reports\PerformanceByOperationRequest;
use App\Http\Requests\Reports\PerformanceByTruckRequest;
use App\Models\Customer;
use App\Models\Distance;
use App\Models\Driver;
use App\Models\Operation;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Status;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\VehicleMaintenanceRecord;
use App\Services\Reports\CustomerProfitabilityReport;
use App\Services\Reports\FuelEfficiencyReport;
use App\Services\Reports\OperationPerformanceReport;
use App\Services\Reports\OutsourcePerformanceReport;
use App\Services\Reports\TruckPerformanceReport;
use Carbon\Carbon;
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
        private readonly TruckPerformanceReport $truckPerformanceReport,
        private readonly OperationPerformanceReport $operationPerformanceReport,
        private readonly CustomerProfitabilityReport $customerProfitabilityReport,
        private readonly FuelEfficiencyReport $fuelEfficiencyReport,
        private readonly OutsourcePerformanceReport $outsourcePerformanceReport,
    ) {}

    /**
     * Display truck reports.
     */
    public function trucks(): Response|RedirectResponse
    {
        try {
            $truckStats = [
                'total_trucks' => Truck::count(),
                'active_trucks' => Truck::where('status', 'active')->count(),
                'inactive_trucks' => Truck::where('status', 'inactive')->count(),
                'trucks_by_type' => Truck::with('vehicleType')
                    ->select('vehicletype_id', DB::raw('count(*) as count'))
                    ->groupBy('vehicletype_id')
                    ->get(),
                'average_purchase_price' => Truck::avg('purchasePrice'),
                'total_purchase_value' => Truck::sum('purchasePrice'),
            ];

            $trucks = Truck::with(['vehicleType', 'drivers'])
                ->paginate(15);

            return Inertia::render('Reports/Trucks', [
                'truckStats' => $truckStats,
                'trucks' => $trucks,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate truck report.']);
        }
    }

    /**
     * Display driver reports.
     */
    public function drivers(): Response|RedirectResponse
    {
        try {
            $driverStats = [
                'total_drivers' => Driver::count(),
                'active_drivers' => Driver::where('status', 'active')->count(),
                'inactive_drivers' => Driver::where('status', 'inactive')->count(),
                'drivers_by_zone' => Driver::select('zone', DB::raw('count(*) as count'))
                    ->groupBy('zone')
                    ->get(),
                'average_age' => Driver::whereNotNull('birthdate')
                    ->selectRaw('AVG(YEAR(CURDATE()) - YEAR(birthdate)) as avg_age')
                    ->value('avg_age'),
            ];

            $drivers = Driver::with(['trucks'])
                ->paginate(15);

            return Inertia::render('Reports/Drivers', [
                'driverStats' => $driverStats,
                'drivers' => $drivers,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate driver report.']);
        }
    }

    /**
     * Display performance reports.
     */
    public function performances(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(1)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $performanceStats = [
                'total_performances' => Performance::whereBetween('DateDispach', [$from, $to])->count(),
                'returned_performances' => Performance::whereBetween('DateDispach', [$from, $to])->where('is_returned', true)->count(),
                'not_returned_performances' => Performance::whereBetween('DateDispach', [$from, $to])->where('is_returned', false)->count(),
                'total_tonnage' => Performance::whereBetween('DateDispach', [$from, $to])->sum('CargoVolumMT'),
                'average_tonnage_per_trip' => Performance::whereBetween('DateDispach', [$from, $to])->avg('CargoVolumMT'),
                'total_distance' => Performance::whereBetween('DateDispach', [$from, $to])->sum(DB::raw('(COALESCE(DistanceWCargo,0)+COALESCE(DistanceWOCargo,0))')),
                'performances_by_month' => Performance::selectRaw('YEAR(DateDispach) as year, MONTH(DateDispach) as month, COUNT(*) as count')
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->limit(12)
                    ->get(),
            ];

            $performances = Performance::with(['operation.customer', 'driverTruck.driver', 'driverTruck.truck', 'origin', 'destination'])
                ->whereBetween('DateDispach', [$from, $to])
                ->orderBy('DateDispach', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Performances', [
                'filters' => ['from' => $from, 'to' => $to],
                'performanceStats' => $performanceStats,
                'performances' => $performances,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate performance report.']);
        }
    }

    /**
     * Display operation reports.
     */
    public function operations(Request $request): Response|RedirectResponse
    {
        try {
            $toInput = $request->input('to');
            $fromInput = $request->input('from');

            $toDate = $toInput ? Carbon::parse($toInput) : now();
            $fromDate = $fromInput ? Carbon::parse($fromInput) : $toDate->copy()->subMonths(3);

            if ($fromDate->greaterThan($toDate)) {
                $fromDate = $toDate->copy()->subMonths(3);
            }

            $fromDateString = $fromDate->toDateString();
            $toDateString = $toDate->toDateString();

            $applyPerformanceDateFilter = static function ($query) use ($fromDateString, $toDateString) {
                return $query
                    ->when($fromDateString, fn ($inner) => $inner->whereDate('DateDispach', '>=', $fromDateString))
                    ->when($toDateString, fn ($inner) => $inner->whereDate('DateDispach', '<=', $toDateString));
            };

            $applyOutsourceDateFilter = static function ($query) use ($fromDateString, $toDateString) {
                return $query
                    ->when($fromDateString, fn ($inner) => $inner->whereDate('dispatch_date', '>=', $fromDateString))
                    ->when($toDateString, fn ($inner) => $inner->whereDate('dispatch_date', '<=', $toDateString));
            };

            $connection = DB::connection();
            $driverName = $connection->getDriverName();

            $performancePeriodExpression = $driverName === 'sqlite'
                ? "strftime('%Y-%m', DateDispach)"
                : "DATE_FORMAT(DateDispach, '%Y-%m')";

            $outsourcePeriodExpression = $driverName === 'sqlite'
                ? "strftime('%Y-%m', dispatch_date)"
                : "DATE_FORMAT(dispatch_date, '%Y-%m')";

            $operationStats = [
                'total_operations' => Operation::count(),
                'active_operations' => Operation::where('status', 'active')->count(),
                'inactive_operations' => Operation::where('status', 'inactive')->count(),
                'operations_with_performances' => Operation::whereHas('performances', $applyPerformanceDateFilter)->count(),
                'operations_with_outsource' => Operation::whereHas('outsourcePerformances', $applyOutsourceDateFilter)->count(),
            ];

            $operationsWithActivity = Operation::where(function ($query) use ($applyPerformanceDateFilter, $applyOutsourceDateFilter) {
                $query->whereHas('performances', $applyPerformanceDateFilter)
                    ->orWhereHas('outsourcePerformances', $applyOutsourceDateFilter);
            })->count();

            $operationStats['operations_with_activity'] = $operationsWithActivity;

            $operationsByCustomer = Operation::with('customer')
                ->select('customer_id', DB::raw('count(*) as count'))
                ->groupBy('customer_id')
                ->orderByDesc('count')
                ->limit(10)
                ->get();

            $operationStats['operations_by_customer'] = $operationsByCustomer;

            $internalTotalsQuery = Performance::query();
            $applyPerformanceDateFilter($internalTotalsQuery);
            $internalTotals = $internalTotalsQuery
                ->selectRaw('COUNT(*) as trips')
                ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as tonnage')
                ->selectRaw('SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)) as distance_km')
                ->selectRaw('SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(other, 0)) as cost')
                ->first();

            $outsourceTotalsQuery = OutsourcePerformance::query();
            $applyOutsourceDateFilter($outsourceTotalsQuery);
            $outsourceTotals = $outsourceTotalsQuery
                ->selectRaw('COUNT(*) as trips')
                ->selectRaw('SUM(COALESCE(cargo_volume_mt, 0)) as tonnage')
                ->selectRaw('SUM(COALESCE(distance_km, 0)) as distance_km')
                ->selectRaw('SUM(COALESCE(cost, 0)) as cost')
                ->first();

            $internalRevenueQuery = Performance::query();
            $applyPerformanceDateFilter($internalRevenueQuery);
            $internalRevenue = (float) $internalRevenueQuery
                ->join('operations', 'operations.id', '=', 'performances.operation_id')
                ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0) * COALESCE(operations.tariff, 0)) as revenue')
                ->value('revenue');

            $outsourceRevenueQuery = OutsourcePerformance::query();
            $applyOutsourceDateFilter($outsourceRevenueQuery);
            $outsourceRevenue = (float) $outsourceRevenueQuery
                ->join('operations', 'operations.id', '=', 'outsource_performances.operation_id')
                ->selectRaw('SUM(COALESCE(outsource_performances.cargo_volume_mt, 0) * COALESCE(operations.tariff, 0)) as revenue')
                ->value('revenue');

            $operationStats['internal_trips'] = (int) ($internalTotals->trips ?? 0);
            $operationStats['internal_tonnage'] = (float) ($internalTotals->tonnage ?? 0.0);
            $operationStats['internal_distance_km'] = (float) ($internalTotals->distance_km ?? 0.0);
            $operationStats['internal_cost'] = (float) ($internalTotals->cost ?? 0.0);
            $operationStats['internal_revenue'] = $internalRevenue;

            $operationStats['outsource_trips'] = (int) ($outsourceTotals->trips ?? 0);
            $operationStats['outsource_tonnage'] = (float) ($outsourceTotals->tonnage ?? 0.0);
            $operationStats['outsource_distance_km'] = (float) ($outsourceTotals->distance_km ?? 0.0);
            $operationStats['outsource_cost'] = (float) ($outsourceTotals->cost ?? 0.0);
            $operationStats['outsource_revenue'] = $outsourceRevenue;

            $operationStats['total_revenue'] = $operationStats['internal_revenue'] + $operationStats['outsource_revenue'];
            $operationStats['margin'] = $operationStats['total_revenue'] - ($operationStats['internal_cost'] + $operationStats['outsource_cost']);

            $operations = Operation::query()
                ->with('customer')
                ->withCount([
                    'performances as internal_trip_count' => $applyPerformanceDateFilter,
                    'outsourcePerformances as outsource_trip_count' => $applyOutsourceDateFilter,
                ])
                ->withSum(['performances as internal_tonnage_sum' => $applyPerformanceDateFilter], 'CargoVolumMT')
                ->withSum(['performances as internal_distance_wc_sum' => $applyPerformanceDateFilter], 'DistanceWCargo')
                ->withSum(['performances as internal_distance_wo_sum' => $applyPerformanceDateFilter], 'DistanceWOCargo')
                ->withSum(['performances as internal_fuel_cost_sum' => $applyPerformanceDateFilter], 'fuelInBirr')
                ->withSum(['performances as internal_perdiem_cost_sum' => $applyPerformanceDateFilter], 'perdiem')
                ->withSum(['performances as internal_other_cost_sum' => $applyPerformanceDateFilter], 'other')
                ->withSum(['outsourcePerformances as outsource_tonnage_sum' => $applyOutsourceDateFilter], 'cargo_volume_mt')
                ->withSum(['outsourcePerformances as outsource_distance_sum' => $applyOutsourceDateFilter], 'distance_km')
                ->withSum(['outsourcePerformances as outsource_cost_sum' => $applyOutsourceDateFilter], 'cost')
                ->orderByDesc('internal_trip_count')
                ->orderByDesc('outsource_trip_count')
                ->paginate(15)
                ->withQueryString()
                ->through(function (Operation $operation) {
                    $internalTonnage = (float) ($operation->internal_tonnage_sum ?? 0.0);
                    $outsourceTonnage = (float) ($operation->outsource_tonnage_sum ?? 0.0);
                    $internalDistance = (float) ($operation->internal_distance_wc_sum ?? 0.0) + (float) ($operation->internal_distance_wo_sum ?? 0.0);
                    $outsourceDistance = (float) ($operation->outsource_distance_sum ?? 0.0);
                    $internalCost = (float) ($operation->internal_fuel_cost_sum ?? 0.0)
                        + (float) ($operation->internal_perdiem_cost_sum ?? 0.0)
                        + (float) ($operation->internal_other_cost_sum ?? 0.0);
                    $outsourceCost = (float) ($operation->outsource_cost_sum ?? 0.0);
                    $totalTonnage = $internalTonnage + $outsourceTonnage;
                    $revenue = (float) ($operation->tariff ?? 0.0) * $totalTonnage;
                    $totalCost = $internalCost + $outsourceCost;
                    $margin = $revenue - $totalCost;
                    $marginPercent = $revenue > 0 ? round(($margin / $revenue) * 100, 2) : null;

                    return [
                        'id' => $operation->id,
                        'code' => $operation->operationid ?? (string) $operation->id,
                        'status' => $operation->status,
                        'tariff' => (float) ($operation->tariff ?? 0.0),
                        'customer' => [
                            'id' => $operation->customer?->id,
                            'name' => $operation->customer?->name ?? 'N/A',
                        ],
                        'internal' => [
                            'trips' => (int) ($operation->internal_trip_count ?? 0),
                            'tonnage' => round($internalTonnage, 2),
                            'distance_km' => round($internalDistance, 2),
                            'cost' => round($internalCost, 2),
                        ],
                        'outsource' => [
                            'trips' => (int) ($operation->outsource_trip_count ?? 0),
                            'tonnage' => round($outsourceTonnage, 2),
                            'distance_km' => round($outsourceDistance, 2),
                            'cost' => round($outsourceCost, 2),
                        ],
                        'revenue' => round($revenue, 2),
                        'total_cost' => round($totalCost, 2),
                        'margin' => round($margin, 2),
                        'margin_percent' => $marginPercent,
                    ];
                });

            $operationsPerCustomer = Operation::query()
                ->select('customer_id', DB::raw('COUNT(DISTINCT operations.id) as operations_count'))
                ->where(function ($query) use ($applyPerformanceDateFilter, $applyOutsourceDateFilter) {
                    $query->whereHas('performances', $applyPerformanceDateFilter)
                        ->orWhereHas('outsourcePerformances', $applyOutsourceDateFilter);
                })
                ->groupBy('customer_id')
                ->get()
                ->keyBy('customer_id');

            $customerInternalQuery = Performance::query();
            $applyPerformanceDateFilter($customerInternalQuery);
            $customerInternal = $customerInternalQuery
                ->join('operations', 'operations.id', '=', 'performances.operation_id')
                ->join('customers', 'customers.id', '=', 'operations.customer_id')
                ->select('operations.customer_id')
                ->selectRaw('MAX(customers.name) as customer_name')
                ->selectRaw('COUNT(*) as internal_trips')
                ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0)) as internal_tonnage')
                ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0) + COALESCE(performances.perdiem, 0) + COALESCE(performances.other, 0)) as internal_cost')
                ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0) * COALESCE(operations.tariff, 0)) as internal_revenue')
                ->groupBy('operations.customer_id')
                ->get()
                ->keyBy('customer_id');

            $customerOutsourceQuery = OutsourcePerformance::query();
            $applyOutsourceDateFilter($customerOutsourceQuery);
            $customerOutsource = $customerOutsourceQuery
                ->join('operations', 'operations.id', '=', 'outsource_performances.operation_id')
                ->join('customers', 'customers.id', '=', 'operations.customer_id')
                ->select('operations.customer_id')
                ->selectRaw('MAX(customers.name) as customer_name')
                ->selectRaw('COUNT(*) as outsource_trips')
                ->selectRaw('SUM(COALESCE(outsource_performances.cargo_volume_mt, 0)) as outsource_tonnage')
                ->selectRaw('SUM(COALESCE(outsource_performances.cost, 0)) as outsource_cost')
                ->selectRaw('SUM(COALESCE(outsource_performances.cargo_volume_mt, 0) * COALESCE(operations.tariff, 0)) as outsource_revenue')
                ->groupBy('operations.customer_id')
                ->get()
                ->keyBy('customer_id');

            $customerHighlights = [];
            $customerIds = $customerInternal->keys()->merge($customerOutsource->keys())->unique();

            foreach ($customerIds as $customerId) {
                $internal = $customerInternal->get($customerId);
                $external = $customerOutsource->get($customerId);
                $operationsCount = (int) ($operationsPerCustomer->get($customerId)->operations_count ?? 0);
                $name = $internal->customer_name ?? $external->customer_name ?? 'N/A';

                $internalTrips = (int) ($internal->internal_trips ?? 0);
                $internalTonnage = (float) ($internal->internal_tonnage ?? 0.0);
                $internalCost = (float) ($internal->internal_cost ?? 0.0);
                $internalRevenueCustomer = (float) ($internal->internal_revenue ?? 0.0);

                $outTrips = (int) ($external->outsource_trips ?? 0);
                $outTonnage = (float) ($external->outsource_tonnage ?? 0.0);
                $outCost = (float) ($external->outsource_cost ?? 0.0);
                $outRevenue = (float) ($external->outsource_revenue ?? 0.0);

                $revenue = $internalRevenueCustomer + $outRevenue;
                $cost = $internalCost + $outCost;
                $margin = $revenue - $cost;
                $marginPercent = $revenue > 0 ? round(($margin / $revenue) * 100, 2) : null;

                $customerHighlights[] = [
                    'customer_id' => $customerId,
                    'customer_name' => $name,
                    'operations' => $operationsCount,
                    'internal_trips' => $internalTrips,
                    'outsource_trips' => $outTrips,
                    'tonnage' => round($internalTonnage + $outTonnage, 2),
                    'revenue' => round($revenue, 2),
                    'cost' => round($cost, 2),
                    'margin' => round($margin, 2),
                    'margin_percent' => $marginPercent,
                ];
            }

            usort($customerHighlights, fn ($a, $b) => $b['revenue'] <=> $a['revenue']);
            $customerHighlights = array_slice($customerHighlights, 0, 5);

            $internalTrendQuery = Performance::query();
            $applyPerformanceDateFilter($internalTrendQuery);
            $internalTrend = $internalTrendQuery
                ->selectRaw("{$performancePeriodExpression} as period")
                ->selectRaw('COUNT(*) as trips')
                ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as tonnage')
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->keyBy('period');

            $outsourceTrendQuery = OutsourcePerformance::query();
            $applyOutsourceDateFilter($outsourceTrendQuery);
            $outsourceTrend = $outsourceTrendQuery
                ->selectRaw("{$outsourcePeriodExpression} as period")
                ->selectRaw('COUNT(*) as trips')
                ->selectRaw('SUM(COALESCE(cargo_volume_mt, 0)) as tonnage')
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->keyBy('period');

            $trendPeriods = $internalTrend->keys()->merge($outsourceTrend->keys())->unique()->sort()->values();
            $mixTrend = [];

            foreach ($trendPeriods as $period) {
                $internalRow = $internalTrend->get($period);
                $outRow = $outsourceTrend->get($period);

                $mixTrend[] = [
                    'period' => $period,
                    'internal_trips' => (int) ($internalRow->trips ?? 0),
                    'outsource_trips' => (int) ($outRow->trips ?? 0),
                    'internal_tonnage' => round((float) ($internalRow->tonnage ?? 0.0), 2),
                    'outsource_tonnage' => round((float) ($outRow->tonnage ?? 0.0), 2),
                ];
            }

            return Inertia::render('Reports/Operations', [
                'filters' => [
                    'from' => $fromDateString,
                    'to' => $toDateString,
                ],
                'operationStats' => $operationStats,
                'operations' => $operations,
                'customerHighlights' => $customerHighlights,
                'mixTrend' => $mixTrend,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate operation report.']);
        }
    }

    /**
     * Display financial reports.
     */
    public function financial(): Response|RedirectResponse
    {
        try {
            $financialStats = [
                'total_revenue' => TruckFinancialRecord::sum('revenue'),
                'total_costs' => TruckFinancialRecord::sum('fuel_cost') +
                               TruckFinancialRecord::sum('maintenance_cost') +
                               TruckFinancialRecord::sum('driver_salary') +
                               TruckFinancialRecord::sum('insurance_cost') +
                               TruckFinancialRecord::sum('depreciation') +
                               TruckFinancialRecord::sum('other_costs'),
                'total_profit' => TruckFinancialRecord::sum('net_profit'),
                'average_profit_margin' => TruckFinancialRecord::avg('net_profit'),
                'monthly_financials' => TruckFinancialRecord::selectRaw('YEAR(record_date) as year, MONTH(record_date) as month, SUM(revenue) as revenue, SUM(net_profit) as profit')
                    ->groupBy('year', 'month')
                    ->orderBy('year', 'desc')
                    ->orderBy('month', 'desc')
                    ->limit(12)
                    ->get(),
            ];

            $financialRecords = TruckFinancialRecord::with(['truck'])
                ->orderBy('record_date', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Financial', [
                'financialStats' => $financialStats,
                'financialRecords' => $financialRecords,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate financial report.']);
        }
    }

    /**
     * Display maintenance reports.
     */
    public function maintenance(): Response|RedirectResponse
    {
        try {
            $maintenanceStats = [
                'total_maintenance_records' => VehicleMaintenanceRecord::count(),
                'scheduled_maintenance' => VehicleMaintenanceRecord::where('status', 'scheduled')->count(),
                'completed_maintenance' => VehicleMaintenanceRecord::where('status', 'completed')->count(),
                'overdue_maintenance' => VehicleMaintenanceRecord::where('status', 'scheduled')
                    ->where('scheduled_date', '<', now())->count(),
                'total_maintenance_cost' => VehicleMaintenanceRecord::sum('cost'),
                'average_maintenance_cost' => VehicleMaintenanceRecord::avg('cost'),
                'maintenance_by_type' => VehicleMaintenanceRecord::with('maintenanceType')
                    ->select('maintenance_type_id', DB::raw('count(*) as count'))
                    ->groupBy('maintenance_type_id')
                    ->get(),
            ];

            $maintenanceRecords = VehicleMaintenanceRecord::with(['truck', 'maintenanceType', 'assignedMechanic'])
                ->orderBy('scheduled_date', 'desc')
                ->paginate(15);

            return Inertia::render('Reports/Maintenance', [
                'maintenanceStats' => $maintenanceStats,
                'maintenanceRecords' => $maintenanceRecords,
            ]);

        } catch (Exception $e) {
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
     * Display route & distance efficiency report (planned vs actual; cost/km; detours).
     */
    public function routeEfficiency(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(3)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $perfs = Performance::with(['origin', 'destination'])
                ->whereBetween('DateDispach', [$from, $to])
                ->get();

            // Build lane metrics using Distance as planned baseline where available
            $lanes = [];
            foreach ($perfs as $p) {
                $fromId = $p->orgion_id;
                $toId = $p->destination_id;
                if (! $fromId || ! $toId) {
                    continue;
                }
                $key = $fromId.'-'.$toId;
                if (! isset($lanes[$key])) {
                    // Try to get planned baseline from Distance
                    $dist = Distance::where('from_place_id', $fromId)->where('to_place_id', $toId)->first();
                    $lanes[$key] = [
                        'from_id' => $fromId,
                        'to_id' => $toId,
                        'from_name' => $p->origin?->name ?? (string) $fromId,
                        'to_name' => $p->destination?->name ?? (string) $toId,
                        'planned_km' => $dist?->distance_km ? (float) $dist->distance_km : null,
                        'actual_km_total' => 0.0,
                        'cost_total' => 0.0,
                        'trips' => 0,
                    ];
                }
                $actualKm = (float) ($p->DistanceWCargo ?? 0) + (float) ($p->DistanceWOCargo ?? 0);
                $cost = (float) ($p->fuelInBirr ?? 0) + (float) ($p->perdiem ?? 0) + (float) ($p->other ?? 0);
                $lanes[$key]['actual_km_total'] += $actualKm;
                $lanes[$key]['cost_total'] += $cost;
                $lanes[$key]['trips'] += 1;
            }

            $laneRows = [];
            foreach ($lanes as $k => $l) {
                $actualAvgKm = $l['trips'] > 0 ? $l['actual_km_total'] / $l['trips'] : 0.0;
                $costPerKm = $l['actual_km_total'] > 0 ? $l['cost_total'] / $l['actual_km_total'] : null;
                $detourPct = ($l['planned_km'] && $l['planned_km'] > 0)
                    ? round((($actualAvgKm - $l['planned_km']) / $l['planned_km']) * 100, 2)
                    : null;
                $laneRows[] = [
                    'from_name' => $l['from_name'],
                    'to_name' => $l['to_name'],
                    'planned_km' => $l['planned_km'] ? round($l['planned_km'], 2) : null,
                    'actual_avg_km' => round($actualAvgKm, 2),
                    'cost_per_km' => $costPerKm ? round($costPerKm, 2) : null,
                    'trips' => $l['trips'],
                    'detour_pct' => $detourPct,
                ];
            }

            // Sort by highest detour percentage (worst)
            usort($laneRows, function ($a, $b) {
                $ad = $a['detour_pct'];
                $bd = $b['detour_pct'];
                if ($ad === null && $bd === null) {
                    return 0;
                }
                if ($ad === null) {
                    return 1;
                }
                if ($bd === null) {
                    return -1;
                }

                return $bd <=> $ad;
            });

            $totals = [
                'lanes' => count($laneRows),
                'trips' => array_sum(array_column($laneRows, 'trips')),
                'avg_cost_per_km' => null,
            ];
            // Compute overall avg cost per km weighted by km if possible
            $sumCost = 0.0;
            $sumKm = 0.0;
            foreach ($lanes as $l) {
                $sumCost += $l['cost_total'];
                $sumKm += $l['actual_km_total'];
            }
            $totals['avg_cost_per_km'] = $sumKm > 0 ? round($sumCost / $sumKm, 2) : null;

            return Inertia::render('Reports/RouteEfficiency', [
                'filters' => ['from' => $from, 'to' => $to],
                'totals' => $totals,
                'lanes' => $laneRows,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate route efficiency report.']);
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
     * Display capacity & load factor report (tonnage vs capacity, load factor, empty runs).
     */
    public function capacityLoadFactor(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(3)->toDateString());
            $to = $request->input('to', now()->toDateString());
            $capacityTons = (float) $request->input('capacity_tons', 20); // default 20 MT per trip

            $perfs = Performance::with(['operation.customer', 'origin', 'destination'])
                ->whereBetween('DateDispach', [$from, $to])
                ->get();

            $totalTrips = $perfs->count();
            $totalTonnage = (float) $perfs->sum(fn ($p) => (float) ($p->CargoVolumMT ?? 0));
            $emptyRuns = $perfs->filter(fn ($p) => (float) ($p->CargoVolumMT ?? 0) <= 0 && (float) ($p->DistanceWOCargo ?? 0) > 0)->count();
            $estCapacity = $capacityTons * max(1, $totalTrips);
            $avgLoadFactor = $estCapacity > 0 ? round(($totalTonnage / $estCapacity) * 100, 2) : null;

            // By lane (origin->destination)
            $lanes = [];
            foreach ($perfs as $p) {
                $fromId = $p->orgion_id;
                $toId = $p->destination_id;
                $key = ($fromId ?? 'N').'-'.($toId ?? 'N');
                if (! isset($lanes[$key])) {
                    $lanes[$key] = [
                        'from_name' => $p->origin?->name ?? (string) $fromId,
                        'to_name' => $p->destination?->name ?? (string) $toId,
                        'trips' => 0,
                        'tonnage' => 0.0,
                        'empty_runs' => 0,
                        'load_factor_pct' => null,
                    ];
                }
                $lanes[$key]['trips'] += 1;
                $lanes[$key]['tonnage'] += (float) ($p->CargoVolumMT ?? 0);
                if ((float) ($p->CargoVolumMT ?? 0) <= 0 && (float) ($p->DistanceWOCargo ?? 0) > 0) {
                    $lanes[$key]['empty_runs'] += 1;
                }
            }

            $laneRows = [];
            foreach ($lanes as $l) {
                $estCap = $capacityTons * max(1, $l['trips']);
                $lf = $estCap > 0 ? round(($l['tonnage'] / $estCap) * 100, 2) : null;
                $laneRows[] = [
                    'from_name' => $l['from_name'],
                    'to_name' => $l['to_name'],
                    'trips' => $l['trips'],
                    'tonnage' => round($l['tonnage'], 2),
                    'empty_runs' => $l['empty_runs'],
                    'load_factor_pct' => $lf,
                ];
            }

            // By customer
            $customers = [];
            foreach ($perfs as $p) {
                $cust = $p->operation?->customer;
                if (! $cust) {
                    continue;
                }
                $cid = $cust->id;
                if (! isset($customers[$cid])) {
                    $customers[$cid] = [
                        'customer_id' => $cid,
                        'customer_name' => $cust->name,
                        'trips' => 0,
                        'tonnage' => 0.0,
                        'empty_runs' => 0,
                        'load_factor_pct' => null,
                    ];
                }
                $customers[$cid]['trips'] += 1;
                $customers[$cid]['tonnage'] += (float) ($p->CargoVolumMT ?? 0);
                if ((float) ($p->CargoVolumMT ?? 0) <= 0 && (float) ($p->DistanceWOCargo ?? 0) > 0) {
                    $customers[$cid]['empty_runs'] += 1;
                }
            }
            $customerRows = [];
            foreach ($customers as $c) {
                $estCap = $capacityTons * max(1, $c['trips']);
                $lf = $estCap > 0 ? round(($c['tonnage'] / $estCap) * 100, 2) : null;
                $customerRows[] = [
                    'customer_id' => $c['customer_id'],
                    'customer_name' => $c['customer_name'],
                    'trips' => $c['trips'],
                    'tonnage' => round($c['tonnage'], 2),
                    'empty_runs' => $c['empty_runs'],
                    'load_factor_pct' => $lf,
                ];
            }

            // Sort lanes by worst load factor
            usort($laneRows, function ($a, $b) {
                $al = $a['load_factor_pct'];
                $bl = $b['load_factor_pct'];
                if ($al === null && $bl === null) {
                    return 0;
                }
                if ($al === null) {
                    return 1;
                }
                if ($bl === null) {
                    return -1;
                }

                return $al <=> $bl; // ascending (worst first)
            });
            // Sort customers by worst load factor
            usort($customerRows, function ($a, $b) {
                $al = $a['load_factor_pct'];
                $bl = $b['load_factor_pct'];
                if ($al === null && $bl === null) {
                    return 0;
                }
                if ($al === null) {
                    return 1;
                }
                if ($bl === null) {
                    return -1;
                }

                return $al <=> $bl;
            });

            return Inertia::render('Reports/CapacityLoad', [
                'filters' => ['from' => $from, 'to' => $to, 'capacity_tons' => $capacityTons],
                'totals' => [
                    'trips' => $totalTrips,
                    'tonnage' => round($totalTonnage, 2),
                    'avg_load_factor_pct' => $avgLoadFactor,
                    'empty_run_rate_pct' => $totalTrips > 0 ? round(($emptyRuns / $totalTrips) * 100, 2) : null,
                ],
                'lanes' => $laneRows,
                'customers' => $customerRows,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate capacity & load factor report.']);
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
    public function performanceAll(Request $request): Response|RedirectResponse
    {
        try {
            $limit = (int) $request->input('limit', 200);
            $perfs = Performance::with(['operation.customer', 'driverTruck.driver', 'driverTruck.truck.vehicleType', 'destination'])
                ->orderByDesc('DateDispach')
                ->limit($limit)
                ->get();

            return Inertia::render('Reports/PerformanceAll', [
                'performances' => $perfs,
                'limit' => $limit,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to load performances.']);
        }
    }

    public function operationalComparison(OperationalComparisonRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->operationPerformanceReport->build($validated);

            $operations = Operation::query()
                ->select('id', 'operationid', 'customer_id')
                ->with('customer:id,name')
                ->orderBy('operationid')
                ->get()
                ->map(static fn (Operation $operation) => [
                    'id' => $operation->id,
                    'code' => $operation->operationid ?? 'Operation #'.$operation->id,
                    'customer_name' => $operation->customer?->name ?? 'N/A',
                ]);

            return Inertia::render('Reports/OperationalComparison', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'operation_ids' => $result['operation_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'operations' => $operations,
                'customerHighlights' => $result['customer_highlights'],
                'mixTrend' => $result['mix_trend'],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate operational comparison report.']);
        }
    }

    public function operationalComparisonExport(OperationalComparisonRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->operationPerformanceReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']->values()
            : collect($result['rows'])->values();

        $filename = 'operational_comparison_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportOperationalComparisonCsv(
                $this->operationalComparisonRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportOperationalComparisonExcel(
                $this->operationalComparisonRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportOperationalComparisonPdf(
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
     * Legacy-style: performance aggregated by driver with date filters.
     */
    public function performanceByOperation(PerformanceByOperationRequest $request): Response|RedirectResponse
    {
        try {
            $validated = $request->validated();
            $result = $this->operationPerformanceReport->build($validated);

            $operations = Operation::query()
                ->select('id', 'operationid', 'customer_id')
                ->with('customer:id,name')
                ->orderBy('operationid')
                ->get()
                ->map(static fn (Operation $operation) => [
                    'id' => $operation->id,
                    'code' => $operation->operationid ?? 'Operation #'.$operation->id,
                    'customer_name' => $operation->customer?->name ?? 'N/A',
                ]);

            return Inertia::render('Reports/PerformanceByOperation', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'operation_ids' => $result['operation_ids'],
                ],
                'rows' => $result['rows'],
                'summary' => $result['summary'],
                'operations' => $operations,
                'customerHighlights' => $result['customer_highlights'],
                'mixTrend' => $result['mix_trend'],
            ]);
        } catch (Exception $e) {
            report($e);

            return back()->withErrors(['error' => 'Failed to generate operation performance report.']);
        }
    }

    public function performanceByOperationExport(PerformanceByOperationRequest $request, string $format)
    {
        $format = strtolower($format);

        if (! in_array($format, ['csv', 'xlsx', 'pdf'], true)) {
            abort(404);
        }

        $validated = array_merge($request->validated(), ['format' => $format]);
        $result = $this->operationPerformanceReport->build($validated);

        $rows = $result['rows'] instanceof Collection
            ? $result['rows']->values()
            : collect($result['rows'])->values();

        $filename = 'operation_performance_'.now()->format('Y-m-d_H-i-s');

        return match ($format) {
            'csv' => $this->exportOperationCsv(
                $this->operationRowsWithTotals($rows, $result['summary']),
                $result['resolved_from'],
                $result['resolved_to'],
                $filename.'.csv'
            ),
            'xlsx' => $this->exportOperationExcel(
                $this->operationRowsWithTotals($rows, $result['summary']),
                $filename.'.xlsx'
            ),
            'pdf' => $this->exportOperationPdf(
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

    private function operationalComparisonRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'operation_id' => null,
            'customer_id' => null,
            'operation_code' => 'TOTAL',
            'customer_name' => '—',
            'status' => null,
            'start_date' => null,
            'end_date' => null,
            'internal_trips' => $summary['internal_trips'],
            'outsource_trips' => $summary['outsource_trips'],
            'total_trips' => $summary['total_trips'],
            'internal_tonnage' => $summary['internal_tonnage'],
            'outsource_tonnage' => $summary['outsource_tonnage'],
            'total_tonnage' => $summary['total_tonnage'],
            'internal_ton_km' => $summary['internal_ton_km'],
            'outsource_ton_km' => $summary['outsource_ton_km'],
            'total_ton_km' => $summary['total_ton_km'],
            'internal_distance_with_cargo' => $summary['internal_distance_with_cargo'],
            'internal_distance_without_cargo' => $summary['internal_distance_without_cargo'],
            'internal_distance' => $summary['internal_distance'],
            'outsource_distance' => $summary['outsource_distance'],
            'total_distance' => $summary['total_distance'],
            'internal_fuel_cost' => $summary['internal_fuel_cost'],
            'internal_expense' => $summary['internal_expense'],
            'outsource_cost' => $summary['outsource_cost'],
            'total_cost' => $summary['total_cost'],
            'tariff' => null,
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
            'average_km_per_trip' => $summary['average_km_per_trip'],
            'cost_per_km' => $summary['cost_per_km'],
            'revenue_per_ton_km' => $summary['revenue_per_ton_km'],
            'cost_per_ton_km' => $summary['cost_per_ton_km'],
            'profit_per_ton_km' => $summary['profit_per_ton_km'],
            'revenue_per_trip' => $summary['revenue_per_trip'],
            'cost_per_trip' => $summary['cost_per_trip'],
            'tonnage_per_trip' => $summary['tonnage_per_trip'],
            'empty_distance_ratio_percent' => $summary['empty_distance_ratio_percent'],
            'internal_fuel_cost_per_km' => $summary['internal_fuel_cost_per_km'],
            'outsource_cost_per_km' => $summary['outsource_cost_per_km'],
            'outsource_trip_share_percent' => $summary['outsource_trip_share_percent'],
            'outsource_tonnage_share_percent' => $summary['outsource_tonnage_share_percent'],
        ]);

        return $data->values();
    }

    private function exportOperationalComparisonCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Operation',
            'Customer',
            'Internal Trips',
            'Outsource Trips',
            'Total Trips',
            'Internal Tonnage (MT)',
            'Outsource Tonnage (MT)',
            'Total Tonnage (MT)',
            'Total Ton-KM',
            'Revenue',
            'Total Cost',
            'Profit',
            'Margin %',
            'Revenue / Ton-KM',
            'Cost / Ton-KM',
            'Profit / Ton-KM',
            'Revenue / Trip',
            'Cost / Trip',
            'Tonnage / Trip',
            'Average Km/Trip',
            'Total Distance (KM)',
            'Empty Distance %',
            'Cost per Km',
            'Internal Fuel / Km',
            'Outsource Cost / Km',
            'Outsource Trip Share %',
            'Outsource Tonnage Share %',
        ];

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        return HttpResponse::streamDownload(static function () use ($rows, $headings, $from, $to) {
            $handle = fopen('php://output', 'w');

            fputcsv($handle, ['Operational Comparison Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['operation_code'],
                    $row['customer_name'],
                    $row['internal_trips'],
                    $row['outsource_trips'],
                    $row['total_trips'],
                    $row['internal_tonnage'],
                    $row['outsource_tonnage'],
                    $row['total_tonnage'],
                    $row['total_ton_km'],
                    $row['revenue'],
                    $row['total_cost'],
                    $row['profit'],
                    $row['margin_percent'],
                    $row['revenue_per_ton_km'],
                    $row['cost_per_ton_km'],
                    $row['profit_per_ton_km'],
                    $row['revenue_per_trip'],
                    $row['cost_per_trip'],
                    $row['tonnage_per_trip'],
                    $row['average_km_per_trip'],
                    $row['total_distance'],
                    $row['empty_distance_ratio_percent'],
                    $row['cost_per_km'],
                    $row['internal_fuel_cost_per_km'],
                    $row['outsource_cost_per_km'],
                    $row['outsource_trip_share_percent'],
                    $row['outsource_tonnage_share_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportOperationalComparisonExcel(Collection $rows, string $filename)
    {
        return Excel::download(new OperationalComparisonExport($rows), $filename);
    }

    private function exportOperationalComparisonPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.operational_comparison_pdf', [
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

    private function operationRowsWithTotals(Collection $rows, array $summary): Collection
    {
        $data = collect($rows->all());

        $data->push([
            'operation_code' => 'TOTAL',
            'customer_name' => '—',
            'status' => null,
            'start_date' => null,
            'end_date' => null,
            'internal_trips' => $summary['internal_trips'],
            'outsource_trips' => $summary['outsource_trips'],
            'total_trips' => $summary['total_trips'],
            'internal_tonnage' => $summary['internal_tonnage'],
            'outsource_tonnage' => $summary['outsource_tonnage'],
            'total_tonnage' => $summary['total_tonnage'],
            'internal_ton_km' => $summary['internal_ton_km'],
            'outsource_ton_km' => $summary['outsource_ton_km'],
            'total_ton_km' => $summary['total_ton_km'],
            'internal_distance' => $summary['internal_distance'],
            'outsource_distance' => $summary['outsource_distance'],
            'total_distance' => $summary['total_distance'],
            'internal_expense' => $summary['internal_expense'],
            'outsource_cost' => $summary['outsource_cost'],
            'total_cost' => $summary['total_cost'],
            'tariff' => null,
            'revenue' => $summary['revenue'],
            'profit' => $summary['profit'],
            'margin_percent' => $summary['margin_percent'],
            'average_km_per_trip' => $summary['average_km_per_trip'],
            'cost_per_km' => $summary['cost_per_km'],
        ]);

        return $data->values();
    }

    private function exportOperationCsv(Collection $rows, string $from, string $to, string $filename)
    {
        $headings = [
            'Operation',
            'Customer',
            'Internal Trips',
            'Outsource Trips',
            'Total Trips',
            'Internal Tonnage (MT)',
            'Outsource Tonnage (MT)',
            'Total Tonnage (MT)',
            'Internal Ton-KM',
            'Outsource Ton-KM',
            'Total Ton-KM',
            'Internal Distance (KM)',
            'Outsource Distance (KM)',
            'Total Distance (KM)',
            'Average Km/Trip',
            'Cost per Km',
            'Internal Expense',
            'Outsource Cost',
            'Total Cost',
            'Tariff',
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

            fputcsv($handle, ['Performance by Operation Report']);
            fputcsv($handle, ["Reporting window: {$from} to {$to}"]);
            fputcsv($handle, []);
            fputcsv($handle, $headings);

            foreach ($rows as $row) {
                fputcsv($handle, [
                    $row['operation_code'],
                    $row['customer_name'],
                    $row['internal_trips'],
                    $row['outsource_trips'],
                    $row['total_trips'],
                    $row['internal_tonnage'],
                    $row['outsource_tonnage'],
                    $row['total_tonnage'],
                    $row['internal_ton_km'],
                    $row['outsource_ton_km'],
                    $row['total_ton_km'],
                    $row['internal_distance'],
                    $row['outsource_distance'],
                    $row['total_distance'],
                    $row['average_km_per_trip'],
                    $row['cost_per_km'],
                    $row['internal_expense'],
                    $row['outsource_cost'],
                    $row['total_cost'],
                    $row['tariff'],
                    $row['revenue'],
                    $row['profit'],
                    $row['margin_percent'],
                ]);
            }

            fclose($handle);
        }, $filename, $headers);
    }

    private function exportOperationExcel(Collection $rows, string $filename)
    {
        return Excel::download(new OperationPerformanceExport($rows), $filename);
    }

    private function exportOperationPdf(Collection $rows, array $summary, string $from, string $to, string $filename)
    {
        $options = new Options;
        $options->set('isRemoteEnabled', true);
        $options->set('defaultFont', 'DejaVu Sans');

        $dompdf = new Dompdf($options);
        $html = view('reports.performance_by_operation_pdf', [
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
                ]);

            return Inertia::render('Reports/PerformanceByTruck', [
                'filters' => [
                    'from' => $result['resolved_from'],
                    'to' => $result['resolved_to'],
                    'truck_ids' => $validated['truck_ids'] ?? [],
                ],
                'rows' => $rows,
                'summary' => $result['summary'],
                'trucks' => $trucks,
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

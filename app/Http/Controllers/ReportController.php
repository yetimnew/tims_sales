<?php

namespace App\Http\Controllers;

use App\Models\Truck;
use App\Models\Driver;
use App\Models\Performance;
use App\Models\Operation;
use App\Models\TruckFinancialRecord;
use App\Models\VehicleMaintenanceRecord;
use App\Models\FuelRecord;
use App\Models\Customer;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Distance;
use App\Models\Place;
use App\Models\DriverTruck;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\VehicleType;
use Illuminate\Support\Facades\DB;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;
use Exception;

class ReportController extends Controller
{
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
            $operationStats = [
                'total_operations' => Operation::count(),
                'active_operations' => Operation::where('status', 'active')->count(),
                'inactive_operations' => Operation::where('status', 'inactive')->count(),
                'operations_by_customer' => Operation::with('customer')
                    ->select('customer_id', DB::raw('count(*) as count'))
                    ->groupBy('customer_id')
                    ->get(),
                'operations_with_performances' => Operation::has('performances')->count(),
            ];

            $operations = Operation::with(['customer', 'performances'])
                ->paginate(15);

            return Inertia::render('Reports/Operations', [
                'filters' => [
                    'from' => $request->input('from', ''),
                    'to' => $request->input('to', ''),
                ],
                'operationStats' => $operationStats,
                'operations' => $operations,
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
    public function fuelEfficiency(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(3)->toDateString());
            $to = $request->input('to', now()->toDateString());
            $truckId = $request->input('truck_id');

            // Aggregate liters and total cost per truck for the period
            $fuelAgg = FuelRecord::select('truck_id',
                    DB::raw('SUM(fuel_quantity_liters) as total_liters'),
                    DB::raw('SUM(total_cost) as total_cost')
                )
                ->whereBetween('fuel_date', [$from, $to])
                ->when($truckId, fn($q) => $q->where('truck_id', $truckId))
                ->groupBy('truck_id')
                ->get()
                ->keyBy('truck_id');

            // Aggregate odometer min/max to estimate distance per truck
            $odoAgg = FuelRecord::select('truck_id',
                    DB::raw('MIN(odometer_reading) as min_odo'),
                    DB::raw('MAX(odometer_reading) as max_odo')
                )
                ->whereBetween('fuel_date', [$from, $to])
                ->whereNotNull('odometer_reading')
                ->when($truckId, fn($q) => $q->where('truck_id', $truckId))
                ->groupBy('truck_id')
                ->get()
                ->keyBy('truck_id');

            $truckIds = $fuelAgg->keys()->merge($odoAgg->keys())->unique()->values();
            $trucks = Truck::whereIn('id', $truckIds)->get()->keyBy('id');

            $breakdown = [];
            $totals = [
                'totalFuelLiters' => 0.0,
                'totalFuelCost' => 0.0,
                'totalDistanceKm' => 0.0,
            ];

            foreach ($truckIds as $tid) {
                $fa = $fuelAgg->get($tid);
                $oa = $odoAgg->get($tid);
                $distance = 0.0;
                if ($oa && $oa->max_odo !== null && $oa->min_odo !== null) {
                    $distance = max(0.0, (float)$oa->max_odo - (float)$oa->min_odo);
                }
                $liters = $fa ? (float)$fa->total_liters : 0.0;
                $cost = $fa ? (float)$fa->total_cost : 0.0;
                $eff = $liters > 0 ? round($distance / $liters, 2) : null;
                $costPerKm = $distance > 0 ? round($cost / $distance, 2) : null;

                $totals['totalFuelLiters'] += $liters;
                $totals['totalFuelCost'] += $cost;
                $totals['totalDistanceKm'] += $distance;

                $breakdown[] = [
                    'truck_id' => (int)$tid,
                    'plate' => $trucks->get($tid)->plate ?? 'Truck #' . $tid,
                    'total_liters' => round($liters, 2),
                    'total_cost' => round($cost, 2),
                    'distance_km' => round($distance, 2),
                    'efficiency_km_per_liter' => $eff,
                    'cost_per_km' => $costPerKm,
                ];
            }

            $summary = [
                'efficiencyKmPerLiter' => $totals['totalFuelLiters'] > 0
                    ? round($totals['totalDistanceKm'] / $totals['totalFuelLiters'], 2)
                    : null,
                'costPerKm' => $totals['totalDistanceKm'] > 0
                    ? round($totals['totalFuelCost'] / $totals['totalDistanceKm'], 2)
                    : null,
            ];

            // Sort breakdown by worst cost per km descending, nulls last
            usort($breakdown, function ($a, $b) {
                $ac = $a['cost_per_km'];
                $bc = $b['cost_per_km'];
                if ($ac === null && $bc === null) return 0;
                if ($ac === null) return 1;
                if ($bc === null) return -1;
                return $bc <=> $ac;
            });

            return Inertia::render('Reports/FuelEfficiency', [
                'filters' => [
                    'from' => $from,
                    'to' => $to,
                    'truck_id' => $truckId,
                ],
                'totals' => [
                    'totalFuelLiters' => round($totals['totalFuelLiters'], 2),
                    'totalFuelCost' => round($totals['totalFuelCost'], 2),
                    'totalDistanceKm' => round($totals['totalDistanceKm'], 2),
                ],
                'summary' => $summary,
                'breakdown' => $breakdown,
            ]);

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate fuel efficiency report.']);
        }
    }

    /**
     * Display customer profitability report (revenue, cost, margin per customer; lanes; trend).
     */
    public function customerProfitability(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(6)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $performances = Performance::with(['operation.customer', 'origin', 'destination'])
                ->whereBetween('DateDispach', [$from, $to])
                ->get();

            $byCustomer = [];
            $trend = [];

            foreach ($performances as $p) {
                $customer = $p->operation?->customer;
                if (!$customer) {
                    continue;
                }
                $cid = $customer->id;
                // Approximate revenue: operation tariff per ton times cargo volume (if provided)
                $revenue = (float)($p->operation?->tariff ?? 0) * (float)($p->CargoVolumMT ?? 1);
                $cost = (float)($p->fuelInBirr ?? 0) + (float)($p->perdiem ?? 0) + (float)($p->other ?? 0);
                $profit = $revenue - $cost;
                $laneKey = ($p->orgion_id ?? 'N') . '-' . ($p->destination_id ?? 'N');

                if (!isset($byCustomer[$cid])) {
                    $byCustomer[$cid] = [
                        'customer_id' => $cid,
                        'customer_name' => $customer->name,
                        'revenue' => 0.0,
                        'cost' => 0.0,
                        'profit' => 0.0,
                        'lanes' => [],
                        'trips' => 0,
                        'tonnage' => 0.0,
                    ];
                }
                $byCustomer[$cid]['revenue'] += $revenue;
                $byCustomer[$cid]['cost'] += $cost;
                $byCustomer[$cid]['profit'] += $profit;
                $byCustomer[$cid]['trips'] += 1;
                $byCustomer[$cid]['tonnage'] += (float)($p->CargoVolumMT ?? 0);
                $byCustomer[$cid]['lanes'][$laneKey] = true;

                // Trend (YYYY-MM)
                $ym = $p->DateDispach?->format('Y-m');
                if ($ym) {
                    if (!isset($trend[$ym])) {
                        $trend[$ym] = ['revenue' => 0.0, 'profit' => 0.0];
                    }
                    $trend[$ym]['revenue'] += $revenue;
                    $trend[$ym]['profit'] += $profit;
                }
            }

            $customers = [];
            foreach ($byCustomer as $c) {
                $margin = $c['revenue'] > 0 ? round(($c['profit'] / $c['revenue']) * 100, 2) : null;
                $customers[] = [
                    'customer_id' => $c['customer_id'],
                    'customer_name' => $c['customer_name'],
                    'revenue' => round($c['revenue'], 2),
                    'cost' => round($c['cost'], 2),
                    'profit' => round($c['profit'], 2),
                    'margin_percent' => $margin,
                    'lanes_used' => count($c['lanes']),
                    'trips' => $c['trips'],
                    'tonnage' => round($c['tonnage'], 2),
                ];
            }

            // Sort by highest revenue
            usort($customers, fn($a, $b) => $b['revenue'] <=> $a['revenue']);

            // Trend sorted by month desc
            krsort($trend);
            $trendArr = [];
            foreach ($trend as $ym => $vals) {
                $trendArr[] = ['month' => $ym, 'revenue' => round($vals['revenue'], 2), 'profit' => round($vals['profit'], 2)];
            }

            $totals = [
                'revenue' => array_sum(array_column($customers, 'revenue')),
                'cost' => array_sum(array_column($customers, 'cost')),
                'profit' => array_sum(array_column($customers, 'profit')),
            ];

            return Inertia::render('Reports/CustomerProfitability', [
                'filters' => ['from' => $from, 'to' => $to],
                'totals' => $totals,
                'customers' => $customers,
                'trend' => $trendArr,
            ]);

        } catch (Exception $e) {
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
                if (!$fromId || !$toId) continue;
                $key = $fromId . '-' . $toId;
                if (!isset($lanes[$key])) {
                    // Try to get planned baseline from Distance
                    $dist = Distance::where('from_place_id', $fromId)->where('to_place_id', $toId)->first();
                    $lanes[$key] = [
                        'from_id' => $fromId,
                        'to_id' => $toId,
                        'from_name' => $p->origin?->name ?? (string)$fromId,
                        'to_name' => $p->destination?->name ?? (string)$toId,
                        'planned_km' => $dist?->distance_km ? (float)$dist->distance_km : null,
                        'actual_km_total' => 0.0,
                        'cost_total' => 0.0,
                        'trips' => 0,
                    ];
                }
                $actualKm = (float)($p->DistanceWCargo ?? 0) + (float)($p->DistanceWOCargo ?? 0);
                $cost = (float)($p->fuelInBirr ?? 0) + (float)($p->perdiem ?? 0) + (float)($p->other ?? 0);
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
                if ($ad === null && $bd === null) return 0;
                if ($ad === null) return 1;
                if ($bd === null) return -1;
                return $bd <=> $ad;
            });

            $totals = [
                'lanes' => count($laneRows),
                'trips' => array_sum(array_column($laneRows, 'trips')),
                'avg_cost_per_km' => null,
            ];
            // Compute overall avg cost per km weighted by km if possible
            $sumCost = 0.0; $sumKm = 0.0;
            foreach ($lanes as $l) { $sumCost += $l['cost_total']; $sumKm += $l['actual_km_total']; }
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
    public function outsourcePerformanceReport(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(6)->toDateString());
            $to = $request->input('to', now()->toDateString());

            $ops = OutsourcePerformance::with('outsource')
                ->whereBetween('dispatch_date', [$from, $to])
                ->get();

            // Internal baseline cost per km from Performance
            $perfs = Performance::whereBetween('DateDispach', [$from, $to])->get();
            $internalCost = $perfs->sum(fn($p) => (float)($p->fuelInBirr ?? 0) + (float)($p->perdiem ?? 0) + (float)($p->other ?? 0));
            $internalKm = $perfs->sum(fn($p) => (float)($p->DistanceWCargo ?? 0) + (float)($p->DistanceWOCargo ?? 0));
            $internalCostPerKm = $internalKm > 0 ? $internalCost / $internalKm : null;

            $vendors = [];
            foreach ($ops as $op) {
                $vid = $op->outsource_id;
                if (!isset($vendors[$vid])) {
                    $vendors[$vid] = [
                        'outsource_id' => $vid,
                        'name' => $op->outsource?->name ?? ('Vendor #' . $vid),
                        'trips' => 0,
                        'distance_km' => 0.0,
                        'cost' => 0.0,
                        'completed' => 0,
                    ];
                }
                $vendors[$vid]['trips'] += 1;
                $vendors[$vid]['distance_km'] += (float)($op->distance_km ?? 0);
                $vendors[$vid]['cost'] += (float)($op->cost ?? 0);
                if ($op->status === 'completed') {
                    $vendors[$vid]['completed'] += 1;
                }
            }

            $rows = [];
            foreach ($vendors as $v) {
                $costPerKm = $v['distance_km'] > 0 ? $v['cost'] / $v['distance_km'] : null;
                $onTimePct = null; // Not available without timestamps; using completed rate as proxy
                $completedRate = $v['trips'] > 0 ? round(($v['completed'] / $v['trips']) * 100, 2) : null;
                $deltaVsInternal = ($internalCostPerKm !== null && $costPerKm !== null)
                    ? round($costPerKm - $internalCostPerKm, 2)
                    : null;
                $rows[] = [
                    'outsource_id' => $v['outsource_id'],
                    'name' => $v['name'],
                    'trips' => $v['trips'],
                    'distance_km' => round($v['distance_km'], 2),
                    'cost' => round($v['cost'], 2),
                    'cost_per_km' => $costPerKm !== null ? round($costPerKm, 2) : null,
                    'completed_rate_pct' => $completedRate,
                    'delta_vs_internal_cost_per_km' => $deltaVsInternal,
                ];
            }

            // Sort most expensive vs internal first
            usort($rows, function ($a, $b) {
                $ad = $a['delta_vs_internal_cost_per_km'];
                $bd = $b['delta_vs_internal_cost_per_km'];
                if ($ad === null && $bd === null) return 0;
                if ($ad === null) return 1;
                if ($bd === null) return -1;
                return $bd <=> $ad;
            });

            return Inertia::render('Reports/OutsourcePerformance', [
                'filters' => ['from' => $from, 'to' => $to],
                'internal' => [
                    'costPerKm' => $internalCostPerKm ? round($internalCostPerKm, 2) : null,
                ],
                'vendors' => $rows,
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
                if (!$op) continue;
                $opId = $op->id;
                if (!isset($ops[$opId])) {
                    $ops[$opId] = [
                        'operation_id' => $opId,
                        'code' => (string)($op->id),
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
                $revenue = (float)($op->tariff ?? 0) * (float)($p->CargoVolumMT ?? 1);
                $cost = (float)($p->fuelInBirr ?? 0) + (float)($p->perdiem ?? 0) + (float)($p->other ?? 0);
                $km = (float)($p->DistanceWCargo ?? 0) + (float)($p->DistanceWOCargo ?? 0);
                $ops[$opId]['revenue'] += $revenue;
                $ops[$opId]['cost'] += $cost;
                $ops[$opId]['profit'] += ($revenue - $cost);
                $ops[$opId]['trips'] += 1;
                $ops[$opId]['tonnage'] += (float)($p->CargoVolumMT ?? 0);
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
            usort($rows, fn($a, $b) => $b['profit'] <=> $a['profit']);

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
            $capacityTons = (float)$request->input('capacity_tons', 20); // default 20 MT per trip

            $perfs = Performance::with(['operation.customer', 'origin', 'destination'])
                ->whereBetween('DateDispach', [$from, $to])
                ->get();

            $totalTrips = $perfs->count();
            $totalTonnage = (float)$perfs->sum(fn($p) => (float)($p->CargoVolumMT ?? 0));
            $emptyRuns = $perfs->filter(fn($p) => (float)($p->CargoVolumMT ?? 0) <= 0 && (float)($p->DistanceWOCargo ?? 0) > 0)->count();
            $estCapacity = $capacityTons * max(1, $totalTrips);
            $avgLoadFactor = $estCapacity > 0 ? round(($totalTonnage / $estCapacity) * 100, 2) : null;

            // By lane (origin->destination)
            $lanes = [];
            foreach ($perfs as $p) {
                $fromId = $p->orgion_id;
                $toId = $p->destination_id;
                $key = ($fromId ?? 'N') . '-' . ($toId ?? 'N');
                if (!isset($lanes[$key])) {
                    $lanes[$key] = [
                        'from_name' => $p->origin?->name ?? (string)$fromId,
                        'to_name' => $p->destination?->name ?? (string)$toId,
                        'trips' => 0,
                        'tonnage' => 0.0,
                        'empty_runs' => 0,
                        'load_factor_pct' => null,
                    ];
                }
                $lanes[$key]['trips'] += 1;
                $lanes[$key]['tonnage'] += (float)($p->CargoVolumMT ?? 0);
                if ((float)($p->CargoVolumMT ?? 0) <= 0 && (float)($p->DistanceWOCargo ?? 0) > 0) {
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
                if (!$cust) continue;
                $cid = $cust->id;
                if (!isset($customers[$cid])) {
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
                $customers[$cid]['tonnage'] += (float)($p->CargoVolumMT ?? 0);
                if ((float)($p->CargoVolumMT ?? 0) <= 0 && (float)($p->DistanceWOCargo ?? 0) > 0) {
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
                $al = $a['load_factor_pct']; $bl = $b['load_factor_pct'];
                if ($al === null && $bl === null) return 0;
                if ($al === null) return 1;
                if ($bl === null) return -1;
                return $al <=> $bl; // ascending (worst first)
            });
            // Sort customers by worst load factor
            usort($customerRows, function ($a, $b) {
                $al = $a['load_factor_pct']; $bl = $b['load_factor_pct'];
                if ($al === null && $bl === null) return 0;
                if ($al === null) return 1;
                if ($bl === null) return -1;
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
                $tonnage = (float)($p->CargoVolumMT ?? 0);
                $revenue = (float)($p->operation?->tariff ?? 0) * ($tonnage > 0 ? $tonnage : 1);

                // Region
                if (!isset($byRegion[$regionName])) {
                    $byRegion[$regionName] = ['name' => $regionName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byRegion[$regionName]['trips'] += 1;
                $byRegion[$regionName]['tonnage'] += $tonnage;
                $byRegion[$regionName]['revenue'] += $revenue;

                // Zone
                if (!isset($byZone[$zoneName])) {
                    $byZone[$zoneName] = ['name' => $zoneName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byZone[$zoneName]['trips'] += 1;
                $byZone[$zoneName]['tonnage'] += $tonnage;
                $byZone[$zoneName]['revenue'] += $revenue;

                // Woreda
                if (!isset($byWoreda[$woredaName])) {
                    $byWoreda[$woredaName] = ['name' => $woredaName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byWoreda[$woredaName]['trips'] += 1;
                $byWoreda[$woredaName]['tonnage'] += $tonnage;
                $byWoreda[$woredaName]['revenue'] += $revenue;

                // Place
                if (!isset($byPlace[$placeName])) {
                    $byPlace[$placeName] = ['name' => $placeName, 'trips' => 0, 'tonnage' => 0.0, 'revenue' => 0.0];
                }
                $byPlace[$placeName]['trips'] += 1;
                $byPlace[$placeName]['tonnage'] += $tonnage;
                $byPlace[$placeName]['revenue'] += $revenue;
            }

            // Convert to arrays and sort by revenue desc
            $regions = array_values($byRegion);
            usort($regions, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
            $zones = array_values($byZone);
            usort($zones, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
            $woredas = array_values($byWoreda);
            usort($woredas, fn($a, $b) => $b['revenue'] <=> $a['revenue']);
            $places = array_values($byPlace);
            usort($places, fn($a, $b) => $b['revenue'] <=> $a['revenue']);

            // Trend by month at region level
            $trend = [];
            foreach ($perfs as $p) {
                $ym = $p->DateDispach?->format('Y-m');
                if (!$ym) continue;
                $regionName = $p->origin?->woreda?->zone?->region?->name ?? 'Unknown';
                $revenue = (float)($p->operation?->tariff ?? 0) * ((float)($p->CargoVolumMT ?? 0) > 0 ? (float)$p->CargoVolumMT : 1);
                if (!isset($trend[$regionName])) { $trend[$regionName] = []; }
                if (!isset($trend[$regionName][$ym])) { $trend[$regionName][$ym] = 0.0; }
                $trend[$regionName][$ym] += $revenue;
            }
            $regionTrends = [];
            foreach ($trend as $region => $months) {
                krsort($months);
                $series = [];
                foreach ($months as $ym => $val) { $series[] = ['month' => $ym, 'revenue' => round($val, 2)]; }
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
            $limit = (int)$request->input('limit', 200);
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

    /**
     * Legacy-style: performance aggregated by driver with date filters.
     */
    public function performanceByDriver(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(1)->toDateString());
            $to = $request->input('to', now()->toDateString());
            $driverId = $request->input('driver_id');

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

            if ($driverId) {
                $query->where('driver_truck.driver_id', $driverId);
            }

            $rows = $query->orderByDesc('trips')->get();

            $mapped = collect($rows)->map(function ($r) {
                $cost = (float)$r->fuel_cost + (float)$r->perdiem + (float)$r->other_cost;
                $profit = (float)$r->revenue - $cost;
                $margin = ((float)$r->revenue) > 0 ? round(($profit / (float)$r->revenue) * 100, 2) : null;
                return [
                    'driver_id' => $r->driver_id,
                    'driver_name' => $r->driver_name,
                    'trips' => (int)$r->trips,
                    'tonnage' => (float)$r->tonnage,
                    'distance_km' => (float)$r->distance_wcargo + (float)$r->distance_wocargo,
                    'revenue' => (float)$r->revenue,
                    'cost' => $cost,
                    'profit' => $profit,
                    'margin_percent' => $margin,
                ];
            })->toArray();

            return Inertia::render('Reports/PerformanceByDriver', [
                'filters' => ['from' => $from, 'to' => $to, 'driver_id' => $driverId],
                'rows' => $mapped,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate driver performance report.']);
        }
    }

    /**
     * Legacy-style: performance aggregated by truck with date filters.
     */
    public function performanceByTruck(Request $request): Response|RedirectResponse
    {
        try {
            $from = $request->input('from', now()->subMonths(1)->toDateString());
            $to = $request->input('to', now()->toDateString());
            $truckId = $request->input('truck_id');

            $query = DB::table('performances')
                ->select(
                    'driver_truck.truck_id as truck_id',
                    DB::raw('MAX(trucks.plate) as plate'),
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
                ->leftJoin('trucks', 'trucks.id', '=', 'driver_truck.truck_id')
                ->leftJoin('operations', 'operations.id', '=', 'performances.operation_id')
                ->whereBetween('performances.DateDispach', [$from, $to])
                ->groupBy('driver_truck.truck_id');

            if ($truckId) {
                $query->where('driver_truck.truck_id', $truckId);
            }

            $rows = $query->orderByDesc('trips')->get();

            $mapped = collect($rows)->map(function ($r) {
                $cost = (float)$r->fuel_cost + (float)$r->perdiem + (float)$r->other_cost;
                $profit = (float)$r->revenue - $cost;
                $margin = ((float)$r->revenue) > 0 ? round(($profit / (float)$r->revenue) * 100, 2) : null;
                return [
                    'truck_id' => $r->truck_id,
                    'plate' => $r->plate,
                    'trips' => (int)$r->trips,
                    'tonnage' => (float)$r->tonnage,
                    'distance_km' => (float)$r->distance_wcargo + (float)$r->distance_wocargo,
                    'revenue' => (float)$r->revenue,
                    'cost' => $cost,
                    'profit' => $profit,
                    'margin_percent' => $margin,
                ];
            })->toArray();

            return Inertia::render('Reports/PerformanceByTruck', [
                'filters' => ['from' => $from, 'to' => $to, 'truck_id' => $truckId],
                'rows' => $mapped,
            ]);
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate truck performance report.']);
        }
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




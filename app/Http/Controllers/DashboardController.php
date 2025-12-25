<?php

namespace App\Http\Controllers;

use App\Models\DailyTruckStatus;
use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Models\InsuranceRecord;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Truck;
use App\Models\TruckFinancialRecord;
use App\Models\VehicleMaintenanceRecord;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    /**
     * Display the dashboard.
     */
    public function index(): Response
    {
        $today = now();
        $start30 = $today->copy()->subDays(29)->startOfDay();
        $previousStart30 = $start30->copy()->subDays(30)->startOfDay();
        $previousEnd30 = $start30->copy()->subDay()->endOfDay();
        $start90 = $today->copy()->subDays(89)->startOfDay();
        $previousStart90 = $start90->copy()->subDays(90)->startOfDay();
        $previousEnd90 = $start90->copy()->subDay()->endOfDay();
        $start180 = $today->copy()->subMonths(5)->startOfMonth();

        $percentChange = static function (?float $current, ?float $previous): ?float {
            if ($current === null || $previous === null || abs($previous) < 0.0001) {
                return null;
            }

            return round((($current - $previous) / abs($previous)) * 100, 1);
        };

        // Cache basic counts for 5 minutes - they change frequently but don't need real-time accuracy
        $totalTrucks = Cache::remember('dashboard.total_trucks', 300, fn () => Truck::count());
        $activeTrucks = Cache::remember('dashboard.active_trucks', 300, fn () => Truck::where('status', 'active')->count());
        $totalDrivers = Cache::remember('dashboard.total_drivers', 300, fn () => Driver::count());
        $activeDrivers = Cache::remember('dashboard.active_drivers', 300, fn () => Driver::where('status', 'active')->count());
        $totalOperations = Cache::remember('dashboard.total_operations', 300, fn () => Operation::count());
        $openOperations = Cache::remember('dashboard.open_operations', 300, fn () => Operation::where('closed', false)->count());

        $dailyPerformance = Performance::selectRaw('DATE(DateDispach) as date')
            ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as tonnage')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(tonkm, 0)) as tonkm')
            ->whereBetween('DateDispach', [$start30, $today])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $dailyPerformancePrev = Performance::selectRaw('DATE(DateDispach) as date')
            ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as tonnage')
            ->selectRaw('COUNT(*) as trips')
            ->whereBetween('DateDispach', [$previousStart30, $previousEnd30])
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $tonnageLast30 = (float) $dailyPerformance->sum('tonnage');
        $tonnagePrev30 = (float) $dailyPerformancePrev->sum('tonnage');
        $avgDailyTonnage = $dailyPerformance->isNotEmpty() ? $tonnageLast30 / $dailyPerformance->count() : 0.0;
        $avgDailyPrev = $dailyPerformancePrev->isNotEmpty() ? $tonnagePrev30 / $dailyPerformancePrev->count() : null;

        $totalTripsLast30 = Performance::whereBetween('DateDispach', [$start30, $today])->count();
        $totalTripsPrev30 = Performance::whereBetween('DateDispach', [$previousStart30, $previousEnd30])->count();
        $returnedTripsLast30 = Performance::whereBetween('DateDispach', [$start30, $today])->where('is_returned', true)->count();
        $returnedTripsPrev30 = Performance::whereBetween('DateDispach', [$previousStart30, $previousEnd30])->where('is_returned', true)->count();
        $returnRateLast30 = $totalTripsLast30 > 0 ? ($returnedTripsLast30 / $totalTripsLast30) * 100 : null;
        $returnRatePrev30 = $totalTripsPrev30 > 0 ? ($returnedTripsPrev30 / $totalTripsPrev30) * 100 : null;
        $avgLoadPerTripLast30 = $totalTripsLast30 > 0 ? $tonnageLast30 / $totalTripsLast30 : null;
        $avgLoadPerTripPrev30 = $totalTripsPrev30 > 0 ? $tonnagePrev30 / $totalTripsPrev30 : null;

        $avgCycleLast30 = Performance::whereBetween('DateDispach', [$start30, $today])
            ->whereNotNull('returned_date')
            ->selectRaw('AVG(DATEDIFF(returned_date, DateDispach)) as avg_cycle')
            ->value('avg_cycle');
        $avgCyclePrev30 = Performance::whereBetween('DateDispach', [$previousStart30, $previousEnd30])
            ->whereNotNull('returned_date')
            ->selectRaw('AVG(DATEDIFF(returned_date, DateDispach)) as avg_cycle')
            ->value('avg_cycle');

        $avgCycleLast30 = $avgCycleLast30 !== null ? round((float) $avgCycleLast30, 1) : null;
        $avgCyclePrev30 = $avgCyclePrev30 !== null ? round((float) $avgCyclePrev30, 1) : null;

        $trucksUtilizedLast30 = Performance::whereBetween('DateDispach', [$start30, $today])
            ->whereNotNull('driver_truck_id')
            ->distinct('driver_truck_id')
            ->count('driver_truck_id');

        $fleetAvailability = $totalTrucks > 0 ? ($activeTrucks / $totalTrucks) * 100 : 0.0;
        $fleetUtilisation = $totalTrucks > 0 ? ($trucksUtilizedLast30 / $totalTrucks) * 100 : 0.0;
        $driverAvailability = $totalDrivers > 0 ? ($activeDrivers / $totalDrivers) * 100 : 0.0;

        $statusReferenceDate = $today->copy()->endOfDay();
        $statusRows = Performance::query()
            ->whereBetween('DateDispach', [$start30, $today])
            ->select(['id', 'satus', 'is_returned', 'DateDispach', 'load_phase'])
            ->get();

        $statusCounts = $statusRows
            ->map(fn (Performance $performance) => $this->determineNetworkStatusBucket($performance, $statusReferenceDate))
            ->filter()
            ->countBy();

        $statusDefinitions = [
            'completed' => ['label' => 'Completed', 'color' => '#10b981'],
            'in_transit' => ['label' => 'In transit (≤7d)', 'color' => '#6366f1'],
            'awaiting_return' => ['label' => 'Awaiting return (8-14d)', 'color' => '#f59e0b'],
            'overdue' => ['label' => 'Overdue (>14d)', 'color' => '#ef4444'],
            'pending' => ['label' => 'Pending dispatch', 'color' => '#0ea5e9'],
            'cancelled' => ['label' => 'Cancelled', 'color' => '#6b7280'],
            'failed' => ['label' => 'Failed', 'color' => '#db2777'],
            'unknown' => ['label' => 'Unknown', 'color' => '#94a3b8'],
        ];

        $totalStatusCount = (int) $statusCounts->sum();

        $statusBreakdownData = collect($statusDefinitions)
            ->map(function (array $definition, string $bucket) use ($statusCounts, $totalStatusCount) {
                $count = (int) ($statusCounts->get($bucket) ?? 0);

                return [
                    'status' => $bucket,
                    'label' => $definition['label'],
                    'color' => $definition['color'],
                    'count' => $count,
                    'share' => $totalStatusCount > 0 ? round(($count / $totalStatusCount) * 100, 1) : 0.0,
                ];
            })
            ->filter(fn (array $entry) => $entry['count'] > 0)
            ->sortByDesc('count')
            ->values()
            ->all();

        $loadPhaseDefinitions = [
            'main' => ['label' => 'Main load trips', 'color' => '#4338ca'],
            'return' => ['label' => 'Return load trips', 'color' => '#0ea5e9'],
            'unspecified' => ['label' => 'Unspecified phase', 'color' => '#94a3b8'],
        ];

        $phaseCounts = $statusRows
            ->map(static function (Performance $performance) {
                $phase = Str::of((string) ($performance->load_phase ?? ''))->trim()->lower()->value();

                return in_array($phase, ['main', 'return'], true) ? $phase : 'unspecified';
            })
            ->countBy();

        $totalPhaseCount = (int) $phaseCounts->sum();

        $loadPhaseBreakdown = collect($loadPhaseDefinitions)
            ->map(function (array $definition, string $key) use ($phaseCounts, $totalPhaseCount) {
                $count = (int) ($phaseCounts->get($key) ?? 0);

                return [
                    'phase' => $key,
                    'label' => $definition['label'],
                    'color' => $definition['color'],
                    'count' => $count,
                    'share' => $totalPhaseCount > 0 ? round(($count / $totalPhaseCount) * 100, 1) : 0.0,
                ];
            })
            ->filter(fn (array $entry) => $entry['count'] > 0)
            ->sortByDesc('count')
            ->values()
            ->all();

        $corridorVolumes = Performance::query()
            ->leftJoin('places as origins', 'performances.orgion_id', '=', 'origins.id')
            ->leftJoin('places as destinations', 'performances.destination_id', '=', 'destinations.id')
            ->whereBetween('performances.DateDispach', [$start30, $today])
            ->groupBy('origins.name', 'destinations.name')
            ->selectRaw('COALESCE(origins.name, "Unknown") as origin')
            ->selectRaw('COALESCE(destinations.name, "Unknown") as destination')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0)) as tonnage')
            ->orderByDesc('tonnage')
            ->limit(8)
            ->get();

        $topCustomers = Performance::query()
            ->join('operations', 'performances.operation_id', '=', 'operations.id')
            ->join('customers', 'operations.customer_id', '=', 'customers.id')
            ->whereBetween('performances.DateDispach', [$start90, $today])
            ->groupBy('customers.name')
            ->selectRaw('customers.name as customer')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(performances.CargoVolumMT, 0)) as tonnage')
            ->orderByDesc('tonnage')
            ->limit(10)
            ->get();

        $revenueLast30 = Performance::query()
            ->leftJoin('operations', 'performances.operation_id', '=', 'operations.id')
            ->whereBetween('performances.DateDispach', [$start30, $today])
            ->selectRaw('SUM(COALESCE(performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
            ->value('revenue') ?? 0.0;

        $revenuePrev30 = Performance::query()
            ->leftJoin('operations', 'performances.operation_id', '=', 'operations.id')
            ->whereBetween('performances.DateDispach', [$previousStart30, $previousEnd30])
            ->selectRaw('SUM(COALESCE(performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
            ->value('revenue') ?? 0.0;

        $operatingCostLast30 = Performance::whereBetween('DateDispach', [$start30, $today])
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(workOnGoing, 0) + COALESCE(other, 0)) as total_cost')
            ->value('total_cost') ?? 0.0;

        $operatingCostPrev30 = Performance::whereBetween('DateDispach', [$previousStart30, $previousEnd30])
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(workOnGoing, 0) + COALESCE(other, 0)) as total_cost')
            ->value('total_cost') ?? 0.0;

        $marginLast30 = $revenueLast30 - $operatingCostLast30;
        $marginPrev30 = $revenuePrev30 - $operatingCostPrev30;
        $avgRevenuePerTon = $tonnageLast30 > 0 ? $revenueLast30 / $tonnageLast30 : null;
        $avgCostPerTon = $tonnageLast30 > 0 ? $operatingCostLast30 / $tonnageLast30 : null;
        $fareboxRecovery = $operatingCostLast30 > 0 ? ($revenueLast30 / $operatingCostLast30) * 100 : null;
        $fareboxRecoveryPrev = $operatingCostPrev30 > 0 ? ($revenuePrev30 / $operatingCostPrev30) * 100 : null;

        $financialTrend = TruckFinancialRecord::query()
            ->where('record_date', '>=', $start180)
            ->selectRaw("DATE_FORMAT(record_date, '%Y-%m') as period")
            ->selectRaw('SUM(COALESCE(revenue, 0)) as revenue')
            ->selectRaw('SUM(COALESCE(fuel_cost, 0) + COALESCE(maintenance_cost, 0) + COALESCE(driver_salary, 0) + COALESCE(insurance_cost, 0) + COALESCE(depreciation, 0) + COALESCE(other_costs, 0)) as cost')
            ->selectRaw('SUM(COALESCE(net_profit, 0)) as net')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'revenue' => (float) $row->revenue,
                'cost' => (float) $row->cost,
                'net' => (float) $row->net,
            ])
            ->values()
            ->all();

        if (empty($financialTrend)) {
            $financialTrend = Performance::query()
                ->leftJoin('operations', 'performances.operation_id', '=', 'operations.id')
                ->whereBetween('performances.DateDispach', [$start180, $today])
                ->selectRaw("DATE_FORMAT(performances.DateDispach, '%Y-%m') as period")
                ->selectRaw('SUM(COALESCE(performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
                ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0) + COALESCE(performances.perdiem, 0) + COALESCE(performances.workOnGoing, 0) + COALESCE(performances.other, 0)) as cost')
                ->groupBy('period')
                ->orderBy('period')
                ->get()
                ->map(fn ($row) => [
                    'period' => $row->period,
                    'revenue' => (float) $row->revenue,
                    'cost' => (float) $row->cost,
                    'net' => (float) $row->revenue - (float) $row->cost,
                ])
                ->values()
                ->all();
        }

        $financialTrend = collect($financialTrend)
            ->mapWithKeys(fn ($row) => [
                $row['period'] => [
                    'revenue' => (float) ($row['revenue'] ?? 0.0),
                    'cost' => (float) ($row['cost'] ?? 0.0),
                    'net' => (float) ($row['net'] ?? (($row['revenue'] ?? 0.0) - ($row['cost'] ?? 0.0))),
                ],
            ]);

        $financialTrend = collect(range(0, 5))
            ->map(fn ($index) => $today->copy()->subMonths(5 - $index)->format('Y-m'))
            ->map(function (string $period) use ($financialTrend) {
                $entry = $financialTrend->get($period, ['revenue' => 0.0, 'cost' => 0.0, 'net' => 0.0]);

                $revenue = (float) ($entry['revenue'] ?? 0.0);
                $cost = (float) ($entry['cost'] ?? 0.0);
                $net = (float) ($entry['net'] ?? ($revenue - $cost));

                return [
                    'period' => $period,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'net' => $net,
                ];
            })
            ->values()
            ->all();

        $costBreakdownRow = TruckFinancialRecord::query()
            ->where('record_date', '>=', $start30)
            ->selectRaw('SUM(COALESCE(fuel_cost, 0)) as fuel')
            ->selectRaw('SUM(COALESCE(maintenance_cost, 0)) as maintenance')
            ->selectRaw('SUM(COALESCE(driver_salary, 0)) as drivers')
            ->selectRaw('SUM(COALESCE(insurance_cost, 0)) as insurance')
            ->selectRaw('SUM(COALESCE(depreciation, 0)) as depreciation')
            ->selectRaw('SUM(COALESCE(other_costs, 0)) as other')
            ->first();

        $costBreakdownCollection = collect([
            'Fuel' => (float) ($costBreakdownRow?->fuel ?? 0.0),
            'Maintenance' => (float) ($costBreakdownRow?->maintenance ?? 0.0),
            'Drivers' => (float) ($costBreakdownRow?->drivers ?? 0.0),
            'Insurance' => (float) ($costBreakdownRow?->insurance ?? 0.0),
            'Depreciation' => (float) ($costBreakdownRow?->depreciation ?? 0.0),
            'Other' => (float) ($costBreakdownRow?->other ?? 0.0),
        ])->filter(fn (float $value): bool => $value > 0.01);

        if ($costBreakdownCollection->isEmpty()) {
            $performanceCostRow = Performance::query()
                ->whereBetween('DateDispach', [$start30, $today])
                ->selectRaw('SUM(COALESCE(fuelInBirr, 0)) as fuel')
                ->selectRaw('SUM(COALESCE(perdiem, 0)) as drivers')
                ->selectRaw('SUM(COALESCE(workOnGoing, 0)) as maintenance')
                ->selectRaw('SUM(COALESCE(other, 0)) as other')
                ->first();

            $insuranceCostLast30 = $this->calculateInsuranceCostForWindow($start30->copy(), $today->copy());

            $costBreakdownCollection = collect([
                'Fuel' => (float) ($performanceCostRow?->fuel ?? 0.0),
                'Maintenance' => (float) ($performanceCostRow?->maintenance ?? 0.0),
                'Drivers' => (float) ($performanceCostRow?->drivers ?? 0.0),
                'Insurance' => $insuranceCostLast30,
                'Depreciation' => 0.0,
                'Other' => (float) ($performanceCostRow?->other ?? 0.0),
            ])->filter(fn (float $value): bool => $value > 0.01);
        }

        $costBreakdown = $costBreakdownCollection
            ->sortDesc()
            ->map(fn (float $value, string $label): array => [
                'label' => $label,
                'value' => round($value, 2),
            ])
            ->values()
            ->all();

        $fuelSummaryRow = Performance::query()
            ->whereBetween('DateDispach', [$start30, $today])
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(fuelInLitter, 0)) as total_volume')
            ->first();

        $fuelTotalCost30 = (float) ($fuelSummaryRow->total_cost ?? 0.0);
        $fuelVolume30 = (float) ($fuelSummaryRow->total_volume ?? 0.0);
        $avgFuelPrice30 = $fuelVolume30 > 0 ? $fuelTotalCost30 / $fuelVolume30 : null;

        $fuelTrendByPeriod = Performance::query()
            ->whereBetween('DateDispach', [$start180, $today])
            ->selectRaw("DATE_FORMAT(DateDispach, '%Y-%m') as period")
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(fuelInLitter, 0)) as total_volume')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->mapWithKeys(fn ($row) => [
                $row->period => [
                    'cost' => (float) $row->total_cost,
                    'volume' => (float) $row->total_volume,
                ],
            ]);

        $fuelTrend = collect(range(0, 5))
            ->map(fn ($index) => $today->copy()->subMonths(5 - $index)->format('Y-m'))
            ->map(function (string $period) use ($fuelTrendByPeriod) {
                $entry = $fuelTrendByPeriod->get($period, ['cost' => 0.0, 'volume' => 0.0]);

                return [
                    'period' => $period,
                    'cost' => (float) ($entry['cost'] ?? 0.0),
                    'volume' => (float) ($entry['volume'] ?? 0.0),
                ];
            })
            ->values()
            ->all();

        $maintenanceScheduled = VehicleMaintenanceRecord::scheduled()->count();
        $maintenanceOverdue = VehicleMaintenanceRecord::overdue()->count();
        $maintenanceCompleted30 = VehicleMaintenanceRecord::completed()
            ->whereBetween('completed_date', [$start30, $today])
            ->count();
        $maintenanceAvgTurnaround = VehicleMaintenanceRecord::completed()
            ->whereBetween('completed_date', [$start90, $today])
            ->whereNotNull('scheduled_date')
            ->selectRaw('AVG(DATEDIFF(completed_date, scheduled_date)) as avg_turnaround')
            ->value('avg_turnaround');
        $maintenanceAvgTurnaround = $maintenanceAvgTurnaround !== null ? round((float) $maintenanceAvgTurnaround, 1) : null;

        $maintenanceTrend = VehicleMaintenanceRecord::query()
            ->where('scheduled_date', '>=', $start180)
            ->selectRaw("DATE_FORMAT(scheduled_date, '%Y-%m') as period")
            ->selectRaw('SUM(CASE WHEN status = "completed" THEN 1 ELSE 0 END) as completed')
            ->selectRaw('SUM(CASE WHEN status = "scheduled" THEN 1 ELSE 0 END) as scheduled')
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'completed' => (int) $row->completed,
                'scheduled' => (int) $row->scheduled,
            ])
            ->values()
            ->all();

        $upcomingMaintenance = VehicleMaintenanceRecord::scheduled()
            ->with('truck:id,plate')
            ->whereNotNull('scheduled_date')
            ->orderBy('scheduled_date')
            ->limit(5)
            ->get()
            ->map(fn ($record) => [
                'id' => $record->id,
                'truck' => $record->truck?->plate ?? 'Unassigned',
                'scheduledDate' => optional($record->scheduled_date)?->toDateString(),
                'daysUntil' => $record->days_until_scheduled,
                'status' => $record->status,
            ])
            ->values()
            ->all();

        $incidentCount90 = DriverSafetyRecord::where('incident_date', '>=', $start90)->count();
        $incidentPrev90 = DriverSafetyRecord::whereBetween('incident_date', [$previousStart90, $previousEnd90])->count();

        $incidentTrend = DriverSafetyRecord::query()
            ->where('incident_date', '>=', $start180)
            ->selectRaw("DATE_FORMAT(incident_date, '%Y-%m') as period, COUNT(*) as total")
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        $severityMix = DriverSafetyRecord::query()
            ->where('incident_date', '>=', $start90)
            ->selectRaw('LOWER(COALESCE(severity, "unknown")) as severity, COUNT(*) as count')
            ->groupBy('severity')
            ->orderByDesc('count')
            ->get()
            ->map(fn ($row) => [
                'severity' => $row->severity,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $topIncidentTypes = DriverSafetyRecord::query()
            ->where('incident_date', '>=', $start90)
            ->selectRaw('LOWER(COALESCE(incident_type, "unspecified")) as type, COUNT(*) as count')
            ->groupBy('type')
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'type' => $row->type,
                'count' => (int) $row->count,
            ])
            ->values()
            ->all();

        $tripsLast90 = Performance::whereBetween('DateDispach', [$start90, $today])->count();
        $tripsPrev90 = Performance::whereBetween('DateDispach', [$previousStart90, $previousEnd90])->count();
        $incidentRatePer100Trips = $tripsLast90 > 0 ? round(($incidentCount90 / $tripsLast90) * 100, 2) : null;
        $incidentRatePrev100Trips = $tripsPrev90 > 0 ? round(($incidentPrev90 / $tripsPrev90) * 100, 2) : null;

        $recentPerformances = Performance::with([
            'operation.customer',
            'driverTruck.driver',
            'driverTruck.truck',
            'origin',
            'destination',
        ])
            ->latest('DateDispach')
            ->limit(10)
            ->get()
            ->map(function ($performance) {
                return [
                    'id' => $performance->id,
                    'trip' => $performance->trip,
                    'DateDispach' => $performance->DateDispach,
                    'CargoVolumMT' => $performance->CargoVolumMT,
                    'satus' => $performance->satus,
                    'driverTruck' => $performance->driverTruck ? [
                        'id' => $performance->driverTruck->id,
                        'driver' => $performance->driverTruck->driver ? [
                            'id' => $performance->driverTruck->driver->id,
                            'name' => $performance->driverTruck->driver->name,
                        ] : null,
                        'truck' => $performance->driverTruck->truck ? [
                            'id' => $performance->driverTruck->truck->id,
                            'plate' => $performance->driverTruck->truck->plate,
                        ] : null,
                    ] : null,
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

        $dailyPerformanceData = $dailyPerformance->map(fn ($row) => [
            'date' => $row->date,
            'tonnage' => (float) $row->tonnage,
            'trips' => (int) $row->trips,
            'tonkm' => (float) $row->tonkm,
        ])->values()->all();

        $corridorVolumesData = $corridorVolumes->map(fn ($row) => [
            'origin' => $row->origin,
            'destination' => $row->destination,
            'label' => trim($row->origin.' → '.$row->destination),
            'tonnage' => (float) $row->tonnage,
            'trips' => (int) $row->trips,
        ])->values()->all();

        $topCustomersData = $topCustomers->map(fn ($row) => [
            'customer' => $row->customer,
            'trips' => (int) $row->trips,
            'tonnage' => (float) $row->tonnage,
        ])->values()->all();

        $executiveSummary = [
            'metrics' => [
                [
                    'key' => 'tonnage',
                    'label' => 'Tonnage moved (30d)',
                    'value' => $tonnageLast30,
                    'unit' => 'MT',
                    'change' => $percentChange($tonnageLast30, $tonnagePrev30),
                ],
                [
                    'key' => 'avgDailyTonnage',
                    'label' => 'Avg daily tonnage',
                    'value' => $avgDailyTonnage,
                    'unit' => 'MT/day',
                    'change' => $percentChange($avgDailyTonnage, $avgDailyPrev),
                ],
                [
                    'key' => 'returnRate',
                    'label' => 'Return rate (30d)',
                    'value' => $returnRateLast30,
                    'unit' => '%',
                    'change' => $percentChange($returnRateLast30, $returnRatePrev30),
                ],
                [
                    'key' => 'avgCycle',
                    'label' => 'Avg cycle time',
                    'value' => $avgCycleLast30,
                    'unit' => 'days',
                    'change' => $percentChange($avgCycleLast30, $avgCyclePrev30),
                ],
            ],
            'fleet' => [
                'totalTrucks' => $totalTrucks,
                'activeTrucks' => $activeTrucks,
                'fleetAvailability' => $fleetAvailability,
                'utilizedAssignments30d' => $trucksUtilizedLast30,
                'fleetUtilisation' => $fleetUtilisation,
            ],
            'drivers' => [
                'total' => $totalDrivers,
                'active' => $activeDrivers,
                'availability' => $driverAvailability,
            ],
            'operations' => [
                'total' => $totalOperations,
                'open' => $openOperations,
            ],
        ];

        $networkOverview = [
            'dailyTrend' => $dailyPerformanceData,
            'statusBreakdown' => $statusBreakdownData,
            'loadPhaseBreakdown' => $loadPhaseBreakdown,
            'corridors' => $corridorVolumesData,
        ];

        $financialOverview = [
            'revenue30d' => $revenueLast30,
            'operatingCost30d' => $operatingCostLast30,
            'margin30d' => $marginLast30,
            'fareboxRecovery' => $fareboxRecovery,
            'avgRevenuePerTon' => $avgRevenuePerTon,
            'avgCostPerTon' => $avgCostPerTon,
            'change' => [
                'revenue' => $percentChange($revenueLast30, $revenuePrev30),
                'operatingCost' => $percentChange($operatingCostLast30, $operatingCostPrev30),
                'margin' => $percentChange($marginLast30, $marginPrev30),
                'fareboxRecovery' => $percentChange($fareboxRecovery, $fareboxRecoveryPrev),
            ],
            'trend' => $financialTrend,
            'costBreakdown' => $costBreakdown,
            'fuel' => [
                'totalCost30d' => $fuelTotalCost30,
                'totalVolume30d' => $fuelVolume30,
                'avgCostPerLiter30d' => $avgFuelPrice30,
                'trend' => $fuelTrend,
            ],
        ];

        $assetOverview = [
            'fleetAvailability' => $fleetAvailability,
            'fleetUtilisation' => $fleetUtilisation,
            'driverAvailability' => $driverAvailability,
            'maintenance' => [
                'scheduled' => $maintenanceScheduled,
                'overdue' => $maintenanceOverdue,
                'completed30d' => $maintenanceCompleted30,
                'averageTurnaroundDays' => $maintenanceAvgTurnaround,
                'trend' => $maintenanceTrend,
                'upcoming' => $upcomingMaintenance,
            ],
        ];

        $safetyOverview = [
            'incidents90d' => $incidentCount90,
            'incidentRatePer100Trips' => $incidentRatePer100Trips,
            'change' => [
                'incidents' => $percentChange((float) $incidentCount90, (float) $incidentPrev90),
                'incidentRate' => $percentChange($incidentRatePer100Trips, $incidentRatePrev100Trips),
            ],
            'severityMix' => $severityMix,
            'incidentTrend' => $incidentTrend,
            'topIncidentTypes' => $topIncidentTypes,
        ];

        $latestTruckStatusSummary = $this->buildLatestTruckStatusSummary($totalTrucks);

        $primaryKpis = [
            [
                'key' => 'tonnage30d',
                'label' => 'Tonnage moved (30d)',
                'value' => $tonnageLast30,
                'unit' => 'MT',
                'format' => 'number',
                'change' => $percentChange($tonnageLast30, $tonnagePrev30),
            ],
            [
                'key' => 'trips30d',
                'label' => 'Trips completed (30d)',
                'value' => (float) $totalTripsLast30,
                'unit' => 'Trips',
                'format' => 'integer',
                'change' => $percentChange((float) $totalTripsLast30, (float) $totalTripsPrev30),
            ],
            [
                'key' => 'avgLoadPerTrip',
                'label' => 'Avg load per trip',
                'value' => $avgLoadPerTripLast30,
                'unit' => 'MT / trip',
                'format' => 'number',
                'change' => $percentChange($avgLoadPerTripLast30, $avgLoadPerTripPrev30),
            ],
            [
                'key' => 'margin30d',
                'label' => 'Operating margin (30d)',
                'value' => $marginLast30,
                'unit' => 'ETB',
                'format' => 'currency',
                'change' => $percentChange($marginLast30, $marginPrev30),
            ],
            [
                'key' => 'fareboxRecovery',
                'label' => 'Farebox recovery',
                'value' => $fareboxRecovery,
                'unit' => '%',
                'format' => 'percent',
                'change' => $percentChange($fareboxRecovery, $fareboxRecoveryPrev),
            ],
            [
                'key' => 'fleetUtilisation',
                'label' => 'Fleet utilisation',
                'value' => $fleetUtilisation,
                'unit' => '%',
                'format' => 'percent',
                'change' => null,
            ],
        ];

        return Inertia::render('Dashboard', [
            'executiveSummary' => $executiveSummary,
            'networkOverview' => $networkOverview,
            'financialOverview' => $financialOverview,
            'assetOverview' => $assetOverview,
            'safetyOverview' => $safetyOverview,
            'primaryKpis' => $primaryKpis,
            'latestTruckStatusSummary' => $latestTruckStatusSummary,
            'topCustomers' => $topCustomersData,
            'recentPerformances' => $recentPerformances,
        ]);
    }

    /**
     * Prepare the latest daily truck status snapshot.
     */
    private function buildLatestTruckStatusSummary(int $totalTrucks): array
    {
        $latestRecord = DailyTruckStatus::query()
            ->orderByDesc('status_date')
            ->orderByDesc('updated_at')
            ->first();

        if (! $latestRecord) {
            return [
                'date' => null,
                'overview' => [
                    'trucksTracked' => 0,
                    'totalEntries' => 0,
                    'coverageRate' => null,
                    'operationalShare' => null,
                    'maintenanceShare' => null,
                    'mostCommonStatus' => null,
                ],
                'statusBreakdown' => [],
                'recentUpdates' => [],
                'notes' => [],
            ];
        }

        $latestDate = $latestRecord->status_date?->toDateString()
            ?? $latestRecord->created_at?->toDateString();

        $records = DailyTruckStatus::query()
            ->with(['truck:id,plate', 'status:id,name'])
            ->whereDate('status_date', $latestDate)
            ->orderByDesc('updated_at')
            ->orderByDesc('created_at')
            ->get();

        if ($records->isEmpty()) {
            return [
                'date' => $latestDate,
                'overview' => [
                    'trucksTracked' => 0,
                    'totalEntries' => 0,
                    'coverageRate' => null,
                    'operationalShare' => null,
                    'maintenanceShare' => null,
                    'mostCommonStatus' => null,
                ],
                'statusBreakdown' => [],
                'recentUpdates' => [],
                'notes' => [],
            ];
        }

        $totalEntries = $records->count();
        $trucksTracked = $records->pluck('truck_id')->filter()->unique()->count();
        $coverageRate = $totalTrucks > 0
            ? round(($trucksTracked / $totalTrucks) * 100, 1)
            : null;

        $statusBreakdown = $records
            ->groupBy(fn ($row) => Str::lower($row->status?->name ?? 'unspecified'))
            ->map(function ($group, string $statusKey) {
                $label = Str::of($statusKey)
                    ->replace('_', ' ')
                    ->replace('-', ' ')
                    ->headline()
                    ->toString();

                return [
                    'status' => $statusKey,
                    'label' => $label,
                    'count' => $group->count(),
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();

        $operationalKeywords = ['active', 'en route', 'enroute', 'assigned', 'dispatched', 'loaded'];
        $maintenanceKeywords = ['maintenance', 'workshop', 'repair', 'service'];

        $operationalCount = $records->filter(function ($record) use ($operationalKeywords) {
            $name = Str::lower($record->status?->name ?? '');

            return $name !== '' && Str::contains($name, $operationalKeywords);
        })->count();

        $maintenanceCount = $records->filter(function ($record) use ($maintenanceKeywords) {
            $name = Str::lower($record->status?->name ?? '');

            return $name !== '' && Str::contains($name, $maintenanceKeywords);
        })->count();

        $recentUpdates = $records
            ->sortByDesc(fn ($record) => $record->updated_at ?? $record->created_at)
            ->take(6)
            ->map(function (DailyTruckStatus $record) {
                return [
                    'truck' => $record->truck?->plate ?? 'Unassigned',
                    'status' => $record->status?->name ?? 'Unknown',
                    'notes' => $record->notes,
                    'updatedAt' => optional($record->updated_at ?? $record->status_date ?? $record->created_at)?->toDateTimeString(),
                ];
            })
            ->values()
            ->all();

        $noteHighlights = $records
            ->filter(fn ($record) => filled($record->notes))
            ->sortByDesc(fn ($record) => $record->updated_at ?? $record->created_at)
            ->take(3)
            ->map(function (DailyTruckStatus $record) {
                return [
                    'truck' => $record->truck?->plate ?? 'Unassigned',
                    'status' => $record->status?->name ?? 'Unknown',
                    'notes' => $record->notes,
                ];
            })
            ->values()
            ->all();

        $mostCommonStatus = $statusBreakdown[0]['label'] ?? null;

        return [
            'date' => $latestDate,
            'overview' => [
                'trucksTracked' => $trucksTracked,
                'totalEntries' => $totalEntries,
                'coverageRate' => $coverageRate,
                'operationalShare' => $totalEntries > 0 ? round(($operationalCount / $totalEntries) * 100, 1) : null,
                'maintenanceShare' => $totalEntries > 0 ? round(($maintenanceCount / $totalEntries) * 100, 1) : null,
                'mostCommonStatus' => $mostCommonStatus,
            ],
            'statusBreakdown' => $statusBreakdown,
            'recentUpdates' => $recentUpdates,
            'notes' => $noteHighlights,
        ];
    }

    /**
     * Categorise performance records into dashboard status buckets.
     */
    private function determineNetworkStatusBucket(Performance $performance, Carbon $referenceDate): string
    {
        $normalizedStatus = Str::of((string) ($performance->satus ?? ''))->trim()->lower();
        $statusValue = $normalizedStatus->value();

        if ($performance->is_returned) {
            return 'completed';
        }

        if ($statusValue !== '') {
            if (in_array($statusValue, ['cancelled', 'canceled', 'void', 'aborted'], true)) {
                return 'cancelled';
            }

            if (in_array($statusValue, ['failed', 'failure'], true)) {
                return 'failed';
            }

            if (in_array($statusValue, ['completed', 'complete', 'done', 'returned'], true)) {
                return 'completed';
            }

            if (in_array($statusValue, ['pending', 'scheduled', 'queued', 'inactive'], true)) {
                return 'pending';
            }
        }

        $dispatchDate = $performance->DateDispach;

        if ($dispatchDate === null) {
            return $statusValue === '' ? 'unknown' : 'overdue';
        }

        if ($dispatchDate->isFuture()) {
            return 'pending';
        }

        $daysSinceDispatch = $dispatchDate->diffInDays($referenceDate);

        if ($daysSinceDispatch <= 7) {
            return 'in_transit';
        }

        if ($daysSinceDispatch <= 14) {
            return 'awaiting_return';
        }

        return 'overdue';
    }

    private function calculateInsuranceCostForWindow(Carbon $start, Carbon $end): float
    {
        if ($end->lt($start)) {
            return 0.0;
        }

        return InsuranceRecord::query()
            ->where(function ($query) use ($start, $end) {
                $query->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end])
                    ->orWhere(function ($subQuery) use ($start, $end) {
                        $subQuery->where('start_date', '<=', $start)
                            ->where('end_date', '>=', $end);
                    });
            })
            ->get()
            ->sum(function (InsuranceRecord $record) use ($start, $end): float {
                $policyStart = $record->start_date?->copy() ?? $start->copy();
                $policyEnd = $record->end_date?->copy() ?? $end->copy();

                if ($policyEnd->lt($start) || $policyStart->gt($end)) {
                    return 0.0;
                }

                $overlapStart = $policyStart->greaterThan($start) ? $policyStart : $start->copy();
                $overlapEnd = $policyEnd->lessThan($end) ? $policyEnd : $end->copy();

                if ($overlapEnd->lt($overlapStart)) {
                    return 0.0;
                }

                $policyDurationDays = max($policyStart->diffInDays($policyEnd) + 1, 1);
                $dailyPremium = (float) ($record->premium_amount ?? 0.0) / $policyDurationDays;
                $overlapDays = $overlapStart->diffInDays($overlapEnd) + 1;

                return $dailyPremium * $overlapDays;
            });
    }
}

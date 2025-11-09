<?php

namespace App\Services\Analytics;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Place;
use App\Models\Performance;
use App\Models\TruckFinancialRecord;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class FleetAnalyticsService
{
    /**
     * Build the analytics payload for the fleet cockpit dashboard.
     */
    public function getDashboardMetrics(array $filters = []): array
    {
        [$startDate, $endDate] = $this->resolveDateRange($filters);

        $financialQuery = TruckFinancialRecord::query()
            ->when($startDate, fn ($query) => $query->whereDate('record_date', '>=', $startDate))
            ->when($endDate, fn ($query) => $query->whereDate('record_date', '<=', $endDate));

        $performanceBaseQuery = Performance::query()
            ->when($startDate, fn ($query) => $query->whereDate('DateDispach', '>=', $startDate))
            ->when($endDate, fn ($query) => $query->whereDate('DateDispach', '<=', $endDate));

        $operationQuery = Operation::query()
            ->when($startDate, fn ($query) => $query->whereDate('startdate', '>=', $startDate))
            ->when($endDate, fn ($query) => $query->whereDate('startdate', '<=', $endDate));

        $financialTotals = (clone $financialQuery)
            ->selectRaw('COALESCE(SUM(revenue), 0) as total_revenue')
            ->selectRaw('COALESCE(SUM(fuel_cost), 0) as total_fuel_cost')
            ->selectRaw('COALESCE(SUM(maintenance_cost), 0) as total_maintenance_cost')
            ->selectRaw('COALESCE(SUM(driver_salary), 0) as total_driver_salary')
            ->selectRaw('COALESCE(SUM(insurance_cost), 0) as total_insurance_cost')
            ->selectRaw('COALESCE(SUM(depreciation), 0) as total_depreciation')
            ->selectRaw('COALESCE(SUM(other_costs), 0) as total_other_costs')
            ->selectRaw('COALESCE(SUM(net_profit), 0) as total_net_profit')
            ->first();

        $totalCost = (float) ($financialTotals->total_fuel_cost
            + $financialTotals->total_maintenance_cost
            + $financialTotals->total_driver_salary
            + $financialTotals->total_insurance_cost
            + $financialTotals->total_depreciation
            + $financialTotals->total_other_costs);

        $totalRevenue = (float) $financialTotals->total_revenue;
        $netProfit = (float) $financialTotals->total_net_profit;

        $totalTonKm = (float) (clone $performanceBaseQuery)->selectRaw('COALESCE(SUM(COALESCE(tonkm, 0)), 0) as total')->value('total') ?? 0.0;
        $totalTonnage = (float) (clone $performanceBaseQuery)->selectRaw('COALESCE(SUM(COALESCE(CargoVolumMT, 0)), 0) as total')->value('total') ?? 0.0;
        $totalTrips = (clone $performanceBaseQuery)->count();
        $completedTrips = (clone $performanceBaseQuery)->where('is_returned', true)->count();
        $openTrips = max($totalTrips - $completedTrips, 0);

        $distanceTotals = (clone $performanceBaseQuery)
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)), 0) as total_distance')
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0)), 0) as total_loaded_distance')
            ->first();

        $avgTripDistance = $totalTrips > 0 ? (float) $distanceTotals->total_distance / $totalTrips : 0.0;
        $avgLoadedDistance = $totalTrips > 0 ? (float) $distanceTotals->total_loaded_distance / $totalTrips : 0.0;
        $avgTonKm = $totalTrips > 0 ? $totalTonKm / $totalTrips : 0.0;

        $targetTrips = (clone $operationQuery)->count();
        $completionRate = $totalTrips > 0 ? round(($completedTrips / $totalTrips) * 100, 1) : 0.0;

        $financialTrend = (clone $financialQuery)
            ->selectRaw("DATE_FORMAT(record_date, '%Y-%m') as period")
            ->selectRaw('COALESCE(SUM(revenue), 0) as revenue')
            ->selectRaw('COALESCE(SUM(fuel_cost), 0) as fuel_cost')
            ->selectRaw('COALESCE(SUM(maintenance_cost), 0) as maintenance_cost')
            ->selectRaw('COALESCE(SUM(driver_salary), 0) as driver_salary')
            ->selectRaw('COALESCE(SUM(insurance_cost), 0) as insurance_cost')
            ->selectRaw('COALESCE(SUM(depreciation), 0) as depreciation')
            ->selectRaw('COALESCE(SUM(other_costs), 0) as other_costs')
            ->selectRaw('COALESCE(SUM(net_profit), 0) as profit')
            ->groupBy('period')
            ->orderBy('period', 'asc')
            ->limit(12)
            ->get()
            ->map(fn ($row) => [
                'period' => $row->period,
                'revenue' => (float) $row->revenue,
                'cost' => (float) ($row->fuel_cost + $row->maintenance_cost + $row->driver_salary + $row->insurance_cost + $row->depreciation + $row->other_costs),
                'profit' => (float) $row->profit,
            ])
            ->values()
            ->all();

        $costBreakdown = [
            ['name' => 'Fuel', 'value' => round((float) $financialTotals->total_fuel_cost, 2)],
            ['name' => 'Maintenance', 'value' => round((float) $financialTotals->total_maintenance_cost, 2)],
            ['name' => 'Driver Salaries', 'value' => round((float) $financialTotals->total_driver_salary, 2)],
            ['name' => 'Insurance', 'value' => round((float) $financialTotals->total_insurance_cost, 2)],
            ['name' => 'Depreciation', 'value' => round((float) $financialTotals->total_depreciation, 2)],
            ['name' => 'Other', 'value' => round((float) $financialTotals->total_other_costs, 2)],
        ];

    $routeEfficiency = $this->buildRouteEfficiencyDataset($startDate, $endDate);
        $underperformingTrips = $this->buildUnderperformingTripsDataset($performanceBaseQuery);
        $driverOutliers = $this->buildDriverOutliersDataset($performanceBaseQuery);

        return [
            'filters' => [
                'startDate' => $startDate?->toDateString(),
                'endDate' => $endDate?->toDateString(),
            ],
            'summary' => [
                'totalRevenue' => round($totalRevenue, 2),
                'totalCost' => round($totalCost, 2),
                'netProfit' => round($netProfit, 2),
                'costPerTon' => $totalTonnage > 0 ? round($totalCost / $totalTonnage, 2) : 0.0,
                'totalTonnage' => round($totalTonnage, 2),
                'totalTrips' => $totalTrips,
                'completedTrips' => $completedTrips,
                'openTrips' => $openTrips,
                'avgTripDistance' => round($avgTripDistance, 2),
                'avgLoadedDistance' => round($avgLoadedDistance, 2),
                'avgTonKm' => round($avgTonKm, 2),
            ],
            'financialTrend' => $financialTrend,
            'costBreakdown' => $costBreakdown,
            'tripCompletion' => [
                'targetTrips' => $targetTrips,
                'completedTrips' => $completedTrips,
                'openTrips' => $openTrips,
                'completionRate' => $completionRate,
            ],
            'routeEfficiency' => $routeEfficiency,
            'underperformingTrips' => $underperformingTrips,
            'driverOutliers' => $driverOutliers,
        ];
    }

    /**
     * Resolve the effective reporting window.
     */
    private function resolveDateRange(array $filters): array
    {
        $start = isset($filters['start_date']) && $filters['start_date']
            ? Carbon::parse($filters['start_date'])->startOfDay()
            : null;

        $end = isset($filters['end_date']) && $filters['end_date']
            ? Carbon::parse($filters['end_date'])->endOfDay()
            : null;

        if (!$start && !$end) {
            $end = Carbon::now()->endOfDay();
            $start = $end->copy()->subDays(89)->startOfDay();
        } elseif ($start && !$end) {
            $end = Carbon::now()->endOfDay();
        } elseif (!$start && $end) {
            $start = $end->copy()->subDays(89)->startOfDay();
        }

        if ($start && $end && $start->greaterThan($end)) {
            [$start, $end] = [$end->copy()->startOfDay(), $start->copy()->endOfDay()];
        }

        return [$start, $end];
    }

    /**
     * Build aggregated route efficiency metrics (top 8 flows).
     */
    private function buildRouteEfficiencyDataset(?Carbon $startDate, ?Carbon $endDate): array
    {
        $routeEfficiencyRaw = DB::table('performances')
            ->when($startDate, fn ($query) => $query->whereDate('DateDispach', '>=', $startDate))
            ->when($endDate, fn ($query) => $query->whereDate('DateDispach', '<=', $endDate))
            ->whereNotNull('orgion_id')
            ->whereNotNull('destination_id')
            ->select('orgion_id', 'destination_id')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('COALESCE(SUM(COALESCE(tonkm, 0)), 0) as total_tonkm')
            ->selectRaw('COALESCE(SUM(COALESCE(CargoVolumMT, 0)), 0) as total_tonnage')
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)), 0) as total_distance')
            ->groupBy('orgion_id', 'destination_id')
            ->havingRaw('trips > 0')
            ->orderByDesc('trips')
            ->limit(8)
            ->get();

        if ($routeEfficiencyRaw->isEmpty()) {
            return [];
        }

        $placeIds = $routeEfficiencyRaw
            ->pluck('orgion_id')
            ->merge($routeEfficiencyRaw->pluck('destination_id'))
            ->unique()
            ->filter()
            ->values();

        $places = Place::query()
            ->whereIn('id', $placeIds)
            ->get(['id', 'name', 'latitude', 'longitude'])
            ->keyBy('id');

        return $routeEfficiencyRaw
            ->map(function ($row) use ($places) {
                $origin = $places->get($row->orgion_id);
                $destination = $places->get($row->destination_id);

                $avgDistance = $row->trips > 0 ? (float) $row->total_distance / $row->trips : 0.0;
                $avgTonKm = $row->trips > 0 ? (float) $row->total_tonkm / $row->trips : 0.0;

                return [
                    'id' => $row->orgion_id . '-' . $row->destination_id,
                    'origin' => $origin?->name ?? 'Unknown',
                    'destination' => $destination?->name ?? 'Unknown',
                    'totalTrips' => (int) $row->trips,
                    'avgDistance' => round($avgDistance, 2),
                    'avgTonKm' => round($avgTonKm, 2),
                    'totalTonnage' => round((float) $row->total_tonnage, 2),
                    'originCoordinates' => $origin ? [
                        'lat' => $origin->latitude ? (float) $origin->latitude : null,
                        'lng' => $origin->longitude ? (float) $origin->longitude : null,
                    ] : null,
                    'destinationCoordinates' => $destination ? [
                        'lat' => $destination->latitude ? (float) $destination->latitude : null,
                        'lng' => $destination->longitude ? (float) $destination->longitude : null,
                    ] : null,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Highlight trips that are either overdue or under target ton-kilometres.
     */
    private function buildUnderperformingTripsDataset($performanceQuery): array
    {
        $thresholdDate = Carbon::now()->subDays(5)->startOfDay();

        $records = (clone $performanceQuery)
            ->with([
                'driverTruck.driver:id,name',
                'driverTruck.truck:id,plate',
                'origin:id,name',
                'destination:id,name',
            ])
            ->where(function ($query) use ($thresholdDate) {
                $query->where(function ($inner) use ($thresholdDate) {
                    $inner->where('is_returned', false)
                        ->whereDate('DateDispach', '<=', $thresholdDate);
                })->orWhere(function ($inner) {
                    $inner->whereNotNull('tonkm')
                        ->where('tonkm', '<', 1);
                });
            })
            ->orderByDesc('DateDispach')
            ->limit(5)
            ->get();

        return $records->map(function (Performance $performance) {
            $ageDays = $performance->DateDispach
                ? $performance->DateDispach->diffInDays(Carbon::now())
                : null;

            return [
                'id' => $performance->id,
                'trip' => $performance->trip,
                'status' => $performance->satus,
                'driver' => $performance->driverTruck?->driver?->name,
                'truck' => $performance->driverTruck?->truck?->plate,
                'origin' => $performance->origin?->name,
                'destination' => $performance->destination?->name,
                'tonnage' => $performance->CargoVolumMT ? (float) $performance->CargoVolumMT : null,
                'tonKm' => $performance->tonkm ? (float) $performance->tonkm : null,
                'ageDays' => $ageDays,
            ];
        })->values()->all();
    }

    /**
     * Detect drivers with the highest fuel cost per transported tonne.
     */
    private function buildDriverOutliersDataset($performanceQuery): array
    {
        $metrics = (clone $performanceQuery)
            ->whereNotNull('driver_truck_id')
            ->select('driver_truck_id')
            ->selectRaw('COALESCE(SUM(COALESCE(fuelInBirr, 0)), 0) as total_fuel_cost')
            ->selectRaw('COALESCE(SUM(COALESCE(CargoVolumMT, 0)), 0) as total_tonnage')
            ->groupBy('driver_truck_id')
            ->havingRaw('total_tonnage > 0')
            ->orderByRaw('total_fuel_cost / NULLIF(total_tonnage, 0) DESC')
            ->limit(5)
            ->get();

        if ($metrics->isEmpty()) {
            return [];
        }

        $assignmentIds = $metrics->pluck('driver_truck_id')->filter()->unique();

        $assignments = DriverTruck::with(['driver:id,name', 'truck:id,plate'])
            ->whereIn('id', $assignmentIds)
            ->get()
            ->keyBy('id');

        return $metrics->map(function ($row) use ($assignments) {
            $assignment = $assignments->get($row->driver_truck_id);
            $fuelPerTon = $row->total_tonnage > 0
                ? round((float) $row->total_fuel_cost / $row->total_tonnage, 2)
                : null;

            return [
                'driverTruckId' => $row->driver_truck_id,
                'driver' => $assignment?->driver?->name ?? 'Unassigned',
                'truck' => $assignment?->truck?->plate ?? 'Unassigned',
                'fuelPerTon' => $fuelPerTon,
                'totalFuelCost' => round((float) $row->total_fuel_cost, 2),
                'totalTonnage' => round((float) $row->total_tonnage, 2),
            ];
        })->values()->all();
    }
}

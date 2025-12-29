<?php

namespace App\Services\Reports;

use App\Models\Driver;
use App\Models\Truck;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FuelEfficiencyReport
{
    private const DEFAULT_PER_PAGE = 25;

    private const PER_PAGE_OPTIONS = [10, 25, 50, 100];

    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $truckIds = $this->resolveTruckIds($filters);

        $aggregated = $this->aggregateByTruck($from, $to, $truckIds);

        $truckDetails = $aggregated->isEmpty()
            ? collect()
            : Truck::query()
                ->select(['id', 'plate', 'status'])
                ->whereIn('id', $aggregated->pluck('truck_id')->all())
                ->get()
                ->keyBy('id');

        $driversByTruck = $this->mapDriversByTruck(
            $from,
            $to,
            $truckIds,
            $aggregated->pluck('truck_id')->all()
        );

        $breakdown = $this->buildBreakdown($aggregated, $truckDetails, $driversByTruck);
        $breakdownCollection = $breakdown->values();
        $breakdownPaginator = $this->paginateBreakdown($breakdownCollection, $filters);

        $totals = $this->summariseTotals($breakdownCollection);
        $summary = $this->buildSummary($totals);
        $trend = $this->trend($from, $to, $truckIds);
        $highlights = $this->buildHighlights($breakdownCollection);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'truck_ids' => $truckIds,
            'totals' => $totals,
            'summary' => $summary,
            'breakdown' => $breakdownPaginator['data'],
            'breakdown_all' => $breakdownCollection->all(),
            'breakdown_paginator' => Arr::except($breakdownPaginator, ['data']),
            'per_page' => $breakdownPaginator['meta']['per_page'] ?? self::DEFAULT_PER_PAGE,
            'per_page_options' => self::PER_PAGE_OPTIONS,
            'trend' => $trend,
            'highlights' => $highlights,
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $fromInput = $filters['from'] ?? null;
        $toInput = $filters['to'] ?? null;

        $from = $fromInput ? Carbon::parse($fromInput)->startOfDay() : now()->copy()->subMonths(3)->startOfDay();
        $to = $toInput ? Carbon::parse($toInput)->endOfDay() : now()->copy()->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    private function resolveTruckIds(array $filters): array
    {
        $ids = Arr::wrap($filters['truck_ids'] ?? $filters['truck_id'] ?? []);

        if (is_string($ids)) {
            $ids = array_filter(array_map('trim', explode(',', $ids)));
        }

        return collect($ids)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function aggregateByTruck(CarbonInterface $from, CarbonInterface $to, array $truckIds): Collection
    {
        $query = DB::table('performances')
            ->selectRaw('driver_truck.truck_id as truck_id')
            ->selectRaw('COUNT(*) as trip_count')
            ->selectRaw('SUM(COALESCE(performances.fuelInLitter, 0)) as total_liters')
            ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(performances.DistanceWCargo, 0)) as distance_loaded')
            ->selectRaw('SUM(COALESCE(performances.DistanceWOCargo, 0)) as distance_empty')
            ->selectRaw('MIN(performances.DateDispach) as first_activity')
            ->selectRaw('MAX(performances.DateDispach) as last_activity')
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->whereBetween('performances.DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->whereNotNull('driver_truck.truck_id')
            ->groupBy('driver_truck.truck_id');

        if (! empty($truckIds)) {
            $query->whereIn('driver_truck.truck_id', $truckIds);
        }

        return collect($query->get());
    }

    private function mapDriversByTruck(
        CarbonInterface $from,
        CarbonInterface $to,
        array $requestedTruckIds,
        array $aggregatedTruckIds,
    ): Collection {
        if (empty($aggregatedTruckIds)) {
            return collect();
        }

        $driverQuery = DB::table('performances')
            ->select('driver_truck.truck_id', 'driver_truck.driver_id')
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->whereBetween('performances.DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->whereNotNull('driver_truck.truck_id')
            ->whereNotNull('driver_truck.driver_id')
            ->whereIn('driver_truck.truck_id', $aggregatedTruckIds)
            ->distinct();

        if (! empty($requestedTruckIds)) {
            $driverQuery->whereIn('driver_truck.truck_id', $requestedTruckIds);
        }

        $assignments = collect($driverQuery->get());

        if ($assignments->isEmpty()) {
            return collect();
        }

        $driverIds = $assignments
            ->pluck('driver_id')
            ->filter()
            ->map(static fn ($id) => (int) $id)
            ->unique()
            ->values();

        $drivers = $driverIds->isEmpty()
            ? collect()
            : Driver::query()
                ->select(['id', 'name', 'status'])
                ->whereIn('id', $driverIds->all())
                ->get()
                ->keyBy('id');

        return $assignments
            ->groupBy('truck_id')
            ->map(function (Collection $rows) use ($drivers) {
                return $rows
                    ->map(function ($row) use ($drivers) {
                        $driver = $drivers->get($row->driver_id);

                        if ($driver === null) {
                            return null;
                        }

                        return [
                            'id' => (int) $driver->id,
                            'name' => $driver->name,
                            'status' => $driver->status,
                        ];
                    })
                    ->filter()
                    ->unique('id')
                    ->values()
                    ->all();
            });
    }

    private function buildBreakdown(
        Collection $aggregated,
        Collection $truckDetails,
        Collection $driversByTruck,
    ): Collection {
        return $aggregated
            ->map(function ($row) use ($truckDetails, $driversByTruck) {
                $truckId = (int) $row->truck_id;
                $truck = $truckDetails->get($truckId);

                $tripCount = (int) $row->trip_count;
                $totalLiters = (float) $row->total_liters;
                $totalCost = (float) $row->total_cost;
                $distanceLoaded = (float) $row->distance_loaded;
                $distanceEmpty = (float) $row->distance_empty;
                $distanceTotal = $distanceLoaded + $distanceEmpty;

                $efficiency = ($totalLiters > 0 && $distanceTotal > 0)
                    ? round($distanceTotal / $totalLiters, 2)
                    : null;

                $costPerKm = ($distanceTotal > 0 && $totalCost > 0)
                    ? round($totalCost / $distanceTotal, 2)
                    : null;

                $costPerLiter = $totalLiters > 0
                    ? round($totalCost / $totalLiters, 2)
                    : null;

                $avgLitersPerTrip = $tripCount > 0
                    ? round($totalLiters / $tripCount, 2)
                    : null;

                $avgCostPerTrip = $tripCount > 0
                    ? round($totalCost / $tripCount, 2)
                    : null;

                $drivers = collect($driversByTruck->get($truckId, []))
                    ->map(static fn ($driver) => [
                        'id' => (int) $driver['id'],
                        'name' => $driver['name'],
                        'status' => $driver['status'] ?? null,
                    ])
                    ->values()
                    ->all();

                $distanceLoadedRounded = round($distanceLoaded, 2);
                $distanceEmptyRounded = round($distanceEmpty, 2);
                $distanceTotalRounded = round($distanceTotal, 2);

                $loadedShare = $distanceTotal > 0
                    ? round(($distanceLoaded / $distanceTotal) * 100, 2)
                    : null;

                $emptyShare = $distanceTotal > 0
                    ? round(($distanceEmpty / $distanceTotal) * 100, 2)
                    : null;

                return [
                    'truck_id' => $truckId,
                    'plate' => $truck?->plate ?? 'Truck #'.$truckId,
                    'status' => $truck?->status,
                    'trip_count' => $tripCount,
                    'total_liters' => round($totalLiters, 2),
                    'total_cost' => round($totalCost, 2),
                    'distance_loaded_km' => $distanceLoadedRounded,
                    'distance_empty_km' => $distanceEmptyRounded,
                    'distance_total_km' => $distanceTotalRounded,
                    'efficiency_km_per_liter' => $efficiency,
                    'cost_per_km' => $costPerKm,
                    'cost_per_liter' => $costPerLiter,
                    'avg_liters_per_trip' => $avgLitersPerTrip,
                    'avg_cost_per_trip' => $avgCostPerTrip,
                    'first_activity_on' => $row->first_activity ? Carbon::parse($row->first_activity)->toDateString() : null,
                    'last_activity_on' => $row->last_activity ? Carbon::parse($row->last_activity)->toDateString() : null,
                    'drivers' => $drivers,
                    'driver_names' => collect($drivers)->pluck('name')->unique()->values()->all(),
                    'loaded_distance_share_percent' => $loadedShare,
                    'empty_distance_share_percent' => $emptyShare,
                    'has_distance' => $distanceTotal > 0,
                ];
            })
            ->sort(function (array $a, array $b) {
                $aCost = $a['cost_per_km'];
                $bCost = $b['cost_per_km'];

                if ($aCost === null && $bCost === null) {
                    return 0;
                }

                if ($aCost === null) {
                    return 1;
                }

                if ($bCost === null) {
                    return -1;
                }

                return $bCost <=> $aCost;
            })
            ->values();
    }

    private function summariseTotals(Collection $breakdown): array
    {
        return [
            'total_liters' => round((float) $breakdown->sum('total_liters'), 2),
            'total_cost' => round((float) $breakdown->sum('total_cost'), 2),
            'total_loaded_distance_km' => round((float) $breakdown->sum('distance_loaded_km'), 2),
            'total_empty_distance_km' => round((float) $breakdown->sum('distance_empty_km'), 2),
            'total_distance_km' => round((float) $breakdown->sum('distance_total_km'), 2),
            'trip_count' => (int) $breakdown->sum('trip_count'),
            'truck_count' => $breakdown->count(),
        ];
    }

    private function buildSummary(array $totals): array
    {
        $totalLiters = $totals['total_liters'];
        $totalCost = $totals['total_cost'];
        $totalDistance = $totals['total_distance_km'];
        $totalLoadedDistance = $totals['total_loaded_distance_km'];
        $totalEmptyDistance = $totals['total_empty_distance_km'];
        $tripCount = $totals['trip_count'];

        return [
            'fleet_efficiency_km_per_liter' => ($totalLiters > 0 && $totalDistance > 0)
                ? round($totalDistance / $totalLiters, 2)
                : null,
            'fleet_cost_per_km' => $totalDistance > 0
                ? round($totalCost / $totalDistance, 2)
                : null,
            'average_cost_per_liter' => $totalLiters > 0
                ? round($totalCost / $totalLiters, 2)
                : null,
            'average_liters_per_trip' => $tripCount > 0
                ? round($totalLiters / $tripCount, 2)
                : null,
            'average_cost_per_trip' => $tripCount > 0
                ? round($totalCost / $tripCount, 2)
                : null,
            'average_loaded_distance_per_trip' => ($tripCount > 0 && $totalLoadedDistance > 0)
                ? round($totalLoadedDistance / $tripCount, 2)
                : null,
            'average_empty_distance_per_trip' => ($tripCount > 0 && $totalEmptyDistance > 0)
                ? round($totalEmptyDistance / $tripCount, 2)
                : null,
            'loaded_distance_share_percent' => $totalDistance > 0
                ? round(($totalLoadedDistance / $totalDistance) * 100, 2)
                : null,
            'empty_distance_share_percent' => $totalDistance > 0
                ? round(($totalEmptyDistance / $totalDistance) * 100, 2)
                : null,
        ];
    }

    private function trend(CarbonInterface $from, CarbonInterface $to, array $truckIds): array
    {
        $connection = DB::connection();
        $driverName = $connection->getDriverName();

        $periodExpression = $driverName === 'sqlite'
            ? "strftime('%Y-%m', performances.DateDispach)"
            : "DATE_FORMAT(performances.DateDispach, '%Y-%m')";

        $query = DB::table('performances')
            ->selectRaw("{$periodExpression} as period")
            ->selectRaw('SUM(COALESCE(performances.fuelInLitter, 0)) as total_liters')
            ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(performances.DistanceWCargo, 0)) as distance_loaded')
            ->selectRaw('SUM(COALESCE(performances.DistanceWOCargo, 0)) as distance_empty')
            ->selectRaw('COUNT(*) as trip_count')
            ->leftJoin('driver_truck', 'driver_truck.id', '=', 'performances.driver_truck_id')
            ->whereBetween('performances.DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->whereNotNull('driver_truck.truck_id')
            ->groupBy('period')
            ->orderBy('period');

        if (! empty($truckIds)) {
            $query->whereIn('driver_truck.truck_id', $truckIds);
        }

        return $query
            ->get()
            ->map(static function ($row) {
                $totalLiters = (float) $row->total_liters;
                $totalCost = (float) $row->total_cost;
                $distanceLoaded = (float) $row->distance_loaded;
                $distanceEmpty = (float) $row->distance_empty;
                $distanceTotal = $distanceLoaded + $distanceEmpty;
                $tripCount = (int) $row->trip_count;

                return [
                    'period' => $row->period,
                    'trip_count' => $tripCount,
                    'total_liters' => round($totalLiters, 2),
                    'total_cost' => round($totalCost, 2),
                    'distance_loaded_km' => round($distanceLoaded, 2),
                    'distance_empty_km' => round($distanceEmpty, 2),
                    'distance_total_km' => round($distanceTotal, 2),
                    'average_liters_per_trip' => $tripCount > 0 ? round($totalLiters / $tripCount, 2) : null,
                    'average_cost_per_trip' => $tripCount > 0 ? round($totalCost / $tripCount, 2) : null,
                    'fleet_efficiency_km_per_liter' => ($totalLiters > 0 && $distanceTotal > 0)
                        ? round($distanceTotal / $totalLiters, 2)
                        : null,
                    'fleet_cost_per_km' => $distanceTotal > 0
                        ? round($totalCost / $distanceTotal, 2)
                        : null,
                ];
            })
            ->values()
            ->all();
    }

    private function resolvePerPage(array $filters): int
    {
        $perPage = (int) ($filters['per_page'] ?? self::DEFAULT_PER_PAGE);

        return in_array($perPage, self::PER_PAGE_OPTIONS, true) ? $perPage : self::DEFAULT_PER_PAGE;
    }

    private function resolvePage(array $filters): int
    {
        $page = (int) ($filters['page'] ?? 1);

        return $page > 0 ? $page : 1;
    }

    private function paginateBreakdown(Collection $breakdown, array $filters): array
    {
        $perPage = $this->resolvePerPage($filters);
        $page = $this->resolvePage($filters);
        $total = $breakdown->count();
        $maxPage = max(1, (int) ceil($total / max(1, $perPage)));

        if ($page > $maxPage) {
            $page = $maxPage;
        }

        $items = $breakdown->forPage($page, $perPage)->values();

        $paginator = new LengthAwarePaginator(
            $items,
            $total,
            $perPage,
            $page,
            [
                'path' => Paginator::resolveCurrentPath(),
                'pageName' => 'page',
                'query' => request()?->query() ?? [],
            ]
        );

        $links = $paginator->linkCollection()
            ->map(static function (array $link): array {
                $label = $link['label'];

                if (is_string($label)) {
                    $label = trim(strip_tags(html_entity_decode($label)));
                }

                return [
                    'url' => $link['url'],
                    'label' => $label,
                    'active' => (bool) ($link['active'] ?? false),
                ];
            })
            ->values()
            ->all();

        return [
            'data' => $items->all(),
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

    private function buildHighlights(Collection $breakdown): array
    {
        $bestEfficiency = $breakdown
            ->filter(static fn (array $row) => $row['efficiency_km_per_liter'] !== null)
            ->sortByDesc('efficiency_km_per_liter')
            ->take(3)
            ->values()
            ->all();

        $highestCostPerKm = $breakdown
            ->filter(static fn (array $row) => $row['cost_per_km'] !== null)
            ->sortByDesc('cost_per_km')
            ->take(3)
            ->values()
            ->all();

        $highestEmptyShare = $breakdown
            ->filter(static fn (array $row) => $row['empty_distance_share_percent'] !== null)
            ->sortByDesc('empty_distance_share_percent')
            ->take(3)
            ->values()
            ->all();

        return [
            'best_efficiency' => $bestEfficiency,
            'highest_cost_per_km' => $highestCostPerKm,
            'highest_empty_distance_share' => $highestEmptyShare,
        ];
    }
}

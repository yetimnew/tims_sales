<?php

namespace App\Services\Reports;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class CustomerProfitabilityReport
{
    public function __construct(private readonly OperationPerformanceReport $operationPerformanceReport) {}

    public function build(array $filters): array
    {
        $customerIds = $this->resolveCustomerIds($filters);

        $operationResult = $this->operationPerformanceReport->build($filters);
        $rows = $operationResult['rows'] instanceof Collection
            ? $operationResult['rows']
            : collect($operationResult['rows']);

        $filteredRows = $rows
            ->filter(static fn (array $row) => ($row['customer_id'] ?? null) !== null)
            ->when(! empty($customerIds), static fn (Collection $collection) => $collection->filter(
                static fn (array $row) => in_array($row['customer_id'], $customerIds, true)
            ))
            ->values();

        $laneCounts = $this->laneCounts(
            Carbon::parse($operationResult['resolved_from'])->startOfDay(),
            Carbon::parse($operationResult['resolved_to'])->endOfDay(),
            $customerIds
        );

        $grouped = $this->groupRows($filteredRows, $laneCounts);
        $summary = $this->summarise($grouped);
        $trend = $this->trend(
            Carbon::parse($operationResult['resolved_from'])->startOfDay(),
            Carbon::parse($operationResult['resolved_to'])->endOfDay(),
            $customerIds
        );

        return [
            'rows' => $grouped->values(),
            'summary' => $summary,
            'trend' => $trend,
            'resolved_from' => $operationResult['resolved_from'],
            'resolved_to' => $operationResult['resolved_to'],
            'customer_ids' => $customerIds,
        ];
    }

    private function resolveCustomerIds(array $filters): array
    {
        $ids = Arr::wrap($filters['customer_ids'] ?? $filters['customer_id'] ?? []);

        return collect($ids)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function groupRows(Collection $rows, array $laneCounts): Collection
    {
        return $rows
            ->groupBy('customer_id')
            ->map(function (Collection $group, int|string $customerId) use ($laneCounts) {
                $first = $group->first();
                $operations = $group->count();

                $internalTrips = (int) $group->sum('internal_trips');
                $outsourceTrips = (int) $group->sum('outsource_trips');
                $totalTrips = $internalTrips + $outsourceTrips;

                $internalTonnage = (float) $group->sum('internal_tonnage');
                $outsourceTonnage = (float) $group->sum('outsource_tonnage');
                $totalTonnage = $internalTonnage + $outsourceTonnage;

                $internalTonKm = (float) $group->sum('internal_ton_km');
                $outsourceTonKm = (float) $group->sum('outsource_ton_km');
                $totalTonKm = $internalTonKm + $outsourceTonKm;

                $internalDistance = (float) $group->sum('internal_distance');
                $outsourceDistance = (float) $group->sum('outsource_distance');
                $totalDistance = $internalDistance + $outsourceDistance;

                $internalFuelCost = (float) $group->sum('internal_fuel_cost');
                $internalPerdiem = (float) $group->sum('internal_perdiem');
                $internalWorkOnGoing = (float) $group->sum('internal_work_on_going');
                $internalOtherCost = (float) $group->sum('internal_other_cost');
                $internalExpense = (float) $group->sum('internal_expense');
                $outsourceCost = (float) $group->sum('outsource_cost');
                $totalCost = (float) $group->sum('total_cost');

                $revenue = (float) $group->sum('revenue');
                $profit = (float) $group->sum('profit');
                $marginPercent = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                $averageKmPerTrip = $totalTrips > 0 ? round($totalDistance / $totalTrips, 2) : null;
                $costPerKm = $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : null;
                $revenuePerTonKm = $totalTonKm > 0 ? round($revenue / $totalTonKm, 2) : null;
                $costPerTonKm = $totalTonKm > 0 ? round($totalCost / $totalTonKm, 2) : null;
                $profitPerTonKm = $totalTonKm > 0 ? round($profit / $totalTonKm, 2) : null;
                $revenuePerTrip = $totalTrips > 0 ? round($revenue / $totalTrips, 2) : null;
                $costPerTrip = $totalTrips > 0 ? round($totalCost / $totalTrips, 2) : null;
                $tonnagePerTrip = $totalTrips > 0 ? round($totalTonnage / $totalTrips, 2) : null;
                $emptyDistanceRatio = $internalDistance > 0 ? round((($group->sum('internal_distance_without_cargo') ?? 0) / $internalDistance) * 100, 2) : null;
                $internalFuelCostPerKm = $internalDistance > 0 ? round($internalFuelCost / $internalDistance, 2) : null;
                $outsourceCostPerKm = $outsourceDistance > 0 ? round($outsourceCost / $outsourceDistance, 2) : null;
                $outsourceTripShare = $totalTrips > 0 ? round(($outsourceTrips / $totalTrips) * 100, 2) : null;
                $outsourceTonnageShare = $totalTonnage > 0 ? round(($outsourceTonnage / $totalTonnage) * 100, 2) : null;

                $lanesUsed = $laneCounts[(int) $customerId] ?? 0;

                return [
                    'customer_id' => (int) $customerId,
                    'customer_name' => $first['customer_name'] ?? 'N/A',
                    'operations' => $operations,
                    'lanes_used' => $lanesUsed,
                    'internal_trips' => $internalTrips,
                    'outsource_trips' => $outsourceTrips,
                    'total_trips' => $totalTrips,
                    'internal_tonnage' => round($internalTonnage, 2),
                    'outsource_tonnage' => round($outsourceTonnage, 2),
                    'total_tonnage' => round($totalTonnage, 2),
                    'internal_ton_km' => round($internalTonKm, 2),
                    'outsource_ton_km' => round($outsourceTonKm, 2),
                    'total_ton_km' => round($totalTonKm, 2),
                    'internal_distance' => round($internalDistance, 2),
                    'outsource_distance' => round($outsourceDistance, 2),
                    'total_distance' => round($totalDistance, 2),
                    'internal_fuel_cost' => round($internalFuelCost, 2),
                    'internal_perdiem' => round($internalPerdiem, 2),
                    'internal_work_on_going' => round($internalWorkOnGoing, 2),
                    'internal_other_cost' => round($internalOtherCost, 2),
                    'internal_expense' => round($internalExpense, 2),
                    'outsource_cost' => round($outsourceCost, 2),
                    'total_cost' => round($totalCost, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $marginPercent,
                    'average_km_per_trip' => $averageKmPerTrip,
                    'cost_per_km' => $costPerKm,
                    'revenue_per_ton_km' => $revenuePerTonKm,
                    'cost_per_ton_km' => $costPerTonKm,
                    'profit_per_ton_km' => $profitPerTonKm,
                    'revenue_per_trip' => $revenuePerTrip,
                    'cost_per_trip' => $costPerTrip,
                    'tonnage_per_trip' => $tonnagePerTrip,
                    'empty_distance_ratio_percent' => $emptyDistanceRatio,
                    'internal_fuel_cost_per_km' => $internalFuelCostPerKm,
                    'outsource_cost_per_km' => $outsourceCostPerKm,
                    'outsource_trip_share_percent' => $outsourceTripShare,
                    'outsource_tonnage_share_percent' => $outsourceTonnageShare,
                ];
            })
            ->sortByDesc('revenue');
    }

    private function summarise(Collection $rows): array
    {
        $summary = [
            'customer_count' => $rows->count(),
            'operations' => (int) $rows->sum('operations'),
            'internal_trips' => (int) $rows->sum('internal_trips'),
            'outsource_trips' => (int) $rows->sum('outsource_trips'),
            'total_trips' => (int) $rows->sum('total_trips'),
            'internal_tonnage' => (float) $rows->sum('internal_tonnage'),
            'outsource_tonnage' => (float) $rows->sum('outsource_tonnage'),
            'total_tonnage' => (float) $rows->sum('total_tonnage'),
            'internal_ton_km' => (float) $rows->sum('internal_ton_km'),
            'outsource_ton_km' => (float) $rows->sum('outsource_ton_km'),
            'total_ton_km' => (float) $rows->sum('total_ton_km'),
            'internal_distance' => (float) $rows->sum('internal_distance'),
            'outsource_distance' => (float) $rows->sum('outsource_distance'),
            'total_distance' => (float) $rows->sum('total_distance'),
            'internal_expense' => (float) $rows->sum('internal_expense'),
            'outsource_cost' => (float) $rows->sum('outsource_cost'),
            'total_cost' => (float) $rows->sum('total_cost'),
            'revenue' => (float) $rows->sum('revenue'),
            'profit' => (float) $rows->sum('profit'),
        ];

        $summary['internal_tonnage'] = round($summary['internal_tonnage'], 2);
        $summary['outsource_tonnage'] = round($summary['outsource_tonnage'], 2);
        $summary['total_tonnage'] = round($summary['total_tonnage'], 2);
        $summary['internal_ton_km'] = round($summary['internal_ton_km'], 2);
        $summary['outsource_ton_km'] = round($summary['outsource_ton_km'], 2);
        $summary['total_ton_km'] = round($summary['total_ton_km'], 2);
        $summary['internal_distance'] = round($summary['internal_distance'], 2);
        $summary['outsource_distance'] = round($summary['outsource_distance'], 2);
        $summary['total_distance'] = round($summary['total_distance'], 2);
        $summary['internal_expense'] = round($summary['internal_expense'], 2);
        $summary['outsource_cost'] = round($summary['outsource_cost'], 2);
        $summary['total_cost'] = round($summary['total_cost'], 2);
        $summary['revenue'] = round($summary['revenue'], 2);
        $summary['profit'] = round($summary['profit'], 2);

        $summary['margin_percent'] = $summary['revenue'] > 0
            ? round(($summary['profit'] / $summary['revenue']) * 100, 2)
            : null;
        $summary['average_km_per_trip'] = $summary['total_trips'] > 0
            ? round($summary['total_distance'] / $summary['total_trips'], 2)
            : null;
        $summary['cost_per_km'] = $summary['total_distance'] > 0
            ? round($summary['total_cost'] / $summary['total_distance'], 2)
            : null;
        $summary['revenue_per_ton_km'] = $summary['total_ton_km'] > 0
            ? round($summary['revenue'] / $summary['total_ton_km'], 2)
            : null;
        $summary['cost_per_ton_km'] = $summary['total_ton_km'] > 0
            ? round($summary['total_cost'] / $summary['total_ton_km'], 2)
            : null;
        $summary['profit_per_ton_km'] = $summary['total_ton_km'] > 0
            ? round($summary['profit'] / $summary['total_ton_km'], 2)
            : null;
        $summary['revenue_per_trip'] = $summary['total_trips'] > 0
            ? round($summary['revenue'] / $summary['total_trips'], 2)
            : null;
        $summary['cost_per_trip'] = $summary['total_trips'] > 0
            ? round($summary['total_cost'] / $summary['total_trips'], 2)
            : null;
        $summary['tonnage_per_trip'] = $summary['total_trips'] > 0
            ? round($summary['total_tonnage'] / $summary['total_trips'], 2)
            : null;
        $summary['outsource_trip_share_percent'] = $summary['total_trips'] > 0
            ? round(($summary['outsource_trips'] / $summary['total_trips']) * 100, 2)
            : null;
        $summary['outsource_tonnage_share_percent'] = $summary['total_tonnage'] > 0
            ? round(($summary['outsource_tonnage'] / $summary['total_tonnage']) * 100, 2)
            : null;

        return $summary;
    }

    private function trend(CarbonInterface $from, CarbonInterface $to, array $customerIds): array
    {
        $connection = DB::connection();
        $driver = $connection->getDriverName();
        $periodExpression = $driver === 'sqlite'
            ? "strftime('%Y-%m', DateDispach)"
            : "DATE_FORMAT(DateDispach, '%Y-%m')";

        $internal = DB::table('performances')
            ->join('operations', 'operations.id', '=', 'performances.operation_id')
            ->selectRaw("{$periodExpression} as period")
            ->selectRaw('SUM(COALESCE(performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
            ->selectRaw('SUM(COALESCE(performances.fuelInBirr, 0) + COALESCE(performances.perdiem, 0) + COALESCE(performances.workOnGoing, 0) + COALESCE(performances.other, 0)) as cost')
            ->whereBetween('performances.DateDispach', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($customerIds), static fn ($query) => $query->whereIn('operations.customer_id', $customerIds))
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $outsourcePeriodExpression = $driver === 'sqlite'
            ? "strftime('%Y-%m', dispatch_date)"
            : "DATE_FORMAT(dispatch_date, '%Y-%m')";

        $outsource = DB::table('outsource_performances')
            ->join('operations', 'operations.id', '=', 'outsource_performances.operation_id')
            ->selectRaw("{$outsourcePeriodExpression} as period")
            ->selectRaw('SUM(COALESCE(outsource_performances.tonkm, 0) * COALESCE(operations.tariff, 0)) as revenue')
            ->selectRaw('SUM(COALESCE(outsource_performances.cost, 0)) as cost')
            ->whereBetween('outsource_performances.dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($customerIds), static fn ($query) => $query->whereIn('operations.customer_id', $customerIds))
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        return collect($internal->keys())
            ->merge($outsource->keys())
            ->unique()
            ->sort()
            ->map(function (string $period) use ($internal, $outsource) {
                $internalRevenue = (float) ($internal->get($period)->revenue ?? 0.0);
                $internalCost = (float) ($internal->get($period)->cost ?? 0.0);
                $outsourceRevenue = (float) ($outsource->get($period)->revenue ?? 0.0);
                $outsourceCost = (float) ($outsource->get($period)->cost ?? 0.0);

                $revenue = $internalRevenue + $outsourceRevenue;
                $cost = $internalCost + $outsourceCost;
                $profit = $revenue - $cost;

                return [
                    'month' => $period,
                    'revenue' => round($revenue, 2),
                    'cost' => round($cost, 2),
                    'profit' => round($profit, 2),
                ];
            })
            ->values()
            ->all();
    }

    private function laneCounts(CarbonInterface $from, CarbonInterface $to, array $customerIds): array
    {
        return DB::table('performances')
            ->join('operations', 'operations.id', '=', 'performances.operation_id')
            ->select('operations.customer_id', 'performances.orgion_id', 'performances.destination_id')
            ->whereBetween('performances.DateDispach', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($customerIds), static fn ($query) => $query->whereIn('operations.customer_id', $customerIds))
            ->whereNotNull('operations.customer_id')
            ->get()
            ->groupBy('customer_id')
            ->map(static function (Collection $lanes) {
                return $lanes
                    ->map(static fn ($lane) => ((string) ($lane->orgion_id ?? 'N')).'-'.((string) ($lane->destination_id ?? 'N')))
                    ->unique()
                    ->count();
            })
            ->filter(static fn ($count, $customerId) => $customerId !== null)
            ->mapWithKeys(static fn ($count, $customerId) => [(int) $customerId => $count])
            ->all();
    }
}

<?php

namespace App\Services\Reports;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OperationPerformanceReport
{
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $operationIds = $this->resolveOperationIds($filters);

        $rows = $this->runQuery($from, $to, $operationIds);
        $summary = $this->summarise($rows);
        $customerHighlights = $this->customerHighlights($rows);
        $mixTrend = $this->mixTrend($from, $to, $operationIds);

        return [
            'rows' => $rows,
            'summary' => $summary,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'operation_ids' => $operationIds,
            'customer_highlights' => $customerHighlights,
            'mix_trend' => $mixTrend,
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $from = $filters['from'] ?? now()->subMonthsNoOverflow(1)->toDateString();
        $to = $filters['to'] ?? now()->toDateString();

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        if ($fromDate->greaterThan($toDate)) {
            [$fromDate, $toDate] = [$toDate->copy()->startOfDay(), $fromDate->copy()->endOfDay()];
        }

        return [$fromDate, $toDate];
    }

    private function resolveOperationIds(array $filters): array
    {
        $ids = Arr::wrap($filters['operation_ids'] ?? $filters['operation_id'] ?? []);

        return collect($ids)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function runQuery(CarbonInterface $from, CarbonInterface $to, array $operationIds): Collection
    {
        $internal = DB::table('performances')
            ->select('operation_id')
            ->selectRaw('COUNT(*) as internal_trips')
            ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as internal_tonnage')
            ->selectRaw('SUM(COALESCE(tonkm, 0)) as internal_ton_km')
            ->selectRaw('SUM(COALESCE(DistanceWCargo, 0)) as internal_distance_wc')
            ->selectRaw('SUM(COALESCE(DistanceWOCargo, 0)) as internal_distance_wo')
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0)) as internal_fuel_cost')
            ->selectRaw('SUM(COALESCE(perdiem, 0)) as internal_perdiem')
            ->selectRaw('SUM(COALESCE(workOnGoing, 0)) as internal_work_on_going')
            ->selectRaw('SUM(COALESCE(other, 0)) as internal_other_cost')
            ->whereBetween('DateDispach', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($operationIds), fn ($query) => $query->whereIn('operation_id', $operationIds))
            ->groupBy('operation_id');

        $outsource = DB::table('outsource_performances')
            ->select('operation_id')
            ->selectRaw('COUNT(*) as outsource_trips')
            ->selectRaw('SUM(COALESCE(cargo_volume_mt, 0)) as outsource_tonnage')
            ->selectRaw('SUM(COALESCE(tonkm, 0)) as outsource_ton_km')
            ->selectRaw('SUM(COALESCE(distance_km, 0)) as outsource_distance')
            ->selectRaw('SUM(COALESCE(cost, 0)) as outsource_cost')
            ->whereBetween('dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($operationIds), fn ($query) => $query->whereIn('operation_id', $operationIds))
            ->groupBy('operation_id');

        $query = DB::table('operations')
            ->select('operations.id')
            ->selectRaw('COALESCE(operations.operationid, operations.id) as operation_code')
            ->selectRaw('operations.customer_id')
            ->selectRaw('COALESCE(customers.name, "N/A") as customer_name')
            ->selectRaw('operations.status')
            ->selectRaw('operations.startdate')
            ->selectRaw('operations.enddate')
            ->selectRaw('COALESCE(operations.tariff, 0) as tariff')
            ->selectRaw('COALESCE(internal.internal_trips, 0) as internal_trips')
            ->selectRaw('COALESCE(internal.internal_tonnage, 0) as internal_tonnage')
            ->selectRaw('COALESCE(internal.internal_ton_km, 0) as internal_ton_km')
            ->selectRaw('COALESCE(internal.internal_distance_wc, 0) as internal_distance_wc')
            ->selectRaw('COALESCE(internal.internal_distance_wo, 0) as internal_distance_wo')
            ->selectRaw('COALESCE(internal.internal_fuel_cost, 0) as internal_fuel_cost')
            ->selectRaw('COALESCE(internal.internal_perdiem, 0) as internal_perdiem')
            ->selectRaw('COALESCE(internal.internal_work_on_going, 0) as internal_work_on_going')
            ->selectRaw('COALESCE(internal.internal_other_cost, 0) as internal_other_cost')
            ->selectRaw('COALESCE(outsource.outsource_trips, 0) as outsource_trips')
            ->selectRaw('COALESCE(outsource.outsource_tonnage, 0) as outsource_tonnage')
            ->selectRaw('COALESCE(outsource.outsource_ton_km, 0) as outsource_ton_km')
            ->selectRaw('COALESCE(outsource.outsource_distance, 0) as outsource_distance')
            ->selectRaw('COALESCE(outsource.outsource_cost, 0) as outsource_cost')
            ->leftJoin('customers', 'customers.id', '=', 'operations.customer_id')
            ->leftJoinSub($internal, 'internal', 'internal.operation_id', '=', 'operations.id')
            ->leftJoinSub($outsource, 'outsource', 'outsource.operation_id', '=', 'operations.id')
            ->when(! empty($operationIds), fn ($q) => $q->whereIn('operations.id', $operationIds))
            ->where(function ($q) {
                $q->whereNotNull('internal.internal_trips')
                    ->orWhereNotNull('outsource.outsource_trips');
            });

        $rows = collect($query->get())->map(function ($row) {
            $internalTrips = (int) ($row->internal_trips ?? 0);
            $outsourceTrips = (int) ($row->outsource_trips ?? 0);
            $internalTonnage = (float) ($row->internal_tonnage ?? 0);
            $outsourceTonnage = (float) ($row->outsource_tonnage ?? 0);
            $internalTonKm = (float) ($row->internal_ton_km ?? 0);
            $outsourceTonKm = (float) ($row->outsource_ton_km ?? 0);
            $internalDistanceWithCargo = (float) ($row->internal_distance_wc ?? 0);
            $internalDistanceWithoutCargo = (float) ($row->internal_distance_wo ?? 0);
            $internalDistance = $internalDistanceWithCargo + $internalDistanceWithoutCargo;
            $outsourceDistance = (float) ($row->outsource_distance ?? 0);
            $internalFuel = (float) ($row->internal_fuel_cost ?? 0);
            $internalPerdiem = (float) ($row->internal_perdiem ?? 0);
            $internalWorkOnGoing = (float) ($row->internal_work_on_going ?? 0);
            $internalOther = (float) ($row->internal_other_cost ?? 0);
            $internalExpense = $internalFuel + $internalPerdiem + $internalWorkOnGoing + $internalOther;
            $outsourceCost = (float) ($row->outsource_cost ?? 0);

            $totalTrips = $internalTrips + $outsourceTrips;
            $totalTonnage = $internalTonnage + $outsourceTonnage;
            $totalTonKm = $internalTonKm + $outsourceTonKm;
            $totalDistance = $internalDistance + $outsourceDistance;

            $tariff = (float) ($row->tariff ?? 0);
            $revenue = $tariff * $totalTonnage;
            $totalCost = $internalExpense + $outsourceCost;
            $profit = $revenue - $totalCost;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;
            $averageKmPerTrip = $totalTrips > 0 ? round($totalDistance / $totalTrips, 2) : null;
            $costPerKm = $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : null;
            $revenuePerTonKm = $totalTonKm > 0 ? round($revenue / $totalTonKm, 2) : null;
            $costPerTonKm = $totalTonKm > 0 ? round($totalCost / $totalTonKm, 2) : null;
            $profitPerTonKm = $totalTonKm > 0 ? round($profit / $totalTonKm, 2) : null;
            $revenuePerTrip = $totalTrips > 0 ? round($revenue / $totalTrips, 2) : null;
            $costPerTrip = $totalTrips > 0 ? round($totalCost / $totalTrips, 2) : null;
            $tonnagePerTrip = $totalTrips > 0 ? round($totalTonnage / $totalTrips, 2) : null;
            $emptyDistanceRatio = $internalDistance > 0 ? round(($internalDistanceWithoutCargo / $internalDistance) * 100, 2) : null;
            $internalFuelCostPerKm = $internalDistance > 0 ? round($internalFuel / $internalDistance, 2) : null;
            $outsourceCostPerKm = $outsourceDistance > 0 ? round($outsourceCost / $outsourceDistance, 2) : null;
            $outsourceTripShare = $totalTrips > 0 ? round(($outsourceTrips / $totalTrips) * 100, 2) : null;
            $outsourceTonnageShare = $totalTonnage > 0 ? round(($outsourceTonnage / $totalTonnage) * 100, 2) : null;

            return [
                'operation_id' => (int) $row->id,
                'customer_id' => $row->customer_id ? (int) $row->customer_id : null,
                'operation_code' => $row->operation_code,
                'customer_name' => $row->customer_name,
                'status' => $row->status,
                'start_date' => $row->startdate,
                'end_date' => $row->enddate,
                'internal_trips' => $internalTrips,
                'outsource_trips' => $outsourceTrips,
                'total_trips' => $totalTrips,
                'internal_tonnage' => round($internalTonnage, 2),
                'outsource_tonnage' => round($outsourceTonnage, 2),
                'total_tonnage' => round($totalTonnage, 2),
                'internal_ton_km' => round($internalTonKm, 2),
                'outsource_ton_km' => round($outsourceTonKm, 2),
                'total_ton_km' => round($totalTonKm, 2),
                'internal_distance_with_cargo' => round($internalDistanceWithCargo, 2),
                'internal_distance_without_cargo' => round($internalDistanceWithoutCargo, 2),
                'internal_distance' => round($internalDistance, 2),
                'outsource_distance' => round($outsourceDistance, 2),
                'total_distance' => round($totalDistance, 2),
                'internal_fuel_cost' => round($internalFuel, 2),
                'internal_perdiem' => round($internalPerdiem, 2),
                'internal_work_on_going' => round($internalWorkOnGoing, 2),
                'internal_other_cost' => round($internalOther, 2),
                'internal_expense' => round($internalExpense, 2),
                'outsource_cost' => round($outsourceCost, 2),
                'total_cost' => round($totalCost, 2),
                'tariff' => round($tariff, 2),
                'revenue' => round($revenue, 2),
                'profit' => round($profit, 2),
                'margin_percent' => $margin,
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
        });

        return $rows->sortByDesc('revenue')->values();
    }

    private function summarise(Collection $rows): array
    {
        $summary = [
            'operation_count' => $rows->count(),
            'internal_trips' => 0,
            'outsource_trips' => 0,
            'total_trips' => 0,
            'internal_tonnage' => 0.0,
            'outsource_tonnage' => 0.0,
            'total_tonnage' => 0.0,
            'internal_ton_km' => 0.0,
            'outsource_ton_km' => 0.0,
            'total_ton_km' => 0.0,
            'internal_distance_with_cargo' => 0.0,
            'internal_distance_without_cargo' => 0.0,
            'internal_distance' => 0.0,
            'outsource_distance' => 0.0,
            'total_distance' => 0.0,
            'internal_fuel_cost' => 0.0,
            'internal_expense' => 0.0,
            'outsource_cost' => 0.0,
            'total_cost' => 0.0,
            'revenue' => 0.0,
            'profit' => 0.0,
            'average_km_per_trip' => null,
            'cost_per_km' => null,
            'revenue_per_ton_km' => null,
            'cost_per_ton_km' => null,
            'profit_per_ton_km' => null,
            'revenue_per_trip' => null,
            'cost_per_trip' => null,
            'tonnage_per_trip' => null,
            'empty_distance_ratio_percent' => null,
            'internal_fuel_cost_per_km' => null,
            'outsource_cost_per_km' => null,
            'outsource_trip_share_percent' => null,
            'outsource_tonnage_share_percent' => null,
        ];

        foreach ($rows as $row) {
            $summary['internal_trips'] += $row['internal_trips'];
            $summary['outsource_trips'] += $row['outsource_trips'];
            $summary['total_trips'] += $row['total_trips'];
            $summary['internal_tonnage'] += $row['internal_tonnage'];
            $summary['outsource_tonnage'] += $row['outsource_tonnage'];
            $summary['total_tonnage'] += $row['total_tonnage'];
            $summary['internal_ton_km'] += $row['internal_ton_km'];
            $summary['outsource_ton_km'] += $row['outsource_ton_km'];
            $summary['total_ton_km'] += $row['total_ton_km'];
            $summary['internal_distance_with_cargo'] += $row['internal_distance_with_cargo'];
            $summary['internal_distance_without_cargo'] += $row['internal_distance_without_cargo'];
            $summary['internal_distance'] += $row['internal_distance'];
            $summary['outsource_distance'] += $row['outsource_distance'];
            $summary['total_distance'] += $row['total_distance'];
            $summary['internal_fuel_cost'] += $row['internal_fuel_cost'];
            $summary['internal_expense'] += $row['internal_expense'];
            $summary['outsource_cost'] += $row['outsource_cost'];
            $summary['total_cost'] += $row['total_cost'];
            $summary['revenue'] += $row['revenue'];
            $summary['profit'] += $row['profit'];
        }

        $summary['internal_tonnage'] = round($summary['internal_tonnage'], 2);
        $summary['outsource_tonnage'] = round($summary['outsource_tonnage'], 2);
        $summary['total_tonnage'] = round($summary['total_tonnage'], 2);
        $summary['internal_ton_km'] = round($summary['internal_ton_km'], 2);
        $summary['outsource_ton_km'] = round($summary['outsource_ton_km'], 2);
        $summary['total_ton_km'] = round($summary['total_ton_km'], 2);
        $summary['internal_distance_with_cargo'] = round($summary['internal_distance_with_cargo'], 2);
        $summary['internal_distance_without_cargo'] = round($summary['internal_distance_without_cargo'], 2);
        $summary['internal_distance'] = round($summary['internal_distance'], 2);
        $summary['outsource_distance'] = round($summary['outsource_distance'], 2);
        $summary['total_distance'] = round($summary['total_distance'], 2);
        $summary['internal_fuel_cost'] = round($summary['internal_fuel_cost'], 2);
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

        $totalInternalDistance = $summary['internal_distance_with_cargo'] + $summary['internal_distance_without_cargo'];

        $summary['empty_distance_ratio_percent'] = $totalInternalDistance > 0
            ? round(($summary['internal_distance_without_cargo'] / $totalInternalDistance) * 100, 2)
            : null;
        $summary['internal_fuel_cost_per_km'] = $totalInternalDistance > 0
            ? round($summary['internal_fuel_cost'] / $totalInternalDistance, 2)
            : null;
        $summary['outsource_cost_per_km'] = $summary['outsource_distance'] > 0
            ? round($summary['outsource_cost'] / $summary['outsource_distance'], 2)
            : null;
        $summary['outsource_trip_share_percent'] = $summary['total_trips'] > 0
            ? round(($summary['outsource_trips'] / $summary['total_trips']) * 100, 2)
            : null;
        $summary['outsource_tonnage_share_percent'] = $summary['total_tonnage'] > 0
            ? round(($summary['outsource_tonnage'] / $summary['total_tonnage']) * 100, 2)
            : null;

        return $summary;
    }

    private function customerHighlights(Collection $rows): array
    {
        return $rows
            ->groupBy('customer_id')
            ->map(function (Collection $group, $customerId) {
                $numericCustomerId = is_numeric($customerId) ? (int) $customerId : null;
                $customerName = $group->first()['customer_name'] ?? 'N/A';
                $operations = $group->count();
                $internalTrips = (int) $group->sum(static fn (array $row) => $row['internal_trips']);
                $outsourceTrips = (int) $group->sum(static fn (array $row) => $row['outsource_trips']);
                $tonnage = round((float) $group->sum(static fn (array $row) => $row['total_tonnage']), 2);
                $revenue = round((float) $group->sum(static fn (array $row) => $row['revenue']), 2);
                $cost = round((float) $group->sum(static fn (array $row) => $row['total_cost']), 2);
                $profit = round((float) $group->sum(static fn (array $row) => $row['profit']), 2);
                $marginPercent = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                return [
                    'customer_id' => $numericCustomerId,
                    'customer_name' => $customerName,
                    'operations' => $operations,
                    'internal_trips' => $internalTrips,
                    'outsource_trips' => $outsourceTrips,
                    'tonnage' => $tonnage,
                    'revenue' => $revenue,
                    'cost' => $cost,
                    'profit' => $profit,
                    'margin_percent' => $marginPercent,
                ];
            })
            ->sortByDesc(static fn (array $row) => $row['revenue'])
            ->take(10)
            ->values()
            ->all();
    }

    private function mixTrend(CarbonInterface $from, CarbonInterface $to, array $operationIds): array
    {
        $connection = DB::connection();
        $driver = $connection->getDriverName();

        $internalPeriodExpression = $driver === 'sqlite'
            ? "strftime('%Y-%m', DateDispach)"
            : "DATE_FORMAT(DateDispach, '%Y-%m')";

        $outsourcePeriodExpression = $driver === 'sqlite'
            ? "strftime('%Y-%m', dispatch_date)"
            : "DATE_FORMAT(dispatch_date, '%Y-%m')";

        $internal = DB::table('performances')
            ->selectRaw("{$internalPeriodExpression} as period")
            ->selectRaw('COUNT(*) as internal_trips')
            ->selectRaw('SUM(COALESCE(CargoVolumMT, 0)) as internal_tonnage')
            ->whereBetween('DateDispach', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($operationIds), fn ($query) => $query->whereIn('operation_id', $operationIds))
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        $outsource = DB::table('outsource_performances')
            ->selectRaw("{$outsourcePeriodExpression} as period")
            ->selectRaw('COUNT(*) as outsource_trips')
            ->selectRaw('SUM(COALESCE(cargo_volume_mt, 0)) as outsource_tonnage')
            ->whereBetween('dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($operationIds), fn ($query) => $query->whereIn('operation_id', $operationIds))
            ->groupBy('period')
            ->get()
            ->keyBy('period');

        return collect($internal->keys())
            ->merge($outsource->keys())
            ->unique()
            ->sort()
            ->map(function (string $period) use ($internal, $outsource) {
                $internalRow = $internal->get($period);
                $outsourceRow = $outsource->get($period);

                $internalTrips = (int) ($internalRow->internal_trips ?? 0);
                $outsourceTrips = (int) ($outsourceRow->outsource_trips ?? 0);
                $internalTonnage = (float) ($internalRow->internal_tonnage ?? 0.0);
                $outsourceTonnage = (float) ($outsourceRow->outsource_tonnage ?? 0.0);

                return [
                    'period' => $period,
                    'internal_trips' => $internalTrips,
                    'outsource_trips' => $outsourceTrips,
                    'total_trips' => $internalTrips + $outsourceTrips,
                    'internal_tonnage' => round($internalTonnage, 2),
                    'outsource_tonnage' => round($outsourceTonnage, 2),
                ];
            })
            ->values()
            ->all();
    }
}

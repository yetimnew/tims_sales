<?php

namespace App\Services\Reports;

use App\Models\Performance;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class RouteProfitabilityReport
{
    /**
     * Build the route profitability dataset grouped by origin-destination pairs.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $originIds = $this->normaliseIds($filters['origin_ids'] ?? []);
        $destinationIds = $this->normaliseIds($filters['destination_ids'] ?? []);

        $rows = $this->fetchRows($from, $to, $originIds, $destinationIds);
        $routeData = $this->groupByRoute($rows);
        $summary = $this->summarise($routeData);

        return [
            'rows' => $routeData,
            'summary' => $summary,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'filters' => [
                'origin_ids' => $originIds,
                'destination_ids' => $destinationIds,
            ],
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $from = $filters['from'] ?? now()->subMonthsNoOverflow(3)->toDateString();
        $to = $filters['to'] ?? now()->toDateString();

        $fromDate = Carbon::parse($from)->startOfDay();
        $toDate = Carbon::parse($to)->endOfDay();

        if ($fromDate->greaterThan($toDate)) {
            [$fromDate, $toDate] = [$toDate->copy()->startOfDay(), $fromDate->copy()->endOfDay()];
        }

        return [$fromDate, $toDate];
    }

    private function normaliseIds(mixed $value): array
    {
        return collect(Arr::wrap($value))
            ->filter(static fn ($id) => $id !== null && $id !== '')
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }

    private function fetchRows(
        CarbonInterface $from,
        CarbonInterface $to,
        array $originIds,
        array $destinationIds,
    ): Collection {
        $query = Performance::query()
            ->with([
                'operation.customer',
                'origin',
                'destination',
            ])
            ->whereBetween('DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->whereNotNull('orgion_id')
            ->whereNotNull('destination_id');

        if (!empty($originIds)) {
            $query->whereIn('orgion_id', $originIds);
        }

        if (!empty($destinationIds)) {
            $query->whereIn('destination_id', $destinationIds);
        }

        return $query->get();
    }

    private function groupByRoute(Collection $performances): Collection
    {
        return $performances
            ->groupBy(function (Performance $performance) {
                $originId = $performance->orgion_id ?? 0;
                $destinationId = $performance->destination_id ?? 0;
                return "{$originId}-{$destinationId}";
            })
            ->map(function (Collection $group, string $routeKey) {
                $first = $group->first();
                $origin = $first->origin;
                $destination = $first->destination;

                $trips = $group->count();
                $tonnage = $group->sum(fn ($p) => (float) ($p->CargoVolumMT ?? 0));
                $tonKm = $group->sum(fn ($p) => (float) ($p->tonkm ?? 0));
                $distanceWithCargo = $group->sum(fn ($p) => (float) ($p->DistanceWCargo ?? 0));
                $distanceWithoutCargo = $group->sum(fn ($p) => (float) ($p->DistanceWOCargo ?? 0));
                $distanceTotal = $distanceWithCargo + $distanceWithoutCargo;
                $fuelCost = $group->sum(fn ($p) => (float) ($p->fuelInBirr ?? 0));
                $perdiem = $group->sum(fn ($p) => (float) ($p->perdiem ?? 0));
                $workOnGoing = $group->sum(fn ($p) => (float) ($p->workOnGoing ?? 0));
                $otherCost = $group->sum(fn ($p) => (float) ($p->other ?? 0));
                $expense = $fuelCost + $perdiem + $workOnGoing + $otherCost;

                // Calculate revenue from operations
                $revenue = $group->sum(function ($p) {
                    $operation = $p->operation;
                    if (!$operation) {
                        return 0;
                    }
                    $tariff = (float) ($operation->tariff ?? 0);
                    $tonKm = (float) ($p->tonkm ?? 0);
                    $tonnage = (float) ($p->CargoVolumMT ?? 0);
                    return $tonKm > 0 ? $tonKm * $tariff : $tonnage * $tariff;
                });

                $profit = $revenue - $expense;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;
                $avgDistance = $trips > 0 ? round($distanceTotal / $trips, 2) : 0;
                $avgTonnage = $trips > 0 ? round($tonnage / $trips, 2) : 0;
                $revenuePerKm = $distanceTotal > 0 ? round($revenue / $distanceTotal, 2) : 0;
                $costPerKm = $distanceTotal > 0 ? round($expense / $distanceTotal, 2) : 0;
                $profitPerKm = $distanceTotal > 0 ? round($profit / $distanceTotal, 2) : 0;

                return [
                    'origin_id' => $origin?->id,
                    'origin_name' => $origin?->name ?? 'Unknown',
                    'destination_id' => $destination?->id,
                    'destination_name' => $destination?->name ?? 'Unknown',
                    'route_key' => $routeKey,
                    'trips' => $trips,
                    'tonnage' => round($tonnage, 2),
                    'ton_km' => round($tonKm, 2),
                    'distance_wc' => round($distanceWithCargo, 2),
                    'distance_wo' => round($distanceWithoutCargo, 2),
                    'distance_total' => round($distanceTotal, 2),
                    'avg_distance' => $avgDistance,
                    'avg_tonnage' => $avgTonnage,
                    'fuel_cost' => round($fuelCost, 2),
                    'perdiem' => round($perdiem, 2),
                    'work_on_going' => round($workOnGoing, 2),
                    'other_cost' => round($otherCost, 2),
                    'expense' => round($expense, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                    'revenue_per_km' => $revenuePerKm,
                    'cost_per_km' => $costPerKm,
                    'profit_per_km' => $profitPerKm,
                ];
            })
            ->filter(static fn (array $route) => $route['trips'] > 0)
            ->values()
            ->sortByDesc('profit')
            ->values();
    }

    private function summarise(Collection $routeData): array
    {
        $totalTrips = $routeData->sum('trips');
        $totalRevenue = $routeData->sum('revenue');
        $totalProfit = $routeData->sum('profit');
        $totalExpense = $routeData->sum('expense');

        return [
            'total_routes' => $routeData->count(),
            'total_trips' => $totalTrips,
            'total_tonnage' => round($routeData->sum('tonnage'), 2),
            'total_ton_km' => round($routeData->sum('ton_km'), 2),
            'total_distance' => round($routeData->sum('distance_total'), 2),
            'total_revenue' => round($totalRevenue, 2),
            'total_expense' => round($totalExpense, 2),
            'total_profit' => round($totalProfit, 2),
            'overall_margin_percent' => $totalRevenue > 0 ? round(($totalProfit / $totalRevenue) * 100, 2) : null,
            'avg_revenue_per_route' => $routeData->count() > 0 ? round($totalRevenue / $routeData->count(), 2) : 0,
            'avg_profit_per_route' => $routeData->count() > 0 ? round($totalProfit / $routeData->count(), 2) : 0,
        ];
    }
}


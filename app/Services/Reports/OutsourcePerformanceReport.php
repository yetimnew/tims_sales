<?php

namespace App\Services\Reports;

use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Performance;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class OutsourcePerformanceReport
{
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $outsourceIds = $this->resolveOutsourceIds($filters);
        $statuses = $this->resolveStatuses($filters);

        $baseline = $this->baseline($from, $to);
        $aggregated = $this->aggregateByOutsource($from, $to, $outsourceIds, $statuses);

        $outsourceDetails = Outsource::query()
            ->select(['id', 'name', 'status'])
            ->whereIn('id', $aggregated->pluck('outsource_id')->all())
            ->get()
            ->keyBy('id');

        $breakdown = $this->buildBreakdown($aggregated, $outsourceDetails, $baseline['cost_per_km']);
        $totals = $this->summariseTotals($breakdown);
        $summary = $this->buildSummary($totals, $baseline);
        $trend = $this->trend($from, $to, $outsourceIds, $statuses);
        $highlights = $this->buildHighlights($breakdown);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'outsource_ids' => $outsourceIds,
            'statuses' => $statuses,
            'baseline' => $baseline,
            'totals' => $totals,
            'summary' => $summary,
            'breakdown' => $breakdown->values()->all(),
            'trend' => $trend,
            'highlights' => $highlights,
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $fromInput = $filters['from'] ?? null;
        $toInput = $filters['to'] ?? null;

        $from = $fromInput ? Carbon::parse($fromInput)->startOfDay() : now()->copy()->subMonths(6)->startOfDay();
        $to = $toInput ? Carbon::parse($toInput)->endOfDay() : now()->copy()->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
    }

    private function resolveOutsourceIds(array $filters): array
    {
        $ids = Arr::wrap($filters['outsource_ids'] ?? $filters['outsource_id'] ?? []);

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

    private function resolveStatuses(array $filters): array
    {
        $statuses = Arr::wrap($filters['statuses'] ?? $filters['status'] ?? []);

        if (is_string($statuses)) {
            $statuses = array_filter(array_map('trim', explode(',', $statuses)));
        }

        return collect($statuses)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();
    }

    private function aggregateByOutsource(
        CarbonInterface $from,
        CarbonInterface $to,
        array $outsourceIds,
        array $statuses
    ): Collection {
        return OutsourcePerformance::query()
            ->select('outsource_id')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(distance_km, 0)) as total_distance_km')
            ->selectRaw('SUM(COALESCE(cost, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(tonkm, 0)) as total_tonkm')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips")
            ->whereBetween('dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($outsourceIds), static fn ($query) => $query->whereIn('outsource_id', $outsourceIds))
            ->when(! empty($statuses), static fn ($query) => $query->whereIn('status', $statuses))
            ->groupBy('outsource_id')
            ->get();
    }

    private function buildBreakdown(Collection $aggregated, Collection $outsourceDetails, ?float $baselineCostPerKm): Collection
    {
        return $aggregated
            ->map(function ($row) use ($outsourceDetails, $baselineCostPerKm) {
                $outsourceId = (int) $row->outsource_id;
                $details = $outsourceDetails->get($outsourceId);

                $trips = (int) $row->trips;
                $distance = (float) $row->total_distance_km;
                $cost = (float) $row->total_cost;
                $tonkm = (float) $row->total_tonkm;
                $completed = (int) $row->completed_trips;

                $costPerKm = $distance > 0 ? round($cost / $distance, 2) : null;
                $costDeltaPerKm = ($baselineCostPerKm !== null && $costPerKm !== null)
                    ? round($costPerKm - $baselineCostPerKm, 2)
                    : null;
                $costDeltaTotal = ($costDeltaPerKm !== null && $distance > 0)
                    ? round($costDeltaPerKm * $distance, 2)
                    : null;

                $completionRate = $trips > 0 ? round(($completed / $trips) * 100, 2) : null;
                $avgCostPerTrip = $trips > 0 ? round($cost / $trips, 2) : null;
                $avgDistancePerTrip = $trips > 0 ? round($distance / $trips, 2) : null;
                $costPerTonKm = $tonkm > 0 ? round($cost / $tonkm, 2) : null;

                return [
                    'outsource_id' => $outsourceId,
                    'name' => $details?->name ?? 'Vendor #'.$outsourceId,
                    'status' => $details?->status,
                    'trips' => $trips,
                    'completed_trips' => $completed,
                    'completion_rate_pct' => $completionRate,
                    'total_distance_km' => round($distance, 2),
                    'total_cost' => round($cost, 2),
                    'total_tonkm' => round($tonkm, 2),
                    'cost_per_km' => $costPerKm,
                    'cost_per_tonkm' => $costPerTonKm,
                    'cost_delta_per_km' => $costDeltaPerKm,
                    'total_cost_delta' => $costDeltaTotal,
                    'average_cost_per_trip' => $avgCostPerTrip,
                    'average_distance_per_trip' => $avgDistancePerTrip,
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
        $totalTrips = (int) $breakdown->sum('trips');
        $completedTrips = (int) $breakdown->sum('completed_trips');
        $totalDistance = (float) $breakdown->sum('total_distance_km');
        $totalCost = (float) $breakdown->sum('total_cost');
        $totalTonKm = (float) $breakdown->sum('total_tonkm');
        $vendorCount = $breakdown->count();

        return [
            'trips' => $totalTrips,
            'completed_trips' => $completedTrips,
            'vendor_count' => $vendorCount,
            'distance_km' => round($totalDistance, 2),
            'cost' => round($totalCost, 2),
            'tonkm' => round($totalTonKm, 2),
            'cost_per_km' => $totalDistance > 0 ? round($totalCost / $totalDistance, 2) : null,
            'average_completion_rate_pct' => $totalTrips > 0 ? round(($completedTrips / $totalTrips) * 100, 2) : null,
        ];
    }

    private function buildSummary(array $totals, array $baseline): array
    {
        $outsourcedCostPerKm = $totals['cost_per_km'];
        $internalCostPerKm = $baseline['cost_per_km'];
        $distance = $totals['distance_km'];

        $costDeltaPerKm = ($outsourcedCostPerKm !== null && $internalCostPerKm !== null)
            ? round($outsourcedCostPerKm - $internalCostPerKm, 2)
            : null;

        $projectedDelta = ($costDeltaPerKm !== null && $distance > 0)
            ? round($costDeltaPerKm * $distance, 2)
            : null;

        $trips = $totals['trips'];

        return [
            'outsourced_cost_per_km' => $outsourcedCostPerKm,
            'internal_cost_per_km' => $internalCostPerKm,
            'cost_delta_per_km' => $costDeltaPerKm,
            'projected_cost_delta' => $projectedDelta,
            'average_cost_per_trip' => $trips > 0 ? round($totals['cost'] / $trips, 2) : null,
            'average_distance_per_trip' => $trips > 0 ? round($distance / $trips, 2) : null,
            'average_completion_rate_pct' => $totals['average_completion_rate_pct'],
            'total_outsourced_cost' => $totals['cost'],
        ];
    }

    private function buildHighlights(Collection $breakdown): array
    {
        $highestCost = $breakdown
            ->filter(static fn (array $row) => $row['cost_per_km'] !== null)
            ->sortByDesc('cost_per_km')
            ->take(3)
            ->values()
            ->all();

        $bestCompletion = $breakdown
            ->filter(static fn (array $row) => $row['completion_rate_pct'] !== null)
            ->sortByDesc('completion_rate_pct')
            ->take(3)
            ->values()
            ->all();

        $largestSpend = $breakdown
            ->sortByDesc('total_cost')
            ->take(3)
            ->values()
            ->all();

        return [
            'highest_cost_per_km' => $highestCost,
            'best_completion_rate' => $bestCompletion,
            'largest_spend' => $largestSpend,
        ];
    }

    private function trend(
        CarbonInterface $from,
        CarbonInterface $to,
        array $outsourceIds,
        array $statuses
    ): array {
        $connection = DB::connection();
        $driverName = $connection->getDriverName();

        $periodExpression = $driverName === 'sqlite'
            ? "strftime('%Y-%m', dispatch_date)"
            : "DATE_FORMAT(dispatch_date, '%Y-%m')";

        return OutsourcePerformance::query()
            ->selectRaw("{$periodExpression} as period")
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(distance_km, 0)) as total_distance_km')
            ->selectRaw('SUM(COALESCE(cost, 0)) as total_cost')
            ->selectRaw('SUM(COALESCE(tonkm, 0)) as total_tonkm')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips")
            ->whereBetween('dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($outsourceIds), static fn ($query) => $query->whereIn('outsource_id', $outsourceIds))
            ->when(! empty($statuses), static fn ($query) => $query->whereIn('status', $statuses))
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(static function ($row) {
                $distance = (float) $row->total_distance_km;
                $cost = (float) $row->total_cost;
                $trips = (int) $row->trips;
                $completed = (int) $row->completed_trips;
                $tonkm = (float) $row->total_tonkm;

                return [
                    'period' => $row->period,
                    'trips' => $trips,
                    'total_distance_km' => round($distance, 2),
                    'total_cost' => round($cost, 2),
                    'total_tonkm' => round($tonkm, 2),
                    'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : null,
                    'cost_per_tonkm' => $tonkm > 0 ? round($cost / $tonkm, 2) : null,
                    'completion_rate_pct' => $trips > 0 ? round(($completed / $trips) * 100, 2) : null,
                ];
            })
            ->values()
            ->all();
    }

    private function baseline(CarbonInterface $from, CarbonInterface $to): array
    {
        $internal = Performance::query()
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)) as total_distance_km')
            ->selectRaw('SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(other, 0)) as total_cost')
            ->whereBetween('DateDispach', [$from->toDateString(), $to->toDateString()])
            ->first();

        $distance = (float) ($internal->total_distance_km ?? 0.0);
        $cost = (float) ($internal->total_cost ?? 0.0);
        $trips = (int) ($internal->trips ?? 0);

        return [
            'trip_count' => $trips,
            'distance_km' => round($distance, 2),
            'cost' => round($cost, 2),
            'cost_per_km' => $distance > 0 ? round($cost / $distance, 2) : null,
        ];
    }
}

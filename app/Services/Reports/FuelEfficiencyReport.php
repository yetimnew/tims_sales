<?php

namespace App\Services\Reports;

use App\Models\FuelRecord;
use App\Models\Truck;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FuelEfficiencyReport
{
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $truckIds = $this->resolveTruckIds($filters);

        $aggregated = $this->aggregateByTruck($from, $to, $truckIds);
        $truckDetails = Truck::query()
            ->select(['id', 'plate', 'status'])
            ->whereIn('id', $aggregated->pluck('truck_id')->all())
            ->get()
            ->keyBy('id');

        $breakdown = $this->buildBreakdown($aggregated, $truckDetails);
        $totals = $this->summariseTotals($breakdown);
        $summary = $this->buildSummary($breakdown, $totals);
        $trend = $this->trend($from, $to, $truckIds);
        $highlights = $this->buildHighlights($breakdown);

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'truck_ids' => $truckIds,
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
        return FuelRecord::query()
            ->select('truck_id')
            ->selectRaw('COUNT(*) as refuel_events')
            ->selectRaw('SUM(COALESCE(fuel_quantity_liters, 0)) as total_liters')
            ->selectRaw('SUM(COALESCE(total_cost, 0)) as total_cost')
            ->selectRaw('MIN(fuel_date) as first_fill')
            ->selectRaw('MAX(fuel_date) as last_fill')
            ->selectRaw('MIN(odometer_reading) as min_odometer')
            ->selectRaw('MAX(odometer_reading) as max_odometer')
            ->whereBetween('fuel_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($truckIds), static fn ($query) => $query->whereIn('truck_id', $truckIds))
            ->groupBy('truck_id')
            ->get();
    }

    private function buildBreakdown(Collection $aggregated, Collection $truckDetails): Collection
    {
        return $aggregated
            ->map(function ($row) use ($truckDetails) {
                $truckId = (int) $row->truck_id;
                $truck = $truckDetails->get($truckId);

                $refuelEvents = (int) $row->refuel_events;
                $totalLiters = (float) $row->total_liters;
                $totalCost = (float) $row->total_cost;

                $minOdometer = $row->min_odometer !== null ? (float) $row->min_odometer : null;
                $maxOdometer = $row->max_odometer !== null ? (float) $row->max_odometer : null;
                $distance = null;

                if ($minOdometer !== null && $maxOdometer !== null && $maxOdometer >= $minOdometer) {
                    $distance = $maxOdometer - $minOdometer;
                }

                $distanceValue = $distance !== null ? round($distance, 2) : null;
                $efficiency = ($distance !== null && $totalLiters > 0)
                    ? round($distance / $totalLiters, 2)
                    : null;

                $costPerKm = ($distance !== null && $distance > 0)
                    ? round($totalCost / $distance, 2)
                    : null;

                $costPerLiter = $totalLiters > 0
                    ? round($totalCost / $totalLiters, 2)
                    : null;

                $avgLitersPerEvent = $refuelEvents > 0
                    ? round($totalLiters / $refuelEvents, 2)
                    : null;

                $avgCostPerEvent = $refuelEvents > 0
                    ? round($totalCost / $refuelEvents, 2)
                    : null;

                return [
                    'truck_id' => $truckId,
                    'plate' => $truck?->plate ?? 'Truck #'.$truckId,
                    'status' => $truck?->status,
                    'refuel_events' => $refuelEvents,
                    'total_liters' => round($totalLiters, 2),
                    'total_cost' => round($totalCost, 2),
                    'distance_km' => $distanceValue,
                    'efficiency_km_per_liter' => $efficiency,
                    'cost_per_km' => $costPerKm,
                    'cost_per_liter' => $costPerLiter,
                    'avg_liters_per_event' => $avgLitersPerEvent,
                    'avg_cost_per_event' => $avgCostPerEvent,
                    'first_fill_on' => $row->first_fill ? Carbon::parse($row->first_fill)->toDateString() : null,
                    'last_fill_on' => $row->last_fill ? Carbon::parse($row->last_fill)->toDateString() : null,
                    'has_distance' => $distance !== null,
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
        $totalLiters = (float) $breakdown->sum('total_liters');
        $totalCost = (float) $breakdown->sum('total_cost');
        $totalDistance = (float) $breakdown->reduce(
            static fn (float $carry, array $row) => $carry + ($row['distance_km'] ?? 0.0),
            0.0
        );
        $refuelEvents = (int) $breakdown->sum('refuel_events');

        return [
            'total_liters' => round($totalLiters, 2),
            'total_cost' => round($totalCost, 2),
            'total_distance_km' => round($totalDistance, 2),
            'refuel_events' => $refuelEvents,
            'truck_count' => $breakdown->count(),
        ];
    }

    private function buildSummary(Collection $breakdown, array $totals): array
    {
        $totalLiters = $totals['total_liters'];
        $totalCost = $totals['total_cost'];
        $totalDistance = $totals['total_distance_km'];
        $refuelEvents = $totals['refuel_events'];

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
            'average_liters_per_event' => $refuelEvents > 0
                ? round($totalLiters / $refuelEvents, 2)
                : null,
            'average_cost_per_event' => $refuelEvents > 0
                ? round($totalCost / $refuelEvents, 2)
                : null,
            'average_distance_per_event' => ($refuelEvents > 0 && $totalDistance > 0)
                ? round($totalDistance / $refuelEvents, 2)
                : null,
        ];
    }

    private function trend(CarbonInterface $from, CarbonInterface $to, array $truckIds): array
    {
        $connection = DB::connection();
        $driverName = $connection->getDriverName();

        $periodExpression = $driverName === 'sqlite'
            ? "strftime('%Y-%m', fuel_date)"
            : "DATE_FORMAT(fuel_date, '%Y-%m')";

        return FuelRecord::query()
            ->selectRaw("{$periodExpression} as period")
            ->selectRaw('SUM(COALESCE(fuel_quantity_liters, 0)) as total_liters')
            ->selectRaw('SUM(COALESCE(total_cost, 0)) as total_cost')
            ->selectRaw('COUNT(*) as refuel_events')
            ->whereBetween('fuel_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($truckIds), static fn ($query) => $query->whereIn('truck_id', $truckIds))
            ->groupBy('period')
            ->orderBy('period')
            ->get()
            ->map(static function ($row) {
                $totalLiters = (float) $row->total_liters;
                $totalCost = (float) $row->total_cost;
                $events = (int) $row->refuel_events;

                return [
                    'period' => $row->period,
                    'total_liters' => round($totalLiters, 2),
                    'total_cost' => round($totalCost, 2),
                    'average_price_per_liter' => $totalLiters > 0 ? round($totalCost / $totalLiters, 2) : null,
                    'refuel_events' => $events,
                    'average_liters_per_event' => $events > 0 ? round($totalLiters / $events, 2) : null,
                ];
            })
            ->values()
            ->all();
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

        return [
            'best_efficiency' => $bestEfficiency,
            'highest_cost_per_km' => $highestCostPerKm,
        ];
    }
}

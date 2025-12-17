<?php

namespace App\Services\Reports;

use App\Models\Performance;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class LoadFactorUtilizationReport
{
    /**
     * Build the load factor and utilization analysis dataset.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $truckIds = $this->normaliseIds($filters['truck_ids'] ?? []);
        $driverIds = $this->normaliseIds($filters['driver_ids'] ?? []);
        $groupBy = $filters['group_by'] ?? 'overall'; // overall, truck, driver, route

        $rows = $this->fetchRows($from, $to, $truckIds, $driverIds);
        $groupedData = $this->groupData($rows, $groupBy);
        $summary = $this->summarise($rows);

        return [
            'rows' => $groupedData,
            'summary' => $summary,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'group_by' => $groupBy,
            'filters' => [
                'truck_ids' => $truckIds,
                'driver_ids' => $driverIds,
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
        array $truckIds,
        array $driverIds,
    ): Collection {
        $query = Performance::query()
            ->with([
                'driverTruck.driver',
                'driverTruck.truck.vehicleType',
                'origin',
                'destination',
            ])
            ->whereBetween('DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()]);

        if (! empty($truckIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($truckIds) {
                $builder->whereIn('truck_id', $truckIds);
            });
        }

        if (! empty($driverIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($driverIds) {
                $builder->whereIn('driver_id', $driverIds);
            });
        }

        return $query->get();
    }

    private function groupData(Collection $performances, string $groupBy): Collection
    {
        if ($groupBy === 'overall') {
            return collect([$this->calculateMetrics($performances, 'Overall', null, null, null, null)]);
        }

        $groupKey = match ($groupBy) {
            'truck' => fn ($p) => $p->driverTruck?->truck?->id ?? 0,
            'driver' => fn ($p) => $p->driverTruck?->driver?->id ?? 0,
            'route' => fn ($p) => ($p->orgion_id ?? 0).'-'.($p->destination_id ?? 0),
            default => fn ($p) => 'overall',
        };

        $labelKey = match ($groupBy) {
            'truck' => fn ($p) => $p->driverTruck?->truck?->plate ?? 'Unknown',
            'driver' => fn ($p) => $p->driverTruck?->driver?->name ?? 'Unassigned',
            'route' => fn ($p) => ($p->origin?->name ?? 'Unknown').' → '.($p->destination?->name ?? 'Unknown'),
            default => fn ($p) => 'Overall',
        };

        return $performances
            ->groupBy($groupKey)
            ->map(function (Collection $group, $key) use ($groupBy, $labelKey) {
                $first = $group->first();
                $label = $labelKey($first);
                $truckId = $groupBy === 'truck' ? (int) $key : null;
                $driverId = $groupBy === 'driver' ? (int) $key : null;
                if ($groupBy === 'route') {
                    $parts = explode('-', (string) $key);
                    $originId = isset($parts[0]) ? (int) $parts[0] : null;
                    $destinationId = isset($parts[1]) ? (int) $parts[1] : null;
                } else {
                    $originId = null;
                    $destinationId = null;
                }

                return $this->calculateMetrics($group, $label, $truckId, $driverId, $originId, $destinationId);
            })
            ->filter(static fn (array $item) => $item['trips'] > 0)
            ->values()
            ->sortByDesc('load_factor_percent')
            ->values();
    }

    private function calculateMetrics(
        Collection $performances,
        string $label,
        ?int $truckId,
        ?int $driverId,
        ?int $originId,
        ?int $destinationId,
    ): array {
        $trips = $performances->count();
        $distanceLoaded = $performances->sum(fn ($p) => (float) ($p->DistanceWCargo ?? 0));
        $distanceEmpty = $performances->sum(fn ($p) => (float) ($p->DistanceWOCargo ?? 0));
        $distanceTotal = $distanceLoaded + $distanceEmpty;
        $tonnage = $performances->sum(fn ($p) => (float) ($p->CargoVolumMT ?? 0));
        $tonKm = $performances->sum(fn ($p) => (float) ($p->tonkm ?? 0));

        $loadFactorPercent = $distanceTotal > 0 ? round(($distanceLoaded / $distanceTotal) * 100, 2) : 0;
        $emptyMilesPercent = $distanceTotal > 0 ? round(($distanceEmpty / $distanceTotal) * 100, 2) : 0;
        $deadheadRatio = $distanceLoaded > 0 ? round($distanceEmpty / $distanceLoaded, 2) : ($distanceEmpty > 0 ? 999.99 : 0);
        $avgDistancePerTrip = $trips > 0 ? round($distanceTotal / $trips, 2) : 0;
        $avgTonnagePerTrip = $trips > 0 ? round($tonnage / $trips, 2) : 0;
        $utilizationRate = $distanceTotal > 0 ? round(($tonKm / $distanceTotal) * 100, 2) : 0;

        return [
            'label' => $label,
            'truck_id' => $truckId,
            'driver_id' => $driverId,
            'origin_id' => $originId,
            'destination_id' => $destinationId,
            'trips' => $trips,
            'distance_loaded' => round($distanceLoaded, 2),
            'distance_empty' => round($distanceEmpty, 2),
            'distance_total' => round($distanceTotal, 2),
            'tonnage' => round($tonnage, 2),
            'ton_km' => round($tonKm, 2),
            'load_factor_percent' => $loadFactorPercent,
            'empty_miles_percent' => $emptyMilesPercent,
            'deadhead_ratio' => $deadheadRatio,
            'avg_distance_per_trip' => $avgDistancePerTrip,
            'avg_tonnage_per_trip' => $avgTonnagePerTrip,
            'utilization_rate' => $utilizationRate,
        ];
    }

    private function summarise(Collection $performances): array
    {
        $totalTrips = $performances->count();
        $distanceLoaded = $performances->sum(fn ($p) => (float) ($p->DistanceWCargo ?? 0));
        $distanceEmpty = $performances->sum(fn ($p) => (float) ($p->DistanceWOCargo ?? 0));
        $distanceTotal = $distanceLoaded + $distanceEmpty;
        $tonnage = $performances->sum(fn ($p) => (float) ($p->CargoVolumMT ?? 0));
        $tonKm = $performances->sum(fn ($p) => (float) ($p->tonkm ?? 0));

        $overallLoadFactor = $distanceTotal > 0 ? round(($distanceLoaded / $distanceTotal) * 100, 2) : 0;
        $overallEmptyMiles = $distanceTotal > 0 ? round(($distanceEmpty / $distanceTotal) * 100, 2) : 0;
        $overallDeadheadRatio = $distanceLoaded > 0 ? round($distanceEmpty / $distanceLoaded, 2) : 0;
        $overallUtilizationRate = $distanceTotal > 0 ? round(($tonKm / $distanceTotal) * 100, 2) : 0;

        return [
            'total_trips' => $totalTrips,
            'total_distance_loaded' => round($distanceLoaded, 2),
            'total_distance_empty' => round($distanceEmpty, 2),
            'total_distance' => round($distanceTotal, 2),
            'total_tonnage' => round($tonnage, 2),
            'total_ton_km' => round($tonKm, 2),
            'overall_load_factor_percent' => $overallLoadFactor,
            'overall_empty_miles_percent' => $overallEmptyMiles,
            'overall_deadhead_ratio' => $overallDeadheadRatio,
            'overall_utilization_rate' => $overallUtilizationRate,
        ];
    }
}

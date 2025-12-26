<?php

namespace App\Services\Reports;

use App\Models\Performance;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class PerformanceAllReport
{
    private const DEFAULT_LIMIT = 200;

    private const DEFAULT_EXPORT_LIMIT = 2000;

    private const MAX_LIMIT = 1000;

    private const MAX_EXPORT_LIMIT = 5000;

    /**
     * Build the full performance dataset respecting filters and limits.
     */
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $driverIds = $this->normaliseIds($filters['driver_ids'] ?? []);
        $truckIds = $this->normaliseIds($filters['truck_ids'] ?? []);
        $operationIds = $this->normaliseIds($filters['operation_ids'] ?? []);
        $loadPhase = $this->normaliseLoadPhase($filters['load_phase'] ?? null);
        $isExport = $this->isExportRequest($filters);
        $perPage = $this->resolvePerPage($filters['per_page'] ?? null, $isExport);

        $paginator = $this->fetchPaginatedRows($from, $to, $driverIds, $truckIds, $operationIds, $loadPhase, $perPage);

        // Get the collection for summary calculations
        $rows = $paginator->getCollection();
        $summary = $this->summarise($rows);
        $highlights = $this->buildHighlights($rows);

        return [
            'paginator' => $paginator, // Return the full paginator for Inertia
            'summary' => $summary,
            'highlights' => $highlights,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'filters' => [
                'driver_ids' => $driverIds,
                'truck_ids' => $truckIds,
                'operation_ids' => $operationIds,
                'load_phase' => $loadPhase,
                'per_page' => $perPage,
            ],
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

    private function resolveLimit(?int $limit, bool $isExport): int
    {
        $default = $isExport ? self::DEFAULT_EXPORT_LIMIT : self::DEFAULT_LIMIT;
        $max = $isExport ? self::MAX_EXPORT_LIMIT : self::MAX_LIMIT;

        if ($limit === null) {
            return $default;
        }

        $bounded = max(50, min($limit, $max));

        return $bounded;
    }

    private function resolvePerPage(?int $perPage, bool $isExport): int
    {
        if ($isExport) {
            return $this->resolveLimit(null, true);
        }

        if ($perPage === null) {
            return 50; // Default per page
        }

        // Allow 10, 25, 50, 100, 200
        return max(10, min($perPage, 200));
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

    private function normaliseLoadPhase(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $phase = strtolower(trim($value));

        return in_array($phase, ['main', 'return'], true) ? $phase : null;
    }

    private function fetchRows(
        CarbonInterface $from,
        CarbonInterface $to,
        array $driverIds,
        array $truckIds,
        array $operationIds,
        ?string $loadPhase,
        int $limit,
    ): Collection {
        $query = Performance::query()
            ->with([
                'operation.customer',
                'driverTruck.driver',
                'driverTruck.truck.vehicleType',
                'origin',
                'destination',
            ])
            ->whereBetween('DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->orderByDesc('DateDispach');

        if (! empty($driverIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($driverIds) {
                $builder->whereIn('driver_id', $driverIds);
            });
        }

        if (! empty($truckIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($truckIds) {
                $builder->whereIn('truck_id', $truckIds);
            });
        }

        if (! empty($operationIds)) {
            $query->whereIn('operation_id', $operationIds);
        }

        if ($loadPhase !== null) {
            $query->where('load_phase', $loadPhase);
        }

        return $query
            ->limit($limit)
            ->get()
            ->map(function (Performance $performance) {
                $driver = $performance->driverTruck?->driver;
                $truck = $performance->driverTruck?->truck;
                $vehicleType = $truck?->vehicleType;
                $operation = $performance->operation;
                $customer = $operation?->customer;
                $origin = $performance->origin;
                $destination = $performance->destination;

                $tonnage = (float) ($performance->CargoVolumMT ?? 0);
                $tonKm = (float) ($performance->tonkm ?? 0);
                $distanceWithCargo = (float) ($performance->DistanceWCargo ?? 0);
                $distanceWithoutCargo = (float) ($performance->DistanceWOCargo ?? 0);
                $distanceTotal = $distanceWithCargo + $distanceWithoutCargo;
                $fuelLitres = (float) ($performance->fuelInLitter ?? 0);
                $fuelCost = (float) ($performance->fuelInBirr ?? 0);
                $perdiem = (float) ($performance->perdiem ?? 0);
                $workOnGoing = (float) ($performance->workOnGoing ?? 0);
                $otherCost = (float) ($performance->other ?? 0);
                $expense = $fuelCost + $perdiem + $workOnGoing + $otherCost;
                $tariff = (float) ($operation?->tariff ?? 0);
                $revenue = $tonKm > 0 ? $tonKm * $tariff : $tonnage * $tariff;
                $profit = $revenue - $expense;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                return [
                    'id' => $performance->id,
                    'fo_number' => $performance->FOnumber ?? '—',
                    'dispatch_date' => $performance->DateDispach?->toDateString(),
                    'driver_id' => $driver?->id,
                    'driver_name' => $driver?->name ?? 'Unassigned',
                    'driver_status' => $driver?->status,
                    'truck_id' => $truck?->id,
                    'truck_plate' => $truck?->plate ?? '—',
                    'truck_status' => $truck?->status,
                    'vehicle_type' => $vehicleType?->name,
                    'operation_id' => $operation?->id,
                    'operation_code' => $operation?->operationid ?? '—',
                    'operation_status' => $operation?->status,
                    'customer_name' => $customer?->name,
                    'origin_name' => $origin?->name ?? '—',
                    'destination_name' => $destination?->name ?? '—',
                    'tonnage' => round($tonnage, 2),
                    'ton_km' => round($tonKm, 2),
                    'distance_wc' => round($distanceWithCargo, 2),
                    'distance_wo' => round($distanceWithoutCargo, 2),
                    'distance_total' => round($distanceTotal, 2),
                    'fuel_litres' => round($fuelLitres, 2),
                    'fuel_cost' => round($fuelCost, 2),
                    'perdiem' => round($perdiem, 2),
                    'work_on_going' => round($workOnGoing, 2),
                    'other_cost' => round($otherCost, 2),
                    'expense' => round($expense, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                ];
            })
            ->values();
    }

    private function fetchPaginatedRows(
        CarbonInterface $from,
        CarbonInterface $to,
        array $driverIds,
        array $truckIds,
        array $operationIds,
        ?string $loadPhase,
        int $perPage,
    ) {
        $query = Performance::query()
            ->with([
                'operation.customer',
                'driverTruck.driver',
                'driverTruck.truck.vehicleType',
                'origin',
                'destination',
            ])
            ->whereBetween('DateDispach', [$from->toDateTimeString(), $to->toDateTimeString()])
            ->orderByDesc('DateDispach');

        if (! empty($driverIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($driverIds) {
                $builder->whereIn('driver_id', $driverIds);
            });
        }

        if (! empty($truckIds)) {
            $query->whereHas('driverTruck', static function ($builder) use ($truckIds) {
                $builder->whereIn('truck_id', $truckIds);
            });
        }

        if (! empty($operationIds)) {
            $query->whereIn('operation_id', $operationIds);
        }

        if ($loadPhase !== null) {
            $query->where('load_phase', $loadPhase);
        }

        $paginator = $query->paginate($perPage);

        // Transform the paginated items
        $paginator->getCollection()->transform(function (Performance $performance) {
            $driver = $performance->driverTruck?->driver;
            $truck = $performance->driverTruck?->truck;
            $vehicleType = $truck?->vehicleType;
            $operation = $performance->operation;
            $customer = $operation?->customer;
            $origin = $performance->origin;
            $destination = $performance->destination;

            $tonnage = (float) ($performance->CargoVolumMT ?? 0);
            $tonKm = (float) ($performance->tonkm ?? 0);
            $distanceWithCargo = (float) ($performance->DistanceWCargo ?? 0);
            $distanceWithoutCargo = (float) ($performance->DistanceWOCargo ?? 0);
            $distanceTotal = $distanceWithCargo + $distanceWithoutCargo;
            $fuelLitres = (float) ($performance->fuelInLitter ?? 0);
            $fuelCost = (float) ($performance->fuelInBirr ?? 0);
            $perdiem = (float) ($performance->perdiem ?? 0);
            $workOnGoing = (float) ($performance->workOnGoing ?? 0);
            $otherCost = (float) ($performance->other ?? 0);
            $expense = $fuelCost + $perdiem + $workOnGoing + $otherCost;
            $tariff = (float) ($operation?->tariff ?? 0);
            $revenue = $tonKm > 0 ? $tonKm * $tariff : $tonnage * $tariff;
            $profit = $revenue - $expense;
            $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

            return [
                'id' => $performance->id,
                'fo_number' => $performance->FOnumber ?? '—',
                'dispatch_date' => $performance->DateDispach?->toDateString(),
                'driver_id' => $driver?->id,
                'driver_name' => $driver?->name ?? 'Unassigned',
                'driver_status' => $driver?->status,
                'truck_id' => $truck?->id,
                'truck_plate' => $truck?->plate ?? '—',
                'truck_status' => $truck?->status,
                'vehicle_type' => $vehicleType?->type,
                'operation_code' => $operation?->operationid ?? 'OP-'.$performance->operation_id,
                'customer_name' => $customer?->name,
                'origin_id' => $origin?->id,
                'origin_name' => $origin?->name ?? '—',
                'destination_id' => $destination?->id,
                'destination_name' => $destination?->name ?? '—',
                'tonnage' => round($tonnage, 2),
                'ton_km' => round($tonKm, 2),
                'distance_wc' => round($distanceWithCargo, 2),
                'distance_wo' => round($distanceWithoutCargo, 2),
                'distance_total' => round($distanceTotal, 2),
                'fuel_litres' => round($fuelLitres, 2),
                'fuel_cost' => round($fuelCost, 2),
                'perdiem' => round($perdiem, 2),
                'work_on_going' => round($workOnGoing, 2),
                'other_cost' => round($otherCost, 2),
                'expense' => round($expense, 2),
                'revenue' => round($revenue, 2),
                'profit' => round($profit, 2),
                'margin_percent' => $margin,
            ];
        });

        return $paginator;
    }

    private function summarise(Collection $rows): array
    {
        $revenue = $rows->sum('revenue');
        $profit = $rows->sum('profit');

        return [
            'records' => $rows->count(),
            'tonnage' => round($rows->sum('tonnage'), 2),
            'ton_km' => round($rows->sum('ton_km'), 2),
            'distance_wc' => round($rows->sum('distance_wc'), 2),
            'distance_wo' => round($rows->sum('distance_wo'), 2),
            'distance_total' => round($rows->sum('distance_total'), 2),
            'fuel_litres' => round($rows->sum('fuel_litres'), 2),
            'fuel_cost' => round($rows->sum('fuel_cost'), 2),
            'perdiem' => round($rows->sum('perdiem'), 2),
            'work_on_going' => round($rows->sum('work_on_going'), 2),
            'other_cost' => round($rows->sum('other_cost'), 2),
            'expense' => round($rows->sum('expense'), 2),
            'revenue' => round($revenue, 2),
            'profit' => round($profit, 2),
            'margin_percent' => $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null,
        ];
    }

    private function buildHighlights(Collection $rows): array
    {
        return [
            'top_drivers' => $this->rankBy($rows, 'driver_id', 'driver_name'),
            'top_trucks' => $this->rankBy($rows, 'truck_id', 'truck_plate'),
            'top_destinations' => $this->rankBy($rows, 'destination_name', 'destination_name'),
        ];
    }

    private function rankBy(Collection $rows, string $groupKey, string $labelKey, int $limit = 3): array
    {
        return $rows
            ->groupBy($groupKey)
            ->map(function (Collection $group) use ($labelKey) {
                $label = $group->first()[$labelKey] ?? '—';

                return [
                    'label' => $label,
                    'records' => $group->count(),
                    'revenue' => round($group->sum('revenue'), 2),
                    'profit' => round($group->sum('profit'), 2),
                ];
            })
            ->filter(static fn (array $item) => $item['label'] !== '—' && $item['records'] > 0)
            ->values()
            ->sortByDesc('revenue')
            ->take($limit)
            ->all();
    }

    private function isExportRequest(array $filters): bool
    {
        if (! isset($filters['format'])) {
            return false;
        }

        return in_array($filters['format'], ['csv', 'xlsx', 'pdf'], true);
    }
}

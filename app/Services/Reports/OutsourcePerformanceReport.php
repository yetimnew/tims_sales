<?php

namespace App\Services\Reports;

use App\Models\OutsourcePerformance;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;

class OutsourcePerformanceReport
{
    private const DEFAULT_LIMIT = 200;

    private const DEFAULT_EXPORT_LIMIT = 2000;

    private const MAX_LIMIT = 1000;

    private const MAX_EXPORT_LIMIT = 5000;

    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $outsourceIds = $this->normaliseIds($filters['outsource_ids'] ?? []);
        $operationIds = $this->normaliseIds($filters['operation_ids'] ?? []);
        $destinationIds = $this->normaliseIds($filters['destination_ids'] ?? []);
        $statuses = $this->normaliseStrings($filters['statuses'] ?? []);
        $isExport = $this->isExportRequest($filters);
        $limit = $this->resolveLimit($filters['limit'] ?? null, $isExport);

        $rows = $this->fetchRows($from, $to, $outsourceIds, $operationIds, $destinationIds, $statuses, $limit);
        $summary = $this->summarise($rows);
        $highlights = $this->buildHighlights($rows);

        return [
            'rows' => $rows,
            'summary' => $summary,
            'highlights' => $highlights,
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'filters' => [
                'outsource_ids' => $outsourceIds,
                'operation_ids' => $operationIds,
                'destination_ids' => $destinationIds,
                'statuses' => $statuses,
                'limit' => $limit,
            ],
        ];
    }

    private function resolveDateRange(array $filters): array
    {
        $fromInput = $filters['from'] ?? null;
        $toInput = $filters['to'] ?? null;

        $from = $fromInput ? Carbon::parse($fromInput)->startOfDay() : now()->copy()->subMonths(1)->startOfDay();
        $to = $toInput ? Carbon::parse($toInput)->endOfDay() : now()->copy()->endOfDay();

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        return [$from, $to];
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

    private function normaliseStrings(mixed $value): array
    {
        return collect(Arr::wrap($value))
            ->filter(static fn ($item) => $item !== null && $item !== '')
            ->map(static fn ($item) => (string) $item)
            ->unique()
            ->values()
            ->all();
    }

    private function fetchRows(
        CarbonInterface $from,
        CarbonInterface $to,
        array $outsourceIds,
        array $operationIds,
        array $destinationIds,
        array $statuses,
        int $limit,
    ): Collection {
        return OutsourcePerformance::query()
            ->with([
                'outsource',
                'operation.customer',
                'fromPlace',
                'toPlace',
            ])
            ->whereBetween('dispatch_date', [$from->toDateString(), $to->toDateString()])
            ->when(! empty($outsourceIds), static fn ($query) => $query->whereIn('outsource_id', $outsourceIds))
            ->when(! empty($operationIds), static fn ($query) => $query->whereIn('operation_id', $operationIds))
            ->when(! empty($destinationIds), static fn ($query) => $query->whereIn('to_place_id', $destinationIds))
            ->when(! empty($statuses), static fn ($query) => $query->whereIn('status', $statuses))
            ->orderByDesc('dispatch_date')
            ->limit($limit)
            ->get()
            ->map(function (OutsourcePerformance $performance) {
                $vendor = $performance->outsource;
                $operation = $performance->operation;
                $customer = $operation?->customer;
                $origin = $performance->fromPlace;
                $destination = $performance->toPlace;

                $tonnage = (float) ($performance->cargo_volume_mt ?? 0);
                $tonKm = (float) ($performance->tonkm ?? 0);
                $distance = (float) ($performance->distance_km ?? 0);
                $expense = (float) ($performance->cost ?? 0);

                $tariff = (float) ($operation?->tariff ?? 0);
                $revenue = $tonKm > 0 ? $tonKm * $tariff : $tonnage * $tariff;
                $profit = $revenue - $expense;
                $margin = $revenue > 0 ? round(($profit / $revenue) * 100, 2) : null;

                return [
                    'id' => $performance->id,
                    'outsource_id' => $performance->outsource_id,
                    'fo_number' => $performance->trip_number ?? '—',
                    'dispatch_date' => $performance->dispatch_date?->toDateString(),
                    'driver_id' => $vendor?->id,
                    'driver_name' => $vendor?->name ?? 'Unnamed vendor',
                    'driver_status' => $vendor?->status,
                    'truck_id' => null,
                    'truck_plate' => $vendor?->status ?? '—',
                    'truck_status' => $vendor?->status,
                    'vehicle_type' => null,
                    'operation_id' => $operation?->id,
                    'operation_code' => $operation?->operationid ?? '—',
                    'operation_status' => $operation?->status,
                    'customer_name' => $customer?->name,
                    'origin_name' => $origin?->name ?? '—',
                    'destination_name' => $destination?->name ?? '—',
                    'tonnage' => round($tonnage, 2),
                    'ton_km' => round($tonKm, 2),
                    'distance_wc' => round($distance, 2),
                    'distance_wo' => 0.0,
                    'distance_total' => round($distance, 2),
                    'fuel_litres' => 0.0,
                    'fuel_cost' => 0.0,
                    'perdiem' => 0.0,
                    'work_on_going' => 0.0,
                    'other_cost' => round($expense, 2),
                    'expense' => round($expense, 2),
                    'revenue' => round($revenue, 2),
                    'profit' => round($profit, 2),
                    'margin_percent' => $margin,
                ];
            })
            ->values();
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
            'top_vendors' => $this->rankBy($rows, 'outsource_id', 'driver_name'),
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

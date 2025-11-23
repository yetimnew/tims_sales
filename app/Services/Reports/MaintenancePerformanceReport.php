<?php

namespace App\Services\Reports;

use App\Models\MaintenanceType;
use App\Models\Truck;
use App\Models\VehicleMaintenanceRecord;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class MaintenancePerformanceReport
{
    public function build(array $filters): array
    {
        [$from, $to] = $this->resolveDateRange($filters);
        $truckIds = $this->resolveIds($filters, 'truck_ids', 'truck_id');
        $maintenanceTypeIds = $this->resolveIds($filters, 'maintenance_type_ids', 'maintenance_type_id');
        $statuses = $this->resolveStrings($filters, 'statuses', 'status');
        $serviceProviders = $this->resolveStrings($filters, 'service_providers', 'service_provider');

        $fromDate = $from->toDateString();
        $toDate = $to->toDateString();

        $truckAggregation = $this->aggregateByTruck($fromDate, $toDate, $truckIds, $maintenanceTypeIds, $statuses, $serviceProviders);
        $truckDetails = $this->getTruckDetails($truckAggregation->pluck('truck_id')->all());
        $truckBreakdown = $this->buildTruckBreakdown($truckAggregation, $truckDetails);

        $typeAggregation = $this->aggregateByType($fromDate, $toDate, $truckIds, $maintenanceTypeIds, $statuses, $serviceProviders);
        $typeDetails = $this->getTypeDetails($typeAggregation->pluck('maintenance_type_id')->all());
        $typeBreakdown = $this->buildTypeBreakdown($typeAggregation, $typeDetails);

        $totals = $this->summariseTotals($truckBreakdown, $typeBreakdown);
        $summary = $this->buildSummary($totals, $truckBreakdown, $typeBreakdown);

        $trend = $this->trend($fromDate, $toDate, $truckIds, $maintenanceTypeIds, $statuses, $serviceProviders);
        $upcoming = $this->upcoming($truckIds, $maintenanceTypeIds, $statuses, $serviceProviders);
        $highlights = $this->buildHighlights($truckBreakdown, $typeBreakdown, $upcoming);

        return [
            'resolved_from' => $fromDate,
            'resolved_to' => $toDate,
            'truck_ids' => $truckIds,
            'maintenance_type_ids' => $maintenanceTypeIds,
            'statuses' => $statuses,
            'service_providers' => $serviceProviders,
            'totals' => $totals,
            'summary' => $summary,
            'breakdown' => $truckBreakdown->values()->all(),
            'type_breakdown' => $typeBreakdown->values()->all(),
            'trend' => $trend,
            'upcoming' => $upcoming,
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

    private function resolveIds(array $filters, string $pluralKey, string $singularKey): array
    {
        $ids = Arr::wrap($filters[$pluralKey] ?? $filters[$singularKey] ?? []);

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

    private function resolveStrings(array $filters, string $pluralKey, string $singularKey): array
    {
        $values = Arr::wrap($filters[$pluralKey] ?? $filters[$singularKey] ?? []);

        if (is_string($values)) {
            $values = array_filter(array_map('trim', explode(',', $values)));
        }

        return collect($values)
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (string) $value)
            ->unique()
            ->values()
            ->all();
    }

    private function applyFilters(Builder $query, string $fromDate, string $toDate, array $truckIds, array $maintenanceTypeIds, array $statuses, array $serviceProviders): Builder
    {
        return $query
            ->where(function (Builder $builder) use ($fromDate, $toDate) {
                $builder->whereBetween('scheduled_date', [$fromDate, $toDate])
                    ->orWhere(function (Builder $inner) use ($fromDate, $toDate) {
                        $inner->whereNotNull('completed_date')
                            ->whereBetween('completed_date', [$fromDate, $toDate]);
                    });
            })
            ->when(! empty($truckIds), static fn (Builder $builder) => $builder->whereIn('truck_id', $truckIds))
            ->when(! empty($maintenanceTypeIds), static fn (Builder $builder) => $builder->whereIn('maintenance_type_id', $maintenanceTypeIds))
            ->when(! empty($statuses), static fn (Builder $builder) => $builder->whereIn('status', $statuses))
            ->when(! empty($serviceProviders), static fn (Builder $builder) => $builder->whereIn('service_provider', $serviceProviders));
    }

    private function aggregateByTruck(string $fromDate, string $toDate, array $truckIds, array $maintenanceTypeIds, array $statuses, array $serviceProviders): Collection
    {
        $driverName = DB::connection()->getDriverName();
        $completionDiff = $driverName === 'sqlite'
            ? 'julianday(completed_date) - julianday(scheduled_date)'
            : 'DATEDIFF(completed_date, scheduled_date)';
        $today = now()->toDateString();
        $overdueDiff = $driverName === 'sqlite'
            ? 'julianday(date(?)) - julianday(date(scheduled_date))'
            : 'DATEDIFF(?, DATE(scheduled_date))';

        $query = $this->applyFilters(
            VehicleMaintenanceRecord::query()->select('truck_id'),
            $fromDate,
            $toDate,
            $truckIds,
            $maintenanceTypeIds,
            $statuses,
            $serviceProviders
        )
            ->whereNotNull('truck_id')
            ->selectRaw('COUNT(*) as total_records')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_records")
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_records")
            ->selectRaw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_records")
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' AND DATE(scheduled_date) < ? THEN 1 ELSE 0 END) as overdue_records", [$today])
            ->selectRaw('SUM(COALESCE(cost, 0)) as total_cost')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN COALESCE(cost, 0) ELSE 0 END) as completed_cost")
            ->selectRaw("SUM(CASE WHEN status != 'completed' THEN COALESCE(cost, 0) ELSE 0 END) as open_cost")
            ->selectRaw('AVG(COALESCE(cost, 0)) as average_cost')
            ->selectRaw("SUM(CASE WHEN completed_date IS NOT NULL AND scheduled_date IS NOT NULL THEN {$completionDiff} ELSE 0 END) as completion_days_total")
            ->selectRaw("AVG(CASE WHEN completed_date IS NOT NULL AND scheduled_date IS NOT NULL THEN {$completionDiff} END) as completion_days_average")
            ->selectRaw("MAX(CASE WHEN status = 'completed' THEN completed_date END) as last_completed_at")
            ->selectRaw("MIN(CASE WHEN status = 'scheduled' AND scheduled_date >= ? THEN scheduled_date END) as next_scheduled_at", [$today])
            ->selectRaw("MAX(CASE WHEN status = 'scheduled' AND DATE(scheduled_date) < ? THEN {$overdueDiff} END) as max_overdue_days", [$today, $today])
            ->groupBy('truck_id');

        return $query->get();
    }

    private function aggregateByType(string $fromDate, string $toDate, array $truckIds, array $maintenanceTypeIds, array $statuses, array $serviceProviders): Collection
    {
        $driverName = DB::connection()->getDriverName();
        $today = now()->toDateString();

        $query = $this->applyFilters(
            VehicleMaintenanceRecord::query()->select('maintenance_type_id'),
            $fromDate,
            $toDate,
            $truckIds,
            $maintenanceTypeIds,
            $statuses,
            $serviceProviders
        )
            ->whereNotNull('maintenance_type_id')
            ->selectRaw('COUNT(*) as total_records')
            ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_records")
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_records")
            ->selectRaw("SUM(CASE WHEN status = 'scheduled' AND DATE(scheduled_date) < ? THEN 1 ELSE 0 END) as overdue_records", [$today])
            ->selectRaw('SUM(COALESCE(cost, 0)) as total_cost')
            ->selectRaw('AVG(COALESCE(cost, 0)) as average_cost')
            ->groupBy('maintenance_type_id');

        return $query->get();
    }

    private function getTruckDetails(array $truckIds): Collection
    {
        if (empty($truckIds)) {
            return collect();
        }

        return Truck::query()
            ->select(['id', 'plate', 'status'])
            ->whereIn('id', $truckIds)
            ->get()
            ->keyBy('id');
    }

    private function getTypeDetails(array $typeIds): Collection
    {
        if (empty($typeIds)) {
            return collect();
        }

        return MaintenanceType::query()
            ->select(['id', 'name', 'category'])
            ->whereIn('id', $typeIds)
            ->get()
            ->keyBy('id');
    }

    private function buildTruckBreakdown(Collection $aggregation, Collection $truckDetails): Collection
    {
        return $aggregation
            ->map(function ($row) use ($truckDetails) {
                $truckId = (int) $row->truck_id;
                $truck = $truckDetails->get($truckId);

                $totalRecords = (int) $row->total_records;
                $completedRecords = (int) $row->completed_records;
                $scheduledRecords = (int) $row->scheduled_records;
                $inProgressRecords = (int) $row->in_progress_records;
                $overdueRecords = (int) $row->overdue_records;
                $totalCost = (float) $row->total_cost;
                $completedCost = (float) $row->completed_cost;
                $openCost = (float) $row->open_cost;
                $averageCost = $row->average_cost !== null ? round((float) $row->average_cost, 2) : null;
                $completionDaysTotal = (float) $row->completion_days_total;
                $completionDaysAverage = $row->completion_days_average !== null ? round((float) $row->completion_days_average, 2) : null;
                $completionRate = $totalRecords > 0 ? round(($completedRecords / $totalRecords) * 100, 2) : null;
                $overdueRate = $totalRecords > 0 ? round(($overdueRecords / $totalRecords) * 100, 2) : null;
                $avgCompletionDays = $completedRecords > 0
                    ? round($completionDaysTotal / $completedRecords, 2)
                    : $completionDaysAverage;
                $lastCompletedAt = $row->last_completed_at ? Carbon::parse($row->last_completed_at)->toDateString() : null;
                $nextScheduledAt = $row->next_scheduled_at ? Carbon::parse($row->next_scheduled_at)->toDateString() : null;
                $maxOverdueDays = $row->max_overdue_days !== null ? round((float) $row->max_overdue_days, 2) : null;

                return [
                    'truck_id' => $truckId,
                    'plate' => $truck?->plate ?? 'Truck #'.$truckId,
                    'status' => $truck?->status,
                    'records' => $totalRecords,
                    'completed' => $completedRecords,
                    'scheduled' => $scheduledRecords,
                    'in_progress' => $inProgressRecords,
                    'overdue' => $overdueRecords,
                    'completion_rate_pct' => $completionRate,
                    'overdue_rate_pct' => $overdueRate,
                    'total_cost' => round($totalCost, 2),
                    'completed_cost' => round($completedCost, 2),
                    'open_cost' => round($openCost, 2),
                    'average_cost' => $averageCost,
                    'average_completion_days' => $avgCompletionDays,
                    'last_completed_at' => $lastCompletedAt,
                    'next_scheduled_at' => $nextScheduledAt,
                    'max_overdue_days' => $maxOverdueDays,
                    'completion_days_total' => $completionDaysTotal,
                ];
            })
            ->sortByDesc('total_cost')
            ->values();
    }

    private function buildTypeBreakdown(Collection $aggregation, Collection $typeDetails): Collection
    {
        return $aggregation
            ->map(function ($row) use ($typeDetails) {
                $typeId = (int) $row->maintenance_type_id;
                $type = $typeDetails->get($typeId);
                $totalRecords = (int) $row->total_records;
                $completedRecords = (int) $row->completed_records;
                $scheduledRecords = (int) $row->scheduled_records;
                $overdueRecords = (int) $row->overdue_records;
                $totalCost = (float) $row->total_cost;
                $averageCost = $row->average_cost !== null ? round((float) $row->average_cost, 2) : null;
                $completionRate = $totalRecords > 0 ? round(($completedRecords / $totalRecords) * 100, 2) : null;

                return [
                    'maintenance_type_id' => $typeId,
                    'name' => $type?->name ?? 'Type #'.$typeId,
                    'category' => $type?->category,
                    'records' => $totalRecords,
                    'completed' => $completedRecords,
                    'scheduled' => $scheduledRecords,
                    'overdue' => $overdueRecords,
                    'completion_rate_pct' => $completionRate,
                    'total_cost' => round($totalCost, 2),
                    'average_cost' => $averageCost,
                ];
            })
            ->sortByDesc('total_cost')
            ->values();
    }

    private function summariseTotals(Collection $truckBreakdown, Collection $typeBreakdown): array
    {
        $records = (int) $truckBreakdown->sum('records');
        $completed = (int) $truckBreakdown->sum('completed');
        $scheduled = (int) $truckBreakdown->sum('scheduled');
        $inProgress = (int) $truckBreakdown->sum('in_progress');
        $overdue = (int) $truckBreakdown->sum('overdue');
        $totalCost = (float) $truckBreakdown->sum('total_cost');
        $completedCost = (float) $truckBreakdown->sum('completed_cost');
        $openCost = (float) $truckBreakdown->sum('open_cost');
        $completionDaysTotal = (float) $truckBreakdown->sum('completion_days_total');

        return [
            'records' => $records,
            'completed' => $completed,
            'scheduled' => $scheduled,
            'in_progress' => $inProgress,
            'overdue' => $overdue,
            'total_cost' => round($totalCost, 2),
            'completed_cost' => round($completedCost, 2),
            'open_cost' => round($openCost, 2),
            'truck_count' => $truckBreakdown->count(),
            'type_count' => $typeBreakdown->count(),
            'average_completion_days' => $completed > 0 ? round($completionDaysTotal / $completed, 2) : null,
        ];
    }

    private function buildSummary(array $totals, Collection $truckBreakdown, Collection $typeBreakdown): array
    {
        $records = $totals['records'];
        $completed = $totals['completed'];
        $overdue = $totals['overdue'];
        $totalCost = $totals['total_cost'];
        $typeTotalCost = (float) $typeBreakdown->sum('total_cost');

        $upcomingWithinSevenDays = $truckBreakdown
            ->filter(static fn (array $row) => $row['next_scheduled_at'] !== null && Carbon::parse($row['next_scheduled_at'])->isBetween(now()->startOfDay(), now()->copy()->addDays(7)->endOfDay()))
            ->count();

        return [
            'completion_rate_pct' => $records > 0 ? round(($completed / $records) * 100, 2) : null,
            'overdue_rate_pct' => $records > 0 ? round(($overdue / $records) * 100, 2) : null,
            'average_cost_per_record' => $records > 0 ? round($totalCost / $records, 2) : null,
            'average_cost_per_completed' => $completed > 0 ? round($totals['completed_cost'] / $completed, 2) : null,
            'average_completion_days' => $totals['average_completion_days'],
            'share_of_cost_tracked_types_pct' => $totalCost > 0 ? round(($typeTotalCost / $totalCost) * 100, 2) : null,
            'upcoming_within_seven_days' => $upcomingWithinSevenDays,
        ];
    }

    private function trend(string $fromDate, string $toDate, array $truckIds, array $maintenanceTypeIds, array $statuses, array $serviceProviders): array
    {
        $driverName = DB::connection()->getDriverName();
        $periodExpression = $driverName === 'sqlite'
            ? "strftime('%Y-%m', COALESCE(completed_date, scheduled_date))"
            : "DATE_FORMAT(COALESCE(completed_date, scheduled_date), '%Y-%m')";
        $today = now()->toDateString();

        $query = $this->applyFilters(
            VehicleMaintenanceRecord::query()
                ->selectRaw("{$periodExpression} as period")
                ->selectRaw('COUNT(*) as total_records')
                ->selectRaw("SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_records")
                ->selectRaw("SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_records")
                ->selectRaw("SUM(CASE WHEN status = 'scheduled' AND DATE(scheduled_date) < ? THEN 1 ELSE 0 END) as overdue_records", [$today])
                ->selectRaw('SUM(COALESCE(cost, 0)) as total_cost'),
            $fromDate,
            $toDate,
            $truckIds,
            $maintenanceTypeIds,
            $statuses,
            $serviceProviders
        )
            ->groupBy('period')
            ->orderBy('period');

        return $query->get()
            ->map(static function ($row) {
                $records = (int) $row->total_records;
                $completed = (int) $row->completed_records;
                $scheduled = (int) $row->scheduled_records;
                $overdue = (int) $row->overdue_records;
                $totalCost = (float) $row->total_cost;

                return [
                    'period' => $row->period,
                    'records' => $records,
                    'completed' => $completed,
                    'scheduled' => $scheduled,
                    'overdue' => $overdue,
                    'total_cost' => round($totalCost, 2),
                    'average_cost_per_record' => $records > 0 ? round($totalCost / $records, 2) : null,
                ];
            })
            ->values()
            ->all();
    }

    private function upcoming(array $truckIds, array $maintenanceTypeIds, array $statuses, array $serviceProviders): array
    {
        $start = now()->startOfDay();
        $end = now()->copy()->addDays(30)->endOfDay();

        $query = VehicleMaintenanceRecord::query()
            ->with(['truck:id,plate,status', 'maintenanceType:id,name,category'])
            ->where('status', 'scheduled')
            ->whereBetween('scheduled_date', [$start->toDateString(), $end->toDateString()])
            ->when(! empty($truckIds), static fn (Builder $builder) => $builder->whereIn('truck_id', $truckIds))
            ->when(! empty($maintenanceTypeIds), static fn (Builder $builder) => $builder->whereIn('maintenance_type_id', $maintenanceTypeIds))
            ->when(! empty($statuses), static fn (Builder $builder) => $builder->whereIn('status', $statuses))
            ->when(! empty($serviceProviders), static fn (Builder $builder) => $builder->whereIn('service_provider', $serviceProviders))
            ->orderBy('scheduled_date')
            ->limit(12);

        return $query->get()
            ->map(static function (VehicleMaintenanceRecord $record) {
                $scheduledDate = $record->scheduled_date;
                $daysUntil = $scheduledDate?->isFuture() ? now()->diffInDays($scheduledDate, false) : null;

                return [
                    'id' => $record->id,
                    'truck' => $record->truck ? [
                        'id' => $record->truck->id,
                        'plate' => $record->truck->plate ?? 'Truck #'.$record->truck->id,
                        'status' => $record->truck->status,
                    ] : null,
                    'maintenance_type' => $record->maintenanceType ? [
                        'id' => $record->maintenanceType->id,
                        'name' => $record->maintenanceType->name,
                        'category' => $record->maintenanceType->category,
                    ] : null,
                    'scheduled_date' => $scheduledDate?->toDateString(),
                    'days_until' => $daysUntil,
                    'service_provider' => $record->service_provider,
                    'estimated_cost' => $record->cost !== null ? round((float) $record->cost, 2) : null,
                ];
            })
            ->values()
            ->all();
    }

    private function buildHighlights(Collection $truckBreakdown, Collection $typeBreakdown, array $upcoming): array
    {
        $highestCost = $truckBreakdown
            ->sortByDesc('total_cost')
            ->take(3)
            ->values()
            ->all();

        $mostOverdue = $truckBreakdown
            ->sortByDesc('overdue')
            ->take(3)
            ->values()
            ->all();

        $costliestTypes = $typeBreakdown
            ->sortByDesc('total_cost')
            ->take(3)
            ->values()
            ->all();

        $upcomingSoon = collect($upcoming)
            ->filter(static fn (array $item) => $item['days_until'] !== null)
            ->sortBy('days_until')
            ->take(3)
            ->values()
            ->all();

        return [
            'highest_cost_trucks' => $highestCost,
            'most_overdue_trucks' => $mostOverdue,
            'costliest_types' => $costliestTypes,
            'upcoming' => $upcomingSoon,
        ];
    }
}

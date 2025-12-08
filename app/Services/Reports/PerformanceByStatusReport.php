<?php

namespace App\Services\Reports;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Support\Collection;

class PerformanceByStatusReport
{
    private const LATEST_LIMIT = 25;

    /**
     * Build the performance by status dataset for the given filters.
     *
     * @param  array{date?: string|null}  $filters
     * @return array{
     *     date: string,
     *     summary: array<int, array{status_id: int, status_name: string, count: int, share: float}>,
     *     latest: array<int, array{
     *         id: int,
     *         truck_id: int,
     *         plate: string,
     *         status_id: int|null,
     *         status_name: string,
     *         status_date: string|null,
     *         registerddate: string|null,
     *         changed_by: string|null,
     *         notes: string|null,
     *     }>,
     *     metrics: array{
     *         vehicles_tracked: int,
     *         unique_statuses: int,
     *         top_status: array{status_name: string, count: int, share: float}|null,
     *         latest_update: string|null,
     *     },
     *     statuses: array<int, array{id: int, name: string}>
     * }
     */
    public function build(array $filters): array
    {
        $date = $this->resolveDate($filters['date'] ?? null);
        $statusTypeId = $this->resolveOperationalStatusTypeId();

        $statuses = $this->fetchStatuses($statusTypeId);
        $records = $this->fetchRecords($date, $statuses->pluck('id')->all());

        $summary = $this->buildSummary($records, $statuses);
        $latest = $this->buildLatest($records);
        $metrics = $this->buildMetrics($records, $summary);

        return [
            'date' => $date->toDateString(),
            'summary' => $summary->values()->all(),
            'latest' => $latest->values()->all(),
            'metrics' => $metrics,
            'statuses' => $statuses
                ->map(static fn (Status $status) => [
                    'id' => $status->id,
                    'name' => $status->name,
                ])
                ->values()
                ->all(),
        ];
    }

    private function resolveDate(?string $value): CarbonInterface
    {
        if ($value === null || $value === '') {
            return now()->startOfDay();
        }

        return Carbon::parse($value)->startOfDay();
    }

    private function resolveOperationalStatusTypeId(): ?int
    {
        return StatusType::query()
            ->where('name', 'Operational Status')
            ->value('id');
    }

    private function fetchStatuses(?int $statusTypeId): Collection
    {
        $query = Status::query()
            ->select(['id', 'name'])
            ->orderBy('name');

        if ($statusTypeId !== null) {
            $query->where('statustype_id', $statusTypeId);
        }

        return $query->get();
    }

    private function fetchRecords(CarbonInterface $date, array $statusIds): Collection
    {
        $query = DailyTruckStatus::query()
            ->with([
                'status:id,name',
                'truck:id,plate',
                'changedBy:id,name',
            ])
            ->whereDate('status_date', $date->toDateString())
            ->orderByDesc('created_at');

        if ($statusIds !== []) {
            $query->whereIn('status_id', $statusIds);
        }

        return $query->get();
    }

    /**
     * @param  Collection<int, DailyTruckStatus>  $records
     * @param  Collection<int, Status>  $statuses
     * @return Collection<int, array{status_id: int, status_name: string, count: int, share: float}>
     */
    private function buildSummary(Collection $records, Collection $statuses): Collection
    {
        $counts = $records
            ->groupBy('status_id')
            ->map(static fn (Collection $group) => $group->count());

        $total = max(0, $records->count());

        return $statuses
            ->map(static function (Status $status) use ($counts, $total) {
                $count = (int) ($counts->get($status->id) ?? 0);
                $share = $total > 0 ? round(($count / $total) * 100, 2) : 0.0;

                return [
                    'status_id' => $status->id,
                    'status_name' => $status->name,
                    'count' => $count,
                    'share' => $share,
                ];
            })
            ->filter(static fn (array $row) => $row['count'] > 0)
            ->values();
    }

    /**
     * @param  Collection<int, DailyTruckStatus>  $records
     * @return Collection<int, array{
     *     id: int,
     *     truck_id: int,
     *     plate: string,
     *     status_id: int|null,
     *     status_name: string,
     *     status_date: string|null,
     *     registerddate: string|null,
     *     changed_by: string|null,
     *     notes: string|null,
     * }>
     */
    private function buildLatest(Collection $records): Collection
    {
        return $records
            ->sortByDesc(static fn (DailyTruckStatus $record) => $record->created_at)
            ->take(self::LATEST_LIMIT)
            ->map(static function (DailyTruckStatus $record) {
                return [
                    'id' => $record->id,
                    'truck_id' => $record->truck_id,
                    'plate' => $record->truck?->plate ?? '—',
                    'status_id' => $record->status_id,
                    'status_name' => $record->status?->name ?? 'Unknown',
                    'status_date' => $record->status_date?->toDateString(),
                    'registerddate' => $record->created_at?->toIso8601String(),
                    'changed_by' => $record->changedBy?->name,
                    'notes' => $record->notes,
                ];
            })
            ->values();
    }

    /**
     * @param  Collection<int, DailyTruckStatus>  $records
     * @param  Collection<int, array{status_id: int, status_name: string, count: int, share: float}>  $summary
     * @return array{
     *     vehicles_tracked: int,
     *     unique_statuses: int,
     *     top_status: array{status_name: string, count: int, share: float}|null,
     *     latest_update: string|null,
     * }
     */
    private function buildMetrics(Collection $records, Collection $summary): array
    {
        $totalVehicles = $records->count();

        $topStatus = $summary
            ->sortByDesc(static fn (array $row) => $row['count'])
            ->first();

        $latestUpdate = $records
            ->sortByDesc(static fn (DailyTruckStatus $record) => $record->created_at)
            ->first()?->created_at;

        return [
            'vehicles_tracked' => $totalVehicles,
            'unique_statuses' => $summary->count(),
            'top_status' => $topStatus !== null ? [
                'status_name' => $topStatus['status_name'],
                'count' => $topStatus['count'],
                'share' => $topStatus['share'],
            ] : null,
            'latest_update' => $latestUpdate?->toIso8601String(),
        ];
    }
}

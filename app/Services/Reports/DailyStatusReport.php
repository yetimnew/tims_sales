<?php

declare(strict_types=1);

namespace App\Services\Reports;

use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\Paginator;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;

class DailyStatusReport
{
    private const DEFAULT_DAYS = 7;

    private const MAX_DAYS = 31;

    private const MAX_EXPORT_DAYS = 62;

    private const CACHE_TTL = 900; // 15 minutes

    /**
     * Build the daily status dataset honouring filters, caching, and pagination.
     *
     * @param  array<string, mixed>  $filters
     * @return array{
     *     filters: array{from: string, to: string, truck_ids: array<int>, status_ids: array<int>, per_page: int, page: int},
     *     summary: array{
     *         total_updates: int,
     *         unique_trucks: int,
     *         unique_statuses: int,
     *         latest_update: string|null,
     *         days_with_activity: int,
     *         average_updates_per_day: float,
     *     },
     *     status_summary: array<int, array{status_id: int|null, status_name: string, count: int, share: float}>,
     *     daily: LengthAwarePaginator,
     *     resolved_from: string,
     *     resolved_to: string,
     *     total_days: int,
     *     truncated: bool,
     *     status_options: array<int, array{id: int, name: string}>
     * }
     */
    public function build(array $filters, bool $forceRefresh = false): array
    {
        $normalised = $this->normaliseFilters($filters);

        $cacheKey = $this->cacheKey($normalised);

        if ($forceRefresh) {
            Cache::forget($cacheKey);
        }

        $payload = Cache::remember($cacheKey, self::CACHE_TTL, fn () => $this->calculateAggregate($normalised));

        $totalDays = $payload['total_days'];
        $page = $normalised['for_export'] ? 1 : $normalised['page'];
        $perPage = $normalised['for_export'] ? max(1, $totalDays) : $normalised['per_page'];
        $perPage = $totalDays > 0 ? min($perPage, $totalDays) : $perPage;
        $perPage = max(1, $perPage);

        $offset = max(0, ($page - 1) * $perPage);
        $slicedDays = array_slice($payload['days'], $offset, $perPage);

        $paginator = $this->makePaginator($slicedDays, $totalDays, $perPage, $page, $normalised);

        return [
            'filters' => [
                'from' => $payload['resolved_from'],
                'to' => $payload['resolved_to'],
                'truck_ids' => $normalised['truck_ids'],
                'status_ids' => $normalised['status_ids'],
                'per_page' => $perPage,
                'page' => $page,
            ],
            'summary' => $payload['summary'],
            'status_summary' => $payload['status_summary'],
            'daily' => $paginator,
            'resolved_from' => $payload['resolved_from'],
            'resolved_to' => $payload['resolved_to'],
            'total_days' => $totalDays,
            'truncated' => $payload['truncated'],
            'status_options' => $payload['status_options'],
        ];
    }

    /**
     * Warm the snapshot cache for the provided filters.
     *
     * @param  array<string, mixed>  $filters
     */
    public function warm(array $filters): void
    {
        $this->build($filters, true);
    }

    /**
     * @param  array{
     *     from: CarbonInterface,
     *     to: CarbonInterface,
     *     truncated: bool,
     *     truck_ids: array<int>,
     *     status_ids: array<int>,
     *     for_export: bool,
     *     page: int,
     *     per_page: int,
     *     day_count: int,
     * }  $normalised
     * @return array{
     *     resolved_from: string,
     *     resolved_to: string,
     *     total_days: int,
     *     days: array<int, array{
     *         date: string,
     *         total_updates: int,
     *         unique_trucks: int,
     *         latest_update: string|null,
     *         status_breakdown: array<int, array{status_id: int|null, status_name: string, count: int, share: float}>,
     *         entries: array<int, array{
     *             id: int,
     *             truck_id: int,
     *             plate: string,
     *             status_id: int|null,
     *             status_name: string,
     *             status_date: string|null,
     *             registered_at: string|null,
     *             changed_by: string|null,
     *             notes: string|null,
     *         }>,
     *     }>,
     *     summary: array{
     *         total_updates: int,
     *         unique_trucks: int,
     *         unique_statuses: int,
     *         latest_update: string|null,
     *         days_with_activity: int,
     *         average_updates_per_day: float,
     *     },
     *     status_summary: array<int, array{status_id: int|null, status_name: string, count: int, share: float}>,
     *     status_options: array<int, array{id: int, name: string}>,
     *     truncated: bool,
     * }
     */
    private function calculateAggregate(array $normalised): array
    {
        $from = $normalised['from']->copy()->startOfDay();
        $to = $normalised['to']->copy()->startOfDay();

        $dayDates = [];
        $cursor = $to->copy();

        while ($cursor->greaterThanOrEqualTo($from)) {
            $dayDates[] = $cursor->copy();
            $cursor->subDay();
        }

        $statusOptions = $this->statusOptions();
        $statusLookup = collect($statusOptions)
            ->mapWithKeys(static fn (array $status) => [$status['id'] => $status['name']])
            ->all();

        $records = DailyTruckStatus::query()
            ->with(['status:id,name', 'truck:id,plate', 'changedBy:id,name'])
            ->whereNotNull('status_date')
            ->whereBetween('status_date', [$from->toDateString(), $to->toDateString()])
            ->when($normalised['truck_ids'] !== [], static fn ($query) => $query->whereIn('truck_id', $normalised['truck_ids']))
            ->when($normalised['status_ids'] !== [], static fn ($query) => $query->whereIn('status_id', $normalised['status_ids']))
            ->orderByDesc('status_date')
            ->orderByDesc('created_at')
            ->get();

        $recordsByDate = $records->groupBy(fn (DailyTruckStatus $record) => $record->status_date?->toDateString());

        $totalUpdates = 0;
        $statusTotals = [];
        $days = [];

        foreach ($dayDates as $day) {
            $dateString = $day->toDateString();
            /** @var Collection<int, DailyTruckStatus> $dayRecords */
            $dayRecords = $recordsByDate->get($dateString, collect());

            $latestByTruck = $dayRecords
                ->groupBy('truck_id')
                ->map(static function (Collection $group): ?DailyTruckStatus {
                    return $group
                        ->sortByDesc(static fn (DailyTruckStatus $record) => $record->created_at ?? $record->updated_at ?? $record->status_date)
                        ->first();
                })
                ->filter();

            $entries = $latestByTruck
                ->map(static function (DailyTruckStatus $record) use ($statusLookup): array {
                    $statusId = $record->status_id;
                    $statusName = $statusLookup[$statusId] ?? $record->status?->name ?? 'Unknown';

                    return [
                        'id' => $record->id,
                        'truck_id' => $record->truck_id,
                        'plate' => $record->truck?->plate ?? '—',
                        'status_id' => $statusId,
                        'status_name' => $statusName,
                        'status_date' => $record->status_date?->toDateString(),
                        'registered_at' => $record->created_at?->toIso8601String(),
                        'changed_by' => $record->changedBy?->name,
                        'notes' => $record->notes,
                    ];
                })
                ->values()
                ->all();

            $dayCount = count($entries);
            $totalUpdates += $dayCount;

            $statusBreakdown = collect($entries)
                ->groupBy(static fn (array $entry) => $entry['status_id'] ?? 'null')
                ->map(static function (Collection $group, $statusId) use ($statusLookup) {
                    $resolvedId = $statusId === 'null' ? null : (int) $statusId;
                    $name = $resolvedId !== null ? ($statusLookup[$resolvedId] ?? 'Unknown') : 'Unspecified';

                    return [
                        'status_id' => $resolvedId,
                        'status_name' => $name,
                        'count' => $group->count(),
                    ];
                })
                ->values()
                ->sortByDesc('count')
                ->map(function (array $row) use ($dayCount) {
                    $share = $dayCount > 0 ? round(($row['count'] / $dayCount) * 100, 2) : 0.0;

                    return [
                        'status_id' => $row['status_id'],
                        'status_name' => $row['status_name'],
                        'count' => $row['count'],
                        'share' => $share,
                    ];
                })
                ->values()
                ->all();

            foreach ($statusBreakdown as $row) {
                $key = $row['status_id'] ?? 'null';

                if (! isset($statusTotals[$key])) {
                    $statusTotals[$key] = [
                        'status_id' => $row['status_id'],
                        'status_name' => $row['status_name'],
                        'count' => 0,
                    ];
                }

                $statusTotals[$key]['count'] += $row['count'];
            }

            $latestUpdate = $latestByTruck
                ->map(static fn (DailyTruckStatus $record) => $record->created_at ?? $record->updated_at ?? $record->status_date)
                ->filter()
                ->sortDesc()
                ->first();

            $days[] = [
                'date' => $dateString,
                'total_updates' => $dayCount,
                'unique_trucks' => $latestByTruck->count(),
                'latest_update' => $latestUpdate?->toIso8601String(),
                'status_breakdown' => $statusBreakdown,
                'entries' => $entries,
            ];
        }

        $statusSummary = collect($statusTotals)
            ->map(function (array $row) use ($totalUpdates) {
                $share = $totalUpdates > 0 ? round(($row['count'] / $totalUpdates) * 100, 2) : 0.0;

                return [
                    'status_id' => $row['status_id'],
                    'status_name' => $row['status_name'],
                    'count' => $row['count'],
                    'share' => $share,
                ];
            })
            ->sortByDesc('count')
            ->values()
            ->all();

        $uniqueTrucks = $records->pluck('truck_id')->filter()->unique()->count();
        $uniqueStatuses = $records->pluck('status_id')->filter()->unique()->count();
        $latestUpdate = $records
            ->map(static fn (DailyTruckStatus $record) => $record->created_at ?? $record->updated_at ?? $record->status_date)
            ->filter()
            ->sortDesc()
            ->first();
        $daysWithActivity = collect($days)->filter(static fn (array $day) => $day['total_updates'] > 0)->count();
        $averageUpdatesPerDay = count($days) > 0 ? round($totalUpdates / count($days), 2) : 0.0;

        return [
            'resolved_from' => $from->toDateString(),
            'resolved_to' => $to->toDateString(),
            'total_days' => count($days),
            'days' => $days,
            'summary' => [
                'total_updates' => $totalUpdates,
                'unique_trucks' => $uniqueTrucks,
                'unique_statuses' => $uniqueStatuses,
                'latest_update' => $latestUpdate?->toIso8601String(),
                'days_with_activity' => $daysWithActivity,
                'average_updates_per_day' => $averageUpdatesPerDay,
            ],
            'status_summary' => $statusSummary,
            'status_options' => $statusOptions,
            'truncated' => $normalised['truncated'],
        ];
    }

    /**
     * @param  array{
     *     from: CarbonInterface,
     *     to: CarbonInterface,
     *     truncated: bool,
     *     truck_ids: array<int>,
     *     status_ids: array<int>,
     *     for_export: bool,
     *     page: int,
     *     per_page: int,
     *     day_count: int,
     * }  $normalised
     */
    private function cacheKey(array $normalised): string
    {
        $payload = [
            'from' => $normalised['from']->toDateString(),
            'to' => $normalised['to']->toDateString(),
            'truck_ids' => $normalised['truck_ids'],
            'status_ids' => $normalised['status_ids'],
        ];

        return 'reports.daily_status.snapshot.'.sha1(json_encode($payload, JSON_THROW_ON_ERROR));
    }

    /**
     * @param  array<string, mixed>  $filters
     * @return array{
     *     from: CarbonInterface,
     *     to: CarbonInterface,
     *     truncated: bool,
     *     truck_ids: array<int>,
     *     status_ids: array<int>,
     *     for_export: bool,
     *     page: int,
     *     per_page: int,
     *     day_count: int,
     * }
     */
    private function normaliseFilters(array $filters): array
    {
        $format = strtolower((string) ($filters['format'] ?? ''));
        $forExport = in_array($format, ['csv', 'xlsx', 'pdf'], true);

        $rawFrom = Arr::get($filters, 'from');
        $rawTo = Arr::get($filters, 'to');

        $defaultFrom = now()->copy()->subDays(self::DEFAULT_DAYS - 1)->startOfDay();
        $defaultTo = now()->copy()->endOfDay();

        $from = $this->parseDate($rawFrom, $defaultFrom);
        $to = $this->parseDate($rawTo, $defaultTo);

        if ($from->greaterThan($to)) {
            [$from, $to] = [$to->copy()->startOfDay(), $from->copy()->endOfDay()];
        }

        $maxDays = $forExport ? self::MAX_EXPORT_DAYS : self::MAX_DAYS;

        $dayCount = $from->diffInDays($to) + 1;
        $truncated = false;

        if ($dayCount > $maxDays) {
            $to = $from->copy()->addDays($maxDays - 1)->endOfDay();
            $dayCount = $maxDays;
            $truncated = true;
        }

        $perPage = $forExport ? $dayCount : (int) ($filters['per_page'] ?? self::DEFAULT_DAYS);
        $perPage = max(3, $perPage);
        $perPage = min($perPage, $maxDays);

        $page = (int) ($filters['page'] ?? 1);

        if ($page < 1) {
            $page = 1;
        }

        $truckIds = $this->normaliseIds($filters['truck_ids'] ?? []);
        $statusIds = $this->normaliseIds($filters['status_ids'] ?? []);

        return [
            'from' => $from->startOfDay(),
            'to' => $to->endOfDay(),
            'truncated' => $truncated,
            'truck_ids' => $truckIds,
            'status_ids' => $statusIds,
            'for_export' => $forExport,
            'page' => $page,
            'per_page' => $perPage,
            'day_count' => $dayCount,
        ];
    }

    private function parseDate(mixed $value, CarbonInterface $default): CarbonInterface
    {
        if ($value === null || $value === '') {
            return $default->copy();
        }

        return Carbon::parse((string) $value)->startOfDay();
    }

    /**
     * @param  array<int, mixed>|string|null  $value
     * @return array<int>
     */
    private function normaliseIds(array|string|null $value): array
    {
        if ($value === null) {
            return [];
        }

        $items = is_string($value)
            ? array_map('trim', explode(',', $value))
            : Arr::wrap($value);

        return collect($items)
            ->filter(static fn ($item) => $item !== null && $item !== '')
            ->map(static fn ($item) => (int) $item)
            ->filter(static fn (int $item) => $item > 0)
            ->unique()
            ->values()
            ->all();
    }

    /**
     * @param  array<int, array{
     *     date: string,
     *     total_updates: int,
     *     unique_trucks: int,
     *     latest_update: string|null,
     *     status_breakdown: array<int, array{status_id: int|null, status_name: string, count: int, share: float}>,
     *     entries: array<int, array{
     *         id: int,
     *         truck_id: int,
     *         plate: string,
     *         status_id: int|null,
     *         status_name: string,
     *         status_date: string|null,
     *         registered_at: string|null,
     *         changed_by: string|null,
     *         notes: string|null,
     *     }>,
     * }>  $items
     * @param  array{
     *     from: CarbonInterface,
     *     to: CarbonInterface,
     *     truncated: bool,
     *     truck_ids: array<int>,
     *     status_ids: array<int>,
     *     for_export: bool,
     *     page: int,
     *     per_page: int,
     *     day_count: int,
     * }  $normalised
     */
    private function makePaginator(array $items, int $total, int $perPage, int $page, array $normalised): LengthAwarePaginator
    {
        $paginator = new LengthAwarePaginator(
            collect($items),
            $total,
            max(1, $perPage),
            max(1, $page),
            [
                'path' => Paginator::resolveCurrentPath(),
                'pageName' => 'page',
            ],
        );

        $append = [
            'from' => $normalised['from']->toDateString(),
            'to' => $normalised['to']->toDateString(),
        ];

        if ($normalised['truck_ids'] !== []) {
            $append['truck_ids'] = $normalised['truck_ids'];
        }

        if ($normalised['status_ids'] !== []) {
            $append['status_ids'] = $normalised['status_ids'];
        }

        if (! $normalised['for_export']) {
            $append['per_page'] = $normalised['per_page'];
        }

        return $paginator->appends($append);
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function statusOptions(): array
    {
        return Cache::remember('reports.daily_status.status_options', 3600, static function () {
            $statusTypeId = StatusType::query()
                ->where('name', 'Operational Status')
                ->value('id');

            $query = Status::query()
                ->select(['id', 'name'])
                ->orderBy('name');

            if ($statusTypeId !== null) {
                $query->where('statustype_id', $statusTypeId);
            }

            return $query
                ->get()
                ->map(static fn (Status $status) => [
                    'id' => $status->id,
                    'name' => $status->name,
                ])
                ->values()
                ->all();
        });
    }
}

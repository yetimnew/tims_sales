<?php

namespace App\Services\DriverSafety;

use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Services\DriverSafety\Data\DriverSafetyIndexFilters;
use App\Services\DriverSafety\Data\DriverSafetyIndexResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DriverSafetyIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'incident_date';

    private const DEFAULT_DIRECTION = 'desc';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'incident_date',
        'severity',
        'incident_type',
        'damage_cost',
        'created_at',
    ];

    public function getIndexResult(Request $request): DriverSafetyIndexResult
    {
        $filters = $this->resolveFilters($request);

        $baseQuery = DriverSafetyRecord::query()->with([
            'driver:id,name',
            'reportedBy:id,name',
        ]);

        $this->applyFilters($baseQuery, $filters);

        $listingQuery = clone $baseQuery;
        $this->applySort($listingQuery, $filters->sort, $filters->direction);

        $paginator = $listingQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (DriverSafetyRecord $record): array {
                return [
                    'id' => $record->id,
                    'driver_id' => $record->driver_id,
                    'incident_date' => $record->incident_date?->toDateString(),
                    'incident_type' => $record->incident_type,
                    'severity' => $record->severity,
                    'description' => $record->description,
                    'location' => $record->location,
                    'damage_cost' => $record->damage_cost !== null ? (float) $record->damage_cost : null,
                    'reported_by' => $record->reportedBy ? [
                        'id' => $record->reportedBy->id,
                        'name' => $record->reportedBy->name,
                    ] : null,
                    'driver' => $record->driver ? [
                        'id' => $record->driver->id,
                        'name' => $record->driver->name,
                    ] : null,
                    'created_at' => $record->created_at?->toDateTimeString(),
                    'updated_at' => $record->updated_at?->toDateTimeString(),
                ];
            })
        );

        $safetyRecords = $this->presentPaginator($paginator);

        $metrics = $this->calculateMetrics(clone $baseQuery);
        // Cache options (1 hour) - rarely changes
        $incidentTypeOptions = Cache::remember('driver_safety.incident_type_options', 3600, fn () => $this->incidentTypeOptions());
        $severityOptions = Cache::remember('driver_safety.severity_options', 3600, fn () => $this->severityOptions());
        $driverOptions = Cache::remember('driver_safety.driver_options', 3600, fn () => $this->driverOptions());

        return new DriverSafetyIndexResult(
            $safetyRecords,
            $metrics,
            $filters->toFilterArray(),
            $incidentTypeOptions,
            $severityOptions,
            $driverOptions,
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): DriverSafetyIndexFilters
    {
        return DriverSafetyIndexFilters::fromRequest(
            $request,
            self::PER_PAGE_OPTIONS,
            self::DEFAULT_PER_PAGE,
            self::ALLOWED_SORTS,
            self::DEFAULT_SORT,
            self::DEFAULT_DIRECTION,
        );
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}
     */
    private function presentPaginator(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->items(),
            'current_page' => $paginator->currentPage(),
            'last_page' => $paginator->lastPage(),
            'per_page' => $paginator->perPage(),
            'total' => $paginator->total(),
            'from' => $paginator->firstItem(),
            'to' => $paginator->lastItem(),
            'links' => $links,
        ];
    }

    private function applyFilters(Builder $query, DriverSafetyIndexFilters $filters): void
    {
        if ($filters->search !== null) {
            $query->where(static function (Builder $inner) use ($filters) {
                $inner->where('description', 'like', "%{$filters->search}%")
                    ->orWhere('location', 'like', "%{$filters->search}%")
                    ->orWhere('incident_type', 'like', "%{$filters->search}%")
                    ->orWhereHas('driver', static function (Builder $driverQuery) use ($filters) {
                        $driverQuery->where('name', 'like', "%{$filters->search}%");
                    });
            });
        }

        if ($filters->incidentType !== null) {
            $query->where('incident_type', $filters->incidentType);
        }

        if ($filters->severity !== null) {
            $query->where('severity', $filters->severity);
        }

        if ($filters->driverId !== null) {
            $query->where('driver_id', $filters->driverId);
        }
    }

    private function applySort(Builder $query, string $sort, string $direction): void
    {
        $query->orderBy($sort, $direction);
    }

    private function calculateMetrics(Builder $baseQuery): array
    {
        $metricsQuery = clone $baseQuery;

        return [
            'total' => (clone $metricsQuery)->count(),
            'accidents' => (clone $metricsQuery)->where('incident_type', 'accident')->count(),
            'violations' => (clone $metricsQuery)->where('incident_type', 'violation')->count(),
            'warnings' => (clone $metricsQuery)->where('incident_type', 'warning')->count(),
            'critical' => (clone $metricsQuery)->where('severity', 'critical')->count(),
            'major' => (clone $metricsQuery)->where('severity', 'major')->count(),
            'minor' => (clone $metricsQuery)->where('severity', 'minor')->count(),
            'total_damage_cost' => (float) (clone $metricsQuery)->sum('damage_cost'),
            'average_damage_cost' => (float) (clone $metricsQuery)->avg('damage_cost'),
        ];
    }

    /**
     * @return array<int, array{label: string, value: string}>
     */
    private function incidentTypeOptions(): array
    {
        return DriverSafetyRecord::query()
            ->select('incident_type')
            ->distinct()
            ->whereNotNull('incident_type')
            ->orderBy('incident_type')
            ->get()
            ->map(static function (DriverSafetyRecord $record): array {
                $value = (string) $record->incident_type;

                return [
                    'label' => Str::of($value)->replace('_', ' ')->headline(),
                    'value' => $value,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{label: string, value: string}>
     */
    private function severityOptions(): array
    {
        return DriverSafetyRecord::query()
            ->select('severity')
            ->distinct()
            ->whereNotNull('severity')
            ->orderBy('severity')
            ->get()
            ->map(static function (DriverSafetyRecord $record): array {
                $value = (string) $record->severity;

                return [
                    'label' => Str::of($value)->replace('_', ' ')->headline(),
                    'value' => $value,
                ];
            })
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function driverOptions(): array
    {
        return Driver::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(static function (Driver $driver): array {
                return [
                    'id' => $driver->id,
                    'name' => $driver->name,
                ];
            })
            ->values()
            ->all();
    }
}

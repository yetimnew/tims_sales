<?php

namespace App\Services\Drivers;

use App\Models\Driver;
use App\Services\DriverMetricsService;
use App\Services\Drivers\Data\DriverIndexFilters;
use App\Services\Drivers\Data\DriverIndexResult;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DriverIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'created_at';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'name',
        'driverid',
        'sex',
        'mobile',
        'hireddate',
        'status',
        'zone',
        'created_at',
    ];

    public function __construct(private readonly DriverMetricsService $driverMetrics) {}

    public function getIndexResult(Request $request): DriverIndexResult
    {
        $filters = $this->resolveFilters($request);

        $statusFilter = $filters->status === 'all' ? null : $filters->status;

        $driversQuery = $this->driverMetrics->applyFilters(
            Driver::query()->select([
                'id',
                'driverid',
                'name',
                'sex',
                'zone',
                'mobile',
                'hireddate',
                'status',
                'created_at',
                'updated_at',
            ]),
            $filters->search,
            $filters->sex,
            $statusFilter,
        );

        $driversQuery->orderBy($filters->sort, $filters->direction);

        $paginator = $driversQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(fn (Driver $driver): array => [
                'id' => $driver->id,
                'driverid' => $driver->driverid,
                'name' => $driver->name,
                'sex' => $driver->sex,
                'zone' => $driver->zone,
                'mobile' => $driver->mobile,
                'hireddate' => $driver->hireddate,
                'status' => strtolower((string) ($driver->getRawOriginal('status') ?? '')),
                'created_at' => $driver->created_at,
                'updated_at' => $driver->updated_at,
            ])
        );

        $driversData = $this->presentPaginator($paginator);

        // Cache status options (1 hour) - rarely changes
        $statusOptions = Cache::remember('drivers.status_options', 3600, function () {
            return Driver::query()
                ->select('status')
                ->distinct()
                ->whereNotNull('status')
                ->orderBy('status')
                ->get()
                ->map(fn (Driver $driver): array => [
                    'label' => Str::of($driver->status)->replace('_', ' ')->headline(),
                    'value' => $driver->status,
                ])
                ->values()
                ->all();
        });

        // Cache gender options (1 hour) - rarely changes
        $genderOptions = Cache::remember('drivers.gender_options', 3600, function () {
            return Driver::query()
                ->select('sex')
                ->distinct()
                ->whereNotNull('sex')
                ->orderBy('sex')
                ->get()
                ->map(fn (Driver $driver): array => [
                    'label' => Str::of($driver->sex)->replace('_', ' ')->headline(),
                    'value' => $driver->sex,
                ])
                ->values()
                ->all();
        });

        $metrics = $this->driverMetrics->metrics($filters->search, $filters->sex, $statusFilter);

        return new DriverIndexResult(
            $driversData,
            $metrics,
            $filters->toFilterArray(),
            $statusOptions,
            $genderOptions,
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): DriverIndexFilters
    {
        return DriverIndexFilters::fromRequest(
            $request,
            self::PER_PAGE_OPTIONS,
            self::DEFAULT_PER_PAGE,
            self::ALLOWED_SORTS,
            self::DEFAULT_SORT,
            'desc'
        );
    }

    /**
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}
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
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
    }
}

<?php

namespace App\Services\Statuses;

use App\Models\Status;
use App\Models\StatusType;
use App\Services\Statuses\Data\StatusIndexFilters;
use App\Services\Statuses\Data\StatusIndexResult;
use App\Services\StatusMetricsService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class StatusIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'name';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'name',
        'status_type',
        'daily_truck_statuses_count',
        'created_at',
    ];

    public function __construct(private readonly StatusMetricsService $metricsService) {}

    public function getIndexResult(Request $request): StatusIndexResult
    {
        $filters = StatusIndexFilters::fromRequest(
            $request,
            self::PER_PAGE_OPTIONS,
            self::DEFAULT_PER_PAGE,
            self::ALLOWED_SORTS,
            self::DEFAULT_SORT,
            'asc'
        );

        $statusesQuery = Status::query()
            ->select([
                'id',
                'statustype_id',
                'name',
                'description',
                'created_at',
                'updated_at',
            ])
            ->with(['statusType:id,name'])
            ->withCount('dailyTruckStatuses');

        if ($filters->search !== null) {
            $statusesQuery->where(function ($query) use ($filters) {
                $query->where('name', 'like', "%{$filters->search}%")
                    ->orWhere('description', 'like', "%{$filters->search}%");
            });
        }

        if ($filters->statusTypeId !== null) {
            $statusesQuery->where('statustype_id', $filters->statusTypeId);
        }

        if ($filters->sort === 'status_type') {
            $statusesQuery->orderBy(
                StatusType::select('name')
                    ->whereColumn('statustypes.id', 'statuses.statustype_id'),
                $filters->direction
            )->orderBy('name');
        } else {
            $statusesQuery->orderBy($filters->sort, $filters->direction);
        }

        $paginator = $statusesQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (Status $status): array {
                return [
                    'id' => $status->id,
                    'statustype_id' => $status->statustype_id,
                    'status_type' => [
                        'id' => $status->statusType?->id,
                        'name' => $status->statusType?->name,
                    ],
                    'name' => $status->name,
                    'description' => $status->description,
                    'daily_truck_statuses_count' => (int) ($status->getAttribute('daily_truck_statuses_count') ?? 0),
                    'created_at' => $status->created_at,
                    'updated_at' => $status->updated_at,
                ];
            })
        );

        $statusTypes = $this->presentPaginator($paginator);
        $metrics = $this->metricsService->metrics($filters->search, $filters->statusTypeId);
        $statusTypeOptions = StatusType::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(static fn (StatusType $statusType): array => [
                'id' => $statusType->id,
                'name' => $statusType->name,
            ])->all();

        return new StatusIndexResult(
            $statusTypes,
            $metrics,
            $filters->toFilterArray(),
            $statusTypeOptions,
            self::PER_PAGE_OPTIONS,
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

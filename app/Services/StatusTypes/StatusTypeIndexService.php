<?php

namespace App\Services\StatusTypes;

use App\Models\StatusType;
use App\Services\StatusTypeMetricsService;
use App\Services\StatusTypes\Data\StatusTypeIndexFilters;
use App\Services\StatusTypes\Data\StatusTypeIndexResult;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class StatusTypeIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'name';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'name',
        'statuses_count',
        'created_at',
    ];

    /**
     * @var array<int, array{label: string, value: string}>
     */
    private const USAGE_OPTIONS = [
        [
            'label' => 'All usage states',
            'value' => 'all',
        ],
        [
            'label' => 'In use',
            'value' => 'in_use',
        ],
        [
            'label' => 'Unused',
            'value' => 'unused',
        ],
    ];

    public function __construct(private readonly StatusTypeMetricsService $metricsService) {}

    public function getIndexResult(Request $request): StatusTypeIndexResult
    {
        $filters = StatusTypeIndexFilters::fromRequest(
            $request,
            self::PER_PAGE_OPTIONS,
            self::DEFAULT_PER_PAGE,
            self::ALLOWED_SORTS,
            self::DEFAULT_SORT,
            'asc'
        );

        $statusTypesQuery = StatusType::query()
            ->select([
                'id',
                'name',
                'description',
                'created_at',
                'updated_at',
            ])
            ->withCount('statuses');

        $this->metricsService->applyFilters($statusTypesQuery, $filters->search, $filters->usage);

        if ($filters->sort === 'statuses_count') {
            $statusTypesQuery->orderBy('statuses_count', $filters->direction);
        } else {
            $statusTypesQuery->orderBy($filters->sort, $filters->direction);
        }

        $paginator = $statusTypesQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (StatusType $statusType): array {
                return [
                    'id' => $statusType->id,
                    'name' => $statusType->name,
                    'description' => $statusType->description,
                    'statuses_count' => (int) ($statusType->getAttribute('statuses_count') ?? 0),
                    'created_at' => $statusType->created_at,
                    'updated_at' => $statusType->updated_at,
                ];
            })
        );

        $statusTypes = $this->presentPaginator($paginator);
        $metrics = $this->metricsService->metrics($filters->search, $filters->usage);

        return new StatusTypeIndexResult(
            $statusTypes,
            $metrics,
            $filters->toFilterArray(),
            self::USAGE_OPTIONS,
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

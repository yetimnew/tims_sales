<?php

namespace App\Services\VehicleTypes;

use App\Models\VehicleType;
use App\Services\VehicleTypes\Data\VehicleTypeIndexFilters;
use App\Services\VehicleTypes\Data\VehicleTypeIndexResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class VehicleTypeIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'created_at';

    private const DEFAULT_DIRECTION = 'desc';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'name',
        'trucks_count',
        'active_trucks_count',
        'created_at',
    ];

    public function getIndexResult(Request $request): VehicleTypeIndexResult
    {
        $filters = $this->resolveFilters($request);

        $baseQuery = VehicleType::query();
        $this->applySearchFilter($baseQuery, $filters->search);

        $listingQuery = (clone $baseQuery)->withCount([
            'trucks',
            'trucks as active_trucks_count' => static fn (Builder $query) => $query->where('status', 'active'),
        ]);

        $this->applySort($listingQuery, $filters->sort, $filters->direction);

        $paginator = $listingQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (VehicleType $vehicleType): array {
                return [
                    'id' => $vehicleType->id,
                    'name' => $vehicleType->name,
                    'description' => $vehicleType->description,
                    'trucks_count' => (int) ($vehicleType->trucks_count ?? 0),
                    'active_trucks_count' => (int) ($vehicleType->active_trucks_count ?? 0),
                    'created_at' => $vehicleType->created_at?->toDateTimeString(),
                ];
            })
        );

        $vehicleTypes = $this->presentPaginator($paginator);

        $metrics = $this->calculateMetrics($baseQuery);

        return new VehicleTypeIndexResult(
            $vehicleTypes,
            $metrics,
            $filters->toFilterArray(),
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): VehicleTypeIndexFilters
    {
        return VehicleTypeIndexFilters::fromRequest(
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

    private function applySearchFilter(Builder $query, ?string $search): void
    {
        if ($search === null) {
            return;
        }

        $query->where(static function (Builder $inner) use ($search) {
            $inner->where('name', 'like', "%{$search}%")
                ->orWhere('description', 'like', "%{$search}%");
        });
    }

    private function applySort(Builder $query, string $sort, string $direction): void
    {
        $query->orderBy($sort, $direction);
    }

    private function calculateMetrics(Builder $baseQuery): array
    {
        $metricsBase = clone $baseQuery;

        $totalTypes = (clone $metricsBase)->count();
        $typesWithTrucks = (clone $metricsBase)->whereHas('trucks')->count();

        $totalTrucks = (clone $metricsBase)
            ->withCount('trucks')
            ->get()
            ->sum('trucks_count');

        $activeTrucks = (clone $metricsBase)
            ->withCount([
                'trucks as active_trucks_count' => static fn (Builder $query) => $query->where('status', 'active'),
            ])
            ->get()
            ->sum('active_trucks_count');

        return [
            'total' => $totalTypes,
            'with_trucks' => $typesWithTrucks,
            'without_trucks' => max($totalTypes - $typesWithTrucks, 0),
            'total_trucks' => $totalTrucks,
            'active_trucks' => $activeTrucks,
        ];
    }
}

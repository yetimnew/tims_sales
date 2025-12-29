<?php

namespace App\Services\CargoTypes;

use App\Enums\CargoCategory;
use App\Models\CargoType;
use App\Services\CargoTypes\Data\CargoTypeIndexFilters;
use App\Services\CargoTypes\Data\CargoTypeIndexResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class CargoTypeIndexService
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
        'category',
        'weight_per_cubic_meter',
        'requires_special_equipment',
        'created_at',
    ];

    public function getIndexResult(Request $request): CargoTypeIndexResult
    {
        $filters = $this->resolveFilters($request);

        $baseQuery = CargoType::query();

        $this->applyFilters($baseQuery, $filters);

        $listingQuery = clone $baseQuery;
        $listingQuery->orderBy($filters->sort, $filters->direction);

        $paginator = $listingQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (CargoType $cargoType): array {
                $categoryValue = $cargoType->category instanceof CargoCategory
                    ? $cargoType->category->value
                    : (string) $cargoType->category;

                return [
                    'id' => $cargoType->id,
                    'name' => $cargoType->name,
                    'category' => $categoryValue,
                    'weight_per_cubic_meter' => $cargoType->weight_per_cubic_meter !== null
                        ? (float) $cargoType->weight_per_cubic_meter
                        : null,
                    'requires_special_equipment' => (bool) $cargoType->requires_special_equipment,
                    'handling_requirements' => $cargoType->handling_requirements,
                    'safety_requirements' => $cargoType->safety_requirements,
                    'created_at' => $cargoType->created_at?->toDateTimeString(),
                    'updated_at' => $cargoType->updated_at?->toDateTimeString(),
                ];
            })
        );

        $cargoTypes = $this->presentPaginator($paginator);

        $metrics = $this->calculateMetrics(clone $baseQuery);
        // Cache category options (1 hour) - rarely changes
        $categoryOptions = Cache::remember('cargo_types.category_options', 3600, fn () => $this->categoryOptions());

        return new CargoTypeIndexResult(
            $cargoTypes,
            $metrics,
            $filters->toFilterArray(),
            $categoryOptions,
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): CargoTypeIndexFilters
    {
        return CargoTypeIndexFilters::fromRequest(
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

    private function applyFilters(Builder $query, CargoTypeIndexFilters $filters): void
    {
        if ($filters->search !== null) {
            $query->where(static function ($inner) use ($filters) {
                $inner->where('name', 'like', "%{$filters->search}%")
                    ->orWhere('category', 'like', "%{$filters->search}%")
                    ->orWhere('handling_requirements', 'like', "%{$filters->search}%")
                    ->orWhere('safety_requirements', 'like', "%{$filters->search}%");
            });
        }

        if ($filters->category !== null) {
            $enum = CargoCategory::tryFrom($filters->category);
            $query->where('category', $enum?->value ?? $filters->category);
        }

        if ($filters->requiresSpecialEquipment !== null) {
            $query->where('requires_special_equipment', $filters->requiresSpecialEquipment === '1');
        }
    }

    private function calculateMetrics(Builder $baseQuery): array
    {
        $metricsQuery = clone $baseQuery;

        return [
            'total' => (clone $metricsQuery)->count(),
            'requires_special_equipment' => (clone $metricsQuery)->where('requires_special_equipment', true)->count(),
            'without_special_equipment' => (clone $metricsQuery)->where('requires_special_equipment', false)->count(),
            'average_weight' => (float) (clone $metricsQuery)->avg('weight_per_cubic_meter'),
            'distinct_categories' => (clone $metricsQuery)->distinct('category')->count('category'),
        ];
    }

    /**
     * @return array<int, array{label: string, value: string}>
     */
    private function categoryOptions(): array
    {
        return CargoType::query()
            ->select('category')
            ->distinct()
            ->whereNotNull('category')
            ->orderBy('category')
            ->get()
            ->map(static function (CargoType $record): array {
                $enumCategory = $record->category instanceof CargoCategory
                    ? $record->category
                    : CargoCategory::tryFrom((string) $record->category);

                $rawValue = $enumCategory?->value ?? (string) $record->category;

                return [
                    'value' => $rawValue,
                    'label' => $enumCategory?->label() ?? (string) Str::of($rawValue)->replace('_', ' ')->headline(),
                ];
            })
            ->values()
            ->all();
    }
}

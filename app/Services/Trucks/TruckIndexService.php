<?php

namespace App\Services\Trucks;

use App\Models\Truck;
use App\Models\VehicleType;
use App\Services\TruckMetricsService;
use App\Services\Trucks\Data\TruckIndexFilters;
use App\Services\Trucks\Data\TruckIndexResult;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class TruckIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'created_at';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'plate',
        'chasisNumber',
        'engineNumber',
        'serviceIntervalKM',
        'purchasePrice',
        'status',
        'created_at',
    ];

    public function __construct(private readonly TruckMetricsService $truckMetrics)
    {
    }

    public function getIndexResult(Request $request): TruckIndexResult
    {
        $filters = TruckIndexFilters::fromRequest(
            $request,
            self::PER_PAGE_OPTIONS,
            self::DEFAULT_PER_PAGE,
            self::ALLOWED_SORTS,
            self::DEFAULT_SORT,
        );

        $trucksQuery = $this->truckMetrics->applyFilters(
            Truck::query()
                ->select([
                    'id',
                    'plate',
                    'status',
                    'vehicletype_id',
                    'chasisNumber',
                    'engineNumber',
                    'serviceIntervalKM',
                    'purchasePrice',
                    'productionDate',
                    'serviceStartDate',
                    'created_at',
                    'updated_at',
                ])
                ->with(['vehicleType:id,name']),
            $filters->search,
            $filters->vehicleTypeId,
            $filters->status,
        );

        $trucksQuery->orderBy($filters->sort, $filters->direction);

        $paginator = $trucksQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(function (Truck $truck): array {
                return [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'status' => $truck->status,
                    'vehicletype_id' => $truck->vehicletype_id,
                    // Fix N+1: vehicleType is already eager loaded, no need for fallback query
                    'vehicleType' => $truck->vehicleType?->only(['id', 'name']),
                    'chasisNumber' => $truck->chasisNumber,
                    'engineNumber' => $truck->engineNumber,
                    'serviceIntervalKM' => $truck->serviceIntervalKM,
                    'purchasePrice' => $truck->purchasePrice,
                    'productionDate' => $truck->productionDate,
                    'serviceStartDate' => $truck->serviceStartDate,
                    'created_at' => $truck->created_at,
                    'updated_at' => $truck->updated_at,
                ];
            })
        );

        $trucksData = $this->presentPaginator($paginator);

        // Cache status options (1 hour) - rarely changes
        $statusOptions = Cache::remember('trucks.status_options', 3600, function () {
            return Truck::query()
                ->select('status')
                ->distinct()
                ->whereNotNull('status')
                ->orderBy('status')
                ->get()
                ->map(fn (Truck $truck): array => [
                    'label' => Str::of($truck->status)->replace('_', ' ')->headline(),
                    'value' => $truck->status,
                ])
                ->values()
                ->all();
        });

        // Cache vehicle types (1 hour) - rarely changes
        $vehicleTypes = Cache::remember('trucks.vehicle_types', 3600, function () {
            return VehicleType::query()
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(fn (VehicleType $type): array => [
                    'id' => $type->id,
                    'name' => $type->name,
                ])
                ->all();
        });

        $metrics = $this->truckMetrics->metrics($filters->search, $filters->vehicleTypeId, $filters->status);

        return new TruckIndexResult(
            $trucksData,
            $metrics,
            $filters->toFilterArray(),
            $statusOptions,
            $vehicleTypes,
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

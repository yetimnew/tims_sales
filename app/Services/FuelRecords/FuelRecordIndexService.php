<?php

namespace App\Services\FuelRecords;

use App\Models\Driver;
use App\Models\FuelRecord;
use App\Models\Truck;
use App\Services\FuelRecords\Data\FuelRecordIndexFilters;
use App\Services\FuelRecords\Data\FuelRecordIndexResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class FuelRecordIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'fuel_date';

    private const DEFAULT_DIRECTION = 'desc';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'fuel_date',
        'fuel_quantity_liters',
        'total_cost',
        'fuel_type',
        'fuel_price_per_liter',
        'created_at',
    ];

    public function getIndexResult(Request $request): FuelRecordIndexResult
    {
        $filters = $this->resolveFilters($request);

        $baseQuery = FuelRecord::query()->with([
            'truck:id,plate',
            'driver:id,name',
            'user:id,name',
            'driverTruck:id,driver_id,truck_id',
            'driverTruck.driver:id,name',
            'driverTruck.truck:id,plate',
        ]);

        $this->applyFilters($baseQuery, $filters);

        $listingQuery = clone $baseQuery;
        $this->applySort($listingQuery, $filters->sort, $filters->direction);

        $paginator = $listingQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (FuelRecord $record): array {
                return [
                    'id' => $record->id,
                    'fuel_date' => $record->fuel_date?->toDateString(),
                    'fuel_type' => $record->fuel_type,
                    'fuel_quantity_liters' => $record->fuel_quantity_liters !== null ? (float) $record->fuel_quantity_liters : null,
                    'fuel_price_per_liter' => $record->fuel_price_per_liter !== null ? (float) $record->fuel_price_per_liter : null,
                    'total_cost' => $record->total_cost !== null ? (float) $record->total_cost : null,
                    'receipt_number' => $record->receipt_number,
                    'notes' => $record->notes,
                    'truck' => $record->truck ? [
                        'id' => $record->truck->id,
                        'plate' => $record->truck->plate,
                    ] : null,
                    'driver' => $record->driver ? [
                        'id' => $record->driver->id,
                        'name' => $record->driver->name,
                    ] : null,
                    'driver_truck' => $record->driverTruck ? [
                        'id' => $record->driverTruck->id,
                        'driver' => $record->driverTruck->driver ? [
                            'id' => $record->driverTruck->driver->id,
                            'name' => $record->driverTruck->driver->name,
                        ] : null,
                        'truck' => $record->driverTruck->truck ? [
                            'id' => $record->driverTruck->truck->id,
                            'plate' => $record->driverTruck->truck->plate,
                        ] : null,
                    ] : null,
                    'user' => $record->user ? [
                        'id' => $record->user->id,
                        'name' => $record->user->name,
                    ] : null,
                    'created_at' => $record->created_at?->toDateTimeString(),
                    'updated_at' => $record->updated_at?->toDateTimeString(),
                ];
            })
        );

        $fuelRecords = $this->presentPaginator($paginator);

        $metrics = $this->calculateMetrics(clone $baseQuery);

        // Cache options (1 hour) - rarely changes
        $fuelTypeOptions = Cache::remember('fuel_records.fuel_type_options', 3600, fn () => $this->fuelTypeOptions());
        $truckOptions = Cache::remember('fuel_records.truck_options', 3600, fn () => $this->truckOptions());
        $driverOptions = Cache::remember('fuel_records.driver_options', 3600, fn () => $this->driverOptions());

        return new FuelRecordIndexResult(
            $fuelRecords,
            $metrics,
            $filters->toFilterArray(),
            $fuelTypeOptions,
            $truckOptions,
            $driverOptions,
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): FuelRecordIndexFilters
    {
        return FuelRecordIndexFilters::fromRequest(
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

    private function applyFilters(Builder $query, FuelRecordIndexFilters $filters): void
    {
        if ($filters->search !== null) {
            $query->where(static function (Builder $inner) use ($filters) {
                $inner->where('receipt_number', 'like', "%{$filters->search}%")
                    ->orWhere('notes', 'like', "%{$filters->search}%")
                    ->orWhereHas('truck', static function (Builder $truckQuery) use ($filters) {
                        $truckQuery->where('plate', 'like', "%{$filters->search}%");
                    })
                    ->orWhereHas('driver', static function (Builder $driverQuery) use ($filters) {
                        $driverQuery->where('name', 'like', "%{$filters->search}%");
                    });
            });
        }

        if ($filters->fuelType !== null) {
            $query->where('fuel_type', $filters->fuelType);
        }

        if ($filters->truckId !== null) {
            $query->where('truck_id', $filters->truckId);
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

        $total = (clone $metricsQuery)->count();
        $totalLiters = (float) (clone $metricsQuery)->sum('fuel_quantity_liters');
        $totalCost = (float) (clone $metricsQuery)->sum('total_cost');
        $averagePricePerLiter = (float) (clone $metricsQuery)->avg('fuel_price_per_liter');

        $dieselCount = (clone $metricsQuery)->where('fuel_type', 'diesel')->count();
        $petrolCount = (clone $metricsQuery)->where('fuel_type', 'petrol')->count();
        $gasCount = (clone $metricsQuery)->where('fuel_type', 'gas')->count();

        return [
            'total' => $total,
            'total_liters' => $totalLiters,
            'total_cost' => $totalCost,
            'average_price_per_liter' => $averagePricePerLiter,
            'diesel_count' => $dieselCount,
            'petrol_count' => $petrolCount,
            'gas_count' => $gasCount,
        ];
    }

    /**
     * @return array<int, array{label: string, value: string}>
     */
    private function fuelTypeOptions(): array
    {
        return FuelRecord::query()
            ->select('fuel_type')
            ->distinct()
            ->whereNotNull('fuel_type')
            ->orderBy('fuel_type')
            ->get()
            ->map(static fn (FuelRecord $record): array => [
                'label' => Str::of((string) $record->fuel_type)->headline(),
                'value' => (string) $record->fuel_type,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, plate: string}>
     */
    private function truckOptions(): array
    {
        return Truck::query()
            ->orderBy('plate')
            ->get(['id', 'plate'])
            ->map(static fn (Truck $truck): array => [
                'id' => $truck->id,
                'plate' => $truck->plate,
            ])
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function driverOptions(): array
    {
        return Driver::query()
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(static fn (Driver $driver): array => [
                'id' => $driver->id,
                'name' => $driver->name,
            ])
            ->all();
    }
}

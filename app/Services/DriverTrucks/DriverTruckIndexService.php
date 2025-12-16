<?php

namespace App\Services\DriverTrucks;

use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Truck;
use App\Services\DriverTrucks\Data\DriverTruckIndexFilters;
use App\Services\DriverTrucks\Data\DriverTruckIndexResult;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class DriverTruckIndexService
{
    private const PER_PAGE_OPTIONS = [15, 25, 50, 100];

    private const DEFAULT_PER_PAGE = 15;

    private const DEFAULT_SORT = 'created_at';

    private const DEFAULT_DIRECTION = 'desc';

    /**
     * @var array<int, string>
     */
    private const ALLOWED_SORTS = [
        'date_recived',
        'date_detach',
        'status',
        'is_attached',
        'created_at',
        'updated_at',
        'driver_name',
        'truck_plate',
    ];

    public function getIndexResult(Request $request): DriverTruckIndexResult
    {
        $filters = $this->resolveFilters($request);

        $assignmentsQuery = DriverTruck::query()
            ->with([
                'driver:id,name,driverid',
                'truck:id,plate,vehicletype_id',
                'truck.vehicleType:id,name',
            ]);

        $metricsQuery = DriverTruck::query();

        $this->applySearchFilter($assignmentsQuery, $filters->search);
        $this->applySearchFilter($metricsQuery, $filters->search);

        $this->applyStatusFilter($assignmentsQuery, $filters->status);
        $this->applyStatusFilter($metricsQuery, $filters->status);

        $this->applySort($assignmentsQuery, $filters->sort, $filters->direction);

        $paginator = $assignmentsQuery
            ->paginate($filters->perPage)
            ->appends($filters->toQueryParameters());

        $paginator->setCollection(
            $paginator->getCollection()->map(static function (DriverTruck $assignment): array {
                return [
                    'id' => $assignment->id,
                    'driver' => $assignment->relationLoaded('driver') && $assignment->driver ? [
                        'id' => $assignment->driver->id,
                        'name' => $assignment->driver->name,
                        'driverid' => $assignment->driver->driverid,
                    ] : null,
                    'truck' => $assignment->relationLoaded('truck') && $assignment->truck ? [
                        'id' => $assignment->truck->id,
                        'plate' => $assignment->truck->plate,
                    ] : null,
                    'date_recived' => $assignment->date_recived?->toDateString(),
                    'date_detach' => $assignment->date_detach?->toDateString(),
                    'status' => $assignment->status,
                    'is_attached' => (bool) $assignment->is_attached,
                    'created_at' => $assignment->created_at?->toDateTimeString(),
                    'updated_at' => $assignment->updated_at?->toDateTimeString(),
                ];
            })
        );

        $driverTrucks = $this->presentPaginator($paginator);

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'attached' => (clone $metricsQuery)->where('is_attached', 1)->count(),
            'detached' => (clone $metricsQuery)->where('is_attached', 0)->count(),
            'availableDrivers' => $this->countAvailableDrivers(),
            'availableTrucks' => $this->countAvailableTrucks(),
        ];

        // Cache status options (1 hour) - rarely changes
        $statusOptions = Cache::remember('driver_trucks.status_options', 3600, function () {
            return collect(['attached', 'detached'])
                ->merge(
                    DriverTruck::query()
                        ->select('status')
                        ->whereNotNull('status')
                        ->distinct()
                        ->orderBy('status')
                        ->pluck('status')
                )
                ->unique()
                ->filter()
                ->map(fn (string $status) => [
                    'label' => Str::of($status)->replace('_', ' ')->headline(),
                    'value' => $status,
                ])
                ->values()
                ->all();
        });

        return new DriverTruckIndexResult(
            $driverTrucks,
            $metrics,
            $filters->toFilterArray(),
            $statusOptions,
            self::PER_PAGE_OPTIONS,
        );
    }

    public function resolveFilters(Request $request): DriverTruckIndexFilters
    {
        return DriverTruckIndexFilters::fromRequest(
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

        $query->where(function (Builder $inner) use ($search) {
            $inner->whereHas('driver', static function (Builder $driverQuery) use ($search) {
                $driverQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('driverid', 'like', "%{$search}%");
            })
                ->orWhereHas('truck', static function (Builder $truckQuery) use ($search) {
                    $truckQuery->where('plate', 'like', "%{$search}%");
                });
        });
    }

    private function applyStatusFilter(Builder $query, ?string $status): void
    {
        if ($status === null) {
            return;
        }

        if ($status === 'attached') {
            $query->where('is_attached', 1);

            return;
        }

        if ($status === 'detached') {
            $query->where('is_attached', 0);

            return;
        }

        $query->where('status', $status);
    }

    private function applySort(Builder $query, string $sort, string $direction): void
    {
        switch ($sort) {
            case 'driver_name':
                $query
                    ->select('driver_truck.*')
                    ->leftJoin('drivers as sort_drivers', 'driver_truck.driver_id', '=', 'sort_drivers.id')
                    ->orderBy('sort_drivers.name', $direction);

                break;
            case 'truck_plate':
                $query
                    ->select('driver_truck.*')
                    ->leftJoin('trucks as sort_trucks', 'driver_truck.truck_id', '=', 'sort_trucks.id')
                    ->orderBy('sort_trucks.plate', $direction);

                break;
            default:
                $query->orderBy($sort, $direction);
        }
    }

    private function countAvailableDrivers(): int
    {
        return Driver::query()
            ->select('drivers.id')
            ->leftJoin('driver_truck', 'drivers.id', '=', 'driver_truck.driver_id')
            ->where('drivers.status', 'active')
            ->groupBy('drivers.id')
            ->havingRaw('COALESCE(SUM(driver_truck.is_attached), 0) = 0')
            ->count();
    }

    private function countAvailableTrucks(): int
    {
        return Truck::query()
            ->select('trucks.id')
            ->leftJoin('driver_truck', 'trucks.id', '=', 'driver_truck.truck_id')
            ->where('trucks.status', 'active')
            ->groupBy('trucks.id')
            ->havingRaw('COALESCE(SUM(driver_truck.is_attached), 0) = 0')
            ->count();
    }
}

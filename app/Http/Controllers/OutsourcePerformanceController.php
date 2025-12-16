<?php

namespace App\Http\Controllers;

use App\Events\OutsourcePerformanceCreated;
use App\Events\OutsourcePerformanceDeleted;
use App\Events\OutsourcePerformanceUpdated;
use App\Models\Outsource;
use App\Models\OutsourcePerformance;
use App\Models\Place;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OutsourcePerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $this->authorize('viewAny', OutsourcePerformance::class);

        $perPageOptions = [10, 15, 25, 50];

        $user = $request->user();

        $query = OutsourcePerformance::query()
            ->with([
                'outsource:id,name',
                'fromPlace:id,name',
                'toPlace:id,name',
            ]);

        if ($user && ! $user->can('outsource-performances.view-any')) {
            $query->ownedBy($user->id);
        }

        $search = $request->string('search')->trim()->value();
        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder->where('trip_number', 'like', "%{$search}%")
                    ->orWhere('remarks', 'like', "%{$search}%")
                    ->orWhereHas('outsource', fn ($relation) => $relation->where('name', 'like', "%{$search}%"));
            });
        }

        $status = $request->string('status')->trim()->value();
        if ($status !== '' && $status !== 'all') {
            $query->where('status', $status);
        }

        $outsourceId = $request->integer('outsource_id');
        if ($outsourceId > 0) {
            $query->where('outsource_id', $outsourceId);
        }

        if ($request->filled('dispatched_from')) {
            $query->whereDate('dispatch_date', '>=', $request->date('dispatched_from'));
        }

        if ($request->filled('dispatched_to')) {
            $query->whereDate('dispatch_date', '<=', $request->date('dispatched_to'));
        }

        $allowedSortColumns = [
            'trip_number',
            'dispatch_date',
            'distance_km',
            'cargo_volume_mt',
            'tonkm',
            'cost',
            'status',
            'created_at',
        ];

        $sortColumn = $request->get('sort', 'dispatch_date');
        if (! in_array($sortColumn, $allowedSortColumns, true)) {
            $sortColumn = 'dispatch_date';
        }

        $direction = $request->get('direction', 'desc');
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $query->orderBy($sortColumn, $direction);

        $perPage = (int) $request->get('per_page', 15);
        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = 15;
        }

        $metricsQuery = clone $query;

        $outsourcePerformances = $query
            ->paginate($perPage)
            ->withQueryString();

        $totalRecords = (clone $metricsQuery)->count();
        $totalDistance = (clone $metricsQuery)->sum('distance_km');
        $totalCargo = (clone $metricsQuery)->sum('cargo_volume_mt');
        $totalCost = (clone $metricsQuery)->sum('cost');
        $activeRecords = (clone $metricsQuery)->where('status', 'active')->count();

        $metrics = [
            'totalRecords' => $totalRecords,
            'totalDistance' => $totalDistance ? (float) $totalDistance : 0.0,
            'totalCargo' => $totalCargo ? (float) $totalCargo : 0.0,
            'totalCost' => $totalCost ? (float) $totalCost : 0.0,
            'activeRecords' => $activeRecords,
        ];

        // Cache status options (1 hour) - rarely changes
        $statusOptions = Cache::remember('outsource_performances.status_options', 3600, function () {
            return OutsourcePerformance::query()
                ->select('status')
                ->distinct()
                ->orderBy('status')
                ->pluck('status')
                ->filter()
                ->map(fn ($status) => [
                    'label' => Str::headline((string) $status),
                    'value' => $status,
                ])
                ->values()
                ->all();
        });

        // Cache outsource options (1 hour) - changes when outsources are added/removed
        $outsourceOptions = Cache::remember('outsource_performances.outsource_options', 3600, function () {
            return Outsource::query()
                ->select(['id', 'name'])
                ->orderBy('name')
                ->get()
                ->map(fn (Outsource $outsource) => [
                    'label' => $outsource->name,
                    'value' => $outsource->id,
                ])
                ->values()
                ->all();
        });

        $filters = [
            'search' => $search !== '' ? $search : null,
            'status' => $status !== '' ? $status : null,
            'outsource_id' => $outsourceId > 0 ? $outsourceId : null,
            'dispatched_from' => $request->get('dispatched_from'),
            'dispatched_to' => $request->get('dispatched_to'),
            'sort' => $sortColumn,
            'direction' => $direction,
            'per_page' => $perPage,
        ];

        return Inertia::render('OutsourcePerformances/Index', [
            'outsourcePerformances' => $outsourcePerformances,
            'metrics' => $metrics,
            'filters' => $filters,
            'statusOptions' => $statusOptions,
            'outsourceOptions' => $outsourceOptions,
            'perPageOptions' => $perPageOptions,
            'can' => [
                'viewOthers' => $user ? $user->can('outsource-performances.view-any') : false,
            ],
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $this->authorize('create', OutsourcePerformance::class);

        $outsources = Outsource::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Outsource $outsource) => [
                'id' => $outsource->id,
                'name' => $outsource->name,
            ])
            ->values();

        $places = Place::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get()
            ->map(fn (Place $place) => [
                'id' => $place->id,
                'name' => $place->name,
            ])
            ->values();

        $statusOptions = $this->resolveStatusOptions();

        return Inertia::render('OutsourcePerformances/Create', [
            'outsources' => $outsources,
            'statusOptions' => $statusOptions,
            'places' => $places,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorize('create', OutsourcePerformance::class);

        try {
            $validated = $request->validate([
                'outsource_id' => 'required|exists:outsources,id',
                'operation_id' => 'required|exists:operations,id',
                'trip_number' => 'required|string|max:255',
                'dispatch_date' => 'required|date',
                'from_place_id' => 'required|exists:places,id',
                'to_place_id' => 'required|exists:places,id',
                'distance_km' => 'nullable|numeric|min:0',
                'cargo_volume_mt' => 'nullable|numeric|min:0',
                'tonkm' => 'nullable|numeric|min:0',
                'cost' => 'nullable|numeric|min:0',
                'remarks' => 'nullable|string|max:2000',
                'status' => 'required|string|max:100',
            ]);

            $payload = $this->preparePayload($validated);
            $payload['user_id'] = Auth::id();

            $actor = Auth::user();

            $outsourcePerformance = OutsourcePerformance::create($payload);

            Log::info('Outsource performance created', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'outsource_id' => $outsourcePerformance->outsource_id,
                'trip_number' => $outsourcePerformance->trip_number,
                'user_id' => Auth::id(),
            ]);

            event(new OutsourcePerformanceCreated($outsourcePerformance->fresh(), $actor));

            // Clear cached options if status changed
            Cache::forget('outsource_performances.status_options');
            // Clear report caches
            Cache::forget('reports.outsource_performance.status_options');

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance created successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create outsource performance. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(OutsourcePerformance $outsourcePerformance): Response
    {
        $this->authorize('view', $outsourcePerformance);

        $outsourcePerformance->load([
            'outsource:id,name',
            'operation:id,operationid,customer_id',
            'operation.customer:id,name',
            'fromPlace:id,name',
            'toPlace:id,name',
            'user:id,name',
        ]);

        $vendorMetricsQuery = OutsourcePerformance::query()
            ->where('outsource_id', $outsourcePerformance->outsource_id);

        $vendorTripCount = (clone $vendorMetricsQuery)->count();
        $vendorCompletedTrips = (clone $vendorMetricsQuery)->where('status', 'completed')->count();
        $vendorActiveTrips = (clone $vendorMetricsQuery)->where('status', 'active')->count();
        $vendorCancelledTrips = (clone $vendorMetricsQuery)->where('status', 'cancelled')->count();
        $vendorTotalDistance = (float) ((clone $vendorMetricsQuery)->sum('distance_km') ?? 0.0);
        $vendorTotalCargo = (float) ((clone $vendorMetricsQuery)->sum('cargo_volume_mt') ?? 0.0);
        $vendorTotalTonKm = (float) ((clone $vendorMetricsQuery)->sum('tonkm') ?? 0.0);
        $vendorTotalCost = (float) ((clone $vendorMetricsQuery)->sum('cost') ?? 0.0);

        $statusBreakdown = (clone $vendorMetricsQuery)
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->filter(fn ($row) => $row->status !== null)
            ->map(fn ($row) => [
                'label' => (string) $row->status,
                'value' => (int) $row->total,
            ])
            ->values();

        $recentTrips = (clone $vendorMetricsQuery)
            ->orderByDesc('dispatch_date')
            ->limit(10)
            ->get()
            ->map(fn (OutsourcePerformance $record) => [
                'id' => $record->id,
                'trip_number' => $record->trip_number,
                'dispatch_date' => optional($record->dispatch_date)->toDateString(),
                'distance_km' => $record->distance_km ? (float) $record->distance_km : null,
                'cargo_volume_mt' => $record->cargo_volume_mt ? (float) $record->cargo_volume_mt : null,
                'tonkm' => $record->tonkm ? (float) $record->tonkm : null,
                'cost' => $record->cost ? (float) $record->cost : null,
                'status' => $record->status,
                'highlight' => $record->id === $outsourcePerformance->id,
            ])
            ->values();

        $tripDistance = (float) ($outsourcePerformance->distance_km ?? 0.0);
        $tripCargo = (float) ($outsourcePerformance->cargo_volume_mt ?? 0.0);
        $tripTonKm = (float) ($outsourcePerformance->tonkm ?? ($tripDistance * $tripCargo));
        $tripCost = (float) ($outsourcePerformance->cost ?? 0.0);

        $costPerKm = $tripDistance > 0 ? round($tripCost / $tripDistance, 2) : null;
        $costPerTonKm = $tripTonKm > 0 ? round($tripCost / $tripTonKm, 2) : null;

        $distanceShare = $vendorTotalDistance > 0
            ? round(($tripDistance / $vendorTotalDistance) * 100, 2)
            : null;
        $cargoShare = $vendorTotalCargo > 0
            ? round(($tripCargo / $vendorTotalCargo) * 100, 2)
            : null;
        $tonKmShare = $vendorTotalTonKm > 0
            ? round(($tripTonKm / $vendorTotalTonKm) * 100, 2)
            : null;
        $costShare = $vendorTotalCost > 0
            ? round(($tripCost / $vendorTotalCost) * 100, 2)
            : null;

        $performanceData = [
            'id' => $outsourcePerformance->id,
            'trip_number' => $outsourcePerformance->trip_number,
            'dispatch_date' => optional($outsourcePerformance->dispatch_date)->toDateString(),
            'distance_km' => $outsourcePerformance->distance_km ? (float) $outsourcePerformance->distance_km : null,
            'cargo_volume_mt' => $outsourcePerformance->cargo_volume_mt ? (float) $outsourcePerformance->cargo_volume_mt : null,
            'tonkm' => $outsourcePerformance->tonkm ? (float) $outsourcePerformance->tonkm : null,
            'cost' => $outsourcePerformance->cost ? (float) $outsourcePerformance->cost : null,
            'cost_per_km' => $costPerKm,
            'cost_per_tonkm' => $costPerTonKm,
            'remarks' => $outsourcePerformance->remarks,
            'status' => $outsourcePerformance->status,
            'created_at' => optional($outsourcePerformance->created_at)->toDateTimeString(),
            'updated_at' => optional($outsourcePerformance->updated_at)->toDateTimeString(),
            'outsource' => $outsourcePerformance->outsource ? [
                'id' => $outsourcePerformance->outsource->id,
                'name' => $outsourcePerformance->outsource->name,
            ] : null,
            'operation' => $outsourcePerformance->operation ? [
                'id' => $outsourcePerformance->operation->id,
                'label' => $outsourcePerformance->operation->operationid,
                'customer' => $outsourcePerformance->operation->customer ? [
                    'id' => $outsourcePerformance->operation->customer->id,
                    'name' => $outsourcePerformance->operation->customer->name,
                ] : null,
            ] : null,
            'from_place' => $outsourcePerformance->fromPlace ? [
                'id' => $outsourcePerformance->fromPlace->id,
                'name' => $outsourcePerformance->fromPlace->name,
            ] : null,
            'to_place' => $outsourcePerformance->toPlace ? [
                'id' => $outsourcePerformance->toPlace->id,
                'name' => $outsourcePerformance->toPlace->name,
            ] : null,
            'author' => $outsourcePerformance->user ? [
                'id' => $outsourcePerformance->user->id,
                'name' => $outsourcePerformance->user->name,
            ] : null,
        ];

        $metrics = [
            'vendorTripCount' => $vendorTripCount,
            'vendorCompletedTrips' => $vendorCompletedTrips,
            'vendorActiveTrips' => $vendorActiveTrips,
            'vendorCancelledTrips' => $vendorCancelledTrips,
            'vendorTotalDistance' => round($vendorTotalDistance, 2),
            'vendorTotalCargo' => round($vendorTotalCargo, 2),
            'vendorTotalTonKm' => round($vendorTotalTonKm, 2),
            'vendorTotalCost' => round($vendorTotalCost, 2),
            'vendorAverageTonKm' => $vendorTripCount > 0 ? round($vendorTotalTonKm / $vendorTripCount, 2) : null,
            'vendorAverageCost' => $vendorTripCount > 0 ? round($vendorTotalCost / $vendorTripCount, 2) : null,
        ];

        $insights = [
            'share' => [
                'distance' => $distanceShare,
                'cargo' => $cargoShare,
                'tonkm' => $tonKmShare,
                'cost' => $costShare,
            ],
            'statusBreakdown' => $statusBreakdown,
            'averages' => [
                'costPerKm' => $costPerKm,
                'costPerTonKm' => $costPerTonKm,
                'avgTonKmPerTrip' => $metrics['vendorAverageTonKm'],
                'avgCostPerTrip' => $metrics['vendorAverageCost'],
            ],
            'totals' => [
                'trips' => $vendorTripCount,
                'distance' => round($vendorTotalDistance, 2),
                'cargo' => round($vendorTotalCargo, 2),
                'tonkm' => round($vendorTotalTonKm, 2),
                'cost' => round($vendorTotalCost, 2),
            ],
            'tripCounts' => [
                'completed' => $vendorCompletedTrips,
                'active' => $vendorActiveTrips,
                'cancelled' => $vendorCancelledTrips,
            ],
        ];

        return Inertia::render('OutsourcePerformances/Show', [
            'performance' => $performanceData,
            'metrics' => $metrics,
            'recentTrips' => $recentTrips,
            'insights' => $insights,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(OutsourcePerformance $outsourcePerformance): Response
    {
        $this->authorize('update', $outsourcePerformance);

        $outsourcePerformance->load([
            'outsource:id,name',
            'operation:id,operationid,customer_id',
            'operation.customer:id,name',
            'fromPlace:id,name',
            'toPlace:id,name',
        ]);

        // Cache outsources list (1 hour)
        $outsources = Cache::remember('outsource_performances.create_outsources', 3600, function () {
            return Outsource::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn (Outsource $outsource) => [
                    'id' => $outsource->id,
                    'name' => $outsource->name,
                ])
                ->values();
        });

        // Cache places list (1 hour)
        $places = Cache::remember('outsource_performances.create_places', 3600, function () {
            return Place::query()
                ->select('id', 'name')
                ->orderBy('name')
                ->get()
                ->map(fn (Place $place) => [
                    'id' => $place->id,
                    'name' => $place->name,
                ])
                ->values();
        });

        $statusOptions = $this->resolveStatusOptions();

        $outsourcePerformanceData = [
            'id' => $outsourcePerformance->id,
            'outsource_id' => $outsourcePerformance->outsource_id,
            'operation_id' => $outsourcePerformance->operation_id,
            'trip_number' => $outsourcePerformance->trip_number,
            'dispatch_date' => optional($outsourcePerformance->dispatch_date)->toDateString(),
            'from_place_id' => $outsourcePerformance->from_place_id,
            'to_place_id' => $outsourcePerformance->to_place_id,
            'distance_km' => $outsourcePerformance->distance_km ? (float) $outsourcePerformance->distance_km : null,
            'cargo_volume_mt' => $outsourcePerformance->cargo_volume_mt ? (float) $outsourcePerformance->cargo_volume_mt : null,
            'tonkm' => $outsourcePerformance->tonkm ? (float) $outsourcePerformance->tonkm : null,
            'cost' => $outsourcePerformance->cost ? (float) $outsourcePerformance->cost : null,
            'remarks' => $outsourcePerformance->remarks,
            'status' => $outsourcePerformance->status,
            'outsource' => $outsourcePerformance->outsource ? [
                'id' => $outsourcePerformance->outsource->id,
                'name' => $outsourcePerformance->outsource->name,
            ] : null,
            'operation' => $outsourcePerformance->operation ? [
                'id' => $outsourcePerformance->operation->id,
                'operationid' => $outsourcePerformance->operation->operationid,
                'customer' => $outsourcePerformance->operation->customer ? [
                    'id' => $outsourcePerformance->operation->customer->id,
                    'name' => $outsourcePerformance->operation->customer->name,
                ] : null,
            ] : null,
        ];

        return Inertia::render('OutsourcePerformances/Edit', [
            'outsourcePerformance' => $outsourcePerformanceData,
            'outsources' => $outsources,
            'statusOptions' => $statusOptions,
            'places' => $places,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, OutsourcePerformance $outsourcePerformance)
    {
        $this->authorize('update', $outsourcePerformance);

        try {
            $validated = $request->validate([
                'outsource_id' => 'required|exists:outsources,id',
                'operation_id' => 'required|exists:operations,id',
                'trip_number' => 'required|string|max:255',
                'dispatch_date' => 'required|date',
                'from_place_id' => 'required|exists:places,id',
                'to_place_id' => 'required|exists:places,id',
                'distance_km' => 'nullable|numeric|min:0',
                'cargo_volume_mt' => 'nullable|numeric|min:0',
                'tonkm' => 'nullable|numeric|min:0',
                'cost' => 'nullable|numeric|min:0',
                'remarks' => 'nullable|string|max:2000',
                'status' => 'required|string|max:100',
            ]);

            $payload = $this->preparePayload($validated);
            $payload['user_id'] = Auth::id();

            $actor = Auth::user();

            $original = $outsourcePerformance->getOriginal();
            $outsourcePerformance->fill($payload);

            $changes = [];

            foreach ($outsourcePerformance->getDirty() as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            if ($changes !== []) {
                $outsourcePerformance->save();
            }

            Log::info('Outsource performance updated', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'outsource_id' => $outsourcePerformance->outsource_id,
                'trip_number' => $outsourcePerformance->trip_number,
                'user_id' => Auth::id(),
            ]);

            if ($changes !== []) {
                event(new OutsourcePerformanceUpdated($outsourcePerformance->fresh(), $changes, $actor));
            }

            // Clear cached options if status changed
            if (isset($changes['status'])) {
                Cache::forget('outsource_performances.status_options');
                Cache::forget('reports.outsource_performance.status_options'); // Clear report cache
            }

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance updated successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance update failed', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update outsource performance. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(OutsourcePerformance $outsourcePerformance)
    {
        $this->authorize('delete', $outsourcePerformance);

        try {
            $actor = Auth::user();

            $outsourcePerformanceData = $outsourcePerformance->toArray();
            $performanceId = $outsourcePerformance->getKey();
            $tripNumber = $outsourcePerformanceData['trip_number'] ?? null;

            $outsourcePerformance->delete();

            Log::info('Outsource performance deleted', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'trip_number' => $outsourcePerformanceData['trip_number'] ?? null,
                'user_id' => Auth::id(),
            ]);

            event(new OutsourcePerformanceDeleted($performanceId, $tripNumber, $outsourcePerformanceData, $actor));

            // Clear cached options
            Cache::forget('outsource_performances.status_options');
            // Clear report caches
            Cache::forget('reports.outsource_performance.status_options');

            return redirect()->route('outsource-performances.index')
                ->with('success', 'Outsource performance deleted successfully.');

        } catch (Exception $e) {
            Log::error('Outsource performance deletion failed', [
                'outsource_performance_id' => $outsourcePerformance->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete outsource performance. Please try again.']);
        }
    }

    private function resolveStatusOptions(): array
    {
        $options = OutsourcePerformance::query()
            ->select('status')
            ->distinct()
            ->orderBy('status')
            ->pluck('status')
            ->filter()
            ->map(fn ($status) => [
                'label' => Str::headline((string) $status),
                'value' => (string) $status,
            ])
            ->values()
            ->all();

        if (count($options) === 0) {
            $defaults = ['active', 'in_transit', 'completed', 'cancelled'];
            $options = array_map(static fn (string $status) => [
                'label' => Str::headline($status),
                'value' => $status,
            ], $defaults);
        }

        return $options;
    }

    private function preparePayload(array $validated): array
    {
        $payload = $validated;

        foreach (['distance_km', 'cargo_volume_mt', 'tonkm', 'cost'] as $numericField) {
            if (! array_key_exists($numericField, $payload)) {
                continue;
            }

            $value = $payload[$numericField];
            if ($value === '' || $value === null) {
                $payload[$numericField] = null;

                continue;
            }

            $payload[$numericField] = round((float) $value, 2);
        }

        if ($payload['tonkm'] === null && $payload['distance_km'] !== null && $payload['cargo_volume_mt'] !== null) {
            $payload['tonkm'] = round((float) $payload['distance_km'] * (float) $payload['cargo_volume_mt'], 2);
        }

        if (isset($payload['remarks']) && $payload['remarks'] === '') {
            $payload['remarks'] = null;
        }

        return $payload;
    }
}

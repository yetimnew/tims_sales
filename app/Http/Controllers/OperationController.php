<?php

namespace App\Http\Controllers;

use App\Enums\CargoServiceType;
use App\Enums\OperationDestinationScope;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Region;
use App\Models\Woreda;
use App\Models\Zone;
use Carbon\Carbon;
use Exception;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class OperationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $customerId = $request->input('customer');
        $closed = $request->input('closed');
        $sort = $request->input('sort', 'operationid');
        $direction = strtolower((string) $request->input('direction', 'asc'));
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $allowedSorts = ['operationid', 'status', 'startdate', 'enddate', 'volume', 'km', 'tariff', 'closed', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'operationid';
        }

        $baseQuery = Operation::query()
            ->with(['customer', 'cargoType'])
            ->withSum('performances as delivered_volume', 'CargoVolumMT');

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('operationid', 'like', "%{$search}%")
                    ->orWhere('remark', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($status) && $status !== 'all') {
            $baseQuery->where('status', $status);
        }

        if (! empty($customerId) && $customerId !== 'all') {
            $baseQuery->where('customer_id', $customerId);
        }

        if (! empty($closed) && $closed !== 'all') {
            if ($closed === 'closed') {
                $baseQuery->where('closed', true);
            } elseif ($closed === 'open') {
                $baseQuery->where(function ($query) {
                    $query->where('closed', false)->orWhereNull('closed');
                });
            }
        }

        $operationsPaginator = (clone $baseQuery)
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $operations = $operationsPaginator->through(function (Operation $operation) {
            $rawPlannedVolume = $operation->volume;
            $plannedVolume = $rawPlannedVolume !== null ? (float) $rawPlannedVolume : null;
            $deliveredVolume = (float) ($operation->delivered_volume ?? 0);
            $remainingVolume = $plannedVolume !== null ? max($plannedVolume - $deliveredVolume, 0) : null;
            $completionRate = ($plannedVolume !== null && $plannedVolume > 0)
                ? round(($deliveredVolume / $plannedVolume) * 100, 1)
                : null;

            return [
                'id' => $operation->id,
                'operationid' => $operation->operationid,
                'customer' => $operation->customer
                    ? [
                        'id' => $operation->customer->id,
                        'name' => $operation->customer->name,
                    ]
                    : null,
                'cargoType' => $operation->cargoType
                    ? [
                        'id' => $operation->cargoType->id,
                        'name' => $operation->cargoType->name,
                        'category' => $operation->cargoType->category,
                    ]
                    : null,
                'cargoServiceType' => $operation->cargo_service_type instanceof CargoServiceType
                    ? $operation->cargo_service_type->value
                    : $operation->cargo_service_type,
                'cargoServiceLabel' => $operation->cargo_service_type instanceof CargoServiceType
                    ? $operation->cargo_service_type->label()
                    : null,
                'description' => $operation->description,
                'status' => $operation->status,
                'volume' => $plannedVolume !== null ? round($plannedVolume, 2) : null,
                'km' => $operation->km !== null ? round((float) $operation->km, 2) : null,
                'startdate' => $operation->startdate,
                'enddate' => $operation->enddate,
                'closed' => (bool) $operation->closed,
                'created_at' => $operation->created_at ? $operation->created_at->toDateTimeString() : null,
                'deliveredVolume' => round($deliveredVolume, 2),
                'remainingVolume' => $remainingVolume !== null ? round($remainingVolume, 2) : null,
                'volumeCompletion' => $completionRate,
                'destination' => [
                    'scope' => $operation->destination_scope instanceof OperationDestinationScope
                        ? $operation->destination_scope->value
                        : $operation->destination_scope,
                    'name' => $operation->destination_name,
                    'reference_id' => $operation->destination_reference_id,
                    'reference_type' => $operation->destination_reference_type,
                ],
            ];
        });

        $metrics = [
            'total' => (clone $baseQuery)->count(),
            'active' => (clone $baseQuery)->where('status', 'active')->count(),
            'inactive' => (clone $baseQuery)->where('status', 'inactive')->count(),
            'closed' => (clone $baseQuery)->where('closed', true)->count(),
            'open' => (clone $baseQuery)->where(function ($query) {
                $query->where('closed', false)->orWhereNull('closed');
            })->count(),
        ];

        $statusOptions = Operation::query()
            ->select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->get()
            ->map(static fn ($operation) => [
                'label' => Str::of($operation->status)->headline(),
                'value' => $operation->status,
            ])->values();

        $customerOptions = Customer::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Operations/Index', [
            'operations' => $operations,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'customer' => $customerId ?: null,
                'closed' => $closed ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'statusOptions' => $statusOptions,
            'customerOptions' => $customerOptions,
            'perPageOptions' => $perPageOptions,
            'totalCount' => $operations->total(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $customers = Customer::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'status']);

        $regions = Region::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $zones = Zone::query()
            ->orderBy('name')
            ->get(['id', 'name', 'region_id', 'status']);

        $woredas = Woreda::query()
            ->orderBy('name')
            ->get(['id', 'name', 'zone_id', 'status']);

        $places = Place::query()
            ->orderBy('name')
            ->get(['id', 'name', 'woreda_id', 'status']);

        $cargoTypes = CargoType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'category']);

        return Inertia::render('Operations/Create', [
            'customers' => $customers,
            'regions' => $regions,
            'zones' => $zones,
            'woredas' => $woredas,
            'places' => $places,
            'destinationScopes' => OperationDestinationScope::options(),
            'cargoTypes' => $cargoTypes,
            'cargoServiceTypes' => CargoServiceType::options(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'operationid' => 'required|string|max:255|unique:operations',
                'customer_id' => 'required|exists:customers,id',
                'startdate' => 'required|date',
                'volume' => 'required|numeric|min:0',
                'cargo_type_id' => 'required|exists:cargo_types,id',
                'cargo_service_type' => ['required', 'string', Rule::in(CargoServiceType::values())],
                'km' => 'required|numeric|min:0',
                'tariff' => 'required|numeric|min:0',
                'remark' => 'nullable|string|max:1000',
                'status' => 'required|string|in:active,inactive',
                'destination_scope' => ['required', 'string', Rule::in(OperationDestinationScope::values())],
                'destination_id' => ['required', 'integer', 'min:1'],
            ]);

            $destinationAttributes = $this->resolveDestinationAttributes(
                OperationDestinationScope::from($validated['destination_scope']),
                (int) $validated['destination_id']
            );

            $attributes = Arr::except($validated, ['destination_id']);
            $attributes['cargo_type_id'] = (int) $attributes['cargo_type_id'];
            $attributes['cargo_service_type'] = strtolower((string) $attributes['cargo_service_type']);
            $attributes['user_id'] = Auth::id();

            $operation = Operation::create(array_merge($attributes, $destinationAttributes));

            return redirect()->route('operations.index')
                ->with('success', 'Operation created successfully.');

        } catch (Exception $e) {
            Log::error('Operation creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create operation. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Operation $operation): Response
    {
    $operation->load(['customer', 'performances', 'user', 'destinationReference', 'cargoType']);

        // Load activity logs for this operation using Spatie Activity Log
        $activityLogs = Activity::forSubject($operation)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        $performanceQuery = Performance::where('operation_id', $operation->id);

        $aggregate = (clone $performanceQuery)
            ->selectRaw('COUNT(*) as total_trips')
            ->selectRaw('SUM(CASE WHEN is_returned = 1 THEN 1 ELSE 0 END) as completed_trips')
            ->selectRaw('SUM(CASE WHEN is_returned = 0 OR is_returned IS NULL THEN 1 ELSE 0 END) as ongoing_trips')
            ->selectRaw('COALESCE(SUM(COALESCE(CargoVolumMT, 0)), 0) as total_tonnage')
            ->selectRaw('COALESCE(SUM(COALESCE(tonkm, 0)), 0) as total_ton_km')
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0)), 0) as loaded_distance')
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWOCargo, 0)), 0) as empty_distance')
            ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)), 0) as total_distance')
            ->selectRaw('COALESCE(SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(other, 0)), 0) as total_cost')
            ->first();

        $totalTrips = (int) ($aggregate->total_trips ?? 0);
        $completedTrips = (int) ($aggregate->completed_trips ?? 0);
        $ongoingTrips = (int) ($aggregate->ongoing_trips ?? 0);
        $totalTonnage = (float) ($aggregate->total_tonnage ?? 0);
        $totalTonKm = (float) ($aggregate->total_ton_km ?? 0);
        $loadedDistance = (float) ($aggregate->loaded_distance ?? 0);
        $emptyDistance = (float) ($aggregate->empty_distance ?? 0);
        $totalDistance = (float) ($aggregate->total_distance ?? 0);
        $totalCost = (float) ($aggregate->total_cost ?? 0);
        $plannedVolume = (float) ($operation->volume ?? 0);
        $remainingTonnage = max($plannedVolume - $totalTonnage, 0);
        $completionRate = $plannedVolume > 0 ? round(($totalTonnage / $plannedVolume) * 100, 2) : null;
        $averageTonPerTrip = $totalTrips > 0 ? round($totalTonnage / $totalTrips, 2) : null;
        $averageTonKmPerTrip = $totalTrips > 0 ? round($totalTonKm / $totalTrips, 2) : null;
        $returnRate = $totalTrips > 0 ? round(($completedTrips / $totalTrips) * 100, 2) : 0;
        $averageCostPerTrip = $totalTrips > 0 ? round($totalCost / $totalTrips, 2) : null;
        $averageCostPerTon = $totalTonnage > 0 ? round($totalCost / $totalTonnage, 2) : null;
        $plannedTonKm = ($operation->volume ?? 0) * ($operation->km ?? 0);
        $costPerTonKm = $totalTonKm > 0 ? round($totalCost / $totalTonKm, 2) : null;
        $actualRevenue = ($operation->tariff !== null && $operation->tariff !== '') ? round($totalTonKm * (float) $operation->tariff, 2) : null;
        $potentialRevenue = ($operation->tariff !== null && $operation->tariff !== '') ? round($plannedTonKm * (float) $operation->tariff, 2) : null;
        $revenueGap = ($potentialRevenue !== null && $actualRevenue !== null) ? round($potentialRevenue - $actualRevenue, 2) : null;
        $grossMarginValue = ($actualRevenue !== null) ? round($actualRevenue - $totalCost, 2) : null;
        $grossMarginPercent = ($actualRevenue !== null && $actualRevenue != 0.0)
            ? round(($grossMarginValue / $actualRevenue) * 100, 2)
            : null;
        $yieldPerTrip = ($actualRevenue !== null && $totalTrips > 0) ? round($actualRevenue / $totalTrips, 2) : null;
        $yieldPerTon = ($actualRevenue !== null && $totalTonnage > 0) ? round($actualRevenue / $totalTonnage, 2) : null;
        $loadFactor = ($totalDistance > 0) ? round(($loadedDistance / $totalDistance) * 100, 2) : null;
        $emptyBackhaulShare = ($totalDistance > 0) ? round(($emptyDistance / $totalDistance) * 100, 2) : null;
        $tonKmCompletionRate = $plannedTonKm > 0 ? round(($totalTonKm / $plannedTonKm) * 100, 2) : null;

        $timeline = (clone $performanceQuery)
            ->selectRaw('DATE(DateDispach) as date')
            ->selectRaw('COUNT(*) as trips')
            ->selectRaw('COALESCE(SUM(COALESCE(CargoVolumMT, 0)), 0) as tonnage')
            ->groupBy(DB::raw('DATE(DateDispach)'))
            ->orderBy(DB::raw('DATE(DateDispach)'))
            ->limit(14)
            ->get()
            ->map(function ($row) {
                $dateLabel = $row->date ? Carbon::parse($row->date)->format('M j') : 'N/A';

                return [
                    'date' => $dateLabel,
                    'trips' => (int) ($row->trips ?? 0),
                    'tonnage' => round((float) ($row->tonnage ?? 0), 2),
                ];
            })
            ->values()
            ->toArray();

        $tonnageBreakdown = [
            [
                'label' => 'Achieved',
                'value' => round($totalTonnage, 2),
            ],
            [
                'label' => 'Remaining',
                'value' => round($remainingTonnage, 2),
            ],
        ];

        return Inertia::render('Operations/Show', [
            'operation' => $operation,
            'activityLogs' => $activityLogs,
            'performanceInsights' => [
                'totals' => [
                    'plannedVolume' => round($plannedVolume, 2),
                    'totalTrips' => $totalTrips,
                    'completedTrips' => $completedTrips,
                    'ongoingTrips' => $ongoingTrips,
                    'returnRate' => $returnRate,
                    'totalTonnage' => round($totalTonnage, 2),
                    'remainingTonnage' => round($remainingTonnage, 2),
                    'completionRate' => $completionRate,
                    'averageTonPerTrip' => $averageTonPerTrip,
                    'totalDistance' => round($totalDistance, 2),
                    'totalTonKm' => round($totalTonKm, 2),
                    'plannedTonKm' => round($plannedTonKm, 2),
                    'tonKmCompletionRate' => $tonKmCompletionRate,
                    'loadedDistance' => round($loadedDistance, 2),
                    'emptyDistance' => round($emptyDistance, 2),
                    'loadFactor' => $loadFactor,
                    'emptyBackhaulShare' => $emptyBackhaulShare,
                ],
                'financial' => [
                    'totalCost' => round($totalCost, 2),
                    'averageCostPerTrip' => $averageCostPerTrip,
                    'averageCostPerTon' => $averageCostPerTon,
                    'costPerTonKm' => $costPerTonKm,
                ],
                'economics' => [
                    'totalTonKm' => round($totalTonKm, 2),
                    'plannedTonKm' => round($plannedTonKm, 2),
                    'tonKmCompletionRate' => $tonKmCompletionRate,
                    'averageTonKmPerTrip' => $averageTonKmPerTrip,
                    'actualRevenue' => $actualRevenue,
                    'potentialRevenue' => $potentialRevenue,
                    'revenueGap' => $revenueGap,
                    'grossMarginValue' => $grossMarginValue,
                    'grossMarginPercent' => $grossMarginPercent,
                    'costPerTonKm' => $costPerTonKm,
                    'yieldPerTrip' => $yieldPerTrip,
                    'yieldPerTon' => $yieldPerTon,
                    'loadFactor' => $loadFactor,
                    'emptyBackhaulShare' => $emptyBackhaulShare,
                    'loadedDistance' => round($loadedDistance, 2),
                    'emptyDistance' => round($emptyDistance, 2),
                ],
                'trends' => [
                    'timeline' => $timeline,
                    'tonnageBreakdown' => $tonnageBreakdown,
                ],
            ],
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Operation $operation): Response
    {
    $operation->load(['destinationReference', 'cargoType']);

        $customers = Customer::where('status', 'active')
            ->orderBy('name')
            ->get(['id', 'name', 'status']);

        $regions = Region::query()
            ->orderBy('name')
            ->get(['id', 'name']);

        $zones = Zone::query()
            ->orderBy('name')
            ->get(['id', 'name', 'region_id', 'status']);

        $woredas = Woreda::query()
            ->orderBy('name')
            ->get(['id', 'name', 'zone_id', 'status']);

        $places = Place::query()
            ->orderBy('name')
            ->get(['id', 'name', 'woreda_id', 'status']);

        $cargoTypes = CargoType::query()
            ->orderBy('name')
            ->get(['id', 'name', 'category']);

        return Inertia::render('Operations/Edit', [
            'operation' => $operation,
            'customers' => $customers,
            'regions' => $regions,
            'zones' => $zones,
            'woredas' => $woredas,
            'places' => $places,
            'destinationScopes' => OperationDestinationScope::options(),
            'cargoTypes' => $cargoTypes,
            'cargoServiceTypes' => CargoServiceType::options(),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Operation $operation)
    {
        try {
            $validated = $request->validate([
                'operationid' => 'required|string|max:255|unique:operations,operationid,'.$operation->id,
                'customer_id' => 'required|exists:customers,id',
                'startdate' => 'required|date',
                'volume' => 'required|numeric|min:0',
                'cargo_type_id' => 'required|exists:cargo_types,id',
                'cargo_service_type' => ['required', 'string', Rule::in(CargoServiceType::values())],
                'km' => 'required|numeric|min:0',
                'tariff' => 'required|numeric|min:0',
                'remark' => 'nullable|string|max:1000',
                'status' => 'required|string|in:active,inactive',
                'destination_scope' => ['required', 'string', Rule::in(OperationDestinationScope::values())],
                'destination_id' => ['required', 'integer', 'min:1'],
            ]);

            $destinationAttributes = $this->resolveDestinationAttributes(
                OperationDestinationScope::from($validated['destination_scope']),
                (int) $validated['destination_id']
            );

            $attributes = Arr::except($validated, ['destination_id']);
            $attributes['cargo_type_id'] = (int) $attributes['cargo_type_id'];
            $attributes['cargo_service_type'] = strtolower((string) $attributes['cargo_service_type']);

            $operation->update(array_merge($attributes, $destinationAttributes));

            return redirect()->route('operations.index')
                ->with('success', 'Operation updated successfully.');

        } catch (Exception $e) {
            Log::error('Operation update failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update operation. Please try again.']);
        }
    }

    /**
     * Resolve destination metadata for the provided scope and identifier.
     *
     * @throws ValidationException
     */
    private function resolveDestinationAttributes(OperationDestinationScope $scope, int $destinationId): array
    {
        return match ($scope) {
            OperationDestinationScope::Region => $this->buildDestinationAttributes(Region::query()->find($destinationId)),
            OperationDestinationScope::Zone => $this->buildDestinationAttributes(Zone::query()->find($destinationId)),
            OperationDestinationScope::Woreda => $this->buildDestinationAttributes(Woreda::query()->find($destinationId)),
            OperationDestinationScope::Place => $this->buildDestinationAttributes(Place::query()->find($destinationId)),
        };
    }

    /**
     * Prepare morph attributes for the resolved destination model.
     *
     * @throws ValidationException
     */
    private function buildDestinationAttributes(?Model $model): array
    {
        if (! $model) {
            throw ValidationException::withMessages([
                'destination_id' => __('The selected destination is invalid.'),
            ]);
        }

        $name = $model->name ?? (string) $model->getKey();

        return [
            'destination_name' => $name,
            'destination_reference_type' => $model::class,
            'destination_reference_id' => $model->getKey(),
        ];
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Operation $operation)
    {
        try {
            // Check for related records that prevent deletion

            // Check if operation has performances
            if ($operation->performances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this operation. It has '.$operation->performances()->count().' performance record(s). Please remove all performance records first.',
                ]);
            }

            // Check if operation has outsource performances
            if ($operation->outsourcePerformances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this operation. It has '.$operation->outsourcePerformances()->count().' outsource performance record(s). Please remove all outsource performance records first.',
                ]);
            }

            $operation->delete();

            return redirect()->route('operations.index')
                ->with('success', 'Operation deleted successfully.');

        } catch (Exception $e) {
            Log::error('Operation deletion failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete operation. Please try again.']);
        }
    }

    /**
     * Export operations to CSV.
     */
    public function export(Request $request)
    {
        $query = Operation::with(['customer']);

        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $customerId = $request->input('customer');
        $closed = $request->input('closed');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('operationid', 'like', "%{$search}%")
                    ->orWhere('remark', 'like', "%{$search}%")
                    ->orWhereHas('customer', function ($customerQuery) use ($search) {
                        $customerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($status) && $status !== 'all') {
            $query->where('status', $status);
        }

        if (! empty($customerId) && $customerId !== 'all') {
            $query->where('customer_id', $customerId);
        }

        if (! empty($closed) && $closed !== 'all') {
            if ($closed === 'closed') {
                $query->where('closed', true);
            } elseif ($closed === 'open') {
                $query->where(function ($query) {
                    $query->where('closed', false)->orWhereNull('closed');
                });
            }
        }

        $sort = $request->input('sort', 'operationid');
        $direction = strtolower((string) $request->input('direction', 'asc'));
        $allowedSorts = ['operationid', 'status', 'startdate', 'enddate', 'volume', 'km', 'tariff', 'closed', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'operationid';
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $query->orderBy($sort, $direction);

        $operations = $query->get();

        // Generate CSV
        $filename = 'operations_'.now()->format('Y-m-d_H-i-s').'.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Operation ID',
            'Customer',
            'Description',
            'Status',
            'Start Date',
            'End Date',
            'Volume (MT)',
            'Distance (KM)',
            'Tariff',
            'Closed',
            'Created At',
        ]);

        // Write data
        foreach ($operations as $operation) {
            fputcsv($handle, [
                $operation->id,
                $operation->operationid,
                $operation->customer?->name ?? 'N/A',
                $operation->description ?? 'N/A',
                $operation->status,
                $operation->startdate,
                $operation->enddate ?? 'N/A',
                $operation->volume ?? 'N/A',
                $operation->km ?? 'N/A',
                $operation->tariff ?? 'N/A',
                $operation->closed ? 'Yes' : 'No',
                $operation->created_at,
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log activity using Spatie Activity Log
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($operations)])
                ->log('exported operations to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Deactivate the specified operation.
     */
    public function deactivate(Operation $operation)
    {
        try {
            $operation->update(['status' => 'inactive']);

            Log::info('Operation deactivated', [
                'operation_id' => $operation->id,
                'operationid' => $operation->operationid,
                'user_id' => Auth::id(),
            ]);

            return redirect()->route('operations.index')
                ->with('success', 'Operation deactivated successfully.');

        } catch (Exception $e) {
            Log::error('Operation deactivation failed', [
                'operation_id' => $operation->id,
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to deactivate operation. Please try again.']);
        }
    }

    /**
     * Get available operations (not closed/completed).
     */
    public function availableOperations()
    {
        try {
            $availableOperations = Operation::where('status', 'active')
                ->where('closed', false)
                ->with(['customer', 'destinationReference', 'cargoType'])
                ->orderBy('operationid')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $availableOperations,
                'count' => $availableOperations->count(),
            ]);

        } catch (Exception $e) {
            Log::error('Failed to retrieve available operations', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve available operations',
            ], 500);
        }
    }
}

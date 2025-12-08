<?php

namespace App\Http\Controllers;

use App\Models\Distance;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Place;
use Carbon\Carbon;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class PerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $loadPhase = $request->input('load_phase');
        $sort = $request->input('sort', 'DateDispach');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = [
            'FOnumber',
            'DateDispach',
            'load_phase',
            'load_completion',
            'satus',
            'DistanceWCargo',
            'DistanceWOCargo',
            'CargoVolumMT',
            'fuelInBirr',
            'fuelInLitter',
            'created_at',
        ];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'DateDispach';
        }

        $baseQuery = Performance::query()
            ->select([
                'id',
                'FOnumber',
                'DateDispach',
                'load_phase',
                'load_completion',
                'satus',
                'DistanceWCargo',
                'DistanceWOCargo',
                'CargoVolumMT',
                'fuelInBirr',
                'fuelInLitter',
                'created_at',
            ]);

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('FOnumber', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        if (! empty($status) && $status !== 'all') {
            $baseQuery->where('satus', $status);
        }

        if (! empty($loadPhase) && $loadPhase !== 'all') {
            $baseQuery->where('load_phase', $loadPhase);
        }

        $performancesPaginator = (clone $baseQuery)
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $performances = $performancesPaginator->through(function (Performance $performance) {
            return [
                'id' => $performance->id,
                'foNumber' => $performance->FOnumber,
                'dispatchDate' => $performance->DateDispach,
                'loadPhase' => $performance->load_phase,
                'loadCompletion' => $performance->load_completion,
                'status' => $performance->satus,
                'distanceWithCargo' => $performance->DistanceWCargo !== null ? (float) $performance->DistanceWCargo : null,
                'distanceWithoutCargo' => $performance->DistanceWOCargo !== null ? (float) $performance->DistanceWOCargo : null,
                'tonnage' => $performance->CargoVolumMT !== null ? (float) $performance->CargoVolumMT : null,
                'fuelCost' => $performance->fuelInBirr !== null ? (float) $performance->fuelInBirr : null,
                'fuelInLitter' => $performance->fuelInLitter !== null ? (float) $performance->fuelInLitter : null,
                'createdAt' => $performance->created_at ? $performance->created_at->toDateTimeString() : null,
            ];
        });

        $metricsQuery = clone $baseQuery;

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'active' => (clone $metricsQuery)->where('satus', 'active')->count(),
            'completed' => (clone $metricsQuery)->where('satus', 'completed')->count(),
            'failed' => (clone $metricsQuery)->where('satus', 'failed')->count(),
        ];

        $statusOptions = Performance::query()
            ->select('satus')
            ->distinct()
            ->whereNotNull('satus')
            ->orderBy('satus')
            ->get()
            ->map(static fn ($performance) => [
                'label' => Str::of((string) $performance->satus)->replace('_', ' ')->headline(),
                'value' => $performance->satus,
            ])
            ->values();

        $loadPhaseOptions = Performance::query()
            ->select('load_phase')
            ->distinct()
            ->whereNotNull('load_phase')
            ->orderBy('load_phase')
            ->get()
            ->map(static fn ($performance) => [
                'label' => Str::of((string) $performance->load_phase)->headline(),
                'value' => $performance->load_phase,
            ])
            ->values();

        return Inertia::render('Performances/Index', [
            'performances' => $performances,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'load_phase' => $loadPhase ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'statusOptions' => $statusOptions,
            'loadPhaseOptions' => $loadPhaseOptions,
            'perPageOptions' => $perPageOptions,
            'totalCount' => $performancesPaginator->total(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $driverTrucks = DriverTruck::with(['driver', 'truck'])
            ->active()
            ->isAttached()
            ->get();

        $places = Place::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Place $place) => [
                'id' => $place->id,
                'name' => $place->name,
            ])
            ->values();

        return Inertia::render('Performances/Create', [
            'driverTrucks' => $driverTrucks,
            'places' => $places,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'load_phase' => 'required|string|in:main,return',
            'load_completion' => 'required|string|in:full,partial',
            'FOnumber' => 'required|string|max:255',
            'operation_id' => 'required|exists:operations,id',
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'DateDispach' => 'required|date',
            'orgion_id' => 'required|exists:places,id',
            'destination_id' => 'required|exists:places,id',
            'DistanceWCargo' => 'nullable|numeric',
            'tonkm' => 'nullable|numeric',
            'DistanceWOCargo' => 'nullable|numeric',
            'CargoVolumMT' => 'nullable|numeric',
            'fuelInLitter' => 'nullable|numeric',
            'fuelInBirr' => 'nullable|numeric',
            'perdiem' => 'nullable|numeric',
            'workOnGoing' => 'nullable|numeric',
            'other' => 'nullable|numeric',
            'comment' => 'nullable|string',
            'satus' => 'required|string|in:active,inactive',
            'is_returned' => 'boolean',
            'returned_date' => 'nullable|date',
        ]);

        $distanceRecord = $this->findDistanceRecord((int) $validated['orgion_id'], (int) $validated['destination_id']);
        $distanceValue = $distanceRecord ? (float) $distanceRecord->distance_km : 0.0;

        $validated['DistanceWCargo'] = round($distanceValue, 2);
        $validated['tonkm'] = $this->calculateTonKm($distanceValue, $validated['CargoVolumMT'] ?? null);
        $validated['user_id'] = Auth::id();

        Performance::create($validated);

        $successMessage = 'Performance created successfully.';
        if (! $distanceRecord) {
            $successMessage .= ' Distance between the selected origin and destination is not registered. Distance with cargo was set to 0 km. Please register this route under Distances before the next trip.';
        }

        $redirect = redirect()->route('performances.index')
            ->with('success', $successMessage);

        if ($distanceRecord) {
            $redirect->with(
                'info',
                sprintf('Distance with cargo set to %s km using the registered route.', number_format($distanceValue, 2))
            );
        }

        return $redirect;
    }

    /**
     * Display the specified resource.
     */
    public function show(Performance $performance): Response
    {
        $performance->load([
            'operation.customer',
            'driverTruck.driver',
            'driverTruck.truck',
            'origin',
            'destination',
            'user',
        ]);

        // Load activity logs for this performance using Spatie Activity Log
        $activityLogs = Activity::forSubject($performance)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        $operationInsights = null;

        if ($performance->operation) {
            $operation = $performance->operation;

            $operationPerformancesQuery = Performance::where('operation_id', $operation->id);

            $aggregate = (clone $operationPerformancesQuery)
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

            $operationPlannedVolume = (float) ($operation->volume ?? 0);
            $operationTotalTrips = (int) ($aggregate->total_trips ?? 0);
            $operationCompletedTrips = (int) ($aggregate->completed_trips ?? 0);
            $operationOngoingTrips = (int) ($aggregate->ongoing_trips ?? 0);
            $operationTotalTonnage = (float) ($aggregate->total_tonnage ?? 0);
            $operationTotalTonKm = (float) ($aggregate->total_ton_km ?? 0);
            $operationRemainingTonnage = max($operationPlannedVolume - $operationTotalTonnage, 0);
            $operationTotalDistance = (float) ($aggregate->total_distance ?? 0);
            $operationLoadedDistance = (float) ($aggregate->loaded_distance ?? 0);
            $operationEmptyDistance = (float) ($aggregate->empty_distance ?? 0);
            $operationTotalCost = (float) ($aggregate->total_cost ?? 0);
            $operationTariff = $operation->tariff !== null ? (float) $operation->tariff : null;
            $operationPlannedDistance = (float) ($operation->km ?? 0);
            $operationPlannedTonKm = $operationPlannedVolume > 0 && $operationPlannedDistance > 0
                ? $operationPlannedVolume * $operationPlannedDistance
                : 0;
            $operationTonKmCompletionRate = $operationPlannedTonKm > 0
                ? round(($operationTotalTonKm / $operationPlannedTonKm) * 100, 2)
                : null;
            $operationActualRevenue = ($operationTariff !== null && $operationTotalTonKm > 0)
                ? round($operationTotalTonKm * $operationTariff, 2)
                : null;
            $operationCostPerTonKm = $operationTotalTonKm > 0
                ? round($operationTotalCost / $operationTotalTonKm, 2)
                : null;
            $operationGrossMarginValue = ($operationActualRevenue !== null)
                ? round($operationActualRevenue - $operationTotalCost, 2)
                : null;
            $operationGrossMarginPercent = ($operationActualRevenue !== null && $operationActualRevenue != 0.0)
                ? round(($operationGrossMarginValue / $operationActualRevenue) * 100, 2)
                : null;
            $operationLoadFactor = $operationTotalDistance > 0
                ? round(($operationLoadedDistance / $operationTotalDistance) * 100, 2)
                : null;
            $operationEmptyShare = $operationTotalDistance > 0
                ? round(($operationEmptyDistance / $operationTotalDistance) * 100, 2)
                : null;

            $performanceTonnage = (float) ($performance->CargoVolumMT ?? 0);
            $performanceDistance = (float) (($performance->DistanceWCargo ?? 0) + ($performance->DistanceWOCargo ?? 0));
            $performanceCost = (float) (($performance->fuelInBirr ?? 0) + ($performance->perdiem ?? 0) + ($performance->other ?? 0));
            $performanceTonKm = (float) ($performance->tonkm ?? (($performance->DistanceWCargo ?? 0) * ($performance->CargoVolumMT ?? 0)));
            $performanceTariff = $operationTariff;
            $performanceRevenue = ($performanceTariff !== null && $performanceTonKm > 0)
                ? round($performanceTonKm * $performanceTariff, 2)
                : null;
            $performanceCostPerTonKm = $performanceTonKm > 0
                ? round($performanceCost / $performanceTonKm, 2)
                : null;
            $performanceMarginValue = ($performanceRevenue !== null)
                ? round($performanceRevenue - $performanceCost, 2)
                : null;
            $performanceMarginPercent = ($performanceRevenue !== null && $performanceRevenue != 0.0)
                ? round(($performanceMarginValue / $performanceRevenue) * 100, 2)
                : null;
            $performanceYieldPerTon = ($performanceRevenue !== null && $performanceTonnage > 0)
                ? round($performanceRevenue / $performanceTonnage, 2)
                : null;
            $performanceYieldPerKm = ($performanceRevenue !== null && $performanceDistance > 0)
                ? round($performanceRevenue / $performanceDistance, 2)
                : null;
            $performanceLoadFactor = $performanceDistance > 0
                ? round((($performance->DistanceWCargo ?? 0) / $performanceDistance) * 100, 2)
                : null;
            $performanceEmptyShare = $performanceDistance > 0
                ? round((($performance->DistanceWOCargo ?? 0) / $performanceDistance) * 100, 2)
                : null;

            $tonnageShare = $operationTotalTonnage > 0
                ? round(($performanceTonnage / $operationTotalTonnage) * 100, 2)
                : null;
            $distanceShare = $operationTotalDistance > 0
                ? round(($performanceDistance / $operationTotalDistance) * 100, 2)
                : null;
            $costShare = $operationTotalCost > 0
                ? round(($performanceCost / $operationTotalCost) * 100, 2)
                : null;
            $plannedContribution = $operationPlannedVolume > 0
                ? round(($performanceTonnage / $operationPlannedVolume) * 100, 2)
                : null;

            $recentPerformances = (clone $operationPerformancesQuery)
                ->select(['id', 'FOnumber', 'DateDispach', 'CargoVolumMT', 'DistanceWCargo', 'DistanceWOCargo', 'fuelInBirr', 'perdiem', 'other'])
                ->orderByDesc('DateDispach')
                ->limit(10)
                ->get()
                ->map(function (Performance $item) use ($performance) {
                    $totalDistance = (float) (($item->DistanceWCargo ?? 0) + ($item->DistanceWOCargo ?? 0));
                    $totalCost = (float) (($item->fuelInBirr ?? 0) + ($item->perdiem ?? 0) + ($item->other ?? 0));
                    $tonnage = (float) ($item->CargoVolumMT ?? 0);

                    return [
                        'id' => $item->id,
                        'foNumber' => $item->FOnumber,
                        'date' => $item->DateDispach ? Carbon::parse($item->DateDispach)->format('M j') : 'N/A',
                        'tonnage' => round($tonnage, 2),
                        'distance' => round($totalDistance, 2),
                        'cost' => round($totalCost, 2),
                        'highlight' => $performance->id === $item->id,
                    ];
                })
                ->reverse()
                ->values();

            $statusBreakdown = (clone $operationPerformancesQuery)
                ->selectRaw("CASE WHEN is_returned = 1 THEN 'Returned' ELSE 'In transit' END as label")
                ->selectRaw('COUNT(*) as value')
                ->groupBy(DB::raw("CASE WHEN is_returned = 1 THEN 'Returned' ELSE 'In transit' END"))
                ->get()
                ->map(fn ($row) => [
                    'label' => $row->label,
                    'value' => (int) $row->value,
                ]);

            $operationInsights = [
                'overview' => [
                    'plannedVolume' => round($operationPlannedVolume, 2),
                    'totalTrips' => $operationTotalTrips,
                    'completedTrips' => $operationCompletedTrips,
                    'ongoingTrips' => $operationOngoingTrips,
                    'totalTonnage' => round($operationTotalTonnage, 2),
                    'remainingTonnage' => round($operationRemainingTonnage, 2),
                    'completionRate' => $operationPlannedVolume > 0
                        ? round(($operationTotalTonnage / $operationPlannedVolume) * 100, 2)
                        : null,
                ],
                'economics' => [
                    'tariff' => $operationTariff,
                    'totalTonKm' => round($operationTotalTonKm, 2),
                    'plannedTonKm' => round($operationPlannedTonKm, 2),
                    'tonKmCompletionRate' => $operationTonKmCompletionRate,
                    'actualRevenue' => $operationActualRevenue,
                    'totalCost' => round($operationTotalCost, 2),
                    'costPerTonKm' => $operationCostPerTonKm,
                    'grossMarginValue' => $operationGrossMarginValue,
                    'grossMarginPercent' => $operationGrossMarginPercent,
                    'loadFactor' => $operationLoadFactor,
                    'emptyBackhaulShare' => $operationEmptyShare,
                    'loadedDistance' => round($operationLoadedDistance, 2),
                    'emptyDistance' => round($operationEmptyDistance, 2),
                ],
                'tripEconomics' => [
                    'tariff' => $performanceTariff,
                    'tonKm' => round($performanceTonKm, 2),
                    'actualRevenue' => $performanceRevenue,
                    'cost' => round($performanceCost, 2),
                    'costPerTonKm' => $performanceCostPerTonKm,
                    'grossMarginValue' => $performanceMarginValue,
                    'grossMarginPercent' => $performanceMarginPercent,
                    'yieldPerTon' => $performanceYieldPerTon,
                    'yieldPerKm' => $performanceYieldPerKm,
                    'loadFactor' => $performanceLoadFactor,
                    'emptyBackhaulShare' => $performanceEmptyShare,
                    'distanceWithCargo' => round((float) ($performance->DistanceWCargo ?? 0), 2),
                    'distanceWithoutCargo' => round((float) ($performance->DistanceWOCargo ?? 0), 2),
                ],
                'performanceShare' => [
                    'tonnageShare' => $tonnageShare,
                    'distanceShare' => $distanceShare,
                    'costShare' => $costShare,
                    'plannedContribution' => $plannedContribution,
                    'tonnage' => round($performanceTonnage, 2),
                    'distance' => round($performanceDistance, 2),
                    'cost' => round($performanceCost, 2),
                    'tonKm' => round($performanceTonKm, 2),
                ],
                'trends' => [
                    'recentTrips' => $recentPerformances,
                    'statusBreakdown' => $statusBreakdown,
                ],
            ];
        }

        return Inertia::render('Performances/Show', [
            'performance' => $performance,
            'activityLogs' => $activityLogs,
            'operationInsights' => $operationInsights,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Performance $performance): Response
    {
        $driverTrucks = DriverTruck::with(['driver', 'truck'])
            ->active()
            ->isAttached()
            ->get();

        $places = Place::query()
            ->select(['id', 'name'])
            ->orderBy('name')
            ->get()
            ->map(fn (Place $place) => [
                'id' => $place->id,
                'name' => $place->name,
            ])
            ->values();

        return Inertia::render('Performances/Edit', [
            'performance' => $performance,
            'driverTrucks' => $driverTrucks,
            'places' => $places,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Performance $performance)
    {
        $validated = $request->validate([
            'load_phase' => 'required|string|in:main,return',
            'load_completion' => 'required|string|in:full,partial',
            'FOnumber' => 'required|string|max:255',
            'operation_id' => 'required|exists:operations,id',
            'driver_truck_id' => 'required|exists:driver_truck,id',
            'DateDispach' => 'required|date',
            'orgion_id' => 'required|exists:places,id',
            'destination_id' => 'required|exists:places,id',
            'DistanceWCargo' => 'nullable|numeric',
            'tonkm' => 'nullable|numeric',
            'DistanceWOCargo' => 'nullable|numeric',
            'CargoVolumMT' => 'nullable|numeric',
            'fuelInLitter' => 'nullable|numeric',
            'fuelInBirr' => 'nullable|numeric',
            'perdiem' => 'nullable|numeric',
            'workOnGoing' => 'nullable|numeric',
            'other' => 'nullable|numeric',
            'comment' => 'nullable|string',
            'satus' => 'required|string|in:active,inactive',
            'is_returned' => 'boolean',
            'returned_date' => 'nullable|date',
        ]);

        $distanceRecord = $this->findDistanceRecord((int) $validated['orgion_id'], (int) $validated['destination_id']);
        $distanceValue = $distanceRecord ? (float) $distanceRecord->distance_km : 0.0;

        $validated['DistanceWCargo'] = round($distanceValue, 2);
        $validated['tonkm'] = $this->calculateTonKm($distanceValue, $validated['CargoVolumMT'] ?? null);

        $performance->update($validated);

        $successMessage = 'Performance updated successfully.';
        if (! $distanceRecord) {
            $successMessage .= ' Distance between the selected origin and destination is not registered. Distance with cargo was set to 0 km. Please register this route under Distances before the next trip.';
        }

        $redirect = redirect()->route('performances.index')
            ->with('success', $successMessage);

        if ($distanceRecord) {
            $redirect->with(
                'info',
                sprintf('Distance with cargo refreshed to %s km from the registered route.', number_format($distanceValue, 2))
            );
        }

        return $redirect;
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Performance $performance)
    {
        $performance->delete();

        return redirect()->route('performances.index')
            ->with('success', 'Performance deleted successfully.');
    }

    /**
     * Get status list for DataTables.
     */
    public function statusList()
    {
        $statuses = Performance::select('satus')
            ->distinct()
            ->pluck('satus');

        return response()->json($statuses);
    }

    /**
     * Calculate distance between places via AJAX.
     */
    public function calculateDistance(Request $request)
    {
        $validated = $request->validate([
            'from_place_id' => ['required', 'integer'],
            'to_place_id' => ['required', 'integer'],
        ]);

        $distance = $this->findDistanceRecord((int) $validated['from_place_id'], (int) $validated['to_place_id']);

        if ($distance) {
            return response()->json([
                'distance' => (float) $distance->distance_km,
                'estimated_time' => $distance->estimated_time_hours,
                'found' => true,
            ]);
        }

        return response()->json([
            'distance' => 0,
            'estimated_time' => null,
            'found' => false,
            'note' => 'Distance between the selected origin and destination is not registered. Please add it via the Distances module before recording performances.',
        ]);
    }

    private function calculateTonKm(float $distanceKm, $cargoVolume): float
    {
        $volume = $cargoVolume !== null ? (float) $cargoVolume : 0.0;

        if ($volume <= 0 || $distanceKm <= 0) {
            return 0.0;
        }

        return round($distanceKm * $volume, 4);
    }

    private function findDistanceRecord(int $originId, int $destinationId): ?Distance
    {
        return Distance::query()
            ->betweenPlaces($originId, $destinationId)
            ->orderByRaw('CASE WHEN from_place_id = ? AND to_place_id = ? THEN 0 ELSE 1 END', [$originId, $destinationId])
            ->first();
    }

    /**
     * Export performances to CSV.
     */
    public function export(Request $request)
    {
        $query = Performance::with([
            'operation.customer', 'driverTruck.driver', 'driverTruck.truck', 'origin', 'destination',
        ]);

        $search = trim((string) $request->input('search'));
        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('FOnumber', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        $status = $request->input('status');
        if (! empty($status) && $status !== 'all') {
            $query->where('satus', $status);
        }

        $loadPhase = $request->input('load_phase', $request->input('load_type'));
        if (! empty($loadPhase) && $loadPhase !== 'all') {
            $query->where('load_phase', $loadPhase);
        }

        $sort = $request->input('sort', 'DateDispach');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = [
            'FOnumber',
            'DateDispach',
            'load_phase',
            'load_completion',
            'satus',
            'DistanceWCargo',
            'DistanceWOCargo',
            'CargoVolumMT',
            'fuelInBirr',
            'fuelInLitter',
            'created_at',
        ];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'DateDispach';
        }

        $query->orderBy($sort, $direction);

        $performances = $query->get();

        // Generate CSV
        $filename = 'performances_'.now()->format('Y-m-d_H-i-s').'.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'FO Number',
            'Date Dispatch',
            'Load Phase',
            'Load Completion',
            'Customer',
            'Driver',
            'Truck',
            'Origin',
            'Destination',
            'Distance with Cargo',
            'Distance without Cargo',
            'Cargo Volume (MT)',
            'Fuel (Litter)',
            'Fuel (Birr)',
            'Status',
            'Created At',
        ]);

        // Write data
        foreach ($performances as $performance) {
            fputcsv($handle, [
                $performance->id,
                $performance->FOnumber,
                $performance->DateDispach,
                $performance->load_phase ?? 'N/A',
                $performance->load_completion ?? 'N/A',
                $performance->operation?->customer?->name ?? 'N/A',
                $performance->driverTruck?->driver?->name ?? 'N/A',
                $performance->driverTruck?->truck?->plate ?? 'N/A',
                $performance->origin?->name ?? 'N/A',
                $performance->destination?->name ?? 'N/A',
                $performance->DistanceWCargo ?? 'N/A',
                $performance->DistanceWOCargo ?? 'N/A',
                $performance->CargoVolumMT ?? 'N/A',
                $performance->fuelInLitter ?? 'N/A',
                $performance->fuelInBirr ?? 'N/A',
                $performance->satus,
                $performance->created_at,
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log activity using Spatie Activity Log
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($performances)])
                ->log('exported performances to CSV');
        }

        return response($csv, 200, [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => 'attachment; filename="'.$filename.'"',
        ]);
    }

    /**
     * Deactivate the specified performance.
     */
    public function deactivate(Performance $performance)
    {
        try {
            $performance->update(['satus' => 'inactive']);

            return redirect()->route('performances.index')
                ->with('success', 'Performance deactivated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to deactivate performance. Please try again.']);
        }
    }

    /**
     * Get active performances.
     */
    public function activePerformances()
    {
        try {
            $activePerformances = Performance::where('satus', 'active')
                ->with(['operation.customer', 'driverTruck.driver', 'driverTruck.truck', 'origin', 'destination'])
                ->orderBy('FOnumber')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activePerformances,
                'count' => $activePerformances->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active performances',
            ], 500);
        }
    }
}

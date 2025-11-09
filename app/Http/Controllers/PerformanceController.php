<?php

namespace App\Http\Controllers;

use App\Models\DriverTruck;
use App\Models\Operation;
use App\Models\Performance;
use App\Models\Place;
use App\Models\Distance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Exception;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class PerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        // Keep the index query lean: select only fields needed for the table
        $query = Performance::query()
            ->select([
                'id',
                'trip',
                'FOnumber',
                'DateDispach',
                'LoadType',
                'satus',
                'DistanceWCargo',
                'fuelInBirr',
            ]);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('trip', 'like', "%{$search}%")
                    ->orWhere('FOnumber', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        // Handle sorting (default to most recent first)
        $sort = $request->input('sort', 'DateDispach');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['trip', 'FOnumber', 'DateDispach', 'satus', 'DistanceWCargo', 'fuelInBirr', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'trip';
        }

        $query->orderBy($sort, $direction);

        // Preserve the current query string when paginating
        $performances = $query->paginate(15)->withQueryString();

        return Inertia::render('Performances/Index', [
            'performances' => $performances,
            'totalCount' => $performances->total(),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $operations = Operation::with('customer')->get();
        $driverTrucks = DriverTruck::with(['driver', 'truck'])->active()->isAttached()->get();
        $places = Place::all();

        return Inertia::render('Performances/Create', [
            'operations' => $operations,
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
            'trip' => 'required|string|max:255',
            'LoadType' => 'required|string|max:255',
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
            'user'
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
                ->selectRaw('COALESCE(SUM(COALESCE(DistanceWCargo, 0) + COALESCE(DistanceWOCargo, 0)), 0) as total_distance')
                ->selectRaw('COALESCE(SUM(COALESCE(fuelInBirr, 0) + COALESCE(perdiem, 0) + COALESCE(other, 0)), 0) as total_cost')
                ->first();

            $operationPlannedVolume = (float) ($operation->volume ?? 0);
            $operationTotalTrips = (int) ($aggregate->total_trips ?? 0);
            $operationCompletedTrips = (int) ($aggregate->completed_trips ?? 0);
            $operationOngoingTrips = (int) ($aggregate->ongoing_trips ?? 0);
            $operationTotalTonnage = (float) ($aggregate->total_tonnage ?? 0);
            $operationRemainingTonnage = max($operationPlannedVolume - $operationTotalTonnage, 0);
            $operationTotalDistance = (float) ($aggregate->total_distance ?? 0);
            $operationTotalCost = (float) ($aggregate->total_cost ?? 0);

            $performanceTonnage = (float) ($performance->CargoVolumMT ?? 0);
            $performanceDistance = (float) (($performance->DistanceWCargo ?? 0) + ($performance->DistanceWOCargo ?? 0));
            $performanceCost = (float) (($performance->fuelInBirr ?? 0) + ($performance->perdiem ?? 0) + ($performance->other ?? 0));
            $performanceTonKm = (float) ($performance->tonkm ?? (($performance->DistanceWCargo ?? 0) * ($performance->CargoVolumMT ?? 0)));

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
                ->select(['id', 'trip', 'DateDispach', 'CargoVolumMT', 'DistanceWCargo', 'DistanceWOCargo', 'fuelInBirr', 'perdiem', 'other'])
                ->orderByDesc('DateDispach')
                ->limit(10)
                ->get()
                ->map(function (Performance $item) use ($performance) {
                    $totalDistance = (float) (($item->DistanceWCargo ?? 0) + ($item->DistanceWOCargo ?? 0));
                    $totalCost = (float) (($item->fuelInBirr ?? 0) + ($item->perdiem ?? 0) + ($item->other ?? 0));
                    $tonnage = (float) ($item->CargoVolumMT ?? 0);

                    return [
                        'id' => $item->id,
                        'trip' => $item->trip,
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
        $operations = Operation::with('customer')->get();
        $driverTrucks = DriverTruck::with(['driver', 'truck'])->active()->isAttached()->get();
        $places = Place::all();

        return Inertia::render('Performances/Edit', [
            'performance' => $performance,
            'operations' => $operations,
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
            'trip' => 'required|string|max:255',
            'LoadType' => 'required|string|max:255',
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
            'operation.customer', 'driverTruck.driver', 'driverTruck.truck', 'origin', 'destination'
        ]);

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('trip', 'like', "%{$search}%")
                    ->orWhere('FOnumber', 'like', "%{$search}%")
                    ->orWhere('comment', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'trip');
            $direction = $request->input('direction', 'asc');
            $query->orderBy($sort, $direction);
        }

        $performances = $query->get();

        // Generate CSV
        $filename = 'performances_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Trip',
            'FO Number',
            'Date Dispatch',
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
                $performance->trip,
                $performance->FOnumber,
                $performance->DateDispach,
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
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
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
                ->orderBy('trip')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $activePerformances,
                'count' => $activePerformances->count()
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active performances'
            ], 500);
        }
    }
}


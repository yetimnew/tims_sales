<?php

namespace App\Http\Controllers;

use App\Models\Performance;
use App\Models\Operation;
use App\Models\DriverTruck;
use App\Models\Place;
use App\Models\Distance;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;
use Exception;
use Illuminate\Support\Facades\Auth;

class PerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Performance::with([
            'operation.customer',
            'driverTruck.driver',
            'driverTruck.truck',
            'origin',
            'destination',
            'user'
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

        // Handle sorting
        $sort = $request->input('sort', 'trip');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['trip', 'FOnumber', 'DateDispach', 'satus', 'DistanceWCargo', 'fuelInBirr', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'trip';
        }

        $query->orderBy($sort, $direction);

        $performances = $query->paginate(15);

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

        $validated['user_id'] = auth('sanctum')->id();

        Performance::create($validated);

        return redirect()->route('performances.index')
            ->with('success', 'Performance created successfully.');
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

        return Inertia::render('Performances/Show', [
            'performance' => $performance,
            'activityLogs' => $activityLogs,
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

        $performance->update($validated);

        return redirect()->route('performances.index')
            ->with('success', 'Performance updated successfully.');
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
    public function ajaxRequestPost(Request $request)
    {
        $fromPlaceId = $request->input('from_place_id');
        $toPlaceId = $request->input('to_place_id');

        $distance = Distance::where('from_place_id', $fromPlaceId)
            ->where('to_place_id', $toPlaceId)
            ->first();

        if ($distance) {
            return response()->json([
                'distance' => $distance->distance_km,
                'estimated_time' => $distance->estimated_time_hours,
            ]);
        }

        return response()->json([
            'distance' => null,
            'estimated_time' => null,
        ]);
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




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

class PerformanceController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(): Response
    {
        $performances = Performance::with([
            'operation.customer',
            'driverTruck.driver',
            'driverTruck.truck',
            'origin',
            'destination',
            'user'
        ])->paginate(15);

        return Inertia::render('Performances/Index', [
            'performances' => $performances,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        $operations = Operation::with('customer')->get();
        $driverTrucks = DriverTruck::with(['driver', 'truck'])->where('status', 'active')->get();
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

        $validated['user_id'] = auth()->id();

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

        return Inertia::render('Performances/Show', [
            'performance' => $performance,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Performance $performance): Response
    {
        $operations = Operation::with('customer')->get();
        $driverTrucks = DriverTruck::with(['driver', 'truck'])->where('status', 'active')->get();
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
}


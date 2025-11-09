<?php

namespace App\Http\Controllers;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Spatie\Activitylog\Models\Activity;

class VehicleTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $sort = $request->input('sort', 'name');
        $direction = strtolower((string) $request->input('direction', 'asc'));
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (!in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (!in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $allowedSorts = ['name', 'trucks_count', 'active_trucks_count', 'created_at'];
        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $baseQuery = VehicleType::query();

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $listingQuery = (clone $baseQuery)->withCount([
            'trucks',
            'trucks as active_trucks_count' => fn ($query) => $query->where('status', 'active'),
        ]);

        $vehicleTypes = $listingQuery
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $metricsBase = clone $baseQuery;
        $totalTypes = (clone $metricsBase)->count();
        $typesWithTrucks = (clone $metricsBase)->whereHas('trucks')->count();
        $totalTrucks = (clone $metricsBase)
            ->withCount('trucks')
            ->get()
            ->sum('trucks_count');
        $activeTrucks = (clone $metricsBase)
            ->withCount([
                'trucks as active_trucks_count' => fn ($query) => $query->where('status', 'active'),
            ])
            ->get()
            ->sum('active_trucks_count');

        $metrics = [
            'total' => $totalTypes,
            'with_trucks' => $typesWithTrucks,
            'without_trucks' => max($totalTypes - $typesWithTrucks, 0),
            'total_trucks' => $totalTrucks,
            'active_trucks' => $activeTrucks,
        ];

        return Inertia::render('VehicleTypes/Index', [
            'vehicleTypes' => $vehicleTypes,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Export vehicle types to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleType::query()->withCount([
            'trucks',
            'trucks as active_trucks_count' => fn ($truckQuery) => $truckQuery->where('status', 'active'),
        ]);

        // Apply search filter if provided
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Apply sorting if provided
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $allowedSorts = ['name', 'trucks_count', 'active_trucks_count', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $vehicleTypes = $query->get();

        // Generate CSV
        $csvData = "Name,Description,Trucks Count,Active Trucks,Created Date\n";
        foreach ($vehicleTypes as $type) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s","%s"' . "\n",
                $type->name,
                str_replace('"', '""', $type->description ?? ''),
                $type->trucks_count,
                $type->active_trucks_count,
                $type->created_at
            );
        }

        // Log the export
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($vehicleTypes)])
                ->log('exported vehicle types to CSV');
        }

        return response($csvData)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', 'attachment; filename="vehicle-types.csv"');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('VehicleTypes/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes',
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicleType = VehicleType::create($validated);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create vehicle type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleType $vehicletype): Response
    {
        // Load activity logs for this vehicle type using Spatie Activity Log
        $activityLogs = Activity::forSubject($vehicletype)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('VehicleTypes/Show', [
            'vehicleType' => $vehicletype,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VehicleType $vehicletype): Response
    {
        return Inertia::render('VehicleTypes/Edit', [
            'vehicleType' => $vehicletype,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleType $vehicletype)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes,name,' . $vehicletype->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $vehicletype->update($validated);

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update vehicle type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleType $vehicletype)
    {
        try {
            // Check for related records that prevent deletion

            // Check if vehicle type has trucks
            if ($vehicletype->trucks()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this vehicle type. It has ' . $vehicletype->trucks()->count() . ' truck(s) associated with it. Please reassign or delete all trucks first.'
                ]);
            }

            $vehicletype->delete();

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete vehicle type. Please try again.']);
        }
    }
}




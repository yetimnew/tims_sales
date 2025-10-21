<?php

namespace App\Http\Controllers;

use App\Models\VehicleType;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Spatie\ActivityLog\Facades\Activity;

class VehicleTypeController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = VehicleType::withCount('trucks');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'trucks_count', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $vehicleTypes = $query->paginate(15);

        return Inertia::render('VehicleTypes/Index', [
            'vehicleTypes' => $vehicleTypes,
        ]);
    }

    /**
     * Export vehicle types to CSV.
     */
    public function export(Request $request)
    {
        $query = VehicleType::withCount('trucks');

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
        $allowedSorts = ['name', 'trucks_count', 'created_at'];
        if (in_array($sort, $allowedSorts)) {
            $query->orderBy($sort, $direction);
        }

        $vehicleTypes = $query->get();

        // Generate CSV
        $csvData = "Name,Description,Trucks Count,Created Date\n";
        foreach ($vehicleTypes as $type) {
            $csvData .= sprintf(
                '"%s","%s","%s","%s"' . "\n",
                $type->name,
                str_replace('"', '""', $type->description ?? ''),
                $type->trucks_count,
                $type->created_at
            );
        }

        // Log the export
        Activity::causedBy(auth()->user())
            ->withProperties(['count' => count($vehicleTypes)])
            ->log('exported');

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

            Activity::performedOn($vehicleType)
                ->causedBy(auth()->user())
                ->log('created');

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create vehicle type. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(VehicleType $vehicleType): Response
    {
        $vehicleType->load(['trucks' => function ($query) {
            $query->with('drivers')->paginate(10);
        }]);

        // Load activity logs for this vehicle type using Spatie Activity Log
        $activityLogs = Activity::forSubject($vehicleType)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('VehicleTypes/Show', [
            'vehicleType' => $vehicleType,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(VehicleType $vehicleType): Response
    {
        return Inertia::render('VehicleTypes/Edit', [
            'vehicleType' => $vehicleType,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, VehicleType $vehicleType)
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255|unique:vehicletypes,name,' . $vehicleType->id,
                'description' => 'nullable|string|max:1000',
            ]);

            $oldData = $vehicleType->toArray();
            $vehicleType->update($validated);

            Activity::performedOn($vehicleType)
                ->causedBy(auth()->user())
                ->withProperties(['old' => $oldData, 'new' => $vehicleType->toArray()])
                ->log('updated');

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update vehicle type. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(VehicleType $vehicleType)
    {
        try {
            $vehicleTypeData = $vehicleType->toArray();
            $vehicleType->delete();

            Activity::performedOn($vehicleType)
                ->causedBy(auth()->user())
                ->withProperties(['deleted' => $vehicleTypeData])
                ->log('deleted');

            return redirect()->route('vehicletypes.index')
                ->with('success', 'Vehicle type deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete vehicle type. Please try again.']);
        }
    }
}




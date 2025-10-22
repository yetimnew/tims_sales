<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\Truck;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Exception;
use Spatie\Activitylog\Models\Activity;

class DriverController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        $query = Driver::with('trucks');

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('driverid', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('zone', 'like', "%{$search}%");
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['name', 'driverid', 'sex', 'mobile', 'hireddate', 'status', 'zone', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'name';
        }

        $query->orderBy($sort, $direction);

        $drivers = $query->paginate(15);

        return Inertia::render('Drivers/Index', [
            'drivers' => $drivers,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(): Response
    {
        return Inertia::render('Drivers/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'driverid' => 'required|string|max:255|unique:drivers',
                'name' => 'required|string|max:255',
                'sex' => 'required|string|in:male,female',
                'birthdate' => 'nullable|date',
                'zone' => 'nullable|string|max:255',
                'woreda' => 'nullable|string|max:255',
                'kebele' => 'nullable|string|max:255',
                'housenumber' => 'nullable|string|max:255',
                'mobile' => 'nullable|string|max:255',
                'hireddate' => 'nullable|date',
                'status' => 'required|string|in:active,inactive',
            ]);

            $driver = Driver::create($validated);

            return redirect()->route('drivers.index')
                ->with('success', 'Driver created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create driver. Please try again.']);
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(Driver $driver): Response
    {
        $driver->load(['trucks', 'performances']);

        // Load activity logs for this driver using Spatie Activity Log
        $activityLogs = Activity::forSubject($driver)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Drivers/Show', [
            'driver' => $driver,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Driver $driver): Response
    {
        return Inertia::render('Drivers/Edit', [
            'driver' => $driver,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Driver $driver)
    {
        try {
            $validated = $request->validate([
                'driverid' => 'required|string|max:255|unique:drivers,driverid,' . $driver->id,
                'name' => 'required|string|max:255',
                'sex' => 'required|string|in:male,female',
                'birthdate' => 'nullable|date',
                'zone' => 'nullable|string|max:255',
                'woreda' => 'nullable|string|max:255',
                'kebele' => 'nullable|string|max:255',
                'housenumber' => 'nullable|string|max:255',
                'mobile' => 'nullable|string|max:255',
                'hireddate' => 'nullable|date',
                'status' => 'required|string|in:active,inactive',
            ]);

            $driver->update($validated);

            return redirect()->route('drivers.index')
                ->with('success', 'Driver updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update driver. Please try again.']);
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Driver $driver)
    {
        try {
            $driver->delete();

            return redirect()->route('drivers.index')
                ->with('success', 'Driver deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete driver. Please try again.']);
        }
    }

    /**
     * Deactivate the specified driver.
     */
    public function deactivate(Driver $driver)
    {
        $driver->update(['status' => 'inactive']);

        return redirect()->route('drivers.index')
            ->with('success', 'Driver deactivated successfully.');
    }

    /**
     * Export drivers to CSV
     */
    public function export(Request $request)
    {
        $query = Driver::with('trucks');

        // Apply same search and sort as index
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query = $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('driverid', 'like', "%{$search}%")
                    ->orWhere('mobile', 'like', "%{$search}%")
                    ->orWhere('zone', 'like', "%{$search}%");
            });
        }

        // Apply sorting
        if ($request->has('sort')) {
            $sort = $request->input('sort', 'name');
            $direction = $request->input('direction', 'asc');
            $query = $query->orderBy($sort, $direction);
        }

        $drivers = $query->get();

        // Generate CSV
        $filename = 'drivers_' . now()->format('Y-m-d_H-i-s') . '.csv';
        $handle = fopen('php://temp', 'r+');

        // Write header
        fputcsv($handle, [
            'ID',
            'Driver ID',
            'Name',
            'Sex',
            'Birthdate',
            'Mobile',
            'Zone',
            'Woreda',
            'Kebele',
            'House Number',
            'Hired Date',
            'Status',
            'Created At',
            'Updated At'
        ]);

        // Write data
        foreach ($drivers as $driver) {
            fputcsv($handle, [
                $driver->id,
                $driver->driverid,
                $driver->name,
                $driver->sex,
                $driver->birthdate,
                $driver->mobile,
                $driver->zone,
                $driver->woreda,
                $driver->kebele,
                $driver->housenumber,
                $driver->hireddate,
                $driver->status,
                $driver->created_at,
                $driver->updated_at
            ]);
        }

        rewind($handle);
        $csv = stream_get_contents($handle);
        fclose($handle);

        // Log activity using Spatie Activity Log
        if (Auth::check()) {
            activity()
                ->causedBy(Auth::user())
                ->withProperties(['count' => count($drivers)])
                ->log('exported drivers to CSV');
        }

        return response($csv, 200)
            ->header('Content-Type', 'text/csv')
            ->header('Content-Disposition', "attachment; filename=\"$filename\"");
    }
}




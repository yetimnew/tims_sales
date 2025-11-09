<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
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
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $sex = $request->input('sex');
    $perPageOptions = [15, 25, 50, 100];
    $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (!in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        $driversQuery = Driver::query()->with('trucks');
        $metricsQuery = Driver::query();

        if ($search !== '') {
            $applySearch = static function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('driverid', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('zone', 'like', "%{$search}%");
                });
            };

            $applySearch($driversQuery);
            $applySearch($metricsQuery);
        }

        if (!empty($sex) && $sex !== 'all') {
            $driversQuery->where('sex', $sex);
            $metricsQuery->where('sex', $sex);
        }

        if (!empty($status) && $status !== 'all') {
            $driversQuery->where('status', $status);
        }

        $sort = $request->input('sort', 'name');
        $direction = $request->input('direction', 'asc');
        $allowedSorts = ['name', 'driverid', 'sex', 'mobile', 'hireddate', 'status', 'zone', 'created_at'];

        if (!in_array($sort, $allowedSorts, true)) {
            $sort = 'name';
        }

        $driversQuery->orderBy($sort, $direction);

    $drivers = $driversQuery->paginate($perPage)->withQueryString();

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'active' => (clone $metricsQuery)->where('status', 'active')->count(),
            'inactive' => (clone $metricsQuery)->where('status', 'inactive')->count(),
            'male' => (clone $metricsQuery)->where('sex', 'male')->count(),
            'female' => (clone $metricsQuery)->where('sex', 'female')->count(),
        ];

        $statusOptions = Driver::query()
            ->select('status')
            ->distinct()
            ->whereNotNull('status')
            ->orderBy('status')
            ->get()
            ->map(fn ($driver) => [
                'label' => Str::of($driver->status)->replace('_', ' ')->headline(),
                'value' => $driver->status,
            ])->values();

        $genderOptions = Driver::query()
            ->select('sex')
            ->distinct()
            ->whereNotNull('sex')
            ->orderBy('sex')
            ->get()
            ->map(fn ($driver) => [
                'label' => Str::of($driver->sex)->replace('_', ' ')->headline(),
                'value' => $driver->sex,
            ])->values();

        return Inertia::render('Drivers/Index', [
            'drivers' => $drivers,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'sex' => $sex ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'statusOptions' => $statusOptions,
            'genderOptions' => $genderOptions,
            'perPageOptions' => $perPageOptions,
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
        $driver->load([
            'trucks',
            'performances',
            'driverTrucks' => function($query) {
                $query->with('truck')->orderBy('date_recived', 'desc');
            }
        ]);

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
            // Check for related records that prevent deletion

            // Check if driver has performances
            if ($driver->performances()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has ' . $driver->performances()->count() . ' performance record(s). Please remove all performance records first.'
                ]);
            }

            // Check if driver has performance records
            if ($driver->performanceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has ' . $driver->performanceRecords()->count() . ' performance record(s). Please remove all performance records first.'
                ]);
            }

            // Check if driver has safety records
            if ($driver->safetyRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has ' . $driver->safetyRecords()->count() . ' safety record(s). Please remove all safety records first.'
                ]);
            }

            // Check if driver has fuel records
            if ($driver->fuelRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has ' . $driver->fuelRecords()->count() . ' fuel record(s). Please remove all fuel records first.'
                ]);
            }

            // Check if driver is currently assigned to active trucks
            if ($driver->trucks()->wherePivot('status', 'active')->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It is currently assigned to ' . $driver->trucks()->wherePivot('status', 'active')->count() . ' active truck(s). Please unassign from all trucks first.'
                ]);
            }

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

        if ($request->filled('search')) {
            $search = trim((string) $request->input('search'));
            if ($search !== '') {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('driverid', 'like', "%{$search}%")
                        ->orWhere('mobile', 'like', "%{$search}%")
                        ->orWhere('zone', 'like', "%{$search}%");
                });
            }
        }

        if ($request->filled('sex') && $request->input('sex') !== 'all') {
            $query->where('sex', $request->input('sex'));
        }

        if ($request->filled('status') && $request->input('status') !== 'all') {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('sort')) {
            $sort = $request->input('sort', 'name');
            $direction = $request->input('direction', 'asc');
            $allowedSorts = ['name', 'driverid', 'sex', 'mobile', 'hireddate', 'status', 'zone', 'created_at'];

            if (!in_array($sort, $allowedSorts, true)) {
                $sort = 'name';
            }

            $query->orderBy($sort, $direction);
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




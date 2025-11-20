<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Services\DriverMetricsService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DriverController extends Controller
{
    public function __construct(private DriverMetricsService $driverMetrics) {}

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

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        $filtersSearch = $search !== '' ? $search : null;

        $driversQuery = $this->driverMetrics->applyFilters(
            Driver::query()
                ->select([
                    'id',
                    'driverid',
                    'name',
                    'sex',
                    'zone',
                    'mobile',
                    'hireddate',
                    'status',
                    'created_at',
                    'updated_at',
                ]),
            $filtersSearch,
            $sex,
            $status,
        )->with('trucks');

        $sort = $request->input('sort', 'created_at');
        $direction = $request->input('direction', 'asc');
        $allowedSorts = ['name', 'driverid', 'sex', 'mobile', 'hireddate', 'status', 'zone', 'created_at'];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'created_at';
        }

        if (! in_array(strtolower((string) $direction), ['asc', 'desc'], true)) {
            $direction = 'asc';
        }

        $driversQuery->orderBy($sort, $direction);

        $drivers = $driversQuery->paginate($perPage)->withQueryString();

        $drivers->setCollection(
            $drivers->getCollection()->map(fn (Driver $driver) => [
                'id' => $driver->id,
                'driverid' => $driver->driverid,
                'name' => $driver->name,
                'sex' => $driver->sex,
                'zone' => $driver->zone,
                'mobile' => $driver->mobile,
                'hireddate' => $driver->hireddate,
                'status' => $driver->status,
                'created_at' => $driver->created_at,
                'updated_at' => $driver->updated_at,
            ])
        );

        $driversData = $this->trimPagination($drivers);

        $metrics = $this->driverMetrics->metrics($filtersSearch, $sex, $status);

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
            'drivers' => $driversData,
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

    private function trimPagination(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
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

            $this->driverMetrics->clearCache();

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
            'performanceRecords',
            'safetyRecords',
            'fuelRecords',
            'driverTrucks' => function ($query) {
                $query->with('truck')->orderBy('date_recived', 'desc');
            },
        ]);

        // Activity logs (limit for payload size) mapped to UI-friendly structure
        $rawActivityLogs = Activity::forSubject($driver)
            ->with('causer')
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $activityLogs = $this->transformActivityLogs($rawActivityLogs);

        // Aggregated performance summary from performanceRecords (higher-level records)
        $performanceRecords = $driver->performanceRecords;
        $performanceSummary = [
            'total_records' => $performanceRecords->count(),
            'total_distance_km' => (float) $performanceRecords->sum('total_distance_km'),
            'total_trips' => (int) $performanceRecords->sum('total_trips'),
            'total_cargo_tonnage' => (float) $performanceRecords->sum('total_cargo_tonnage'),
            'avg_fuel_efficiency' => $performanceRecords->count() > 0 ? round((float) $performanceRecords->avg('fuel_efficiency'), 2) : null,
            'avg_customer_rating' => $performanceRecords->count() > 0 ? round((float) $performanceRecords->avg('customer_rating'), 2) : null,
            'safety_incidents' => (int) $performanceRecords->sum('safety_violations') + (int) $performanceRecords->sum('accidents'),
        ];

        // Safety summary from safetyRecords
        $safetyRecords = $driver->safetyRecords;
        $safetySummary = [
            'total_records' => $safetyRecords->count(),
            'accidents' => $safetyRecords->where('incident_type', 'accident')->count(),
            'violations' => $safetyRecords->where('incident_type', 'violation')->count(),
            'warnings' => $safetyRecords->where('incident_type', 'warning')->count(),
            'critical' => $safetyRecords->where('severity', 'critical')->count(),
            'major' => $safetyRecords->where('severity', 'major')->count(),
            'minor' => $safetyRecords->where('severity', 'minor')->count(),
            'total_damage_cost' => (float) $safetyRecords->sum('damage_cost'),
        ];

        // General counts similar to truck counts
        $counts = [
            'trucks' => $driver->trucks->count(),
            'assignments' => $driver->driverTrucks->count(),
            'performances' => $driver->performances->count(),
            'performance_records' => $performanceRecords->count(),
            'safety_records' => $safetyRecords->count(),
            'fuel_records' => $driver->fuelRecords->count(),
        ];

        return Inertia::render('Drivers/Show', [
            'driver' => $driver,
            'activityLogs' => $activityLogs,
            'performanceSummary' => $performanceSummary,
            'safetySummary' => $safetySummary,
            'counts' => $counts,
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
                'driverid' => 'required|string|max:255|unique:drivers,driverid,'.$driver->id,
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

            $this->driverMetrics->clearCache();

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
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->performances()->count().' performance record(s). Please remove all performance records first.',
                ]);
            }

            // Check if driver has performance records
            if ($driver->performanceRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->performanceRecords()->count().' performance record(s). Please remove all performance records first.',
                ]);
            }

            // Check if driver has safety records
            if ($driver->safetyRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->safetyRecords()->count().' safety record(s). Please remove all safety records first.',
                ]);
            }

            // Check if driver has fuel records
            if ($driver->fuelRecords()->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It has '.$driver->fuelRecords()->count().' fuel record(s). Please remove all fuel records first.',
                ]);
            }

            // Check if driver is currently assigned to active trucks
            if ($driver->trucks()->wherePivot('status', 'active')->count() > 0) {
                return back()->withErrors([
                    'error' => 'You are not allowed to delete this driver. It is currently assigned to '.$driver->trucks()->wherePivot('status', 'active')->count().' active truck(s). Please unassign from all trucks first.',
                ]);
            }

            $driver->delete();

            $this->driverMetrics->clearCache();

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

        $this->driverMetrics->clearCache();

        return redirect()->route('drivers.index')
            ->with('success', 'Driver deactivated successfully.');
    }

    /**
     * Export drivers to CSV
     */
    public function export(Request $request)
    {
        $query = $this->driverMetrics->applyFilters(
            Driver::with('trucks'),
            $request->filled('search') ? $request->input('search') : null,
            $request->input('sex'),
            $request->input('status'),
        );

        if ($request->filled('sort')) {
            $sort = $request->input('sort', 'name');
            $direction = $request->input('direction', 'asc');
            $allowedSorts = ['name', 'driverid', 'sex', 'mobile', 'hireddate', 'status', 'zone', 'created_at'];

            if (! in_array($sort, $allowedSorts, true)) {
                $sort = 'name';
            }

            if (! in_array(strtolower((string) $direction), ['asc', 'desc'], true)) {
                $direction = 'asc';
            }

            $query->orderBy($sort, $direction);
        }

        $drivers = $query->get();

        // Generate CSV
        $filename = 'drivers_'.now()->format('Y-m-d_H-i-s').'.csv';
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
            'Updated At',
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
                $driver->updated_at,
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

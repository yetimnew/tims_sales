<?php

namespace App\Http\Controllers;

use App\Events\DriverSafetyRecordCreated;
use App\Events\DriverSafetyRecordDeleted;
use App\Events\DriverSafetyRecordUpdated;
use App\Http\Requests\StoreDriverSafetyRequest;
use App\Http\Requests\UpdateDriverSafetyRequest;
use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DriverSafetyController extends Controller
{
    /**
     * Display a listing of driver safety records.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $incidentType = $request->input('incident_type');
        $severity = $request->input('severity');
        $driverId = $request->input('driver');
        $sort = $request->input('sort', 'incident_date');
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

        $allowedSorts = ['incident_date', 'severity', 'incident_type', 'damage_cost', 'created_at'];
        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'incident_date';
        }

        $baseQuery = DriverSafetyRecord::query()->with(['driver', 'reportedBy']);

        if ($search !== '') {
            $baseQuery->where(function ($query) use ($search) {
                $query->where('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('incident_type', 'like', "%{$search}%")
                    ->orWhereHas('driver', function ($driverQuery) use ($search) {
                        $driverQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (! empty($incidentType) && $incidentType !== 'all') {
            $baseQuery->where('incident_type', $incidentType);
        }

        if (! empty($severity) && $severity !== 'all') {
            $baseQuery->where('severity', $severity);
        }

        if (! empty($driverId) && $driverId !== 'all') {
            $baseQuery->where('driver_id', $driverId);
        }

        $safetyRecords = (clone $baseQuery)
            ->orderBy($sort, $direction)
            ->paginate($perPage)
            ->withQueryString();

        $metricsQuery = clone $baseQuery;

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'accidents' => (clone $metricsQuery)->where('incident_type', 'accident')->count(),
            'violations' => (clone $metricsQuery)->where('incident_type', 'violation')->count(),
            'warnings' => (clone $metricsQuery)->where('incident_type', 'warning')->count(),
            'critical' => (clone $metricsQuery)->where('severity', 'critical')->count(),
            'major' => (clone $metricsQuery)->where('severity', 'major')->count(),
            'minor' => (clone $metricsQuery)->where('severity', 'minor')->count(),
            'total_damage_cost' => (float) (clone $metricsQuery)->sum('damage_cost'),
            'average_damage_cost' => (float) (clone $metricsQuery)->avg('damage_cost'),
        ];

        $incidentTypeOptions = DriverSafetyRecord::query()
            ->select('incident_type')
            ->distinct()
            ->whereNotNull('incident_type')
            ->orderBy('incident_type')
            ->get()
            ->map(static fn ($record) => [
                'label' => Str::of($record->incident_type)->replace('_', ' ')->headline(),
                'value' => $record->incident_type,
            ])->values();

        $severityOptions = DriverSafetyRecord::query()
            ->select('severity')
            ->distinct()
            ->whereNotNull('severity')
            ->orderBy('severity')
            ->get()
            ->map(static fn ($record) => [
                'label' => Str::of($record->severity)->replace('_', ' ')->headline(),
                'value' => $record->severity,
            ])->values();

        $driverOptions = Driver::query()
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('DriverSafety/Index', [
            'safetyRecords' => $safetyRecords,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'incident_type' => $incidentType ?: null,
                'severity' => $severity ?: null,
                'driver' => $driverId ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
            ],
            'incidentTypeOptions' => $incidentTypeOptions,
            'severityOptions' => $severityOptions,
            'driverOptions' => $driverOptions,
            'perPageOptions' => $perPageOptions,
        ]);
    }

    /**
     * Show the form for creating a new safety record.
     */
    public function create(): Response
    {
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('DriverSafety/Create', [
            'drivers' => $drivers,
        ]);
    }

    /**
     * Store a newly created safety record.
     */
    public function store(StoreDriverSafetyRequest $request)
    {
        try {
            $validated = $request->validated();
            $validated['reported_by'] = Auth::id();

            $safetyRecord = DriverSafetyRecord::create($validated);

            event(new DriverSafetyRecordCreated($safetyRecord->loadMissing('driver'), Auth::user()));

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record created successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create safety record. Please try again.']);
        }
    }

    /**
     * Display the specified safety record.
     */
    public function show(DriverSafetyRecord $driverSafety): Response
    {
        $driverSafety->load(['driver', 'reportedBy']);

        // Load activity logs for this safety record using Spatie Activity Log
        $activityLogs = Activity::forSubject($driverSafety)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('DriverSafety/Show', [
            'driverSafety' => $driverSafety,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified safety record.
     */
    public function edit(DriverSafetyRecord $driverSafety): Response
    {
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('DriverSafety/Edit', [
            'driverSafety' => $driverSafety,
            'drivers' => $drivers,
        ]);
    }

    /**
     * Update the specified safety record.
     */
    public function update(UpdateDriverSafetyRequest $request, DriverSafetyRecord $driverSafety)
    {
        try {
            $validated = $request->validated();

            $original = $driverSafety->getOriginal();

            $driverSafety->fill($validated);

            $dirty = $driverSafety->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $driverSafety->save();

            if ($changes !== []) {
                event(new DriverSafetyRecordUpdated($driverSafety->fresh('driver'), $changes, Auth::user()));
            }

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update safety record. Please try again.']);
        }
    }

    /**
     * Remove the specified safety record.
     */
    public function destroy(DriverSafetyRecord $driverSafety)
    {
        try {
            $driverSafety->loadMissing('driver');

            $recordId = $driverSafety->getKey();
            $driverId = $driverSafety->driver?->getKey();
            $driverName = $driverSafety->driver?->name;
            $attributes = $driverSafety->getAttributes();

            $driverSafety->delete();

            event(new DriverSafetyRecordDeleted($recordId, $driverId, $driverName, $attributes, Auth::user()));

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete safety record. Please try again.']);
        }
    }

    /**
     * Get safety analytics.
     */
    public function analytics(Request $request)
    {
        try {
            $driverId = $request->get('driver_id');
            $incidentType = $request->get('incident_type');
            $severity = $request->get('severity');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = DriverSafetyRecord::with(['driver', 'reportedBy'])
                ->whereBetween('incident_date', [$startDate, $endDate]);

            if ($driverId) {
                $query->where('driver_id', $driverId);
            }

            if ($incidentType) {
                $query->where('incident_type', $incidentType);
            }

            if ($severity) {
                $query->where('severity', $severity);
            }

            $analytics = $query->orderBy('incident_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analytics,
                'count' => $analytics->count(),
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get safety analytics', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve safety analytics',
            ], 500);
        }
    }

    /**
     * Get drivers with safety issues.
     */
    public function driversWithIssues(Request $request)
    {
        try {
            $limit = $request->get('limit', 10);
            $severity = $request->get('severity');

            $query = DriverSafetyRecord::with(['driver'])
                ->where('incident_date', '>=', now()->subMonths(6))
                ->select('driver_id')
                ->selectRaw('COUNT(*) as incident_count')
                ->selectRaw('SUM(CASE WHEN severity = "critical" THEN 1 ELSE 0 END) as critical_count')
                ->selectRaw('SUM(CASE WHEN severity = "major" THEN 1 ELSE 0 END) as major_count')
                ->selectRaw('SUM(CASE WHEN severity = "minor" THEN 1 ELSE 0 END) as minor_count')
                ->selectRaw('SUM(damage_cost) as total_damage_cost')
                ->groupBy('driver_id')
                ->having('incident_count', '>', 0);

            if ($severity) {
                $query->having($severity.'_count', '>', 0);
            }

            $driversWithIssues = $query->orderBy('incident_count', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $driversWithIssues,
                'count' => $driversWithIssues->count(),
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get drivers with safety issues', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve drivers with safety issues',
            ], 500);
        }
    }

    /**
     * Get safety statistics.
     */
}

<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Http\Requests\StoreDriverSafetyRequest;
use App\Http\Requests\UpdateDriverSafetyRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;
use Spatie\Activitylog\Models\Activity;

class DriverSafetyController extends Controller
{
    /**
     * Display a listing of driver safety records.
     */
    public function index(Request $request): Response
    {
        $query = DriverSafetyRecord::with(['driver', 'reportedBy']);

        // Handle search
        if ($request->has('search') && !empty($request->input('search'))) {
            $search = $request->input('search');
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('location', 'like', "%{$search}%")
                    ->orWhere('incident_type', 'like', "%{$search}%")
                    ->orWhereHas('driver', function ($q) use ($search) {
                        $q->where('name', 'like', "%{$search}%");
                    });
            });
        }

        // Handle sorting
        $sort = $request->input('sort', 'incident_date');
        $direction = $request->input('direction', 'desc');

        // Validate sort column to prevent SQL injection
        $allowedSorts = ['incident_date', 'severity', 'incident_type', 'damage_cost', 'created_at'];
        if (!in_array($sort, $allowedSorts)) {
            $sort = 'incident_date';
        }

        $query->orderBy($sort, $direction);

        $safetyRecords = $query->paginate(15);
        $statistics = $this->getSafetyStatistics();

        return Inertia::render('DriverSafety/Index', [
            'safetyRecords' => $safetyRecords,
            'statistics' => $statistics,
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
            $driverSafety->update($validated);

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
            $driverSafety->delete();

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
                'count' => $analytics->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get safety analytics', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve safety analytics'
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
                $query->having($severity . '_count', '>', 0);
            }

            $driversWithIssues = $query->orderBy('incident_count', 'desc')
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $driversWithIssues,
                'count' => $driversWithIssues->count()
            ]);

        } catch (Exception $e) {
            Log::error('Failed to get drivers with safety issues', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve drivers with safety issues'
            ], 500);
        }
    }

    /**
     * Get safety statistics.
     */
    private function getSafetyStatistics()
    {
        return [
            'total_records' => DriverSafetyRecord::count(),
            'accidents' => DriverSafetyRecord::where('incident_type', 'accident')->count(),
            'violations' => DriverSafetyRecord::where('incident_type', 'violation')->count(),
            'warnings' => DriverSafetyRecord::where('incident_type', 'warning')->count(),
            'critical_incidents' => DriverSafetyRecord::where('severity', 'critical')->count(),
            'major_incidents' => DriverSafetyRecord::where('severity', 'major')->count(),
            'minor_incidents' => DriverSafetyRecord::where('severity', 'minor')->count(),
            'total_damage_cost' => DriverSafetyRecord::sum('damage_cost'),
        ];
    }
}




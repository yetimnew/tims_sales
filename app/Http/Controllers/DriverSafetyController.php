<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use Exception;

class DriverSafetyController extends Controller
{
    /**
     * Display a listing of driver safety records.
     */
    public function index(): Response
    {
        $safetyRecords = DriverSafetyRecord::with(['driver', 'reportedBy'])
            ->orderBy('incident_date', 'desc')
            ->paginate(15);

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
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:drivers,id',
                'incident_date' => 'required|date|before_or_equal:today',
                'incident_type' => 'required|string|in:accident,violation,warning',
                'description' => 'required|string|max:2000',
                'severity' => 'required|string|in:minor,major,critical',
                'damage_cost' => 'nullable|numeric|min:0',
                'location' => 'nullable|string|max:255',
                'resolution' => 'nullable|string|max:2000',
            ]);

            $validated['reported_by'] = auth()->id();

            $safetyRecord = DriverSafetyRecord::create($validated);

            Log::info('Driver safety record created', [
                'safety_record_id' => $safetyRecord->id,
                'driver_id' => $safetyRecord->driver_id,
                'incident_type' => $safetyRecord->incident_type,
                'severity' => $safetyRecord->severity,
                'reported_by' => auth()->id(),
            ]);

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record created successfully.');

        } catch (Exception $e) {
            Log::error('Driver safety record creation failed', [
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create safety record. Please try again.']);
        }
    }

    /**
     * Display the specified safety record.
     */
    public function show(DriverSafetyRecord $driverSafety): Response
    {
        $driverSafety->load(['driver', 'reportedBy']);

        return Inertia::render('DriverSafety/Show', [
            'driverSafety' => $driverSafety,
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
    public function update(Request $request, DriverSafetyRecord $driverSafety)
    {
        try {
            $validated = $request->validate([
                'driver_id' => 'required|exists:drivers,id',
                'incident_date' => 'required|date|before_or_equal:today',
                'incident_type' => 'required|string|in:accident,violation,warning',
                'description' => 'required|string|max:2000',
                'severity' => 'required|string|in:minor,major,critical',
                'damage_cost' => 'nullable|numeric|min:0',
                'location' => 'nullable|string|max:255',
                'resolution' => 'nullable|string|max:2000',
            ]);

            $driverSafety->update($validated);

            Log::info('Driver safety record updated', [
                'safety_record_id' => $driverSafety->id,
                'driver_id' => $driverSafety->driver_id,
                'incident_type' => $driverSafety->incident_type,
                'severity' => $driverSafety->severity,
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record updated successfully.');

        } catch (Exception $e) {
            Log::error('Driver safety record update failed', [
                'safety_record_id' => $driverSafety->id,
                'error' => $e->getMessage(),
                'data' => $request->all(),
                'user_id' => auth()->id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update safety record. Please try again.']);
        }
    }

    /**
     * Remove the specified safety record.
     */
    public function destroy(DriverSafetyRecord $driverSafety)
    {
        try {
            $safetyData = $driverSafety->toArray();
            $driverSafety->delete();

            Log::info('Driver safety record deleted', [
                'safety_record_id' => $driverSafety->id,
                'driver_id' => $safetyData['driver_id'],
                'user_id' => auth()->id(),
            ]);

            return redirect()->route('driver-safety.index')
                ->with('success', 'Safety record deleted successfully.');

        } catch (Exception $e) {
            Log::error('Driver safety record deletion failed', [
                'safety_record_id' => $driverSafety->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
            ]);

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
                'user_id' => auth()->id(),
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
                'user_id' => auth()->id(),
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


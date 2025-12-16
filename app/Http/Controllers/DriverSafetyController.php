<?php

namespace App\Http\Controllers;

use App\Events\DriverSafetyRecordCreated;
use App\Events\DriverSafetyRecordDeleted;
use App\Events\DriverSafetyRecordUpdated;
use App\Http\Requests\StoreDriverSafetyRequest;
use App\Http\Requests\UpdateDriverSafetyRequest;
use App\Models\Driver;
use App\Models\DriverSafetyRecord;
use App\Services\DriverSafety\DriverSafetyIndexService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DriverSafetyController extends Controller
{
    public function __construct(private DriverSafetyIndexService $driverSafetyIndexService) {}

    public function index(Request $request): Response
    {
        $result = $this->driverSafetyIndexService->getIndexResult($request);

        return Inertia::render('DriverSafety/Index', $result->toInertia());
    }

    public function create(): Response
    {
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('DriverSafety/Create', [
            'drivers' => $drivers,
        ]);
    }

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
            Log::error('Failed to create safety record', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to create safety record. Please try again.']);
        }
    }

    public function show(DriverSafetyRecord $driverSafety): Response
    {
        $driverSafety->load(['driver', 'reportedBy']);

        $activityLogs = Activity::forSubject($driverSafety)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('DriverSafety/Show', [
            'driverSafety' => $driverSafety,
            'activityLogs' => $activityLogs,
        ]);
    }

    public function edit(DriverSafetyRecord $driverSafety): Response
    {
        $drivers = Driver::where('status', 'active')->get();

        return Inertia::render('DriverSafety/Edit', [
            'driverSafety' => $driverSafety,
            'drivers' => $drivers,
        ]);
    }

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
            Log::error('Failed to update safety record', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to update safety record. Please try again.']);
        }
    }

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
            Log::error('Failed to delete safety record', [
                'error' => $e->getMessage(),
                'user_id' => Auth::id(),
            ]);

            return back()->withErrors(['error' => 'Failed to delete safety record. Please try again.']);
        }
    }

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
}

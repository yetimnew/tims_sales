<?php

namespace App\Http\Controllers;

use App\Events\DriverTruckCreated;
use App\Events\DriverTruckDeleted;
use App\Events\DriverTruckUpdated;
use App\Http\Requests\StoreDriverTruckRequest;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Truck;
use App\Services\DriverTruckDeletionGuard;
use App\Services\DriverTruckGradeService;
use App\Services\DriverTrucks\DriverTruckIndexService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DriverTruckController extends BaseResourceController
{
    public function __construct(
        private DriverTruckDeletionGuard $driverTruckDeletionGuard,
        private DriverTruckGradeService $driverTruckGrade,
        private DriverTruckIndexService $driverTruckIndexService,
    ) {}

    /**
     * Display a listing of driver-truck assignments.
     */
    public function index(Request $request): Response
    {
        $result = $this->driverTruckIndexService->getIndexResult($request);

        return Inertia::render('DriverTrucks/Index', $result->toInertia());
    }

    /**
     * Show the form for creating a new driver-truck assignment.
     */
    public function create(): Response
    {
        $trucks = $this->getAvailableTrucks();
        $drivers = $this->getAvailableDrivers();

        // Show available trucks even if no drivers are available
        // Users can still see available trucks and understand why they can't create assignments
        $error = null;
        if ($trucks->count() == 0) {
            $error = 'You must have available trucks before attempting to create assignments.';
        } elseif ($drivers->count() == 0) {
            $error = 'You must have available drivers before attempting to create assignments.';
        }

        return Inertia::render('DriverTrucks/Create', [
            'trucks' => $trucks,
            'drivers' => $drivers,
            'error' => $error,
        ]);
    }

    /**
     * Store a newly created driver-truck assignment.
     */
    public function store(StoreDriverTruckRequest $request)
    {
        try {
            // Get validated data (includes auto-populated fields)
            $validatedData = $request->validated();

            // Additional validation: Only active drivers and trucks can be assigned
            $driver = Driver::find($validatedData['driver_id']);
            $truck = Truck::find($validatedData['truck_id']);

            if (! $driver || $driver->status !== 'active') {
                return back()->withErrors(['error' => 'Selected driver is not active or does not exist.']);
            }

            if (! $truck || $truck->status !== 'active') {
                return back()->withErrors(['error' => 'Selected truck is not active or does not exist.']);
            }

            // Create the assignment
            $assignment = DriverTruck::create([
                'truck_id' => $validatedData['truck_id'],
                'driver_id' => $validatedData['driver_id'],
                'plate' => $validatedData['plate'] ?? null,
                'driverid' => $validatedData['driverid'] ?? null,
                'date_recived' => $validatedData['date_recived'],
                'status' => 'active',
                'is_attached' => 1,
                'user_id' => Auth::id(),
            ]);

            // Clear all related caches systematically
            Cache::forget('driver_trucks.status_options');
            Cache::forget('driver_trucks.driver_options');
            Cache::forget('driver_trucks.truck_options');

            // Dispatch event for audit trail
            event(new DriverTruckCreated($assignment->loadMissing(['driver', 'truck']), Auth::user()));

            return redirect()->route('driver-trucks.index')
                ->with('success', sprintf('Driver %s assigned to truck %s successfully.',
                    $driver->name, $truck->plate));

        } catch (Exception $e) {
            $this->logError('store', 'DriverTruck', $e, [
                'created_by' => Auth::id(),
                'driver_id' => $request->input('driver_id'),
                'truck_id' => $request->input('truck_id'),
            ]);

            return back()->withErrors(['error' => 'Failed to create assignment. Please try again.']);
        }
    }

    /**
     * Display the specified driver-truck assignment.
     */
    public function show(DriverTruck $driverTruck): Response
    {
        $driverTruck->load(['driver', 'truck']);

        // Get performances for this assignment
        $performances = Performance::where('driver_truck_id', $driverTruck->id)
            ->with(['operation.customer', 'origin', 'destination'])
            ->orderBy('DateDispach', 'desc')
            ->get();

        // Calculate date difference if detached
        $dateDifference = null;
        if ($driverTruck->date_detach && $driverTruck->date_recived) {
            $start = \Carbon\Carbon::parse($driverTruck->date_detach);
            $end = \Carbon\Carbon::parse($driverTruck->date_recived);
            $diff = $end->diff($start);
            $dateDifference = $diff->d.' days '.$diff->h.' hours '.$diff->i.' minutes';
        }

        // Get activity logs using base controller method
        $activityLogs = $this->getActivityLogs($driverTruck);

        return Inertia::render('DriverTrucks/Show', [
            'driverTruck' => $driverTruck,
            'performances' => $performances,
            'dateDifference' => $dateDifference,
            'activityLogs' => $activityLogs,
            'gradeReport' => $this->driverTruckGrade->grade($driverTruck),
        ]);
    }

    /**
     * Show the form for editing the driver-truck assignment.
     */
    public function edit(DriverTruck $driverTruck): Response
    {
        $driverTruck->load(['driver', 'truck']);

        $trucks = $this->getAvailableTrucks();
        $drivers = $this->getAvailableDrivers();

        // Add current assignments to the lists
        $trucks->push($driverTruck->truck);
        $drivers->push($driverTruck->driver);

        return Inertia::render('DriverTrucks/Edit', [
            'driverTruck' => $driverTruck,
            'trucks' => $trucks->unique('id'),
            'drivers' => $drivers->unique('id'),
        ]);
    }

    /**
     * Update the specified driver-truck assignment.
     */
    public function update(Request $request, DriverTruck $driverTruck)
    {
        $request->validate([
            'truck_id' => 'required|exists:trucks,id',
            'driver_id' => 'required|exists:drivers,id',
            'date_recived' => 'required|date',
            'date_detach' => 'nullable|date|after:date_recived',
            'reason' => 'nullable|string|max:1000',
        ]);

        try {
            // Validate that only active drivers and trucks can be assigned
            $truck = Truck::find($request->truck_id);
            $driver = Driver::find($request->driver_id);

            if (! $truck || $truck->status !== 'active') {
                return back()->withErrors(['error' => 'Selected truck is not active or does not exist.']);
            }

            if (! $driver || $driver->status !== 'active') {
                return back()->withErrors(['error' => 'Selected driver is not active or does not exist.']);
            }

            // Capture original values before update
            $original = $this->normalizeAttributes($driverTruck->getOriginal());

            $driverTruck->update([
                'truck_id' => $request->truck_id,
                'driver_id' => $request->driver_id,
                'plate' => $truck->plate,
                'driverid' => $driver->driverid,
                'date_recived' => $request->date_recived,
                'date_detach' => $request->date_detach,
                'reason' => $request->reason,
                'is_attached' => $request->has('date_detach') ? 0 : 1,
            ]);

            // Format changes for audit trail
            $changes = $this->formatChanges($original, $this->normalizeAttributes($driverTruck->getChanges()));

            // Clear related caches
            Cache::forget('driver_trucks.status_options');
            Cache::forget('driver_trucks.driver_options');
            Cache::forget('driver_trucks.truck_options');

            // Only dispatch event if there were actual changes
            if (! empty($changes)) {
                event(new DriverTruckUpdated($driverTruck->fresh(['driver', 'truck']), $changes, Auth::user()));
            }

            return redirect()->route('driver-trucks.index')
                ->with('success', sprintf('Assignment for driver %s and truck %s updated successfully.',
                    $driver->name, $truck->plate));

        } catch (Exception $e) {
            $this->logError('update', 'DriverTruck', $e);

            return back()->withErrors(['error' => 'Failed to update assignment. Please try again.']);
        }
    }

    /**
     * Remove the specified driver-truck assignment.
     */
    public function destroy(DriverTruck $driverTruck)
    {
        try {
            $blockers = $this->driverTruckDeletionGuard->blockers($driverTruck);

            if (! empty($blockers)) {
                return back()->withErrors(['error' => $blockers]);
            }

            $driverTruck->loadMissing(['driver', 'truck']);

            // Capture data before deletion for audit trail
            $assignmentId = $driverTruck->id;
            $driverId = $driverTruck->driver?->id;
            $driverName = $driverTruck->driver?->name;
            $truckId = $driverTruck->truck?->id;
            $truckPlate = $driverTruck->truck?->plate ?? $driverTruck->plate;
            $attributes = $this->normalizeAttributes($driverTruck->toArray());

            $driverTruck->delete();
            $this->driverTruckDeletionGuard->clearCache($driverTruck);

            // Clear related caches
            Cache::forget('driver_trucks.status_options');
            Cache::forget('driver_trucks.driver_options');
            Cache::forget('driver_trucks.truck_options');

            // Dispatch event with deleted data for audit trail
            event(new DriverTruckDeleted(
                $assignmentId,
                $driverId,
                $driverName,
                $truckId,
                $truckPlate,
                $attributes,
                Auth::user(),
            ));

            return redirect()->route('driver-trucks.index')
                ->with('success', sprintf('Assignment for driver %s and truck %s deleted successfully.',
                    $driverName ?? 'Unknown', $truckPlate ?? 'Unknown'));

        } catch (Exception $e) {
            $this->logError('destroy', 'DriverTruck', $e);

            return back()->withErrors(['error' => 'Failed to delete assignment. Please try again.']);
        }
    }

    /**
     * Show the detach form for the driver-truck assignment.
     */
    public function detach(DriverTruck $driverTruck): Response
    {
        $driverTruck->load(['driver', 'truck']);

        return Inertia::render('DriverTrucks/Detach', [
            'driverTruck' => $driverTruck,
        ]);
    }

    /**
     * Update the driver-truck assignment for detachment.
     */
    public function updateDetach(Request $request, DriverTruck $driverTruck)
    {
        $request->validate([
            'date_detach' => 'required|date',
            'reason' => 'required|string|max:1000',
        ]);

        try {
            $truck = $driverTruck->truck;
            $driver = $driverTruck->driver;

            $original = $driverTruck->getOriginal();

            $driverTruck->fill([
                'date_detach' => $request->date_detach,
                'reason' => $request->reason,
                'is_attached' => 0,
            ]);

            $dirty = $driverTruck->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $driverTruck->save();

            if ($changes !== []) {
                event(new DriverTruckUpdated($driverTruck->fresh(['driver', 'truck']), $changes, Auth::user()));
            }

            Cache::forget('driver_trucks.status_options'); // Clear cached status options when detached

            return redirect()->route('driver-trucks.index')
                ->with('success', 'Driver detached from truck successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to detach driver. Please try again.']);
        }
    }

    /**
     * Get available trucks (not currently assigned).
     */
    private function getAvailableTrucks()
    {
        return Truck::select(
            'trucks.*',
            DB::raw('COALESCE(SUM(driver_truck.is_attached), 0) as total_assigned')
        )
            ->leftJoin('driver_truck', 'trucks.id', '=', 'driver_truck.truck_id')
            ->where('trucks.status', 'active')
            ->groupBy('trucks.id', 'trucks.plate', 'trucks.vehicletype_id', 'trucks.chasisNumber', 'trucks.engineNumber', 'trucks.tyreSyze', 'trucks.serviceIntervalKM', 'trucks.purchasePrice', 'trucks.productionDate', 'trucks.serviceStartDate', 'trucks.status', 'trucks.created_at', 'trucks.updated_at', 'trucks.deleted_at')
            ->havingRaw('total_assigned = 0')
            ->orderBy('trucks.plate')
            ->get();
    }

    /**
     * Get available drivers (not currently assigned).
     */
    private function getAvailableDrivers()
    {
        return Driver::select(
            'drivers.*',
            DB::raw('COALESCE(SUM(driver_truck.is_attached), 0) as total_assigned')
        )
            ->leftJoin('driver_truck', 'drivers.id', '=', 'driver_truck.driver_id')
            ->where('drivers.status', 'active')
            ->groupBy('drivers.id', 'drivers.driverid', 'drivers.name', 'drivers.sex', 'drivers.birthdate', 'drivers.zone', 'drivers.woreda', 'drivers.kebele', 'drivers.housenumber', 'drivers.mobile', 'drivers.hireddate', 'drivers.status', 'drivers.created_at', 'drivers.updated_at', 'drivers.deleted_at')
            ->havingRaw('total_assigned = 0')
            ->orderBy('drivers.name')
            ->get();
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreDriverTruckRequest;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\Performance;
use App\Models\Truck;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class DriverTruckController extends Controller
{
    /**
     * Display a listing of driver-truck assignments.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search'));
        $status = $request->input('status');
        $sort = $request->input('sort', 'date_recived');
        $direction = strtolower((string) $request->input('direction', 'desc'));
        $driverId = $request->input('driver_id');
        $truckId = $request->input('truck_id');
        $perPageOptions = [15, 25, 50, 100];
        $perPageDefault = 15;
        $perPage = (int) $request->input('per_page', $perPageDefault);

        if (! in_array($perPage, $perPageOptions, true)) {
            $perPage = $perPageDefault;
        }

        if (! in_array($direction, ['asc', 'desc'], true)) {
            $direction = 'desc';
        }

        $allowedSorts = ['date_recived', 'date_detach', 'status', 'is_attached', 'created_at', 'updated_at'];

        if (! in_array($sort, $allowedSorts, true)) {
            $sort = 'date_recived';
        }

        $assignmentsQuery = DriverTruck::query()->with(['driver', 'truck.vehicletype']);
        $metricsQuery = DriverTruck::query();

        if ($search !== '') {
            $applySearch = static function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->whereHas('driver', function ($driverQuery) use ($search) {
                        $driverQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('driverid', 'like', "%{$search}%");
                    })
                        ->orWhereHas('truck', function ($truckQuery) use ($search) {
                            $truckQuery->where('plate', 'like', "%{$search}%");
                        });
                });
            };

            $applySearch($assignmentsQuery);
            $applySearch($metricsQuery);
        }

        if (! empty($status) && $status !== 'all') {
            if ($status === 'attached') {
                $assignmentsQuery->where('is_attached', 1);
                $metricsQuery->where('is_attached', 1);
            } elseif ($status === 'detached') {
                $assignmentsQuery->where('is_attached', 0);
                $metricsQuery->where('is_attached', 0);
            } else {
                $assignmentsQuery->where('status', $status);
                $metricsQuery->where('status', $status);
            }
        }

        if (! empty($driverId) && ctype_digit((string) $driverId)) {
            $assignmentsQuery->where('driver_id', (int) $driverId);
            $metricsQuery->where('driver_id', (int) $driverId);
        }

        if (! empty($truckId) && ctype_digit((string) $truckId)) {
            $assignmentsQuery->where('truck_id', (int) $truckId);
            $metricsQuery->where('truck_id', (int) $truckId);
        }

        $assignmentsQuery->orderBy($sort, $direction);

        $driverTrucks = $assignmentsQuery->paginate($perPage)->withQueryString();

        $availableDriversCount = $this->getAvailableDrivers()->count();
        $availableTrucksCount = $this->getAvailableTrucks()->count();

        $metrics = [
            'total' => (clone $metricsQuery)->count(),
            'attached' => (clone $metricsQuery)->where('is_attached', 1)->count(),
            'detached' => (clone $metricsQuery)->where('is_attached', 0)->count(),
            'availableDrivers' => $availableDriversCount,
            'availableTrucks' => $availableTrucksCount,
        ];

        $statusOptions = collect(['attached', 'detached'])
            ->merge(
                DriverTruck::query()
                    ->select('status')
                    ->whereNotNull('status')
                    ->distinct()
                    ->pluck('status')
            )
            ->unique()
            ->filter()
            ->map(fn ($value) => [
                'label' => Str::headline((string) $value),
                'value' => (string) $value,
            ])->values();

        $driverOptions = Driver::query()
            ->select('drivers.id', 'drivers.name', 'drivers.driverid')
            ->whereHas('driverTrucks')
            ->orderBy('drivers.name')
            ->get()
            ->map(fn (Driver $driver) => [
                'label' => trim($driver->name.' ('.$driver->driverid.')'),
                'value' => $driver->id,
            ]);

        $truckOptions = Truck::query()
            ->select('trucks.id', 'trucks.plate')
            ->whereHas('driverTrucks')
            ->orderBy('trucks.plate')
            ->get()
            ->map(fn (Truck $truck) => [
                'label' => $truck->plate,
                'value' => $truck->id,
            ]);

        return Inertia::render('DriverTrucks/Index', [
            'driverTrucks' => $driverTrucks,
            'metrics' => $metrics,
            'filters' => [
                'search' => $search !== '' ? $search : null,
                'status' => $status ?: null,
                'sort' => $sort,
                'direction' => $direction,
                'per_page' => $perPage,
                'driver_id' => $driverId ? (int) $driverId : null,
                'truck_id' => $truckId ? (int) $truckId : null,
            ],
            'statusOptions' => $statusOptions,
            'perPageOptions' => $perPageOptions,
            'driverOptions' => $driverOptions,
            'truckOptions' => $truckOptions,
        ]);
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

            return redirect()->route('driver-trucks.index')
                ->with('success', 'Driver and truck assigned successfully.');

        } catch (Exception $e) {
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

        // Load activity logs
        $activityLogs = Activity::forSubject($driverTruck)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('DriverTrucks/Show', [
            'driverTruck' => $driverTruck,
            'performances' => $performances,
            'dateDifference' => $dateDifference,
            'activityLogs' => $activityLogs,
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
            $truck = Truck::findOrFail($request->truck_id);
            $driver = Driver::findOrFail($request->driver_id);

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

            return redirect()->route('driver-trucks.index')
                ->with('success', 'Driver-truck assignment updated successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update assignment. Please try again.']);
        }
    }

    /**
     * Remove the specified driver-truck assignment.
     */
    public function destroy(DriverTruck $driverTruck)
    {
        try {
            // Check if there are performances associated with this assignment
            $performances = Performance::where('driver_truck_id', $driverTruck->id)->first();

            if ($performances) {
                return back()->withErrors(['error' => 'Cannot delete this assignment. There are performance records associated with it.']);
            }

            $driverTruck->delete();

            return redirect()->route('driver-trucks.index')
                ->with('success', 'Driver-truck assignment deleted successfully.');

        } catch (Exception $e) {
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

            $driverTruck->update([
                'date_detach' => $request->date_detach,
                'reason' => $request->reason,
                'is_attached' => 0,
            ]);

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

<?php

namespace App\Http\Controllers;

use App\Events\FuelRecordCreated;
use App\Events\FuelRecordDeleted;
use App\Events\FuelRecordUpdated;
use App\Http\Requests\StoreFuelRequest;
use App\Http\Requests\UpdateFuelRequest;
use App\Models\DriverTruck;
use App\Models\FuelConsumptionAnalysis;
use App\Models\FuelRecord;
use App\Services\FuelRecords\FuelRecordIndexService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Activitylog\Models\Activity;

class FuelController extends Controller
{
    public function __construct(private FuelRecordIndexService $fuelRecordIndexService) {}

    /**
     * Display a listing of fuel records.
     */
    public function index(Request $request): Response
    {
        $result = $this->fuelRecordIndexService->getIndexResult($request);

        return Inertia::render('Fuel/Index', $result->toInertia());
    }

    /**
     * Show the form for creating a new fuel record.
     */
    public function create(): Response
    {
        $assignments = DriverTruck::query()
            ->with(['truck:id,plate,status', 'driver:id,name,driverid,status'])
            ->where('status', 'active')
            ->where('is_attached', 1)
            ->where(function ($query) {
                $query->whereNull('date_detach')
                    ->orWhere('date_detach', '>', now());
            })
            ->orderByDesc('date_recived')
            ->get()
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'truck_id' => $assignment->truck_id,
                    'truck_plate' => $assignment->truck?->plate,
                    'driver_id' => $assignment->driver_id,
                    'driver_name' => $assignment->driver?->name,
                    'driver_code' => $assignment->driver?->driverid,
                    'assigned_on' => optional($assignment->date_recived)->toDateString(),
                ];
            })
            ->values();

        return Inertia::render('Fuel/Create', [
            'assignments' => $assignments,
        ]);
    }

    /**
     * Store a newly created fuel record.
     */
    public function store(StoreFuelRequest $request)
    {
        try {
            $validated = $request->validated();

            $assignment = DriverTruck::query()->find($validated['driver_truck_id']);

            if (
                ! $assignment
                || (int) $assignment->is_attached !== 1
                || $assignment->date_detach !== null
                || $assignment->status !== 'active'
            ) {
                throw ValidationException::withMessages([
                    'driver_truck_id' => 'The selected driver and truck pairing is no longer active.',
                ]);
            }

            $validated['truck_id'] = $assignment->truck_id;
            $validated['driver_id'] = $assignment->driver_id;
            $validated['total_cost'] = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];
            $validated['user_id'] = Auth::id();

            $fuelRecord = FuelRecord::create($validated);

            event(new FuelRecordCreated($fuelRecord->loadMissing(['truck', 'driver']), Auth::user()));

            // Clear cached options
            Cache::forget('fuel_records.fuel_type_options');
            Cache::forget('fuel_records.truck_options');
            Cache::forget('fuel_records.driver_options');

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record created successfully.');

        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to create fuel record. Please try again.']);
        }
    }

    /**
     * Display the specified fuel record.
     */
    public function show(FuelRecord $fuel): Response
    {
        $fuel->load(['truck', 'driver', 'user']);

        // Load activity logs for this fuel record using Spatie Activity Log
        $activityLogs = Activity::forSubject($fuel)
            ->with('causer')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Fuel/Show', [
            'fuel' => $fuel,
            'activityLogs' => $activityLogs,
        ]);
    }

    /**
     * Show the form for editing the specified fuel record.
     */
    public function edit(FuelRecord $fuel): Response
    {
        $fuel->load(['truck', 'driver', 'driverTruck']);

        $assignments = DriverTruck::query()
            ->with(['truck:id,plate,status', 'driver:id,name,driverid,status'])
            ->where(function ($query) {
                $query->where('is_attached', 1)
                    ->where('status', 'active')
                    ->where(function ($nested) {
                        $nested->whereNull('date_detach')
                            ->orWhere('date_detach', '>', now());
                    });
            })
            ->when($fuel->driver_truck_id, function ($query, $driverTruckId) {
                $query->orWhere('id', $driverTruckId);
            })
            ->orderByDesc('date_recived')
            ->get()
            ->unique('id')
            ->map(function ($assignment) {
                return [
                    'id' => $assignment->id,
                    'truck_id' => $assignment->truck_id,
                    'truck_plate' => $assignment->truck?->plate,
                    'driver_id' => $assignment->driver_id,
                    'driver_name' => $assignment->driver?->name,
                    'driver_code' => $assignment->driver?->driverid,
                    'assigned_on' => optional($assignment->date_recived)->toDateString(),
                ];
            })
            ->values();

        return Inertia::render('Fuel/Edit', [
            'fuel' => $fuel,
            'assignments' => $assignments,
        ]);
    }

    /**
     * Update the specified fuel record.
     */
    public function update(UpdateFuelRequest $request, FuelRecord $fuel)
    {
        try {
            $validated = $request->validated();

            $assignment = DriverTruck::query()->find($validated['driver_truck_id']);

            if (! $assignment) {
                throw ValidationException::withMessages([
                    'driver_truck_id' => 'The selected driver and truck pairing could not be found.',
                ]);
            }

            $assignmentIsActive = (int) $assignment->is_attached === 1 && $assignment->date_detach === null && $assignment->status === 'active';

            if (! $assignmentIsActive && $fuel->driver_truck_id !== $assignment->id) {
                throw ValidationException::withMessages([
                    'driver_truck_id' => 'The selected driver and truck pairing is no longer active.',
                ]);
            }

            $validated['truck_id'] = $assignment->truck_id;
            $validated['driver_id'] = $assignment->driver_id;
            $validated['total_cost'] = $validated['fuel_quantity_liters'] * $validated['fuel_price_per_liter'];

            $original = $fuel->getOriginal();

            $fuel->fill($validated);

            $dirty = $fuel->getDirty();
            $changes = [];

            foreach ($dirty as $attribute => $newValue) {
                $changes[$attribute] = [
                    'old' => $original[$attribute] ?? null,
                    'new' => $newValue,
                ];
            }

            $fuel->save();

            if ($changes !== []) {
                event(new FuelRecordUpdated($fuel->fresh(['truck', 'driver']), $changes, Auth::user()));
            }

            // Clear cached options if fuel_type, truck_id, or driver_id changed
            if (isset($changes['fuel_type']) || isset($changes['truck_id']) || isset($changes['driver_id'])) {
                Cache::forget('fuel_records.fuel_type_options');
                Cache::forget('fuel_records.truck_options');
                Cache::forget('fuel_records.driver_options');
            }

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record updated successfully.');

        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to update fuel record. Please try again.']);
        }
    }

    /**
     * Remove the specified fuel record.
     */
    public function destroy(FuelRecord $fuel)
    {
        try {
            $fuelRecordId = $fuel->getKey();
            $receiptNumber = $fuel->receipt_number;
            $attributes = $fuel->getAttributes();

            $fuel->delete();

            event(new FuelRecordDeleted($fuelRecordId, $receiptNumber, $attributes, Auth::user()));

            // Clear cached options
            Cache::forget('fuel_records.fuel_type_options');
            Cache::forget('fuel_records.truck_options');
            Cache::forget('fuel_records.driver_options');

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record deleted successfully.');

        } catch (Exception $e) {
            return back()->withErrors(['error' => 'Failed to delete fuel record. Please try again.']);
        }
    }

    /**
     * Get fuel consumption analysis.
     */
    public function analysis(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $query = FuelConsumptionAnalysis::with('truck')
                ->where('period_type', $periodType)
                ->whereBetween('analysis_date', [$startDate, $endDate]);

            if ($truckId) {
                $query->where('truck_id', $truckId);
            }

            $analysis = $query->orderBy('analysis_date', 'desc')->get();

            return response()->json([
                'success' => true,
                'data' => $analysis,
                'count' => $analysis->count(),
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve fuel consumption analysis',
            ], 500);
        }
    }

    /**
     * Generate fuel consumption analysis.
     */
    public function generateAnalysis(Request $request)
    {
        try {
            $truckId = $request->get('truck_id');
            $periodType = $request->get('period_type', 'monthly');
            $startDate = $request->get('start_date', now()->subMonths(6));
            $endDate = $request->get('end_date', now());

            $this->generateFuelConsumptionAnalysis($truckId, $periodType, $startDate, $endDate);

            return response()->json([
                'success' => true,
                'message' => 'Fuel consumption analysis generated successfully',
            ]);

        } catch (Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate fuel consumption analysis',
            ], 500);
        }
    }

    /**
     * Generate fuel consumption analysis for a truck.
     */
    private function generateFuelConsumptionAnalysis($truckId, $periodType, $startDate, $endDate)
    {
        $query = FuelRecord::whereBetween('fuel_date', [$startDate, $endDate]);

        if ($truckId) {
            $query->where('truck_id', $truckId);
        }

        $fuelRecords = $query->get();

        if ($fuelRecords->isEmpty()) {
            return;
        }

        $groupedRecords = $fuelRecords->groupBy(function ($record) use ($periodType) {
            if ($periodType === 'daily') {
                return $record->fuel_date->format('Y-m-d');
            } elseif ($periodType === 'weekly') {
                return $record->fuel_date->format('Y-W');
            } else {
                return $record->fuel_date->format('Y-m');
            }
        });

        foreach ($groupedRecords as $period => $records) {
            $totalFuel = $records->sum('fuel_quantity_liters');
            $totalCost = $records->sum('total_cost');
            $totalDistance = $records->sum(function ($record) {
                // This would need odometer readings to calculate actual distance
                return 0;
            });

            $fuelEfficiency = $totalDistance > 0 ? $totalDistance / $totalFuel : 0;
            $fuelCostPerKm = $totalDistance > 0 ? $totalCost / $totalDistance : 0;

            FuelConsumptionAnalysis::updateOrCreate([
                'truck_id' => $truckId,
                'analysis_date' => $records->first()->fuel_date,
                'period_type' => $periodType,
            ], [
                'total_distance_km' => $totalDistance,
                'total_fuel_consumed_liters' => $totalFuel,
                'fuel_efficiency_km_per_liter' => $fuelEfficiency,
                'fuel_cost_per_km' => $fuelCostPerKm,
            ]);
        }
    }
}

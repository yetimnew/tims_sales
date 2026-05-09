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

class FuelController extends BaseResourceController
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

            $this->validateOdometerSequence($assignment->id, $validated['odometer_reading'] ?? null);

            $fuelRecord = FuelRecord::create($validated);

            // Clear all related caches systematically
            Cache::forget('fuel_records.fuel_type_options');
            Cache::forget('fuel_records.truck_options');
            Cache::forget('fuel_records.driver_options');

            // Dispatch event for audit trail
            event(new FuelRecordCreated($fuelRecord->loadMissing(['truck', 'driver']), Auth::user()));

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record created successfully.');

        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Exception $e) {
            $this->logError('store', 'FuelRecord', $e, [
                'created_by' => Auth::id(),
            ]);

            $errorMessage = 'Failed to create fuel record. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    /**
     * Display the specified fuel record.
     */
    public function show(FuelRecord $fuel): Response
    {
        $fuel->load(['truck', 'driver', 'user']);

        // Get activity logs using base controller method
        $activityLogs = $this->getActivityLogs($fuel);

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

            $this->validateOdometerSequence($assignment->id, $validated['odometer_reading'] ?? null, $fuel->id);

            // Capture original values before update
            $original = $this->normalizeAttributes($fuel->getOriginal());

            $fuel->update($validated);

            // Format changes for audit trail
            $changes = $this->formatChanges($original, $this->normalizeAttributes($fuel->getChanges()));

            // Clear related caches if changes exist
            if (! empty($changes)) {
                Cache::forget('fuel_records.fuel_type_options');
                Cache::forget('fuel_records.truck_options');
                Cache::forget('fuel_records.driver_options');

                event(new FuelRecordUpdated($fuel->fresh(['truck', 'driver']), $changes, Auth::user()));
            }

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record updated successfully.');

        } catch (ValidationException $exception) {
            throw $exception;
        } catch (Exception $e) {
            $this->logError('update', 'FuelRecord', $e);

            $errorMessage = 'Failed to update fuel record. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
        }
    }

    public function mobileReview(Request $request): Response
    {
        $reviewStatus = $request->string('review_status')->value();

        $records = FuelRecord::query()
            ->with(['truck:id,plate', 'driver:id,name,driverid', 'reviewedBy:id,name'])
            ->where('submitted_via_mobile', true)
            ->when($reviewStatus === 'pending', fn ($query) => $query->whereNull('reviewed_at'))
            ->when($reviewStatus === 'reviewed', fn ($query) => $query->whereNotNull('reviewed_at'))
            ->orderByDesc('fuel_date')
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString()
            ->through(fn (FuelRecord $record) => $this->transformMobileFuelRecord($record));

        return Inertia::render('Fuel/MobileReview', [
            'records' => $records,
            'filters' => [
                'review_status' => $reviewStatus ?: 'pending',
            ],
        ]);
    }

    public function markMobileReviewed(Request $request, FuelRecord $fuel)
    {
        $validated = $request->validate([
            'review_note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (! $fuel->submitted_via_mobile) {
            return redirect()->route('fuel.mobile-review')
                ->with('error', 'Only mobile-submitted fuel records can be reviewed here.');
        }

        $fuel->forceFill([
            'reviewed_at' => now(),
            'reviewed_by_user_id' => Auth::id(),
            'review_note' => $validated['review_note'] ?? null,
        ])->save();

        return redirect()->route('fuel.mobile-review')
            ->with('success', 'Fuel submission marked as reviewed.');
    }

    /**
     * Remove the specified fuel record.
     */
    public function destroy(FuelRecord $fuel)
    {
        try {
            // Capture data before deletion for audit trail
            $fuelRecordId = $fuel->id;
            $receiptNumber = $fuel->receipt_number;
            $attributes = $this->normalizeAttributes($fuel->toArray());

            $fuel->delete();

            // Clear related caches
            Cache::forget('fuel_records.fuel_type_options');
            Cache::forget('fuel_records.truck_options');
            Cache::forget('fuel_records.driver_options');

            // Dispatch event with deleted data for audit trail
            event(new FuelRecordDeleted($fuelRecordId, $receiptNumber, $attributes, Auth::user()));

            return redirect()->route('fuel.index')
                ->with('success', 'Fuel record deleted successfully.');

        } catch (Exception $e) {
            $this->logError('destroy', 'FuelRecord', $e);

            $errorMessage = 'Failed to delete fuel record. Please try again.';

            return back()
                ->withErrors(['error' => $errorMessage])
                ->with('error', $errorMessage);
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

    private function validateOdometerSequence(int $driverTruckId, ?int $odometerReading, ?int $ignoreFuelRecordId = null): void
    {
        if ($odometerReading === null) {
            return;
        }

        $latestRecord = FuelRecord::query()
            ->where('driver_truck_id', $driverTruckId)
            ->whereNotNull('odometer_reading')
            ->when($ignoreFuelRecordId !== null, fn ($query) => $query->where('id', '!=', $ignoreFuelRecordId))
            ->orderByDesc('fuel_date')
            ->orderByDesc('created_at')
            ->first();

        if ($latestRecord !== null && $odometerReading < (int) $latestRecord->odometer_reading) {
            throw ValidationException::withMessages([
                'odometer_reading' => sprintf(
                    'Odometer reading cannot be lower than the latest recorded value (%d km).',
                    $latestRecord->odometer_reading
                ),
            ]);
        }
    }

    private function transformMobileFuelRecord(FuelRecord $record): array
    {
        return [
            'id' => $record->id,
            'fuel_date' => optional($record->fuel_date)->toDateString(),
            'fuel_station' => $record->fuel_station,
            'fuel_type' => $record->fuel_type,
            'fuel_quantity_liters' => $record->fuel_quantity_liters !== null ? (float) $record->fuel_quantity_liters : null,
            'fuel_price_per_liter' => $record->fuel_price_per_liter !== null ? (float) $record->fuel_price_per_liter : null,
            'total_cost' => $record->total_cost !== null ? (float) $record->total_cost : null,
            'odometer_reading' => $record->odometer_reading,
            'receipt_number' => $record->receipt_number,
            'receipt_image_url' => $record->receipt_image_url,
            'notes' => $record->notes,
            'latitude' => $record->latitude !== null ? (float) $record->latitude : null,
            'longitude' => $record->longitude !== null ? (float) $record->longitude : null,
            'location_accuracy_m' => $record->location_accuracy_m !== null ? (float) $record->location_accuracy_m : null,
            'location_timestamp' => $record->location_timestamp?->toIso8601String(),
            'truck' => [
                'id' => $record->truck?->id,
                'plate' => $record->truck?->plate,
            ],
            'driver' => [
                'id' => $record->driver?->id,
                'name' => $record->driver?->name,
                'driverid' => $record->driver?->driverid,
            ],
            'reviewed_at' => $record->reviewed_at?->toIso8601String(),
            'review_note' => $record->review_note,
            'reviewed_by' => $record->reviewedBy?->name,
            'created_at' => $record->created_at?->toIso8601String(),
        ];
    }
}

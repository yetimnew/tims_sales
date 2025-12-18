<?php

namespace App\Http\Controllers;

use App\Events\DailyTruckStatusCreated;
use App\Events\DailyTruckStatusUpdated;
use App\Http\Requests\StoreDailyTruckStatusRequest;
use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use App\Services\Trucks\TruckStatusHistoryService;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DailyTruckStatusController extends Controller
{
    public function __construct(private TruckStatusHistoryService $truckStatusHistory) {}

    /**
     * Display the truck status board.
     */
    public function index(Request $request): Response
    {
        // Get date from request or use today
        $date = $request->input('date', now()->format('Y-m-d'));

        // Cache trucks list (1 hour) - changes when trucks are added/removed/updated
        $trucks = Cache::remember('daily_truck_status.active_trucks', 3600, function () {
            return Truck::query()
                ->active()
                ->with(['vehicleType'])
                ->orderBy('plate')
                ->get();
        });

        $trucks = $trucks
            ->filter(static fn (Truck $truck): bool => $truck->status === 'active')
            ->values();

        $currentDriverAssignments = DB::table('driver_truck')
            ->leftJoin('drivers', 'drivers.id', '=', 'driver_truck.driver_id')
            ->select([
                'driver_truck.truck_id',
                'driver_truck.driver_id',
                'driver_truck.driverid as legacy_driver_id',
                DB::raw('COALESCE(drivers.name, driver_truck.driverid) as driver_name'),
                DB::raw('COALESCE(driver_truck.date_recived, driver_truck.created_at) as assignment_order'),
                'driver_truck.id as assignment_id',
            ])
            ->whereNull('driver_truck.deleted_at')
            ->whereNull('driver_truck.date_detach')
            ->whereNull('driver_truck.unassigned_date')
            ->where(function ($assignmentQuery) {
                $assignmentQuery
                    ->where('driver_truck.is_attached', true)
                    ->orWhere(function ($statusQuery) {
                        $statusQuery
                            ->whereNull('driver_truck.is_attached')
                            ->where('driver_truck.status', 'active');
                    });
            })
            ->whereNotExists(function ($conflicting) {
                $conflicting
                    ->from('driver_truck as recent_assignments')
                    ->whereNull('recent_assignments.deleted_at')
                    ->whereNull('recent_assignments.date_detach')
                    ->whereNull('recent_assignments.unassigned_date')
                    ->where(function ($identifier) {
                        $identifier
                            ->where(function ($matchByDriverId) {
                                $matchByDriverId
                                    ->whereNotNull('driver_truck.driver_id')
                                    ->whereColumn('recent_assignments.driver_id', 'driver_truck.driver_id');
                            })
                            ->orWhere(function ($matchByLegacyId) {
                                $matchByLegacyId
                                    ->whereNull('driver_truck.driver_id')
                                    ->whereColumn('recent_assignments.driverid', 'driver_truck.driverid');
                            });
                    })
                    ->where(function ($activeAssignment) {
                        $activeAssignment
                            ->where('recent_assignments.is_attached', true)
                            ->orWhere(function ($statusQuery) {
                                $statusQuery
                                    ->whereNull('recent_assignments.is_attached')
                                    ->where('recent_assignments.status', 'active');
                            });
                    })
                    ->where(function ($recencyCheck) {
                        $recencyCheck
                            ->whereRaw('COALESCE(recent_assignments.date_recived, recent_assignments.created_at) > COALESCE(driver_truck.date_recived, driver_truck.created_at)')
                            ->orWhere(function ($conflictWithSameDate) {
                                $conflictWithSameDate
                                    ->whereRaw('COALESCE(recent_assignments.date_recived, recent_assignments.created_at) = COALESCE(driver_truck.date_recived, driver_truck.created_at)')
                                    ->whereColumn('recent_assignments.id', '>', 'driver_truck.id');
                            });
                    });
            })
            ->orderByDesc(DB::raw('COALESCE(driver_truck.date_recived, driver_truck.created_at)'))
            ->orderByDesc('driver_truck.id')
            ->get()
            ->groupBy('truck_id')
            ->map(function ($assignments) {
                $assignment = $assignments->first();

                if (! $assignment) {
                    return null;
                }

                return [
                    'driver_id' => $assignment->driver_id,
                    'legacy_driver_id' => $assignment->legacy_driver_id,
                    'driver_name' => $assignment->driver_name,
                ];
            });

        // Cache operational status type (1 hour) - changes when status types are modified
        $operationalStatusType = Cache::remember('daily_truck_status.operational_status_type', 3600, function () {
            return StatusType::where('name', 'Operational Status')->first();
        });

        // Cache statuses list (1 hour) - changes when statuses are added/removed/updated
        $statuses = Cache::remember('daily_truck_status.statuses', 3600, function () use ($operationalStatusType) {
            if (! $operationalStatusType) {
                return collect();
            }

            return Status::where('statustype_id', $operationalStatusType->id)
                ->orderBy('name')
                ->get();
        });

        // Get status assignments for the date
        $dailyStatuses = DailyTruckStatus::with(['truck', 'status', 'changedBy'])
            ->where('status_date', $date)
            ->get()
            ->keyBy('truck_id');

        // Group trucks by status
        $trucksByStatus = [];
        foreach ($statuses as $status) {
            $trucksByStatus[$status->id] = [
                'status' => $status,
                'trucks' => [],
            ];
        }

        // Assign trucks to their status
        foreach ($trucks as $truck) {
            $assignment = $currentDriverAssignments->get($truck->id);

            $driver = null;

            if ($assignment && $assignment['driver_name'] !== null) {
                $driverId = $assignment['driver_id'];
                $driver = [
                    'id' => $driverId !== null ? (int) $driverId : null,
                    'name' => $assignment['driver_name'],
                    'legacy_id' => $assignment['legacy_driver_id'],
                ];
            }

            $dailyStatus = $dailyStatuses->get($truck->id);

            if ($dailyStatus) {
                $statusId = $dailyStatus->status_id;
                $trucksByStatus[$statusId]['trucks'][] = [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'vehicleType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'equipmentType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'driver' => $driver,
                    'status_id' => $statusId,
                    'notes' => $dailyStatus->notes,
                    'changed_at' => $dailyStatus->created_at,
                    'changed_by' => $dailyStatus->changedBy ? $dailyStatus->changedBy->name : 'Unknown',
                ];
            } else {
                // Trucks without status go to "Available" or first status
                $firstStatusId = $statuses->first()->id;
                $trucksByStatus[$firstStatusId]['trucks'][] = [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'vehicleType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'equipmentType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'driver' => $driver,
                    'status_id' => null,
                    'notes' => null,
                    'changed_at' => null,
                    'changed_by' => null,
                ];
            }
        }

        return Inertia::render('Status/Index', [
            'trucksByStatus' => $trucksByStatus,
            'statuses' => $statuses,
            'selectedDate' => $date,
        ]);
    }

    /**
     * Display the recent status view for a single truck.
     */
    public function show(Truck $truck): Response
    {
        $truck->load([
            'vehicleType:id,name',
            'drivers' => function ($query) {
                $query->select('drivers.id', 'drivers.name')
                    ->wherePivot('status', 'active')
                    ->orderBy('driver_truck.created_at', 'desc');
            },
        ]);

        $statusHistoryPayload = $this->truckStatusHistory->recentForTruck($truck);

        $primaryDriver = $truck->drivers->first();

        return Inertia::render('Status/TruckStatusShow', [
            'truck' => [
                'id' => $truck->id,
                'plate' => $truck->plate,
                'status' => $truck->status,
                'vehicleType' => $truck->vehicleType?->name,
                'driver' => $primaryDriver ? [
                    'id' => $primaryDriver->id,
                    'name' => $primaryDriver->name,
                ] : null,
            ],
            'recentStatusHistory' => $statusHistoryPayload['history'],
            'recentStatusSummary' => $statusHistoryPayload['summary'],
        ]);
    }

    /**
     * Store or update truck status.
     */
    public function store(StoreDailyTruckStatusRequest $request)
    {
        try {
            DB::beginTransaction();

            $data = $request->validated();
            $data['changed_by'] = Auth::id();

            $criteria = [
                'truck_id' => $data['truck_id'],
                'status_date' => $data['status_date'],
            ];

            $existing = DailyTruckStatus::query()
                ->where($criteria)
                ->first();

            $dailyStatus = DailyTruckStatus::updateOrCreate($criteria, $data);

            DB::commit();

            $dailyStatus->load([
                'truck:id,plate',
                'status:id,name,statustype_id',
                'status.statusType:id,name',
                'changedBy:id,name',
            ]);

            $wasNewRecord = $existing === null || $dailyStatus->wasRecentlyCreated;

            if ($wasNewRecord) {
                event(new DailyTruckStatusCreated($dailyStatus, Auth::user()));
            } else {
                $changes = $this->extractDailyStatusChanges($existing, $dailyStatus);

                if ($changes !== []) {
                    event(new DailyTruckStatusUpdated($dailyStatus, $changes, Auth::user()));
                }
            }

            // Clear cached trucks list when status changes (truck status affects the board)
            Cache::forget('daily_truck_status.trucks');

            if ($request->expectsJson()) {
                return response()->json([
                    'truck_id' => (int) $dailyStatus->truck_id,
                    'status_id' => $dailyStatus->status_id === null ? null : (int) $dailyStatus->status_id,
                    'notes' => $dailyStatus->notes,
                    'changed_at' => optional($dailyStatus->created_at)->toISOString(),
                    'changed_by' => $dailyStatus->changedBy?->name,
                ]);
            }

            return redirect()->back()->with('success', 'Truck status updated successfully.');

        } catch (Exception $e) {
            DB::rollBack();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Failed to update truck status.',
                ], 500);
            }

            return back()->withErrors(['error' => 'Failed to update truck status.']);
        }
    }

    /**
     * @return array<string, array{old: mixed, new: mixed}>
     */
    private function extractDailyStatusChanges(?DailyTruckStatus $before, DailyTruckStatus $after): array
    {
        if ($before === null) {
            return [];
        }

        $changes = [];

        $previousStatusId = $before->getAttribute('status_id');
        $currentStatusId = $after->getAttribute('status_id');

        if ($previousStatusId !== $currentStatusId) {
            $changes['status_id'] = [
                'old' => $previousStatusId === null ? null : (int) $previousStatusId,
                'new' => $currentStatusId === null ? null : (int) $currentStatusId,
            ];
        }

        $previousNotes = $before->getAttribute('notes');
        $currentNotes = $after->getAttribute('notes');

        if (($previousNotes ?? null) !== ($currentNotes ?? null)) {
            $changes['notes'] = [
                'old' => $previousNotes,
                'new' => $currentNotes,
            ];
        }

        return $changes;
    }
}

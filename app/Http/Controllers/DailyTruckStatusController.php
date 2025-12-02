<?php

namespace App\Http\Controllers;

use App\Events\DailyTruckStatusCreated;
use App\Events\DailyTruckStatusUpdated;
use App\Http\Requests\StoreDailyTruckStatusRequest;
use App\Models\DailyTruckStatus;
use App\Models\Status;
use App\Models\StatusType;
use App\Models\Truck;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class DailyTruckStatusController extends Controller
{
    /**
     * Display the truck status board.
     */
    public function index(Request $request): Response
    {
        // Get date from request or use today
        $date = $request->input('date', now()->format('Y-m-d'));

        // Get all trucks
        $trucks = Truck::with(['vehicleType', 'drivers'])->get();

        // Get operational status type
        $operationalStatusType = StatusType::where('name', 'Operational Status')->first();

        // Get all operational statuses
        $statuses = Status::where('statustype_id', $operationalStatusType->id)
            ->orderBy('name')
            ->get();

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
            $dailyStatus = $dailyStatuses->get($truck->id);

            if ($dailyStatus) {
                $statusId = $dailyStatus->status_id;
                $trucksByStatus[$statusId]['trucks'][] = [
                    'id' => $truck->id,
                    'plate' => $truck->plate,
                    'vehicleType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'equipmentType' => $truck->vehicleType ? $truck->vehicleType->name : 'N/A',
                    'driver' => $truck->drivers->where('pivot.status', 'active')->first(),
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
                    'driver' => $truck->drivers->where('pivot.status', 'active')->first(),
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

            if ($existing === null || $dailyStatus->wasRecentlyCreated) {
                event(new DailyTruckStatusCreated($dailyStatus, Auth::user()));

                return redirect()->back()->with('success', 'Truck status updated successfully.');
            }

            $changes = $this->extractDailyStatusChanges($existing, $dailyStatus);

            if ($changes !== []) {
                event(new DailyTruckStatusUpdated($dailyStatus, $changes, Auth::user()));
            }

            return redirect()->back()->with('success', 'Truck status updated successfully.');

        } catch (Exception $e) {
            DB::rollBack();

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

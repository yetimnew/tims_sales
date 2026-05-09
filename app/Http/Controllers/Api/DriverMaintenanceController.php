<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Driver;
use App\Models\DriverTruck;
use App\Models\NotificationType;
use App\Models\VehicleMaintenanceRecord;
use App\Notifications\MaintenanceAlertNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class DriverMaintenanceController extends Controller
{
    /**
     * Get the driver associated with the authenticated user
     * Uses the User->Driver relationship (user_id in drivers table)
     * Returns null if user is not a driver
     */
    private function getDriverForUser($user): ?Driver
    {
        // Use the User->Driver relationship via user_id
        return $user->driver;
    }

    /**
     * Get maintenance schedules for assigned truck
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found. Please contact administrator to link your account to a driver record.',
                'data' => [
                    'upcoming' => [],
                    'overdue' => [],
                    'recent' => [],
                ],
            ], 404);
        }

        // Get active truck assignment
        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->latest('date_recived')
            ->first();

        if (!$activeAssignment || !$activeAssignment->truck_id) {
            return response()->json([
                'success' => true,
                'data' => [
                    'upcoming' => [],
                    'overdue' => [],
                    'recent' => [],
                ],
            ]);
        }

        $truckId = $activeAssignment->truck_id;

        $upcomingRecords = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->upcoming(30)
            ->with(['maintenanceType'])
            ->orderBy('scheduled_date')
            ->get();

        $overdueRecords = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->overdue()
            ->with(['maintenanceType'])
            ->orderBy('scheduled_date')
            ->get();

        $recentRecords = VehicleMaintenanceRecord::where('truck_id', $truckId)
            ->where('status', 'completed')
            ->with(['maintenanceType'])
            ->orderByDesc('completed_date')
            ->limit(10)
            ->get();

        $this->dispatchDriverMaintenanceNotifications($user, $upcomingRecords, $overdueRecords);

        $upcoming = $upcomingRecords->map(fn (VehicleMaintenanceRecord $maintenance) => $this->formatMaintenance($maintenance));
        $overdue = $overdueRecords->map(fn (VehicleMaintenanceRecord $maintenance) => $this->formatMaintenance($maintenance));
        $recent = $recentRecords->map(fn (VehicleMaintenanceRecord $maintenance) => $this->formatMaintenance($maintenance));

        return response()->json([
            'success' => true,
            'data' => [
                'upcoming' => $upcoming,
                'overdue' => $overdue,
                'recent' => $recent,
            ],
        ]);
    }

    /**
     * Get maintenance details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $maintenance = $this->resolveMaintenanceForDriver($request, $id);

        if (!$maintenance) {
            return response()->json([
                'success' => false,
                'message' => 'Maintenance record not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->formatMaintenance($maintenance, true),
        ]);
    }

    public function acknowledge(Request $request, int $id): JsonResponse
    {
        $maintenance = $this->resolveMaintenanceForDriver($request, $id);

        if (!$maintenance) {
            return response()->json([
                'success' => false,
                'message' => 'Maintenance record not found',
            ], 404);
        }

        $user = $request->user();

        if ($maintenance->driver_acknowledged_at === null) {
            $maintenance->forceFill([
                'driver_acknowledged_at' => now(),
                'driver_acknowledged_by_user_id' => $user->id,
            ])->save();
        }

        $this->dispatchMaintenanceWorkflowNotification(
            NotificationType::MAINTENANCE_DRIVER_ACKNOWLEDGED,
            'Maintenance Acknowledged',
            sprintf('%s acknowledged maintenance record #%d.', $user->name, $maintenance->id),
            $maintenance,
            $user,
        );

        return response()->json([
            'success' => true,
            'message' => 'Maintenance acknowledged.',
            'data' => $this->formatMaintenance($maintenance->fresh(['maintenanceType', 'truck']), true),
        ]);
    }

    public function reportIssue(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
        ]);

        $maintenance = $this->resolveMaintenanceForDriver($request, $id);

        if (!$maintenance) {
            return response()->json([
                'success' => false,
                'message' => 'Maintenance record not found',
            ], 404);
        }

        $user = $request->user();

        $maintenance->forceFill([
            'driver_issue_reported_at' => now(),
            'driver_issue_reported_by_user_id' => $user->id,
            'driver_issue_report' => $validated['message'],
        ])->save();

        $this->dispatchMaintenanceWorkflowNotification(
            NotificationType::MAINTENANCE_ISSUE_REPORTED,
            'Driver Reported Maintenance Issue',
            sprintf('%s reported a maintenance issue for record #%d.', $user->name, $maintenance->id),
            $maintenance,
            $user,
            ['message' => $validated['message']],
        );

        return response()->json([
            'success' => true,
            'message' => 'Issue reported successfully.',
            'data' => $this->formatMaintenance($maintenance->fresh(['maintenanceType', 'truck']), true),
        ]);
    }

    public function requestService(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $maintenance = $this->resolveMaintenanceForDriver($request, $id);

        if (!$maintenance) {
            return response()->json([
                'success' => false,
                'message' => 'Maintenance record not found',
            ], 404);
        }

        $user = $request->user();

        $maintenance->forceFill([
            'driver_service_requested_at' => now(),
            'driver_service_requested_by_user_id' => $user->id,
            'driver_service_request_notes' => $validated['notes'] ?? null,
        ])->save();

        $this->dispatchMaintenanceWorkflowNotification(
            NotificationType::MAINTENANCE_SERVICE_REQUESTED,
            'Driver Requested Maintenance Service',
            sprintf('%s requested maintenance service for record #%d.', $user->name, $maintenance->id),
            $maintenance,
            $user,
            ['notes' => $validated['notes'] ?? null],
        );

        return response()->json([
            'success' => true,
            'message' => 'Service request submitted.',
            'data' => $this->formatMaintenance($maintenance->fresh(['maintenanceType', 'truck']), true),
        ]);
    }

    /**
     * Format maintenance data
     */
    private function formatMaintenance(VehicleMaintenanceRecord $maintenance, bool $detailed = false): array
    {
        $data = [
            'id' => $maintenance->id,
            'status' => $maintenance->status,
            'scheduled_date' => $maintenance->scheduled_date?->toDateString(),
            'completed_date' => $maintenance->completed_date?->toDateString(),
            'maintenance_type' => $maintenance->maintenanceType ? [
                'id' => $maintenance->maintenanceType->id,
                'name' => $maintenance->maintenanceType->name,
            ] : null,
            'driver_acknowledged_at' => $maintenance->driver_acknowledged_at?->toIso8601String(),
            'driver_issue_reported_at' => $maintenance->driver_issue_reported_at?->toIso8601String(),
            'driver_issue_report' => $maintenance->driver_issue_report,
            'driver_service_requested_at' => $maintenance->driver_service_requested_at?->toIso8601String(),
            'driver_service_request_notes' => $maintenance->driver_service_request_notes,
            'mobile_request_status' => $maintenance->mobile_request_status,
            'mobile_request_reviewed_at' => $maintenance->mobile_request_reviewed_at?->toIso8601String(),
            'mobile_request_review_note' => $maintenance->mobile_request_review_note,
        ];

        if ($detailed) {
            $data = array_merge($data, [
                'odometer_reading' => $maintenance->odometer_reading,
                'cost' => $maintenance->cost ? (float) $maintenance->cost : null,
                'description' => $maintenance->description,
                'work_performed' => $maintenance->work_performed,
                'parts_replaced' => $maintenance->parts_replaced,
                'service_provider' => $maintenance->service_provider,
                'is_overdue' => $maintenance->is_overdue,
                'days_until_scheduled' => $maintenance->days_until_scheduled,
            ]);
        } else {
            $data['is_overdue'] = $maintenance->is_overdue;
            $data['days_until_scheduled'] = $maintenance->days_until_scheduled;
        }

        return $data;
    }

    private function resolveMaintenanceForDriver(Request $request, int $id): ?VehicleMaintenanceRecord
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return null;
        }

        $activeAssignment = DriverTruck::where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->latest('date_recived')
            ->first();

        if (!$activeAssignment || !$activeAssignment->truck_id) {
            return null;
        }

        return VehicleMaintenanceRecord::where('id', $id)
            ->where('truck_id', $activeAssignment->truck_id)
            ->with(['maintenanceType', 'truck'])
            ->first();
    }

    private function dispatchDriverMaintenanceNotifications($user, Collection $upcomingRecords, Collection $overdueRecords): void
    {
        $assignedType = NotificationType::query()->where('key', NotificationType::MAINTENANCE_ASSIGNED)->first();
        $dueSoonType = NotificationType::query()->where('key', NotificationType::MAINTENANCE_DUE_SOON)->first();
        $overdueType = NotificationType::query()->where('key', NotificationType::MAINTENANCE_OVERDUE)->first();

        foreach ($upcomingRecords as $record) {
            if (! $record instanceof VehicleMaintenanceRecord) {
                continue;
            }

            if ($assignedType !== null && ! $this->driverNotificationExists($user, NotificationType::MAINTENANCE_ASSIGNED, $record->id)) {
                $user->notify(
                    (new MaintenanceAlertNotification(
                        $assignedType,
                        'Maintenance Scheduled',
                        sprintf('Maintenance #%d is scheduled for your assigned truck on %s.', $record->id, $record->scheduled_date?->toDateString() ?? 'N/A'),
                        $this->buildMaintenancePayload($record),
                    ))->withChannels(['database'])
                );
            }

            if (
                $dueSoonType !== null &&
                $record->days_until_scheduled !== null &&
                $record->days_until_scheduled <= 3 &&
                ! $this->driverNotificationExists($user, NotificationType::MAINTENANCE_DUE_SOON, $record->id)
            ) {
                $user->notify(
                    (new MaintenanceAlertNotification(
                        $dueSoonType,
                        'Maintenance Due Soon',
                        sprintf('Maintenance #%d is due in %d day(s).', $record->id, max(0, $record->days_until_scheduled)),
                        $this->buildMaintenancePayload($record),
                    ))->withChannels(['database'])
                );
            }
        }

        foreach ($overdueRecords as $record) {
            if (
                $overdueType !== null &&
                $record instanceof VehicleMaintenanceRecord &&
                ! $this->driverNotificationExists($user, NotificationType::MAINTENANCE_OVERDUE, $record->id)
            ) {
                $user->notify(
                    (new MaintenanceAlertNotification(
                        $overdueType,
                        'Maintenance Overdue',
                        sprintf('Maintenance #%d for your assigned truck is overdue.', $record->id),
                        $this->buildMaintenancePayload($record),
                    ))->withChannels(['database'])
                );
            }
        }
    }

    private function driverNotificationExists($user, string $notificationTypeKey, int $maintenanceId): bool
    {
        return $user->notifications()
            ->where('data->type', $notificationTypeKey)
            ->where('data->payload->maintenance_id', $maintenanceId)
            ->exists();
    }

    /**
     * @param  array<string, mixed>  $extraPayload
     */
    private function dispatchMaintenanceWorkflowNotification(
        string $notificationKey,
        string $title,
        string $message,
        VehicleMaintenanceRecord $maintenance,
        $actor,
        array $extraPayload = [],
    ): void {
        app(NotificationDispatcher::class)->dispatch(
            $notificationKey,
            function (NotificationType $type) use ($title, $message, $maintenance, $actor, $extraPayload) {
                return new MaintenanceAlertNotification(
                    $type,
                    $title,
                    $message,
                    array_merge(
                        $this->buildMaintenancePayload($maintenance),
                        [
                            'actor' => array_filter([
                                'id' => $actor?->id,
                                'name' => $actor?->name,
                            ], static fn ($value) => $value !== null),
                        ],
                        $extraPayload,
                    ),
                );
            }
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function buildMaintenancePayload(VehicleMaintenanceRecord $maintenance): array
    {
        return [
            'maintenance_id' => $maintenance->id,
            'truck_id' => $maintenance->truck_id,
            'scheduled_date' => $maintenance->scheduled_date?->toDateString(),
            'status' => $maintenance->status,
            'maintenance_type' => $maintenance->maintenanceType?->name,
        ];
    }
}

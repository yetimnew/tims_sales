<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverLocation;
use App\Models\DriverStatusHistory;
use App\Models\NotificationType;
use App\Models\Status;
use App\Models\StatusType;
use App\Notifications\DriverLifecycleNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class DriverStatusController extends Controller
{
    /**
     * Normalize legacy driver work statuses to the mobile app work-status values.
     */
    private function normalizeWorkStatus(?string $status): string
    {
        return match (strtolower((string) $status)) {
            'active' => 'available',
            'inactive' => 'off_duty',
            'available', 'on_trip', 'on_break', 'off_duty' => strtolower((string) $status),
            default => 'available',
        };
    }

    /**
     * Get the driver associated with the authenticated user
     * Uses the User->Driver relationship (user_id in drivers table)
     * Returns null if user is not a driver
     */
    private function getDriverForUser($user)
    {
        // Use the User->Driver relationship via user_id
        return $user->driver;
    }

    private function resolveStatusOptions(string $statusType): array
    {
        if ($statusType === 'work') {
            return [
                ['value' => 'available', 'label' => 'Available'],
                ['value' => 'on_trip', 'label' => 'On Trip'],
                ['value' => 'on_break', 'label' => 'On Break'],
                ['value' => 'off_duty', 'label' => 'Off Duty'],
            ];
        }

        if ($statusType === 'truck') {
            $operationalStatusType = StatusType::query()
                ->where('name', 'Operational Status')
                ->first();

            if (! $operationalStatusType) {
                return [];
            }

            return Status::query()
                ->where('statustype_id', $operationalStatusType->id)
                ->orderBy('name')
                ->get(['id', 'name', 'description'])
                ->map(static fn (Status $status): array => [
                    'id' => $status->id,
                    'value' => $status->name,
                    'label' => $status->name,
                    'description' => $status->description,
                ])
                ->all();
        }

        return [];
    }

    private function extractLocationSnapshot(Request $request): ?array
    {
        if (! $request->filled('latitude') || ! $request->filled('longitude')) {
            return null;
        }

        return [
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'accuracy' => $request->accuracy,
            'speed' => $request->speed,
            'heading' => $request->heading,
            'location_timestamp' => $request->timestamp ? now()->parse($request->timestamp) : now(),
        ];
    }

    private function persistLocationHistory(int $driverId, array $locationSnapshot): void
    {
        DriverLocation::create([
            'driver_id' => $driverId,
            'latitude' => $locationSnapshot['latitude'],
            'longitude' => $locationSnapshot['longitude'],
            'accuracy' => $locationSnapshot['accuracy'],
            'speed' => $locationSnapshot['speed'],
            'heading' => $locationSnapshot['heading'],
            'timestamp' => $locationSnapshot['location_timestamp'],
        ]);
    }

    private function shouldUpsertDailyStatus(string $statusType): bool
    {
        return $statusType === 'truck';
    }

    private function dispatchStatusUpdatedNotification($driver, $actor, DriverStatusHistory $statusHistory): void
    {
        app(NotificationDispatcher::class)->dispatch(
            NotificationType::DRIVER_STATUS_UPDATED,
            function (NotificationType $type) use ($driver, $actor, $statusHistory) {
                $identifier = trim(implode(' ', array_filter([$driver->name, $driver->driverid])));
                $message = $identifier === ''
                    ? 'A driver updated status from the mobile app.'
                    : sprintf('Driver %s updated %s status to %s.', $identifier, $statusHistory->status_type, $statusHistory->status_value);

                return new DriverLifecycleNotification(
                    $type,
                    'Driver Status Updated',
                    $message,
                    [
                        'driver_id' => $driver->id,
                        'driver_code' => $driver->driverid,
                        'name' => $driver->name,
                        'status_type' => $statusHistory->status_type,
                        'status_value' => $statusHistory->status_value,
                        'notes' => $statusHistory->notes,
                        'status_history_id' => $statusHistory->id,
                        'location' => $statusHistory->latitude !== null && $statusHistory->longitude !== null ? [
                            'latitude' => (float) $statusHistory->latitude,
                            'longitude' => (float) $statusHistory->longitude,
                            'accuracy' => $statusHistory->accuracy !== null ? (float) $statusHistory->accuracy : null,
                            'timestamp' => $statusHistory->location_timestamp?->toIso8601String(),
                        ] : null,
                        'actor' => array_filter([
                            'id' => $actor?->id,
                            'name' => $actor?->name,
                        ], static fn ($value) => $value !== null),
                    ],
                );
            }
        );
    }

    /**
     * Get status options for the mobile app.
     */
    public function options(Request $request): JsonResponse
    {
        $statusType = strtolower((string) $request->query('status_type', 'work'));

        if (! in_array($statusType, ['work', 'truck', 'trip'], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid status type.',
                'data' => [],
            ], 422);
        }

        return response()->json([
            'success' => true,
            'data' => $this->resolveStatusOptions($statusType),
        ]);
    }

    /**
     * Update driver status
     * If no status exists for today, uses driver's current status field as fallback
     */
    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'status_type' => 'required|string|in:work,truck,trip',
            'status_value' => 'required|string',
            'notes' => 'nullable|string|max:1000',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'accuracy' => 'nullable|numeric|min:0',
            'speed' => 'nullable|numeric|min:0',
            'heading' => 'nullable|numeric|between:0,360',
            'timestamp' => 'nullable|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found. Please contact administrator to link your account to a driver record.',
            ], 404);
        }

        // Get the status value - use provided value or fallback to driver's status field
        $statusValue = $request->status_value;
        
        // If status_value is empty or not provided, use driver's current status field
        if (empty($statusValue) && $request->status_type === 'work') {
            $statusValue = $this->normalizeWorkStatus($driver->status);
        }

        if ($request->status_type === 'work') {
            $statusValue = $this->normalizeWorkStatus($statusValue);
        }

        $locationSnapshot = $this->extractLocationSnapshot($request);

        if ($this->shouldUpsertDailyStatus($request->status_type)) {
            $today = now()->format('Y-m-d');
            $existingStatus = DriverStatusHistory::where('driver_id', $driver->id)
                ->where('status_type', $request->status_type)
                ->whereDate('created_at', $today)
                ->first();

            if ($existingStatus) {
                $existingStatus->update([
                    'status_value' => $statusValue,
                    'notes' => $request->notes,
                    'latitude' => $locationSnapshot['latitude'] ?? $existingStatus->latitude,
                    'longitude' => $locationSnapshot['longitude'] ?? $existingStatus->longitude,
                    'accuracy' => $locationSnapshot['accuracy'] ?? $existingStatus->accuracy,
                    'speed' => $locationSnapshot['speed'] ?? $existingStatus->speed,
                    'heading' => $locationSnapshot['heading'] ?? $existingStatus->heading,
                    'location_timestamp' => $locationSnapshot['location_timestamp'] ?? $existingStatus->location_timestamp,
                ]);
                $statusHistory = $existingStatus->fresh();
            } else {
                $statusHistory = DriverStatusHistory::create([
                    'driver_id' => $driver->id,
                    'status_type' => $request->status_type,
                    'status_value' => $statusValue,
                    'notes' => $request->notes,
                    ...($locationSnapshot ?? []),
                ]);
            }
        } else {
            $statusHistory = DriverStatusHistory::create([
                'driver_id' => $driver->id,
                'status_type' => $request->status_type,
                'status_value' => $statusValue,
                'notes' => $request->notes,
                ...($locationSnapshot ?? []),
            ]);
        }

        if ($locationSnapshot !== null) {
            $this->persistLocationHistory($driver->id, $locationSnapshot);
        }

        // Update driver's current status field if it's a work status
        if ($request->status_type === 'work') {
            $driver->update([
                'status' => $statusValue === 'off_duty' ? 'inactive' : 'active',
            ]);
        }

        $this->dispatchStatusUpdatedNotification($driver, $user, $statusHistory);

        return response()->json([
            'success' => true,
            'message' => 'Status updated successfully',
            'data' => [
                'id' => $statusHistory->id,
                'status_type' => $statusHistory->status_type,
                'status_value' => $statusHistory->status_value,
                'notes' => $statusHistory->notes,
                'created_at' => $statusHistory->created_at->toIso8601String(),
                'location' => $statusHistory->latitude !== null && $statusHistory->longitude !== null ? [
                    'latitude' => (float) $statusHistory->latitude,
                    'longitude' => (float) $statusHistory->longitude,
                    'accuracy' => $statusHistory->accuracy !== null ? (float) $statusHistory->accuracy : null,
                    'speed' => $statusHistory->speed !== null ? (float) $statusHistory->speed : null,
                    'heading' => $statusHistory->heading !== null ? (float) $statusHistory->heading : null,
                    'timestamp' => $statusHistory->location_timestamp?->toIso8601String(),
                ] : null,
            ],
        ]);
    }

    /**
     * Get current driver status (latest work status)
     * If no status history exists, falls back to driver's status field from drivers table
     */
    public function current(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
                'data' => null,
            ], 404);
        }

        $currentStatus = DriverStatusHistory::where('driver_id', $driver->id)
            ->where('status_type', 'work')
            ->orderByDesc('created_at')
            ->first();

        // If no status history exists, use driver's current status field
        if (!$currentStatus) {
            return response()->json([
                'success' => true,
                'data' => [
                    'id' => null,
                    'status_type' => 'work',
                    'status_value' => $this->normalizeWorkStatus($driver->status), // Use driver's status field
                    'notes' => null,
                    'created_at' => $driver->updated_at?->toIso8601String() ?? now()->toIso8601String(),
                    'is_default' => true, // Flag to indicate this is from driver's status field
                    'location' => null,
                ],
            ]);
        }

        return response()->json([
            'success' => true,
            'data' => [
                'id' => $currentStatus->id,
                'status_type' => $currentStatus->status_type,
                'status_value' => $currentStatus->status_value,
                'notes' => $currentStatus->notes,
                'created_at' => $currentStatus->created_at->toIso8601String(),
                'location' => $currentStatus->latitude !== null && $currentStatus->longitude !== null ? [
                    'latitude' => (float) $currentStatus->latitude,
                    'longitude' => (float) $currentStatus->longitude,
                    'accuracy' => $currentStatus->accuracy !== null ? (float) $currentStatus->accuracy : null,
                    'speed' => $currentStatus->speed !== null ? (float) $currentStatus->speed : null,
                    'heading' => $currentStatus->heading !== null ? (float) $currentStatus->heading : null,
                    'timestamp' => $currentStatus->location_timestamp?->toIso8601String(),
                ] : null,
            ],
        ]);
    }

    /**
     * Get driver status history
     */
    public function history(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (!$driver) {
            return response()->json([
                'success' => false,
                'message' => 'Driver record not found.',
                'data' => [],
            ], 404);
        }

        $statusType = $request->query('status_type'); // Optional filter
        $limit = min((int) $request->query('limit', 50), 100);

        $query = DriverStatusHistory::where('driver_id', $driver->id)
            ->orderByDesc('created_at')
            ->limit($limit);

        if ($statusType) {
            $query->where('status_type', $statusType);
        }

        $history = $query->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'status_type' => $item->status_type,
                'status_value' => $item->status_value,
                'notes' => $item->notes,
                'created_at' => $item->created_at->toIso8601String(),
                'location' => $item->latitude !== null && $item->longitude !== null ? [
                    'latitude' => (float) $item->latitude,
                    'longitude' => (float) $item->longitude,
                    'accuracy' => $item->accuracy !== null ? (float) $item->accuracy : null,
                    'speed' => $item->speed !== null ? (float) $item->speed : null,
                    'heading' => $item->heading !== null ? (float) $item->heading : null,
                    'timestamp' => $item->location_timestamp?->toIso8601String(),
                ] : null,
            ];
        });

        return response()->json([
            'success' => true,
            'data' => $history,
        ]);
    }
}

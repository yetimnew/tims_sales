<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DriverTruck;
use App\Models\EmergencyAlert;
use App\Models\NotificationType;
use App\Models\User;
use App\Notifications\EmergencyAlertNotification;
use App\Services\NotificationDispatcher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class DriverEmergencyController extends Controller
{
    public function __construct(
        private readonly NotificationDispatcher $notificationDispatcher,
    ) {}

    /**
     * Get driver for authenticated user
     */
    private function getDriverForUser(User $user)
    {
        return $user->driver;
    }

    /**
     * Send emergency alert with location
     */
    public function sendAlert(Request $request): JsonResponse
    {
        $user = $request->user();
        $driver = $this->getDriverForUser($user);

        if (! $driver) {
            return response()->json([
                'success' => false,
                'message' => 'You are not registered as a driver.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'message' => 'nullable|string|max:500',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $validator->errors(),
            ], 422);
        }

        $latitude = $request->input('latitude');
        $longitude = $request->input('longitude');
        $hasLatitude = $latitude !== null && $latitude !== '';
        $hasLongitude = $longitude !== null && $longitude !== '';

        if ($hasLatitude xor $hasLongitude) {
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => [
                    'location' => ['Latitude and longitude must both be provided, or both omitted.'],
                ],
            ], 422);
        }

        $locationMissing = ! $hasLatitude && ! $hasLongitude;

        $assignment = DriverTruck::query()
            ->where('driver_id', $driver->id)
            ->where('status', 'active')
            ->whereNull('date_detach')
            ->where('is_attached', true)
            ->latest('date_recived')
            ->first();

        $alert = DB::transaction(function () use ($request, $driver, $user, $assignment): EmergencyAlert {
            return EmergencyAlert::create([
                'driver_id' => $driver->id,
                'user_id' => $user->id,
                'truck_id' => $assignment?->truck_id,
                'driver_truck_id' => $assignment?->id,
                'alert_code' => $this->generateAlertCode(),
                'latitude' => $locationMissing ? null : (float) $latitude,
                'longitude' => $locationMissing ? null : (float) $longitude,
                'location_missing' => $locationMissing,
                'message' => $request->input('message'),
                'status' => EmergencyAlert::STATUS_PENDING,
            ]);
        });

        $alert->loadMissing(['truck:id,plate']);
        $this->notificationDispatcher->dispatch(
            NotificationType::EMERGENCY_ALERT_CREATED,
            static fn (NotificationType $type) => new EmergencyAlertNotification(
                $type,
                'Emergency Alert Received',
                sprintf(
                    'Driver %s (%s) sent an emergency alert%s.',
                    $driver->name,
                    $driver->driverid,
                    $alert->truck?->plate ? ' for truck '.$alert->truck->plate : ''
                ),
                [
                    'emergency_alert_id' => $alert->id,
                    'alert_code' => $alert->alert_code,
                    'driver_id' => $driver->id,
                    'driver_name' => $driver->name,
                    'driver_code' => $driver->driverid,
                    'truck_id' => $alert->truck_id,
                    'truck_plate' => $alert->truck?->plate,
                    'latitude' => $alert->latitude !== null ? (float) $alert->latitude : null,
                    'longitude' => $alert->longitude !== null ? (float) $alert->longitude : null,
                    'location_missing' => (bool) $alert->location_missing,
                    'message' => $alert->message,
                    'status' => $alert->status,
                    'created_at' => $alert->created_at?->toIso8601String(),
                ],
            ),
        );

        return response()->json([
            'success' => true,
            'message' => 'Emergency alert sent successfully. Help is on the way.',
            'data' => [
                'alert_id' => $alert->alert_code,
                'timestamp' => $alert->created_at?->toIso8601String(),
                'status' => $alert->status,
                'location_missing' => (bool) $alert->location_missing,
                'location' => $alert->latitude !== null && $alert->longitude !== null ? [
                    'latitude' => (float) $alert->latitude,
                    'longitude' => (float) $alert->longitude,
                ] : null,
                'driver' => [
                    'id' => $driver->id,
                    'name' => $driver->name,
                    'driverid' => $driver->driverid,
                ],
                'truck' => $alert->truck ? [
                    'id' => $alert->truck->id,
                    'plate' => $alert->truck->plate,
                ] : null,
            ],
        ]);
    }

    private function generateAlertCode(): string
    {
        return 'EMR-'.now()->format('YmdHis').'-'.strtoupper(substr((string) str()->uuid(), 0, 6));
    }
}

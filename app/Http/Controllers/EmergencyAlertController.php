<?php

namespace App\Http\Controllers;

use App\Models\Driver;
use App\Models\EmergencyAlert;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmergencyAlertController extends Controller
{
    public function index(Request $request): Response
    {
        $query = EmergencyAlert::query()
            ->with([
                'driver:id,name,driverid',
                'truck:id,plate',
                'acknowledgedBy:id,name',
                'resolvedBy:id,name',
                'falseAlarmBy:id,name',
            ])
            ->orderByRaw("
                CASE
                    WHEN status = 'pending' THEN 0
                    WHEN status = 'acknowledged' THEN 1
                    WHEN status = 'resolved' THEN 2
                    WHEN status = 'false_alarm' THEN 3
                    ELSE 4
                END
            ")
            ->orderByDesc('created_at');

        if ($request->filled('driver_id')) {
            $query->where('driver_id', (int) $request->input('driver_id'));
        }

        if ($request->filled('status')) {
            $query->where('status', (string) $request->input('status'));
        }

        if ($request->filled('from')) {
            $query->whereDate('created_at', '>=', (string) $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('created_at', '<=', (string) $request->input('to'));
        }

        $alerts = $query->paginate(20)->withQueryString()
            ->through(function (EmergencyAlert $alert): array {
                return [
                    'id' => $alert->id,
                    'alert_code' => $alert->alert_code,
                    'status' => $alert->status,
                    'message' => $alert->message,
                    'location_missing' => (bool) $alert->location_missing,
                    'latitude' => $alert->latitude !== null ? (float) $alert->latitude : null,
                    'longitude' => $alert->longitude !== null ? (float) $alert->longitude : null,
                    'created_at' => $alert->created_at?->toIso8601String(),
                    'acknowledged_at' => $alert->acknowledged_at?->toIso8601String(),
                    'resolved_at' => $alert->resolved_at?->toIso8601String(),
                    'false_alarm_at' => $alert->false_alarm_at?->toIso8601String(),
                    'resolution_notes' => $alert->resolution_notes,
                    'driver' => $alert->driver ? [
                        'id' => $alert->driver->id,
                        'name' => $alert->driver->name,
                        'driverid' => $alert->driver->driverid,
                    ] : null,
                    'truck' => $alert->truck ? [
                        'id' => $alert->truck->id,
                        'plate' => $alert->truck->plate,
                    ] : null,
                    'acknowledged_by' => $alert->acknowledgedBy?->name,
                    'resolved_by' => $alert->resolvedBy?->name,
                    'false_alarm_by' => $alert->falseAlarmBy?->name,
                ];
            });

        $drivers = Driver::query()
            ->orderBy('name')
            ->get(['id', 'name', 'driverid'])
            ->map(static fn (Driver $driver): array => [
                'id' => $driver->id,
                'name' => $driver->name,
                'driverid' => $driver->driverid,
            ])
            ->values();

        return Inertia::render('Mobile/EmergencyAlerts', [
            'alerts' => $alerts,
            'drivers' => $drivers,
            'filters' => [
                'driver_id' => $request->input('driver_id'),
                'status' => $request->input('status'),
                'from' => $request->input('from'),
                'to' => $request->input('to'),
            ],
        ]);
    }

    public function acknowledge(Request $request, EmergencyAlert $emergencyAlert): RedirectResponse
    {
        if ($emergencyAlert->status !== EmergencyAlert::STATUS_PENDING) {
            return back()->withErrors(['error' => 'Only pending emergency alerts can be acknowledged.']);
        }

        $emergencyAlert->forceFill([
            'status' => EmergencyAlert::STATUS_ACKNOWLEDGED,
            'acknowledged_at' => now(),
            'acknowledged_by_user_id' => $request->user()?->id,
        ])->save();

        return back()->with('success', 'Emergency alert acknowledged.');
    }

    public function resolve(Request $request, EmergencyAlert $emergencyAlert): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_notes' => 'nullable|string|max:1000',
        ]);

        if (in_array($emergencyAlert->status, [EmergencyAlert::STATUS_RESOLVED, EmergencyAlert::STATUS_FALSE_ALARM], true)) {
            return back()->withErrors(['error' => 'This emergency alert has already been closed.']);
        }

        $emergencyAlert->forceFill([
            'status' => EmergencyAlert::STATUS_RESOLVED,
            'resolved_at' => now(),
            'resolved_by_user_id' => $request->user()?->id,
            'resolution_notes' => $validated['resolution_notes'] ?? null,
        ])->save();

        return back()->with('success', 'Emergency alert marked as resolved.');
    }

    public function falseAlarm(Request $request, EmergencyAlert $emergencyAlert): RedirectResponse
    {
        $validated = $request->validate([
            'resolution_notes' => 'nullable|string|max:1000',
        ]);

        if (in_array($emergencyAlert->status, [EmergencyAlert::STATUS_RESOLVED, EmergencyAlert::STATUS_FALSE_ALARM], true)) {
            return back()->withErrors(['error' => 'This emergency alert has already been closed.']);
        }

        $emergencyAlert->forceFill([
            'status' => EmergencyAlert::STATUS_FALSE_ALARM,
            'false_alarm_at' => now(),
            'false_alarm_by_user_id' => $request->user()?->id,
            'resolution_notes' => $validated['resolution_notes'] ?? null,
        ])->save();

        return back()->with('success', 'Emergency alert marked as false alarm.');
    }
}

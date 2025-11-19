<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Spatie\Activitylog\Models\Activity;

abstract class Controller extends BaseController
{
    use AuthorizesRequests, ValidatesRequests;

    /**
     * Transform Spatie activity log models into frontend-friendly arrays.
     *
     * @param  Collection<int, Activity>  $logs
     * @return array<int, array<string, mixed>>
     */
    protected function transformActivityLogs(Collection $logs): array
    {
        return $logs
            ->map(function (Activity $activity): array {
                $properties = $activity->properties ?? collect();

                if (! $properties instanceof Collection) {
                    $properties = collect($properties);
                }

                $oldValues = $properties->get('old');
                $newValues = $properties->get('attributes', $properties->get('new'));

                $event = Str::lower((string) ($activity->event ?? $activity->description ?? 'activity'));
                $action = match (true) {
                    str_contains($event, 'created') => 'created',
                    str_contains($event, 'updated') => 'updated',
                    str_contains($event, 'deleted') => 'deleted',
                    default => 'activity',
                };

                return [
                    'id' => $activity->id,
                    'action' => $action,
                    'description' => $activity->description ?? Str::headline($action),
                    'user' => $activity->causer ? [
                        'name' => $activity->causer->name ?? 'System',
                    ] : null,
                    'created_at' => $activity->created_at?->toIso8601String() ?? (string) $activity->created_at,
                    'old_values' => $this->normalizeLogValues($oldValues),
                    'new_values' => $this->normalizeLogValues($newValues),
                ];
            })
            ->values()
            ->all();
    }

    /**
     * Normalize log values into plain arrays.
     */
    protected function normalizeLogValues(mixed $values): ?array
    {
        if ($values instanceof Collection) {
            return $values->toArray();
        }

        if (is_array($values)) {
            return $values;
        }

        if (is_object($values)) {
            return (array) $values;
        }

        return null;
    }
}

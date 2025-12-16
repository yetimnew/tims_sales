<?php

namespace App\Http\Controllers;

use Carbon\CarbonInterface;
use Exception;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Log;
use Spatie\Activitylog\Models\Activity;

/**
 * Base Controller for Resource Management
 *
 * This controller provides common functionality for all resource controllers.
 * Use this as a base class for consistent, professional controller implementation.
 *
 * Usage:
 *   class TruckController extends BaseResourceController
 *   {
 *       public function show(Truck $truck): Response
 *       {
 *           $logs = $this->getActivityLogs($truck);
 *           return Inertia::render('Trucks/Show', [
 *               'truck' => $truck,
 *               'activityLogs' => $logs,
 *           ]);
 *       }
 *   }
 */
abstract class BaseResourceController extends Controller
{
    /**
     * Format pagination data for Inertia response.
     *
     * Converts Laravel pagination to a format compatible with Inertia.js
     * tables and pagination components.
     *
     * @param  LengthAwarePaginator  $paginator  The paginated collection
     * @return array{data: array, meta: array, links: array}
     */
    protected function formatPagination(LengthAwarePaginator $paginator): array
    {
        $links = $paginator->linkCollection()->map(static function (array $link): array {
            $label = $link['label'];

            if (is_string($label)) {
                $label = trim(strip_tags(html_entity_decode($label)));
            }

            return [
                'url' => $link['url'],
                'label' => $label,
                'active' => (bool) $link['active'],
            ];
        })->values()->all();

        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
            'links' => $links,
        ];
    }

    /**
     * Format changes for audit logging.
     *
     * Creates a structured diff between original and updated attributes.
     *
     * @param  array<string, mixed>  $original  Original attribute values
     * @param  array<string, mixed>  $changes   Changed attribute values
     * @return array<string, array{old: mixed, new: mixed}>  Formatted changes
     */
    protected function formatChanges(array $original, array $changes): array
    {
        $formatted = [];

        foreach ($changes as $attribute => $newValue) {
            $formatted[$attribute] = [
                'old' => $original[$attribute] ?? null,
                'new' => $newValue,
            ];
        }

        return $formatted;
    }

    /**
     * Normalize attributes for comparison.
     *
     * Ensures all values in an attributes array are properly formatted
     * for comparison and logging.
     *
     * @param  array<string, mixed>  $attributes  The attributes to normalize
     * @return array<string, mixed>  Normalized attributes
     */
    protected function normalizeAttributes(array $attributes): array
    {
        foreach ($attributes as $key => $value) {
            $attributes[$key] = $this->normalizeValue($value);
        }

        return $attributes;
    }

    /**
     * Normalize a single value.
     *
     * Converts special types (Carbon, arrays, etc.) to standard formats.
     *
     * @param  mixed  $value  The value to normalize
     * @return mixed  Normalized value
     */
    protected function normalizeValue(mixed $value): mixed
    {
        if (is_array($value)) {
            foreach ($value as $key => $item) {
                $value[$key] = $this->normalizeValue($item);
            }

            return $value;
        }

        if ($value instanceof CarbonInterface) {
            return $value->toIso8601String();
        }

        return $value;
    }

    /**
     * Get activity logs for a model.
     *
     * Retrieves and transforms activity logs for a specific model instance.
     *
     * @param  mixed  $model  The model to get logs for
     * @param  int    $limit  Maximum number of logs to retrieve
     * @return array  Transformed activity logs
     */
    protected function getActivityLogs(mixed $model, int $limit = 50): array
    {
        try {
            $logs = Activity::forSubject($model)
                ->with('causer')
                ->latest()
                ->limit($limit)
                ->get();

            return $this->transformActivityLogs($logs);
        } catch (Exception $e) {
            Log::warning('Failed to retrieve activity logs', [
                'model' => get_class($model),
                'model_id' => $model->id ?? null,
                'error' => $e->getMessage(),
            ]);

            return [];
        }
    }

    /**
     * Transform activity logs for frontend display.
     *
     * Format: [
     *     'id' => int,
     *     'description' => string,
     *     'causer' => ['id' => int, 'name' => string],
     *     'properties' => array,
     *     'created_at' => string (ISO 8601),
     * ]
     *
     * @param  \Illuminate\Database\Eloquent\Collection  $logs  Activity logs
     * @return array  Transformed logs
     */
    protected function transformActivityLogs($logs): array
    {
        return $logs->map(function (Activity $log) {
            return [
                'id' => $log->id,
                'description' => $log->description,
                'causer' => $log->causer ? [
                    'id' => $log->causer->id,
                    'name' => $log->causer->name ?? 'System',
                ] : null,
                'properties' => $log->properties?->toArray() ?? [],
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        })->values()->all();
    }

    /**
     * Parse a value to Carbon instance.
     *
     * Safely converts string/Carbon/null values to Carbon instances.
     *
     * @param  null|string|Carbon  $value  The value to parse
     * @return null|Carbon  Parsed Carbon instance or null
     */
    protected function toCarbon(null|string|Carbon $value): ?Carbon
    {
        if ($value instanceof Carbon) {
            return $value;
        }

        if ($value === null || $value === '') {
            return null;
        }

        try {
            return Carbon::parse($value);
        } catch (Exception) {
            return null;
        }
    }

    /**
     * Log an error with context.
     *
     * Provides consistent error logging across all controllers.
     *
     * @param  string  $action     The action being performed (store, update, delete, etc)
     * @param  string  $resource   The resource type
     * @param  Exception|string  $error  The error message or exception
     * @param  array  $context    Additional context data
     * @return void
     */
    protected function logError(string $action, string $resource, Exception|string $error, array $context = []): void
    {
        $message = $error instanceof Exception ? $error->getMessage() : $error;

        Log::error("{$action} {$resource} failed", array_merge([
            'action' => $action,
            'resource' => $resource,
            'error' => $message,
        ], $context));
    }

    /**
     * Log a successful action.
     *
     * Provides consistent success logging across all controllers.
     *
     * @param  string  $action     The action being performed
     * @param  string  $resource   The resource type
     * @param  array   $context    Additional context data
     * @return void
     */
    protected function logSuccess(string $action, string $resource, array $context = []): void
    {
        Log::info("{$action} {$resource} successful", array_merge([
            'action' => $action,
            'resource' => $resource,
        ], $context));
    }
}


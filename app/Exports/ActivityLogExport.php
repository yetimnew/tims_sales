<?php

namespace App\Exports;

use App\Support\ActivityLogQueryBuilder;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use JsonException;
use Maatwebsite\Excel\Concerns\Exportable;
use Maatwebsite\Excel\Concerns\FromQuery;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Spatie\Activitylog\Models\Activity;

class ActivityLogExport implements FromQuery, WithHeadings, WithMapping
{
    use Exportable;

    /**
     * @param  array<string, mixed>  $filters
     * @param  array<string, mixed>  $sort
     */
    public function __construct(private array $filters = [], private array $sort = []) {}

    public function query(): Builder
    {
        return ActivityLogQueryBuilder::build($this->filters, $this->sort);
    }

    public function headings(): array
    {
        return [
            'ID',
            'Timestamp',
            'Log Name',
            'Event',
            'Description',
            'Causer',
            'Subject Type',
            'Subject ID',
            'Old Values',
            'New Values',
        ];
    }

    /**
     * @param  Activity  $activity
     * @return array<int, mixed>
     */
    public function map($activity): array
    {
        $properties = $activity->properties ?? collect();

        if (! $properties instanceof Collection) {
            $properties = collect($properties);
        }

        $oldValues = $properties->get('old_values', $properties->get('old'));
        $newValues = $properties->get('attributes', $properties->get('new_values', $properties->get('new')));

        return [
            $activity->id,
            $activity->created_at?->toDateTimeString(),
            $activity->log_name,
            $activity->event ?? $activity->description,
            $activity->description,
            $activity->causer?->name ?? $activity->getAttribute('causer_name') ?? 'System',
            $activity->subject_type,
            $activity->subject_id ? (string) $activity->subject_id : null,
            $this->stringifyValues($oldValues),
            $this->stringifyValues($newValues),
        ];
    }

    private function stringifyValues(mixed $values): ?string
    {
        if ($values === null) {
            return null;
        }

        if ($values instanceof Collection) {
            $values = $values->toArray();
        }

        if (is_string($values)) {
            return $values;
        }

        if (is_scalar($values)) {
            return (string) $values;
        }

        if (is_array($values)) {
            try {
                return json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
            } catch (JsonException) {
                return null;
            }
        }

        try {
            return json_encode($values, JSON_THROW_ON_ERROR | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        } catch (JsonException) {
            return null;
        }
    }
}

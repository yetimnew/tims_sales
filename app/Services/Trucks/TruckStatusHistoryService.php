<?php

namespace App\Services\Trucks;

use App\Models\DailyTruckStatus;
use App\Models\Truck;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

class TruckStatusHistoryService
{
    private const DEFAULT_WINDOW_DAYS = 30;

    /**
     * Build a recent status history summary for the given truck.
     *
     * @return array{
     *     history: array<int, array<string, mixed>>,
     *     summary: array<string, mixed>
     * }
     */
    public function recentForTruck(Truck $truck, int $days = self::DEFAULT_WINDOW_DAYS): array
    {
        $windowDays = $days > 0 ? $days : self::DEFAULT_WINDOW_DAYS;

        $windowEnd = Carbon::today();
        $windowStart = (clone $windowEnd)->subDays($windowDays - 1);

        $records = DailyTruckStatus::query()
            ->with([
                'status:id,name,statustype_id',
                'status.statusType:id,name',
                'changedBy:id,name',
            ])
            ->where('truck_id', $truck->getKey())
            ->whereDate('status_date', '>=', $windowStart->toDateString())
            ->orderByDesc('status_date')
            ->orderByDesc('created_at')
            ->get([
                'id',
                'truck_id',
                'status_id',
                'status_date',
                'notes',
                'changed_by',
                'created_at',
                'updated_at',
            ]);

        $history = $records
            ->map(static function (DailyTruckStatus $record): array {
                $statusDate = $record->getAttribute('status_date');

                return [
                    'id' => $record->getKey(),
                    'status_id' => $record->getAttribute('status_id'),
                    'status' => $record->relationLoaded('status') && $record->status ? [
                        'id' => $record->status->getKey(),
                        'name' => $record->status->getAttribute('name'),
                        'statustype_id' => $record->status->getAttribute('statustype_id'),
                        'status_type' => $record->status->relationLoaded('statusType') && $record->status->statusType ? [
                            'id' => $record->status->statusType->getKey(),
                            'name' => $record->status->statusType->getAttribute('name'),
                        ] : null,
                    ] : null,
                    'status_date' => $statusDate instanceof Carbon ? $statusDate->toDateString() : (string) $statusDate,
                    'notes' => $record->getAttribute('notes'),
                    'changed_at' => $record->getAttribute('updated_at') instanceof Carbon
                        ? $record->getAttribute('updated_at')->toIso8601String()
                        : ($record->getAttribute('updated_at') ? (string) $record->getAttribute('updated_at') : null),
                    'changed_by' => $record->relationLoaded('changedBy') && $record->changedBy ? [
                        'id' => $record->changedBy->getKey(),
                        'name' => $record->changedBy->getAttribute('name'),
                    ] : null,
                ];
            })
            ->values()
            ->all();

        $statusCounts = $this->buildStatusCounts($records);

        $summary = [
            'window_start' => $windowStart->toDateString(),
            'window_end' => $windowEnd->toDateString(),
            'window_days' => $windowDays,
            'total_records' => count($history),
            'days_with_status' => $records
                ->pluck('status_date')
                ->filter()
                ->map(static fn ($value) => $value instanceof Carbon ? $value->toDateString() : (string) $value)
                ->unique()
                ->count(),
            'distinct_statuses' => count($statusCounts),
            'current_status' => $records->first()?->status?->name,
            'current_status_changed_at' => $records->first()?->updated_at?->toIso8601String(),
            'status_counts' => $statusCounts,
        ];

        return [
            'history' => $history,
            'summary' => $summary,
        ];
    }

    /**
     * @param  Collection<int, DailyTruckStatus>  $records
     * @return array<int, array<string, mixed>>
     */
    private function buildStatusCounts(Collection $records): array
    {
        $total = max($records->count(), 1);

        return $records
            ->groupBy('status_id')
            ->map(static function (Collection $group): array {
                /** @var DailyTruckStatus|null $first */
                $first = $group->first();

                return [
                    'status_id' => $first?->getAttribute('status_id'),
                    'status_name' => $first?->status?->getAttribute('name'),
                    'status_type' => $first?->status?->statusType?->getAttribute('name'),
                    'occurrences' => $group->count(),
                ];
            })
            ->sortByDesc(static fn (array $entry): int => $entry['occurrences'])
            ->values()
            ->map(static function (array $entry) use ($total): array {
                $occurrences = (int) ($entry['occurrences'] ?? 0);

                return array_merge($entry, [
                    'percentage' => $total > 0 ? round(($occurrences / $total) * 100, 1) : 0.0,
                ]);
            })
            ->all();
    }
}

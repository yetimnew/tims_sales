<?php

namespace App\Services;

use App\Models\DriverTruck;
use App\Models\DriverTruckGradeSnapshot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use JsonException;

class DriverTruckGradeSnapshotService
{
    public function __construct(private readonly DriverTruckGradeService $grader) {}

    public function recalculateSnapshot(string $snapshotDate, ?string $status = null, ?string $attachmentState = null, ?int $userId = null): int
    {
        $resolvedSnapshotDate = Carbon::parse($snapshotDate)->toDateString();
        $calculatedAt = Carbon::now();
        $filterIsAttached = $this->normalizeAttachmentState($attachmentState);

        $assignmentQuery = DriverTruck::query()
            ->select(['id', 'driver_id', 'truck_id', 'status', 'is_attached'])
            ->whereNull('deleted_at')
            ->when($status, static fn (Builder $query, string $value) => $query->where('status', $value))
            ->when($filterIsAttached !== null, static function (Builder $query) use ($filterIsAttached): void {
                $query->where('is_attached', $filterIsAttached);
            })
            ->orderBy('id');

        $inserted = 0;

        DB::transaction(function () use ($assignmentQuery, $resolvedSnapshotDate, $status, $filterIsAttached, $userId, $calculatedAt, &$inserted) {
            $deleteQuery = $this->applySnapshotFilters(DriverTruckGradeSnapshot::query(), $resolvedSnapshotDate, $status, $filterIsAttached);
            $deleteQuery->delete();

            $assignmentQuery->chunkById(100, function ($chunk) use ($resolvedSnapshotDate, $status, $filterIsAttached, $userId, $calculatedAt, &$inserted) {
                $grades = $this->grader->gradeMany($chunk);
                $batch = [];

                foreach ($chunk as $assignment) {
                    $grade = $grades->get($assignment->id);

                    if (! $grade) {
                        continue;
                    }

                    // Skip assignments with insufficient data - only store graded entities in snapshots
                    if (($grade['status'] ?? null) === 'insufficient_data') {
                        continue;
                    }

                    $batch[] = $this->normalizeSnapshotPayload([
                        'snapshot_date' => $resolvedSnapshotDate,
                        'driver_truck_id' => $assignment->id,
                        'driver_id' => $assignment->driver_id,
                        'truck_id' => $assignment->truck_id,
                        'status' => $assignment->status,
                        'is_attached' => (bool) $assignment->is_attached,
                        'filter_status' => $status,
                        'filter_is_attached' => $filterIsAttached,
                        'overall_score' => $grade['overall']['score'] ?? 0,
                        'overall_letter' => $grade['overall']['letter'] ?? 'E',
                        'weights' => $grade['weights'] ?? [],
                        'categories' => $grade['categories'] ?? null,
                        'metrics' => $grade['metrics'] ?? null,
                        'grade_thresholds' => $grade['grade_thresholds'] ?? null,
                        'calculated_at' => $calculatedAt,
                        'calculated_by' => $userId,
                        'created_at' => $calculatedAt,
                        'updated_at' => $calculatedAt,
                    ]);

                    if (count($batch) >= 200) {
                        DriverTruckGradeSnapshot::query()->insert($batch);
                        $inserted += count($batch);
                        $batch = [];
                    }
                }

                if ($batch !== []) {
                    DriverTruckGradeSnapshot::query()->insert($batch);
                    $inserted += count($batch);
                }
            });
        });

        return $inserted;
    }

    public function distinctFilterSets(): Collection
    {
        return DriverTruckGradeSnapshot::query()
            ->select(['snapshot_date', 'filter_status', 'filter_is_attached'])
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->get()
            ->map(static fn (DriverTruckGradeSnapshot $snapshot) => [
                'snapshot_date' => Carbon::parse($snapshot->snapshot_date)->toDateString(),
                'status' => $snapshot->filter_status,
                'attachment_state' => match ($snapshot->filter_is_attached) {
                    true => 'attached',
                    false => 'detached',
                    default => null,
                },
            ])
            ->values();
    }

    private function applySnapshotFilters(Builder $query, string $snapshotDate, ?string $status, ?bool $isAttached): Builder
    {
        $query->whereDate('snapshot_date', $snapshotDate);

        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
        }

        if ($isAttached !== null) {
            $query->where('filter_is_attached', $isAttached);
        } else {
            $query->whereNull('filter_is_attached');
        }

        return $query;
    }

    private function normalizeSnapshotPayload(array $payload): array
    {
        foreach (['weights', 'categories', 'metrics', 'grade_thresholds'] as $jsonKey) {
            if (! array_key_exists($jsonKey, $payload)) {
                continue;
            }

            $value = $payload[$jsonKey];

            if ($value === null || is_string($value)) {
                continue;
            }

            try {
                $payload[$jsonKey] = json_encode($value, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                $payload[$jsonKey] = json_encode($value);
            }
        }

        return $payload;
    }

    private function normalizeAttachmentState(?string $value): ?bool
    {
        if ($value === null) {
            return null;
        }

        $normalized = strtolower(trim($value));

        return match ($normalized) {
            'attached' => true,
            'detached' => false,
            default => null,
        };
    }
}

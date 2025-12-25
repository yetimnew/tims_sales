<?php

namespace App\Services;

use App\Models\Driver;
use App\Models\DriverGradeSnapshot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use JsonException;

class DriverGradeSnapshotService
{
    public function __construct(private readonly DriverGradeService $driverGrade) {}

    public function recalculateSnapshot(string $snapshotDate, ?string $status = null, ?int $userId = null): int
    {
        $resolvedSnapshotDate = Carbon::parse($snapshotDate)->toDateString();
        $calculatedAt = Carbon::now();

        $driverQuery = Driver::query()
            ->select(['id', 'status'])
            ->whereNull('deleted_at')
            ->when($status, static fn (Builder $query, string $value) => $query->where('status', $value))
            ->orderBy('id');

        $inserted = 0;

        DB::transaction(function () use ($driverQuery, $resolvedSnapshotDate, $status, $userId, $calculatedAt, &$inserted) {
            $deleteQuery = $this->applySnapshotFilters(DriverGradeSnapshot::query(), $resolvedSnapshotDate, $status);
            $deleteQuery->delete();

            $driverQuery->chunkById(100, function ($chunk) use ($resolvedSnapshotDate, $status, $userId, $calculatedAt, &$inserted) {
                $grades = $this->driverGrade->gradeMany($chunk);
                $batch = [];

                foreach ($chunk as $driver) {
                    $grade = $grades->get($driver->id);
                    if (! $grade) {
                        continue;
                    }

                    // Skip drivers with insufficient data - only store graded entities in snapshots
                    if (($grade['status'] ?? null) === 'insufficient_data') {
                        continue;
                    }

                    $batch[] = $this->normalizeSnapshotPayload([
                        'snapshot_date' => $resolvedSnapshotDate,
                        'driver_id' => $driver->id,
                        'status' => $driver->status,
                        'filter_status' => $status,
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
                        DriverGradeSnapshot::query()->insert($batch);
                        $inserted += count($batch);
                        $batch = [];
                    }
                }

                if ($batch !== []) {
                    DriverGradeSnapshot::query()->insert($batch);
                    $inserted += count($batch);
                }
            });
        });

        return $inserted;
    }

    public function distinctFilterSets(): Collection
    {
        return DriverGradeSnapshot::query()
            ->select(['snapshot_date', 'filter_status'])
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->get()
            ->map(static fn (DriverGradeSnapshot $snapshot) => [
                'snapshot_date' => Carbon::parse($snapshot->snapshot_date)->toDateString(),
                'status' => $snapshot->filter_status,
            ])
            ->values();
    }

    private function applySnapshotFilters(Builder $query, string $snapshotDate, ?string $status): Builder
    {
        $query->whereDate('snapshot_date', $snapshotDate);
        if ($status !== null) {
            $query->where('filter_status', $status);
        } else {
            $query->whereNull('filter_status');
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
}

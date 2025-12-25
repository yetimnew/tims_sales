<?php

namespace App\Services;

use App\Models\Truck;
use App\Models\TruckGradeSnapshot;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use JsonException;

class TruckGradeSnapshotService
{
    public function __construct(private readonly TruckGradeService $truckGrade) {}

    public function recalculateSnapshot(
        string $snapshotDate,
        ?int $vehicleTypeId = null,
        ?string $status = null,
        ?int $userId = null,
    ): int {
        $resolvedSnapshotDate = Carbon::parse($snapshotDate)->toDateString();
        $calculatedAt = Carbon::now();

        $truckQuery = Truck::query()
            ->select(['id', 'vehicletype_id', 'status'])
            ->when($vehicleTypeId, static fn (Builder $query, int $id) => $query->where('vehicletype_id', $id))
            ->when($status, static fn (Builder $query, string $value) => $query->where('status', $value))
            ->orderBy('id');

        $inserted = 0;

        DB::transaction(function () use ($truckQuery, $resolvedSnapshotDate, $vehicleTypeId, $status, $userId, $calculatedAt, &$inserted) {
            $deleteQuery = $this->applySnapshotFilters(
                TruckGradeSnapshot::query(),
                $resolvedSnapshotDate,
                $vehicleTypeId,
                $status,
            );

            $deleteQuery->delete();

            $truckQuery->chunkById(100, function ($chunk) use ($resolvedSnapshotDate, $vehicleTypeId, $status, $userId, $calculatedAt, &$inserted) {
                $grades = $this->truckGrade->gradeMany($chunk);

                $batch = [];

                foreach ($chunk as $truck) {
                    $grade = $grades->get($truck->id);

                    if (! $grade) {
                        continue;
                    }

                    // Skip trucks with insufficient data - only store graded entities in snapshots
                    if (($grade['status'] ?? null) === 'insufficient_data') {
                        continue;
                    }

                    $batch[] = $this->normalizeSnapshotPayload([
                        'snapshot_date' => $resolvedSnapshotDate,
                        'truck_id' => $truck->id,
                        'vehicle_type_id' => $truck->vehicletype_id,
                        'status' => $truck->status,
                        'filter_vehicle_type_id' => $vehicleTypeId,
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
                        TruckGradeSnapshot::query()->insert($batch);
                        $inserted += count($batch);
                        $batch = [];
                    }
                }

                if ($batch !== []) {
                    TruckGradeSnapshot::query()->insert($batch);
                    $inserted += count($batch);
                }
            });
        });

        return $inserted;
    }

    public function distinctFilterSets(): Collection
    {
        return TruckGradeSnapshot::query()
            ->select(['snapshot_date', 'filter_vehicle_type_id', 'filter_status'])
            ->distinct()
            ->orderByDesc('snapshot_date')
            ->get()
            ->map(static fn (TruckGradeSnapshot $snapshot) => [
                'snapshot_date' => Carbon::parse($snapshot->snapshot_date)->toDateString(),
                'vehicle_type_id' => $snapshot->filter_vehicle_type_id,
                'status' => $snapshot->filter_status,
            ])
            ->values();
    }

    private function applySnapshotFilters(
        Builder $query,
        string $snapshotDate,
        ?int $vehicleTypeId,
        ?string $status,
    ): Builder {
        $query->whereDate('snapshot_date', $snapshotDate);

        if ($vehicleTypeId !== null) {
            $query->where('filter_vehicle_type_id', $vehicleTypeId);
        } else {
            $query->whereNull('filter_vehicle_type_id');
        }

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

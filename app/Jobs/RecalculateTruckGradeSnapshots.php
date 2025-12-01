<?php

namespace App\Jobs;

use App\Services\TruckGradeSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class RecalculateTruckGradeSnapshots implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $filterSets
     */
    public function __construct(
        private readonly array $filterSets = [],
        private readonly ?int $userId = null,
    ) {}

    public function handle(TruckGradeSnapshotService $snapshots): void
    {
        $filters = $this->filterSets;

        if ($filters === []) {
            $filters = $snapshots->distinctFilterSets()->all();
        }

        if ($filters === []) {
            $filters = [[
                'snapshot_date' => Carbon::now()->toDateString(),
                'vehicle_type_id' => null,
                'status' => null,
            ]];
        }

        foreach ($filters as $filter) {
            $snapshotDate = Arr::get($filter, 'snapshot_date');

            if (! $snapshotDate) {
                continue;
            }

            $vehicleTypeId = Arr::has($filter, 'vehicle_type_id')
                ? $this->castNullableInt($filter['vehicle_type_id'])
                : null;

            $status = Arr::has($filter, 'status') ? $this->castNullableString($filter['status']) : null;

            $snapshots->recalculateSnapshot(
                $snapshotDate,
                $vehicleTypeId,
                $status,
                $this->userId,
            );
        }
    }

    private function castNullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $int = (int) $value;

        return $int > 0 ? $int : null;
    }

    private function castNullableString(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $trimmed = trim((string) $value);

        return $trimmed === '' ? null : $trimmed;
    }
}

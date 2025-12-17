<?php

namespace App\Jobs;

use App\Services\DriverTruckGradeSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;

class RecalculateDriverTruckGradeSnapshots implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, array<string, mixed>>  $filterSets
     */
    public function __construct(
        private readonly array $filterSets = [],
        private readonly ?int $userId = null,
    ) {}

    public function handle(DriverTruckGradeSnapshotService $snapshots): void
    {
        $filters = $this->filterSets;

        if ($filters === []) {
            $filters = $snapshots->distinctFilterSets()->all();
        }

        if ($filters === []) {
            $filters = [[
                'snapshot_date' => Carbon::now()->toDateString(),
                'status' => null,
                'attachment_state' => null,
            ]];
        }

        foreach ($filters as $filter) {
            $snapshotDate = Arr::get($filter, 'snapshot_date');

            if (! $snapshotDate) {
                continue;
            }

            $status = Arr::has($filter, 'status') ? $this->castNullableString($filter['status']) : null;
            $attachmentState = Arr::has($filter, 'attachment_state') ? $this->castNullableString($filter['attachment_state']) : null;

            $snapshots->recalculateSnapshot(
                $snapshotDate,
                $status,
                $attachmentState,
                $this->userId,
            );
        }
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

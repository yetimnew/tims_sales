<?php

namespace App\Jobs;

use App\Models\DriverGradeSnapshot;
use App\Services\DriverGradeSnapshotService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Carbon;

class RecalculateDriverGradeSnapshots implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param  array<int, array{snapshot_date:string,status:?string}>  $filterSets
     */
    public function __construct(
        private readonly array $filterSets = [],
        private readonly ?int $userId = null,
    ) {}

    public function handle(DriverGradeSnapshotService $snapshots): void
    {
        $filters = $this->filterSets;

        if ($filters === []) {
            $filters = DriverGradeSnapshot::query()
                ->select(['snapshot_date', 'filter_status'])
                ->distinct()
                ->orderByDesc('snapshot_date')
                ->get()
                ->map(static fn (DriverGradeSnapshot $s) => [
                    'snapshot_date' => $s->snapshot_date->toDateString(),
                    'status' => $s->filter_status,
                ])
                ->values()
                ->all();
        }

        if ($filters === []) {
            $filters = [[
                'snapshot_date' => Carbon::now()->toDateString(),
                'status' => null,
            ]];
        }

        foreach ($filters as $filter) {
            $snapshotDate = (string) ($filter['snapshot_date'] ?? Carbon::now()->toDateString());
            $status = $filter['status'] ?? null;

            $snapshots->recalculateSnapshot(
                $snapshotDate,
                $status,
                $this->userId,
            );
        }
    }
}

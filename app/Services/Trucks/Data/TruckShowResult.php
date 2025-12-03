<?php

namespace App\Services\Trucks\Data;

use Illuminate\Support\Collection;

final class TruckShowResult
{
    /**
     * @param  array<string, mixed>  $truck
     * @param  Collection<int, mixed>  $activityLogs
     * @param  array<string, int>  $counts
     * @param  array<string, mixed>  $performanceSummary
     * @param  array<string, mixed>  $maintenanceSummary
     * @param  array<string, mixed>|null  $gradeReport
     */
    public function __construct(
        public readonly array $truck,
        public readonly Collection $activityLogs,
        public readonly array $counts,
        public readonly array $performanceSummary,
        public readonly array $maintenanceSummary,
        public readonly ?array $gradeReport,
    ) {}

    /**
     * @param  callable(Collection<int, mixed>): array<int, array<string, mixed>>  $activityTransformer
     * @return array<string, mixed>
     */
    public function toInertiaPayload(callable $activityTransformer): array
    {
        return [
            'truck' => $this->truck,
            'activityLogs' => $activityTransformer($this->activityLogs),
            'counts' => $this->counts,
            'performanceSummary' => $this->performanceSummary,
            'maintenanceSummary' => $this->maintenanceSummary,
            'gradeReport' => $this->gradeReport,
        ];
    }
}

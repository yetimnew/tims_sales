<?php

namespace App\Services\Trucks\Data;

final class TruckPerformanceSummary
{
    /**
     * @param  array<int, array<string, mixed>>  $recentRecords
     * @param  array<string, mixed>  $summary
     */
    public function __construct(
        public readonly array $recentRecords,
        public readonly array $summary,
    ) {}

    public function totalRecords(): int
    {
        return (int) ($this->summary['total_records'] ?? 0);
    }

    public function completedTrips(): int
    {
        return (int) ($this->summary['completed_trips'] ?? 0);
    }

    public function openTrips(): int
    {
        return (int) ($this->summary['open_trips'] ?? 0);
    }
}

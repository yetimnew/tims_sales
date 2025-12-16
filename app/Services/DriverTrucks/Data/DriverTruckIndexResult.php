<?php

namespace App\Services\DriverTrucks\Data;

final class DriverTruckIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}  $driverTrucks
     * @param  array<string, mixed>  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $statusOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $driverTrucks,
        public readonly array $metrics,
        public readonly array $filters,
        public readonly array $statusOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'driverTrucks' => $this->driverTrucks,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'statusOptions' => $this->statusOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

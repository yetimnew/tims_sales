<?php

namespace App\Services\FuelRecords\Data;

final class FuelRecordIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}  $fuelRecords
     * @param  array<string, mixed>  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $fuelTypeOptions
     * @param  array<int, array{id: int, plate: string}>  $truckOptions
     * @param  array<int, array{id: int, name: string}>  $driverOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $fuelRecords,
        public readonly array $metrics,
        public readonly array $filters,
        public readonly array $fuelTypeOptions,
        public readonly array $truckOptions,
        public readonly array $driverOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'fuelRecords' => $this->fuelRecords,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'fuelTypeOptions' => $this->fuelTypeOptions,
            'truckOptions' => $this->truckOptions,
            'driverOptions' => $this->driverOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

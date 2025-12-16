<?php

namespace App\Services\VehicleTypes\Data;

final class VehicleTypeIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}  $vehicleTypes
     * @param  array<string, mixed>  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $vehicleTypes,
        public readonly array $metrics,
        public readonly array $filters,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'vehicleTypes' => $this->vehicleTypes,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

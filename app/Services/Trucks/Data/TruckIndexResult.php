<?php

namespace App\Services\Trucks\Data;

final class TruckIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}  $trucks
     * @param  array<string, mixed>|null  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $statusOptions
     * @param  array<int, array{id: int, name: string}>  $vehicleTypes
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $trucks,
        public readonly ?array $metrics,
        public readonly array $filters,
        public readonly array $statusOptions,
        public readonly array $vehicleTypes,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'trucks' => $this->trucks,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'statusOptions' => $this->statusOptions,
            'vehicleTypes' => $this->vehicleTypes,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

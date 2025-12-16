<?php

namespace App\Services\Drivers\Data;

final class DriverIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}  $drivers
     * @param  array<string, mixed>|null  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $statusOptions
     * @param  array<int, array{label: string, value: string}>  $genderOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $drivers,
        public readonly ?array $metrics,
        public readonly array $filters,
        public readonly array $statusOptions,
        public readonly array $genderOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'drivers' => $this->drivers,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'statusOptions' => $this->statusOptions,
            'genderOptions' => $this->genderOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

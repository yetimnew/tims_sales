<?php

namespace App\Services\CargoTypes\Data;

final class CargoTypeIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}  $cargoTypes
     * @param  array<string, mixed>  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $categoryOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $cargoTypes,
        public readonly array $metrics,
        public readonly array $filters,
        public readonly array $categoryOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'cargoTypes' => $this->cargoTypes,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'categoryOptions' => $this->categoryOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

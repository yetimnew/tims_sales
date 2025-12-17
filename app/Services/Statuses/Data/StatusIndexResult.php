<?php

namespace App\Services\Statuses\Data;

final class StatusIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, meta: array<string, mixed>, links: array<int, array<string, mixed>>}  $statuses
     * @param  array<string, mixed>|null  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{id: int, name: string}>  $statusTypeOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $statuses,
        public readonly ?array $metrics,
        public readonly array $filters,
        public readonly array $statusTypeOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'statuses' => $this->statuses,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'statusTypeOptions' => $this->statusTypeOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

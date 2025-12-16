<?php

namespace App\Services\DriverSafety\Data;

final class DriverSafetyIndexResult
{
    /**
     * @param  array{data: array<int, array<string, mixed>>, current_page: int, last_page: int, per_page: int, total: int, from: ?int, to: ?int, links: array<int, array<string, mixed>>}  $safetyRecords
     * @param  array<string, mixed>  $metrics
     * @param  array<string, string|int|null>  $filters
     * @param  array<int, array{label: string, value: string}>  $incidentTypeOptions
     * @param  array<int, array{label: string, value: string}>  $severityOptions
     * @param  array<int, array{id: int, name: string}>  $driverOptions
     * @param  array<int, int>  $perPageOptions
     */
    public function __construct(
        public readonly array $safetyRecords,
        public readonly array $metrics,
        public readonly array $filters,
        public readonly array $incidentTypeOptions,
        public readonly array $severityOptions,
        public readonly array $driverOptions,
        public readonly array $perPageOptions,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toInertia(): array
    {
        return [
            'safetyRecords' => $this->safetyRecords,
            'metrics' => $this->metrics,
            'filters' => $this->filters,
            'incidentTypeOptions' => $this->incidentTypeOptions,
            'severityOptions' => $this->severityOptions,
            'driverOptions' => $this->driverOptions,
            'perPageOptions' => $this->perPageOptions,
        ];
    }
}

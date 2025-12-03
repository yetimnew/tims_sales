<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class PerformanceAllRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.performance-all.view') || $user->can('reports.performance-all.export');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date', 'before_or_equal:to'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'driver_ids' => ['nullable', 'array'],
            'driver_ids.*' => ['integer', 'exists:drivers,id'],
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', 'exists:trucks,id'],
            'operation_ids' => ['nullable', 'array'],
            'operation_ids.*' => ['integer', 'exists:operations,id'],
            'destination_ids' => ['nullable', 'array'],
            'destination_ids.*' => ['integer', 'exists:places,id'],
            'limit' => ['nullable', 'integer', 'min:50', 'max:5000'],
            'format' => ['sometimes', 'in:csv,xlsx,pdf'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $driverIds = $this->normaliseIds($this->input('driver_ids'));
        $truckIds = $this->normaliseIds($this->input('truck_ids'));
        $operationIds = $this->normaliseIds($this->input('operation_ids'));
        $destinationIds = $this->normaliseIds($this->input('destination_ids'));

        $this->merge([
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
            'driver_ids' => $driverIds,
            'truck_ids' => $truckIds,
            'operation_ids' => $operationIds,
            'destination_ids' => $destinationIds,
            'limit' => $this->filled('limit') ? (int) $this->input('limit') : null,
        ]);
    }

    private function normaliseIds(mixed $value): array
    {
        return collect(Arr::wrap($value))
            ->filter(static fn ($id) => $id !== null && $id !== '')
            ->map(static fn ($id) => (int) $id)
            ->filter(static fn ($id) => $id > 0)
            ->unique()
            ->values()
            ->all();
    }
}

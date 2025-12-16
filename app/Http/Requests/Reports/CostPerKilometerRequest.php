<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class CostPerKilometerRequest extends FormRequest
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

        return $user->can('reports.cost-per-kilometer.view') || $user->can('reports.cost-per-kilometer.export');
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
            'truck_ids' => ['nullable', 'array'],
            'truck_ids.*' => ['integer', 'exists:trucks,id'],
            'driver_ids' => ['nullable', 'array'],
            'driver_ids.*' => ['integer', 'exists:drivers,id'],
            'group_by' => ['nullable', 'string', 'in:overall,truck,driver,route'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $truckIds = $this->normaliseIds($this->input('truck_ids'));
        $driverIds = $this->normaliseIds($this->input('driver_ids'));

        $this->merge([
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
            'truck_ids' => $truckIds,
            'driver_ids' => $driverIds,
            'group_by' => $this->filled('group_by') ? $this->input('group_by') : 'overall',
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


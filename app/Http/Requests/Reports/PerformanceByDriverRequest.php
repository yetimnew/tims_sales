<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class PerformanceByDriverRequest extends FormRequest
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

        return $user->can('reports.performance-by-driver.view') || $user->can('reports.performance-by-driver.export');
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
            'format' => ['sometimes', 'in:csv,xlsx,pdf'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $driverIds = collect(Arr::wrap($this->input('driver_ids')))
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->unique()
            ->values()
            ->all();

        $this->merge([
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
            'driver_ids' => $driverIds,
        ]);
    }
}

<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CapacityPlanningRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.capacity-planning.view') || $user->can('reports.capacity-planning.export');
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'format' => ['nullable', Rule::in(['csv', 'xlsx'])],
        ];
    }

    public function messages(): array
    {
        return [
            'to.after_or_equal' => 'The end date must be on or after the start date.',
        ];
    }

    protected function prepareForValidation(): void
    {
        // Set default dates if not provided (last 90 days)
        if (! $this->has('from') || ! $this->input('from')) {
            $this->merge([
                'from' => now()->subDays(89)->format('Y-m-d'),
            ]);
        }

        if (! $this->has('to') || ! $this->input('to')) {
            $this->merge([
                'to' => now()->format('Y-m-d'),
            ]);
        }
    }
}


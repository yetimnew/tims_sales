<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class PerformanceByStatusRequest extends FormRequest
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

        return $user->can('reports.performance-by-status.view');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'date' => ['nullable', 'date'],
            'status_ids' => ['nullable', 'array'],
            'status_ids.*' => ['integer'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $statusIds = collect($this->input('status_ids', []))
            ->filter(static fn ($value) => $value !== null && $value !== '')
            ->map(static fn ($value) => (int) $value)
            ->filter(static fn ($value) => $value > 0)
            ->unique()
            ->values()
            ->all();

        $this->merge([
            'date' => $this->filled('date') ? $this->input('date') : null,
            'status_ids' => $statusIds,
        ]);
    }
}

<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Arr;

class RouteProfitabilityRequest extends FormRequest
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

        return $user->can('reports.route-profitability.view') || $user->can('reports.route-profitability.export');
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
            'origin_ids' => ['nullable', 'array'],
            'origin_ids.*' => ['integer', 'exists:places,id'],
            'destination_ids' => ['nullable', 'array'],
            'destination_ids.*' => ['integer', 'exists:places,id'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $originIds = $this->normaliseIds($this->input('origin_ids'));
        $destinationIds = $this->normaliseIds($this->input('destination_ids'));

        $this->merge([
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
            'origin_ids' => $originIds,
            'destination_ids' => $destinationIds,
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


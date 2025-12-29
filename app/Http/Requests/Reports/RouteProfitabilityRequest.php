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
            'customer_ids' => ['nullable', 'array'],
            'customer_ids.*' => ['integer', 'exists:customers,id'],
            'min_trips' => ['nullable', 'integer', 'min:0'],
            'min_margin_percent' => ['nullable', 'numeric'],
            'min_profit_per_km' => ['nullable', 'numeric'],
            'sort' => ['nullable', 'in:profit_desc,profit_asc,margin_desc,margin_asc,trips_desc,trips_asc,revenue_desc,revenue_asc,profit_per_km_desc,profit_per_km_asc,distance_desc,distance_asc'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $originIds = $this->normaliseIds($this->input('origin_ids'));
        $destinationIds = $this->normaliseIds($this->input('destination_ids'));
        $customerIds = $this->normaliseIds($this->input('customer_ids'));

        $minTrips = $this->toNullableInt($this->input('min_trips'));
        $minMarginPercent = $this->toNullableFloat($this->input('min_margin_percent'));
        $minProfitPerKm = $this->toNullableFloat($this->input('min_profit_per_km'));
        $sort = $this->resolveSort($this->input('sort'));

        $this->merge([
            'from' => $this->filled('from') ? $this->input('from') : null,
            'to' => $this->filled('to') ? $this->input('to') : null,
            'origin_ids' => $originIds,
            'destination_ids' => $destinationIds,
            'customer_ids' => $customerIds,
            'min_trips' => $minTrips,
            'min_margin_percent' => $minMarginPercent,
            'min_profit_per_km' => $minProfitPerKm,
            'sort' => $sort,
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

    private function toNullableInt(mixed $value): ?int
    {
        if ($value === null || $value === '') {
            return null;
        }

        $intValue = (int) $value;

        return $intValue >= 0 ? $intValue : null;
    }

    private function toNullableFloat(mixed $value): ?float
    {
        if ($value === null || $value === '') {
            return null;
        }

        if (! is_numeric($value)) {
            return null;
        }

        return (float) $value;
    }

    private function resolveSort(mixed $value): string
    {
        $allowed = [
            'profit_desc',
            'profit_asc',
            'margin_desc',
            'margin_asc',
            'trips_desc',
            'trips_asc',
            'revenue_desc',
            'revenue_asc',
            'profit_per_km_desc',
            'profit_per_km_asc',
            'distance_desc',
            'distance_asc',
        ];

        $sort = is_string($value) ? $value : '';

        return in_array($sort, $allowed, true) ? $sort : 'profit_desc';
    }
}

<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OutsourcePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date'],
            'outsource_ids' => ['nullable', 'array'],
            'outsource_ids.*' => ['integer', Rule::exists('outsources', 'id')],
            'outsource_id' => ['nullable', 'integer', Rule::exists('outsources', 'id')],
            'statuses' => ['nullable', 'array'],
            'statuses.*' => ['string', 'max:255'],
            'status' => ['nullable', 'string', 'max:255'],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $outsourceIds = $this->input('outsource_ids');
        $singleOutsource = $this->input('outsource_id');
        $statuses = $this->input('statuses');
        $singleStatus = $this->input('status');

        if ($outsourceIds === null && $singleOutsource !== null) {
            $outsourceIds = [$singleOutsource];
        }

        if (is_string($outsourceIds)) {
            $outsourceIds = array_filter(array_map('trim', explode(',', $outsourceIds)));
        }

        if (is_array($outsourceIds)) {
            $outsourceIds = array_values(array_unique(array_filter($outsourceIds, static fn ($value) => $value !== null && $value !== '')));
        }

        if ($statuses === null && $singleStatus !== null) {
            $statuses = [$singleStatus];
        }

        if (is_string($statuses)) {
            $statuses = array_filter(array_map('trim', explode(',', $statuses)));
        }

        if (is_array($statuses)) {
            $statuses = array_values(array_unique(array_filter($statuses, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'outsource_ids' => $outsourceIds,
            'statuses' => $statuses,
        ]);
    }
}

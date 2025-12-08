<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OutsourcePerformanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        return $user->can('reports.outsource-performance.view') || $user->can('reports.outsource-performance.export');
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
            'operation_ids' => ['nullable', 'array'],
            'operation_ids.*' => ['integer', Rule::exists('operations', 'id')],
            'operation_id' => ['nullable', 'integer', Rule::exists('operations', 'id')],
            'destination_ids' => ['nullable', 'array'],
            'destination_ids.*' => ['integer', Rule::exists('places', 'id')],
            'destination_id' => ['nullable', 'integer', Rule::exists('places', 'id')],
            'limit' => ['nullable', 'integer', 'min:50', 'max:5000'],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $outsourceIds = $this->input('outsource_ids');
        $singleOutsource = $this->input('outsource_id');
        $statuses = $this->input('statuses');
        $singleStatus = $this->input('status');
        $operationIds = $this->input('operation_ids', $this->input('operation_id'));
        $destinationIds = $this->input('destination_ids', $this->input('destination_id'));

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

        if (is_string($operationIds)) {
            $operationIds = array_filter(array_map('trim', explode(',', $operationIds)));
        }

        if (is_array($operationIds)) {
            $operationIds = array_values(array_unique(array_filter($operationIds, static fn ($value) => $value !== null && $value !== '')));
        }

        if (is_string($destinationIds)) {
            $destinationIds = array_filter(array_map('trim', explode(',', $destinationIds)));
        }

        if (is_array($destinationIds)) {
            $destinationIds = array_values(array_unique(array_filter($destinationIds, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'outsource_ids' => $outsourceIds,
            'statuses' => $statuses,
            'operation_ids' => $operationIds,
            'destination_ids' => $destinationIds,
        ]);
    }
}

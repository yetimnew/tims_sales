<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PerformanceByOperationRequest extends FormRequest
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
            'operation_ids' => ['nullable', 'array'],
            'operation_ids.*' => ['integer', Rule::exists('operations', 'id')],
            'operation_id' => ['nullable', 'integer', Rule::exists('operations', 'id')],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $operationIds = $this->input('operation_ids');
        $singleOperation = $this->input('operation_id');

        if ($operationIds === null && $singleOperation !== null) {
            $operationIds = [$singleOperation];
        }

        if (is_string($operationIds)) {
            $operationIds = array_filter(array_map('trim', explode(',', $operationIds)));
        }

        if (is_array($operationIds)) {
            $operationIds = array_values(array_unique(array_filter($operationIds, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'operation_ids' => $operationIds,
        ]);
    }
}

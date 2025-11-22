<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CustomerProfitabilityRequest extends FormRequest
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
            'customer_ids' => ['nullable', 'array'],
            'customer_ids.*' => ['integer', Rule::exists('customers', 'id')],
            'customer_id' => ['nullable', 'integer', Rule::exists('customers', 'id')],
            'format' => ['nullable', Rule::in(['csv', 'xlsx', 'pdf'])],
        ];
    }

    protected function prepareForValidation(): void
    {
        $customerIds = $this->input('customer_ids');
        $singleCustomer = $this->input('customer_id');

        if ($customerIds === null && $singleCustomer !== null) {
            $customerIds = [$singleCustomer];
        }

        if (is_string($customerIds)) {
            $customerIds = array_filter(array_map('trim', explode(',', $customerIds)));
        }

        if (is_array($customerIds)) {
            $customerIds = array_values(array_unique(array_filter($customerIds, static fn ($value) => $value !== null && $value !== '')));
        }

        $this->merge([
            'customer_ids' => $customerIds,
        ]);
    }
}

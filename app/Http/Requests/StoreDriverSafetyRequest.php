<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverSafetyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'driver_id' => 'required|exists:drivers,id',
            'incident_date' => 'required|date|before_or_equal:today',
            'incident_type' => 'required|string|in:accident,violation,warning',
            'description' => 'required|string|max:2000',
            'severity' => 'required|string|in:minor,major,critical',
            'damage_cost' => 'nullable|numeric|min:0|max:999999.99',
            'location' => 'nullable|string|max:255',
            'resolution' => 'nullable|string|max:2000',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'driver_id.exists' => 'The selected driver does not exist.',
            'incident_date.before_or_equal' => 'The incident date cannot be in the future.',
            'incident_type.in' => 'The incident type must be one of: accident, violation, or warning.',
            'severity.in' => 'The severity must be one of: minor, major, or critical.',
            'damage_cost.min' => 'Damage cost cannot be negative.',
            'damage_cost.max' => 'Damage cost cannot exceed 999,999.99.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'location' => trim($this->location ?? ''),
            'resolution' => trim($this->resolution ?? ''),
            'description' => trim($this->description ?? ''),
        ]);
    }
}

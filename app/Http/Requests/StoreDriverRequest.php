<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreDriverRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('drivers.create');
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date|before:today',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:20|regex:/^[0-9+]{10,13}$/',
            'hireddate' => 'nullable|date|before_or_equal:today',
            'status' => 'required|string|in:active,inactive',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'driverid.unique' => 'A driver with this ID already exists.',
            'driverid.required' => 'Driver ID is required.',
            'name.required' => 'Driver name is required.',
            'sex.in' => 'Gender must be either male or female.',
            'birthdate.before' => 'Birth date must be before today.',
            'mobile.regex' => 'Mobile number must be a valid Ethiopian phone number.',
            'hireddate.before_or_equal' => 'Hired date cannot be in the future.',
            'status.in' => 'Status must be either active or inactive.',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'driverid' => trim($this->driverid ?? ''),
            'name' => trim($this->name ?? ''),
            'mobile' => trim($this->mobile ?? ''),
            'zone' => trim($this->zone ?? ''),
            'woreda' => trim($this->woreda ?? ''),
            'kebele' => trim($this->kebele ?? ''),
            'housenumber' => trim($this->housenumber ?? ''),
        ]);
    }
}

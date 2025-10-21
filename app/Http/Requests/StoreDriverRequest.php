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
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'driverid' => 'required|string|max:255|unique:drivers',
            'name' => 'required|string|max:255|min:2',
            'sex' => 'required|string|in:male,female',
            'birthdate' => 'nullable|date|before:today|after:1900-01-01',
            'zone' => 'nullable|string|max:255',
            'woreda' => 'nullable|string|max:255',
            'kebele' => 'nullable|string|max:255',
            'housenumber' => 'nullable|string|max:255',
            'mobile' => 'nullable|string|max:20|regex:/^[0-9+\-\s()]+$/',
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
            'driverid.unique' => 'Driver ID already exists',
            'name.min' => 'Driver name must be at least 2 characters',
            'birthdate.before' => 'Birth date must be before today',
            'birthdate.after' => 'Birth date must be after 1900',
            'mobile.regex' => 'Mobile number format is invalid',
            'hireddate.before_or_equal' => 'Hired date cannot be in the future',
        ];
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'driverid' => strtoupper(trim($this->driverid ?? '')),
            'name' => ucwords(trim($this->name ?? '')),
            'zone' => trim($this->zone ?? ''),
            'woreda' => trim($this->woreda ?? ''),
            'kebele' => trim($this->kebele ?? ''),
            'housenumber' => trim($this->housenumber ?? ''),
            'mobile' => preg_replace('/[^0-9+\-\s()]/', '', $this->mobile ?? ''),
        ]);
    }
}




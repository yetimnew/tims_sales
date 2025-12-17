<?php

namespace App\Http\Requests\Statuses;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('statuses.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'status_type_id' => ['required', 'integer', 'exists:statustypes,id'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Status name is required.',
            'name.max' => 'Status name may not be greater than 255 characters.',
            'status_type_id.required' => 'Please select a status type.',
            'status_type_id.exists' => 'The selected status type was not found.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) $this->input('name', '')),
            'description' => $this->filled('description') ? trim((string) $this->input('description')) : null,
        ]);
    }
}

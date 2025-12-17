<?php

namespace App\Http\Requests;

use App\Models\StatusType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStatusTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statusType = $this->route('statustype');
        $statusTypeId = $statusType instanceof StatusType ? $statusType->id : $statusType;

        return [
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('statustypes', 'name')
                    ->ignore($statusTypeId)
                    ->whereNull('deleted_at'),
            ],
            'description' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'name.unique' => 'A status type with this name already exists.',
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim((string) ($this->name ?? '')),
            'description' => is_string($this->description) ? trim($this->description) : $this->description,
        ]);
    }
}

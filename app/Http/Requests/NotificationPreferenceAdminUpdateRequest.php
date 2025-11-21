<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class NotificationPreferenceAdminUpdateRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('users.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'preferences' => ['sometimes', 'array'],
            'preferences.*.type_id' => ['required', 'integer', 'exists:notification_types,id'],
            'preferences.*.in_app_enabled' => ['required', 'boolean'],
            'preferences.*.email_enabled' => ['required', 'boolean'],
            'preferences.*.remove' => ['sometimes', 'boolean'],
        ];
    }
}

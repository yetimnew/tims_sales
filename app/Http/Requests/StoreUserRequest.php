<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('users.store');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()      // Requires uppercase and lowercase
                    ->numbers()        // Requires at least one number
                    ->symbols()       // Requires at least one special character
                    ->uncompromised(), // Checks against leaked passwords
            ],
            'role' => 'required|string|exists:roles,name',
            'notification_preferences' => ['sometimes', 'array'],
            'notification_preferences.*.type_id' => ['required', 'integer', 'exists:notification_types,id'],
            'notification_preferences.*.in_app_enabled' => ['required', 'boolean'],
            'notification_preferences.*.email_enabled' => ['required', 'boolean'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'The name field is required.',
            'name.max' => 'The name may not be greater than 255 characters.',
            'email.required' => 'The email field is required.',
            'email.email' => 'The email must be a valid email address.',
            'email.unique' => 'The email has already been taken.',
            'password.required' => 'The password field is required.',
            'password.mixedCase' => 'The password must contain both uppercase and lowercase letters.',
            'password.numbers' => 'The password must contain at least one number.',
            'password.symbols' => 'The password must contain at least one special character (!@#$%^&*).',
            'password.uncompromised' => 'The given password has appeared in a data leak. Please choose a different password.',
            'password.confirmed' => 'The password confirmation does not match.',
            'role.required' => 'The role field is required.',
            'role.exists' => 'The selected role is invalid.',
            'notification_preferences.*.type_id.required' => 'A notification type selection is required.',
            'notification_preferences.*.type_id.exists' => 'One of the selected notification types is invalid.',
            'notification_preferences.*.in_app_enabled.boolean' => 'In-app selection must be true or false.',
            'notification_preferences.*.email_enabled.boolean' => 'Email selection must be true or false.',
        ];
    }

    /**
     * Get custom attributes for validator errors.
     *
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return [
            'name' => 'name',
            'email' => 'email address',
            'password' => 'password',
            'password_confirmation' => 'password confirmation',
            'role' => 'role',
            'notification_preferences' => 'notification preferences',
        ];
    }
}

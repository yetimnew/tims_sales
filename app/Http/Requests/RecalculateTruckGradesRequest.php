<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

use function trim;

class RecalculateTruckGradesRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('trucks.update') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'snapshot_date' => ['required', 'date'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicletypes,id'],
            'status' => ['nullable', 'string', 'max:40'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function filters(): array
    {
        $vehicleTypeId = $this->integer('vehicle_type_id');
        $status = $this->input('status');

        return [
            'snapshot_date' => $this->input('snapshot_date'),
            'vehicle_type_id' => $vehicleTypeId > 0 ? $vehicleTypeId : null,
            'status' => $status !== null && trim((string) $status) !== '' ? trim((string) $status) : null,
        ];
    }
}

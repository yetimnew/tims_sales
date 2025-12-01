<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecalculateDriverGradesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('drivers.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'snapshot_date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'max:40'],
        ];
    }

    /**
     * @return array{snapshot_date:string,status:?string}
     */
    public function filters(): array
    {
        $status = $this->input('status');

        return [
            'snapshot_date' => (string) $this->input('snapshot_date'),
            'status' => $status !== null && trim((string) $status) !== '' ? trim((string) $status) : null,
        ];
    }
}

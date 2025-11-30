<?php

namespace App\Http\Requests\Reports;

use Illuminate\Foundation\Http\FormRequest;

class TruckGradingReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('trucks.show') ?? false;
    }

    public function rules(): array
    {
        return [
            'snapshot_date' => ['nullable', 'date'],
            'vehicle_type_id' => ['nullable', 'integer', 'exists:vehicletypes,id'],
            'status' => ['nullable', 'string', 'max:40'],
            'grade_letter' => ['nullable', 'string', 'in:A,B,C,D,E'],
            'per_page' => ['nullable', 'integer'],
        ];
    }
}

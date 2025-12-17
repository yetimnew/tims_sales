<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RecalculateDriverTruckGradesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('driver-trucks.update') ?? false;
    }

    public function rules(): array
    {
        return [
            'snapshot_date' => ['required', 'date'],
            'status' => ['nullable', 'string', 'max:40'],
            'attachment_state' => ['nullable', 'string', 'in:attached,detached'],
        ];
    }

    /**
     * @return array{snapshot_date:string,status:?string,attachment_state:?string}
     */
    public function filters(): array
    {
        $status = $this->input('status');
        $attachmentState = $this->input('attachment_state');

        return [
            'snapshot_date' => (string) $this->input('snapshot_date'),
            'status' => $status !== null && trim((string) $status) !== '' ? trim((string) $status) : null,
            'attachment_state' => $attachmentState !== null && trim((string) $attachmentState) !== ''
                ? strtolower(trim((string) $attachmentState))
                : null,
        ];
    }
}

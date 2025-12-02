<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverSafetyRecordDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $safetyRecordId,
        public readonly ?int $driverId,
        public readonly ?string $driverName,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

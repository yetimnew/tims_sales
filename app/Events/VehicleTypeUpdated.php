<?php

namespace App\Events;

use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleTypeUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly VehicleType $vehicleType,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

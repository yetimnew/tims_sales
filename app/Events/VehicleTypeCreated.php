<?php

namespace App\Events;

use App\Models\User;
use App\Models\VehicleType;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class VehicleTypeCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly VehicleType $vehicleType,
        public readonly ?User $actor = null,
    ) {}
}

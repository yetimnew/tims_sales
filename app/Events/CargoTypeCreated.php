<?php

namespace App\Events;

use App\Models\CargoType;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CargoTypeCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly CargoType $cargoType,
        public readonly ?User $actor = null,
    ) {}
}

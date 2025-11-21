<?php

namespace App\Events;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TruckCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Truck $truck,
        public readonly ?User $actor = null,
    ) {}
}

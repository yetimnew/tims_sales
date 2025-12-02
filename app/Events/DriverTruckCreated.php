<?php

namespace App\Events;

use App\Models\DriverTruck;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverTruckCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly DriverTruck $assignment,
        public readonly ?User $actor = null,
    ) {}
}

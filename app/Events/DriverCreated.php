<?php

namespace App\Events;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Driver $driver,
        public readonly ?User $actor = null,
    ) {}
}

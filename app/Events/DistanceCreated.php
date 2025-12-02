<?php

namespace App\Events;

use App\Models\Distance;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DistanceCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Distance $distance,
        public readonly ?User $actor = null,
    ) {}
}

<?php

namespace App\Events;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ZoneCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Zone $zone,
        public readonly ?User $actor = null,
    ) {}
}

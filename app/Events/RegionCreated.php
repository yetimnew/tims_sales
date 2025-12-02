<?php

namespace App\Events;

use App\Models\Region;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RegionCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Region $region,
        public readonly ?User $actor = null,
    ) {}
}

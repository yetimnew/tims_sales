<?php

namespace App\Events;

use App\Models\Distance;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DistanceUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Distance $distance,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

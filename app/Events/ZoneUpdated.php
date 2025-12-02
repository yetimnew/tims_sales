<?php

namespace App\Events;

use App\Models\User;
use App\Models\Zone;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ZoneUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Zone $zone,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

<?php

namespace App\Events;

use App\Models\Region;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RegionUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Region $region,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

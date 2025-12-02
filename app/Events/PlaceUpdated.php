<?php

namespace App\Events;

use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlaceUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Place $place,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

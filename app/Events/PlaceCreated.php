<?php

namespace App\Events;

use App\Models\Place;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlaceCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Place $place,
        public readonly ?User $actor = null,
    ) {}
}

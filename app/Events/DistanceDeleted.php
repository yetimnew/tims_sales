<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DistanceDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $distanceId,
        public readonly ?int $fromPlaceId,
        public readonly ?int $toPlaceId,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

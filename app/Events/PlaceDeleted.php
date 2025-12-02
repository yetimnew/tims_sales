<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlaceDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $placeId,
        public readonly ?string $placeName,
        public readonly ?int $woredaId,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

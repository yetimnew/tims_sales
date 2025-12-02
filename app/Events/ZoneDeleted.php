<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ZoneDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $zoneId,
        public readonly ?string $zoneName,
        public readonly ?int $regionId,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

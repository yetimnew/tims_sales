<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WoredaDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $woredaId,
        public readonly ?string $woredaName,
        public readonly ?int $zoneId,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

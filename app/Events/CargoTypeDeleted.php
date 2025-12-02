<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CargoTypeDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $cargoTypeId,
        public readonly ?string $name,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

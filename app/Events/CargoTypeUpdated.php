<?php

namespace App\Events;

use App\Models\CargoType;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CargoTypeUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly CargoType $cargoType,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

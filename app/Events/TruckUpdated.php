<?php

namespace App\Events;

use App\Models\Truck;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class TruckUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly Truck $truck,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

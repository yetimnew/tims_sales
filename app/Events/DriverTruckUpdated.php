<?php

namespace App\Events;

use App\Models\DriverTruck;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverTruckUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly DriverTruck $assignment,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

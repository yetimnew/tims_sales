<?php

namespace App\Events;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly Driver $driver,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

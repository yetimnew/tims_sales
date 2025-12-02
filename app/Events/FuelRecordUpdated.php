<?php

namespace App\Events;

use App\Models\FuelRecord;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class FuelRecordUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly FuelRecord $fuelRecord,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

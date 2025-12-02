<?php

namespace App\Events;

use App\Models\DriverSafetyRecord;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverSafetyRecordUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly DriverSafetyRecord $safetyRecord,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

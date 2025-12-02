<?php

namespace App\Events;

use App\Models\DriverSafetyRecord;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverSafetyRecordCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly DriverSafetyRecord $safetyRecord,
        public readonly ?User $actor = null,
    ) {}
}

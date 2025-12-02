<?php

namespace App\Events;

use App\Models\DailyTruckStatus;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DailyTruckStatusUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly DailyTruckStatus $dailyTruckStatus,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

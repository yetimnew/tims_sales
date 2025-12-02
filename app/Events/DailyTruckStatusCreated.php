<?php

namespace App\Events;

use App\Models\DailyTruckStatus;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DailyTruckStatusCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly DailyTruckStatus $dailyTruckStatus,
        public readonly ?User $actor = null,
    ) {}
}

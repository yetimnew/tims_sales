<?php

namespace App\Events;

use App\Models\OutsourcePerformance;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourcePerformanceCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly OutsourcePerformance $performance,
        public readonly ?User $actor = null,
    ) {}
}

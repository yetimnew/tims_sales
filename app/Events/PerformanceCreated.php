<?php

namespace App\Events;

use App\Models\Performance;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PerformanceCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Performance $performance,
        public readonly ?User $actor = null,
    ) {}
}

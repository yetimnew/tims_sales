<?php

namespace App\Events;

use App\Models\OutsourcePerformance;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourcePerformanceUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly OutsourcePerformance $performance,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

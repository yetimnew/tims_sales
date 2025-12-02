<?php

namespace App\Events;

use App\Models\User;
use App\Models\Woreda;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WoredaUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Woreda $woreda,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

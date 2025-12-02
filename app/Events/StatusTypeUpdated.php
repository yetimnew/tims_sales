<?php

namespace App\Events;

use App\Models\StatusType;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StatusTypeUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old: mixed, new: mixed}>  $changes
     */
    public function __construct(
        public readonly StatusType $statusType,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

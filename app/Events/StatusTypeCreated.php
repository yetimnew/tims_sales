<?php

namespace App\Events;

use App\Models\StatusType;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StatusTypeCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly StatusType $statusType,
        public readonly ?User $actor = null,
    ) {}
}

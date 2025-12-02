<?php

namespace App\Events;

use App\Models\Operation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OperationCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Operation $operation,
        public readonly ?User $actor = null,
    ) {}
}

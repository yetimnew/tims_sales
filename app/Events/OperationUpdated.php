<?php

namespace App\Events;

use App\Models\Operation;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OperationUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Operation $operation,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

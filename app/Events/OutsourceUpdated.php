<?php

namespace App\Events;

use App\Models\Outsource;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourceUpdated
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, array{old:mixed, new:mixed}>  $changes
     */
    public function __construct(
        public readonly Outsource $outsource,
        public readonly array $changes,
        public readonly ?User $actor = null,
    ) {}
}

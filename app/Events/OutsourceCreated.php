<?php

namespace App\Events;

use App\Models\Outsource;
use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourceCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Outsource $outsource,
        public readonly ?User $actor = null,
    ) {}
}

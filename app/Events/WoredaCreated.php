<?php

namespace App\Events;

use App\Models\User;
use App\Models\Woreda;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WoredaCreated
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly Woreda $woreda,
        public readonly ?User $actor = null,
    ) {}
}

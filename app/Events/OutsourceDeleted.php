<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourceDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $outsourceId,
        public readonly ?string $outsourceName,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

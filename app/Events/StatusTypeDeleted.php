<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class StatusTypeDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<string, mixed>  $metrics
     */
    public function __construct(
        public readonly int $statusTypeId,
        public readonly string $statusTypeName,
        public readonly array $attributes,
        public readonly array $metrics,
        public readonly ?User $actor = null,
    ) {}
}

<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class OutsourcePerformanceDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $performanceId,
        public readonly ?string $tripNumber,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

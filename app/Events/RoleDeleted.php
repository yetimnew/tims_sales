<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class RoleDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     * @param  array<int, string>  $permissions
     */
    public function __construct(
        public readonly int $roleId,
        public readonly string $roleName,
        public readonly array $attributes,
        public readonly array $permissions,
        public readonly ?User $actor = null,
    ) {}
}

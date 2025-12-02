<?php

namespace App\Events;

use App\Models\User;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DriverTruckDeleted
{
    use Dispatchable, SerializesModels;

    /**
     * @param  array<string, mixed>  $attributes
     */
    public function __construct(
        public readonly int $assignmentId,
        public readonly ?int $driverId,
        public readonly ?string $driverName,
        public readonly ?int $truckId,
        public readonly ?string $truckPlate,
        public readonly array $attributes,
        public readonly ?User $actor = null,
    ) {}
}

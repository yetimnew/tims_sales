<?php

namespace App\Enums;

enum CargoServiceType: string
{
    case Relief = 'relief';
    case Commercial = 'commercial';

    public function label(): string
    {
        return match ($this) {
            self::Relief => 'Relief Cargo',
            self::Commercial => 'Commercial Cargo',
        };
    }

    /**
     * Retrieve value-label pairs for UI consumption.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return array_map(
            static fn (self $type) => [
                'value' => $type->value,
                'label' => $type->label(),
            ],
            self::cases()
        );
    }

    /**
     * Retrieve the scalar values for all cases.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return array_map(
            static fn (self $type) => $type->value,
            self::cases()
        );
    }
}

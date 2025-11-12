<?php

namespace App\Enums;

enum CargoCategory: string
{
    case Construction = 'Construction';
    case Agricultural = 'Agricultural';
    case Industrial = 'Industrial';
    case ConsumerGoods = 'Consumer Goods';
    case Food = 'Food';
    case Hazardous = 'Hazardous';
    case General = 'General';

    public function label(): string
    {
        return match ($this) {
            self::Construction => 'Construction',
            self::Agricultural => 'Agricultural',
            self::Industrial => 'Industrial',
            self::ConsumerGoods => 'Consumer Goods',
            self::Food => 'Food & Beverages',
            self::General => 'General Cargo',
            self::Hazardous => 'Hazardous Materials',
        };
    }

    /**
     * Retrieve value-label pairs for UI consumption.
     *
     * @return array<int, array{value: string, label: string}>
     */
    public static function options(): array
    {
        return \array_map(
            static fn (self $category) => [
                'value' => $category->value,
                'label' => $category->label(),
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
        return \array_map(
            static fn (self $category) => $category->value,
            self::cases()
        );
    }
}

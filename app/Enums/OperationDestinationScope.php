<?php

namespace App\Enums;

enum OperationDestinationScope: string
{
    case Region = 'region';
    case Zone = 'zone';
    case Woreda = 'woreda';
    case Place = 'place';

    public function label(): string
    {
        return match ($this) {
            self::Region => 'Region',
            self::Zone => 'Zone',
            self::Woreda => 'Woreda',
            self::Place => 'Place',
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
            static fn (self $scope) => [
                'value' => $scope->value,
                'label' => $scope->label(),
            ],
            self::cases()
        );
    }

    /**
     * Retrieve raw values for all cases.
     *
     * @return array<int, string>
     */
    public static function values(): array
    {
        return \array_map(
            static fn (self $scope) => $scope->value,
            self::cases()
        );
    }
}

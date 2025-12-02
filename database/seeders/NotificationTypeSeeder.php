<?php

namespace Database\Seeders;

use App\Models\NotificationType;
use Illuminate\Database\Seeder;

class NotificationTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $types = [
            [
                'key' => NotificationType::TRUCK_CREATED,
                'name' => 'Truck Created',
                'description' => 'Triggered when a new truck is added to the system.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::TRUCK_UPDATED,
                'name' => 'Truck Updated',
                'description' => 'Triggered when a truck record is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::TRUCK_DELETED,
                'name' => 'Truck Deleted',
                'description' => 'Triggered when a truck is removed from the system.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::USER_CREATED,
                'name' => 'User Created',
                'description' => 'Triggered when an account is created.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::USER_UPDATED,
                'name' => 'User Updated',
                'description' => 'Triggered when an account profile changes.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::USER_DELETED,
                'name' => 'User Deleted',
                'description' => 'Triggered when an account is deleted.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::DRIVER_CREATED,
                'name' => 'Driver Created',
                'description' => 'Triggered when a driver is added to the system.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_UPDATED,
                'name' => 'Driver Updated',
                'description' => 'Triggered when a driver record is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_DELETED,
                'name' => 'Driver Deleted',
                'description' => 'Triggered when a driver is removed from the system.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::DRIVER_TRUCK_CREATED,
                'name' => 'Driver-Truck Assignment Created',
                'description' => 'Triggered when a driver is assigned to a truck.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_TRUCK_UPDATED,
                'name' => 'Driver-Truck Assignment Updated',
                'description' => 'Triggered when a driver-truck assignment changes.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_TRUCK_DELETED,
                'name' => 'Driver-Truck Assignment Deleted',
                'description' => 'Triggered when a driver-truck assignment is removed.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::VEHICLE_TYPE_CREATED,
                'name' => 'Vehicle Type Created',
                'description' => 'Triggered when a vehicle type is added.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::VEHICLE_TYPE_UPDATED,
                'name' => 'Vehicle Type Updated',
                'description' => 'Triggered when a vehicle type is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::VEHICLE_TYPE_DELETED,
                'name' => 'Vehicle Type Deleted',
                'description' => 'Triggered when a vehicle type is removed.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::FUEL_RECORD_CREATED,
                'name' => 'Fuel Record Created',
                'description' => 'Triggered when a fuel record is created.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::FUEL_RECORD_UPDATED,
                'name' => 'Fuel Record Updated',
                'description' => 'Triggered when a fuel record is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::FUEL_RECORD_DELETED,
                'name' => 'Fuel Record Deleted',
                'description' => 'Triggered when a fuel record is removed.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::DRIVER_SAFETY_CREATED,
                'name' => 'Driver Safety Record Created',
                'description' => 'Triggered when a safety record is logged for a driver.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_SAFETY_UPDATED,
                'name' => 'Driver Safety Record Updated',
                'description' => 'Triggered when a driver safety record is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::DRIVER_SAFETY_DELETED,
                'name' => 'Driver Safety Record Deleted',
                'description' => 'Triggered when a driver safety record is deleted.',
                'default_in_app' => true,
                'default_email' => true,
            ],
            [
                'key' => NotificationType::CARGO_TYPE_CREATED,
                'name' => 'Cargo Type Created',
                'description' => 'Triggered when a cargo type is added.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::CARGO_TYPE_UPDATED,
                'name' => 'Cargo Type Updated',
                'description' => 'Triggered when a cargo type is updated.',
                'default_in_app' => true,
                'default_email' => false,
            ],
            [
                'key' => NotificationType::CARGO_TYPE_DELETED,
                'name' => 'Cargo Type Deleted',
                'description' => 'Triggered when a cargo type is removed.',
                'default_in_app' => true,
                'default_email' => true,
            ],
        ];

        NotificationType::query()->upsert(
            $types,
            ['key'],
            ['name', 'description', 'default_in_app', 'default_email']
        );
    }
}

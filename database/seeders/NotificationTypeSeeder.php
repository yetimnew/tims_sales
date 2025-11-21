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
        ];

        NotificationType::query()->upsert(
            $types,
            ['key'],
            ['name', 'description', 'default_in_app', 'default_email']
        );
    }
}

<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use Spatie\Permission\Models\Role;

class AdminUserSeeder extends Seeder
{
    /**
     * Run the database seeder.
     */
    public function run(): void
    {
        // Create admin user
        $admin = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password123'),
            ]
        );

        // Assign admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $admin->assignRole($adminRole);
        $this->command->info('✓ Admin user created: admin@test.com / password123');

        // Create manager user
        $manager = User::firstOrCreate(
            ['email' => 'manager@test.com'],
            [
                'name' => 'Manager User',
                'password' => bcrypt('password123'),
            ]
        );

        // Assign manager role
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $manager->assignRole($managerRole);
        $this->command->info('✓ Manager user created: manager@test.com / password123');

        // Create regular user
        $user = User::firstOrCreate(
            ['email' => 'user@test.com'],
            [
                'name' => 'Regular User',
                'password' => bcrypt('password123'),
            ]
        );

        // Assign user role
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $user->assignRole($userRole);
        $this->command->info('✓ Regular user created: user@test.com / password123');
    }
}

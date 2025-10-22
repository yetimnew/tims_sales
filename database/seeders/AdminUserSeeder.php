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
        $user = User::firstOrCreate(
            ['email' => 'admin@test.com'],
            [
                'name' => 'Admin User',
                'password' => bcrypt('password123'),
            ]
        );

        // Assign admin role
        $adminRole = Role::firstOrCreate(['name' => 'admin']);
        $user->assignRole($adminRole);

        $this->command->info('Admin user created: admin@test.com / password123');
    }
}

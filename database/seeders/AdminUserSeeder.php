<?php

namespace Database\Seeders;

use App\Models\Driver;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
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
                'email_verified_at' => now(),
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
                'email_verified_at' => now(),
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
                'email_verified_at' => now(),
            ]
        );

        // Assign user role
        $userRole = Role::firstOrCreate(['name' => 'user']);
        $user->assignRole($userRole);
        $this->command->info('✓ Regular user created: user@test.com / password123');

        // Create driver users (users who are also drivers)
        $this->createDriverUsers();
    }

    /**
     * Create driver users - users who are also drivers
     * These users will have both User and Driver records linked via user_id
     */
    private function createDriverUsers(): void
    {
        $driverUsers = [
            [
                'name' => 'John Driver',
                'email' => 'driver1@test.com',
                'password' => 'password123',
                'driver' => [
                    'driverid' => 'DRV001',
                    'name' => 'John Driver',
                    'sex' => 'male', // Required field
                    'birthdate' => '1990-01-15',
                    'mobile' => '+251911234567',
                    'zone' => 'Addis Ababa',
                    'woreda' => 'Bole',
                    'kebele' => '01',
                    'housenumber' => '123',
                    'hireddate' => '2020-01-01',
                    'status' => 'active',
                ],
                'role' => 'driver',
            ],
            [
                'name' => 'Sarah Driver',
                'email' => 'driver2@test.com',
                'password' => 'password123',
                'driver' => [
                    'driverid' => 'DRV002',
                    'name' => 'Sarah Driver',
                    'sex' => 'female', // Required field
                    'birthdate' => '1992-05-20',
                    'mobile' => '+251911234568',
                    'zone' => 'Addis Ababa',
                    'woreda' => 'Merkato',
                    'kebele' => '02',
                    'housenumber' => '456',
                    'hireddate' => '2021-03-15',
                    'status' => 'active',
                ],
                'role' => 'driver',
            ],
            [
                'name' => 'Michael Driver',
                'email' => 'driver3@test.com',
                'password' => 'password123',
                'driver' => [
                    'driverid' => 'DRV003',
                    'name' => 'Michael Driver',
                    'sex' => 'male', // Required field
                    'birthdate' => '1988-08-10',
                    'mobile' => '+251911234569',
                    'zone' => 'Addis Ababa',
                    'woreda' => 'Kirkos',
                    'kebele' => '03',
                    'housenumber' => '789',
                    'hireddate' => '2019-06-01',
                    'status' => 'active',
                ],
                'role' => 'driver',
            ],
        ];

        foreach ($driverUsers as $driverUserData) {
            // Create or get user
            $user = User::firstOrCreate(
                ['email' => $driverUserData['email']],
                [
                    'name' => $driverUserData['name'],
                    'password' => Hash::make($driverUserData['password']),
                    'email_verified_at' => now(),
                ]
            );

            // Update user if it exists but name changed
            if ($user->name !== $driverUserData['name']) {
                $user->update(['name' => $driverUserData['name']]);
            }

            // Assign driver role if it exists
            $driverRole = Role::firstOrCreate(['name' => $driverUserData['role']]);
            if (!$user->hasRole($driverRole->name)) {
                $user->assignRole($driverRole);
            }

            // Create or update driver record linked to user
            $driverData = $driverUserData['driver'];
            $driver = Driver::firstOrCreate(
                ['driverid' => $driverData['driverid']],
                array_merge($driverData, [
                    'user_id' => $user->id,
                ])
            );

            // If driver exists but user_id is not set or different, update it
            if ($driver->user_id !== $user->id) {
                $driver->update([
                    'user_id' => $user->id,
                    'name' => $driverData['name'],
                    'sex' => $driverData['sex'],
                    'status' => $driverData['status'],
                    'birthdate' => $driverData['birthdate'] ?? null,
                    'mobile' => $driverData['mobile'] ?? null,
                    'zone' => $driverData['zone'] ?? null,
                    'woreda' => $driverData['woreda'] ?? null,
                    'kebele' => $driverData['kebele'] ?? null,
                    'housenumber' => $driverData['housenumber'] ?? null,
                    'hireddate' => $driverData['hireddate'] ?? null,
                ]);
            }

            $this->command->info(sprintf(
                '✓ Driver user created: %s (%s) / password123 | Driver ID: %s',
                $driverUserData['email'],
                $driverUserData['name'],
                $driverData['driverid']
            ));
        }

        $this->command->info(sprintf('✓ Created %d driver user(s)', count($driverUsers)));
    }
}

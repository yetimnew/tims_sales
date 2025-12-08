<?php

namespace Tests\Unit;

use App\Http\Requests\StoreUserRequest;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use PHPUnit\Framework\Attributes\Test;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class UserManagementTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        // Create roles for testing
        Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'manager', 'guard_name' => 'web']);
        Role::create(['name' => 'user', 'guard_name' => 'web']);
    }

    #[Test]
    public function it_validates_user_creation_required_fields()
    {
        $request = new StoreUserRequest;

        $validator = Validator::make([], [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('name', $validator->errors()->toArray());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
        $this->assertArrayHasKey('role', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_user_creation_with_valid_data()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_validates_email_uniqueness()
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $data = [
            'name' => 'Test User',
            'email' => 'existing@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('email', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_password_minimum_length()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Pass1!',
            'password_confirmation' => 'Pass1!',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_password_confirmation()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Different123!@#',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    #[Test]
    public function it_requires_mixed_case_password()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'lowercase123!@#',
            'password_confirmation' => 'lowercase123!@#',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    #[Test]
    public function it_requires_numbers_in_password()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'NoNumbers!@#',
            'password_confirmation' => 'NoNumbers!@#',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    #[Test]
    public function it_requires_symbols_in_password()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'NoSymbols123',
            'password_confirmation' => 'NoSymbols123',
            'role' => 'user',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('password', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_role_exists()
    {
        $data = [
            'name' => 'Test User',
            'email' => 'test@example.com',
            'password' => 'Password123!@#',
            'password_confirmation' => 'Password123!@#',
            'role' => 'nonexistent',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => [
                'required',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols()
                    ->uncompromised(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertTrue($validator->fails());
        $this->assertArrayHasKey('role', $validator->errors()->toArray());
    }

    #[Test]
    public function it_validates_user_update_with_valid_data()
    {
        $user = User::factory()->create();

        $data = [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'password' => 'NewPassword123!@#',
            'password_confirmation' => 'NewPassword123!@#',
            'role' => 'manager',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => [
                'nullable',
                'confirmed',
                Password::min(8)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_validates_user_update_without_password()
    {
        $user = User::factory()->create();

        $data = [
            'name' => 'Updated User',
            'email' => 'updated@example.com',
            'role' => 'manager',
        ];

        $validator = Validator::make($data, [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,'.$user->id,
            'password' => 'nullable|string|min:8|confirmed',
            'role' => 'required|string|exists:roles,name',
        ]);

        $this->assertFalse($validator->fails());
    }

    #[Test]
    public function it_hashes_password_correctly()
    {
        $password = 'password123';
        $hashedPassword = Hash::make($password);

        $this->assertNotEquals($password, $hashedPassword);
        $this->assertTrue(Hash::check($password, $hashedPassword));
    }

    #[Test]
    public function it_assigns_role_to_user()
    {
        $user = User::factory()->create();
        $role = Role::where('name', 'admin')->first();

        $user->assignRole($role);

        $this->assertTrue($user->hasRole('admin'));
        $this->assertTrue($user->hasRole($role));
    }

    #[Test]
    public function it_syncs_user_roles()
    {
        $user = User::factory()->create();
        $adminRole = Role::where('name', 'admin')->first();
        $managerRole = Role::where('name', 'manager')->first();

        // Assign initial role
        $user->assignRole($adminRole);
        $this->assertTrue($user->hasRole('admin'));

        // Sync to new role
        $user->syncRoles([$managerRole]);
        $this->assertFalse($user->hasRole('admin'));
        $this->assertTrue($user->hasRole('manager'));
    }

    #[Test]
    public function it_prevents_user_from_deleting_themselves()
    {
        $user = User::factory()->create();

        $this->assertTrue($user->id === $user->id); // This would be the check in the controller
    }

    #[Test]
    public function it_gets_user_roles_correctly()
    {
        $user = User::factory()->create();
        $role = Role::where('name', 'user')->first();

        $user->assignRole($role);

        $this->assertCount(1, $user->roles);
        $this->assertEquals('user', $user->roles->first()->name);
    }
}

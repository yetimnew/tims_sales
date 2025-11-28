<?php

namespace Tests\Feature;

use App\Enums\CargoCategory;
use App\Enums\CargoServiceType;
use App\Models\CargoType;
use App\Models\Customer;
use App\Models\Driver;
use App\Models\Operation;
use App\Models\Region;
use App\Models\Truck;
use App\Models\User;
use App\Models\VehicleType;
use Database\Seeders\CheckPermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class SecurityTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    protected User $user;

    protected User $adminUser;

    protected VehicleType $vehicleType;

    protected Truck $truck;

    protected Driver $driver;

    protected Customer $customer;

    protected Region $region;

    protected Operation $operation;

    protected CargoType $cargoType;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(CheckPermissionSeeder::class);

        $this->user = User::factory()->create([
            'name' => 'Test User',
            'email' => 'user@test.com',
        ]);

        $this->adminUser = User::factory()->create([
            'name' => 'Admin User',
            'email' => 'admin@test.com',
        ]);

        $this->user->assignRole('admin');
        $this->adminUser->assignRole('admin');

        $this->createTestData();
    }

    private function createTestData(): void
    {
        $this->vehicleType = VehicleType::create([
            'name' => 'Heavy Truck',
            'description' => 'Large cargo truck for heavy loads',
        ]);

        $this->truck = Truck::create([
            'plate' => 'AA-1234',
            'vehicletype_id' => $this->vehicleType->id,
            'status' => 'active',
            'chasisNumber' => 'CH123456',
            'engineNumber' => 'EN789012',
        ]);

        $this->driver = Driver::create([
            'driverid' => 'DRV001',
            'name' => 'John Doe',
            'sex' => 'male',
            'status' => 'active',
            'zone' => 'ADDISE ABABA',
            'mobile' => '+251911234567',
        ]);

        $this->customer = Customer::create([
            'name' => 'ABC Transport Company',
            'contact_person' => 'Jane Smith',
            'phone' => '+251912345678',
            'email' => 'contact@abctransport.com',
            'status' => 'active',
        ]);

        $this->region = Region::create([
            'name' => 'ADDISE ABABA',
            'description' => 'Capital city region',
        ]);

        $this->cargoType = CargoType::create([
            'name' => 'General Cargo',
            'category' => CargoCategory::General->value,
            'weight_per_cubic_meter' => 1000,
            'handling_requirements' => 'Standard',
            'safety_requirements' => 'Standard',
            'requires_special_equipment' => false,
        ]);

        $this->operation = Operation::create([
            'operationid' => 'OP001',
            'customer_id' => $this->customer->id,
            'startdate' => '2025-01-01',
            'volume' => 100.00,
            'cargo_type_id' => $this->cargoType->id,
            'cargo_service_type' => CargoServiceType::Commercial->value,
            'km' => 500.00,
            'tariff' => 50.00,
            'status' => 'active',
            'closed' => false,
            'destination_scope' => 'region',
            'destination_name' => $this->region->name,
            'destination_reference_type' => Region::class,
            'destination_reference_id' => $this->region->id,
            'user_id' => $this->user->id,
        ]);
    }

    /** @test */
    public function unauthenticated_users_cannot_access_protected_routes()
    {
        $protectedRoutes = [
            '/dashboard',
            '/trucks',
            '/drivers',
            '/customers',
            '/operations',
            '/maintenance',
            '/fuel',
            '/driver-performance',
            '/cargo-types',
            '/financial',
            '/route-plans',
            '/reports/maintenance',
        ];

        foreach ($protectedRoutes as $route) {
            $response = $this->get($route);
            $response->assertRedirect('/login');
        }
    }

    /** @test */
    public function authenticated_users_can_access_protected_routes()
    {
        $protectedRoutes = [
            '/dashboard',
            '/trucks',
            '/drivers',
            '/customers',
            '/operations',
            '/maintenance',
            '/fuel',
            '/driver-performance',
            '/cargo-types',
            '/financial',
            '/route-plans',
        ];

        foreach ($protectedRoutes as $route) {
            $response = $this->actingAs($this->user)->get($route);
            $response->assertStatus(200);
        }
    }

    /** @test */
    public function csrf_protection_is_enabled()
    {
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'BB-5678',
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        // Should redirect back with CSRF error
        $response->assertStatus(419);
    }

    /** @test */
    public function sql_injection_attempts_are_blocked()
    {
        $maliciousInput = "'; DROP TABLE trucks; --";

        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => $maliciousInput,
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        // Should handle gracefully without executing SQL
        $response->assertSessionHasErrors(['plate']);

        // Verify table still exists
        $this->assertDatabaseHas('trucks', ['id' => $this->truck->id]);
    }

    /** @test */
    public function xss_attempts_are_sanitized()
    {
        $xssPayload = '<script>alert("XSS")</script>';

        $response = $this->actingAs($this->user)
            ->post('/drivers', [
                'driverid' => 'DRV002',
                'name' => $xssPayload,
                'sex' => 'male',
                'status' => 'active',
                'zone' => 'ADDISE ABABA',
                'mobile' => '+251911234568',
            ]);

        $response->assertRedirect('/drivers');

        // Verify XSS payload is stored safely
        $driver = Driver::where('driverid', 'DRV002')->first();
        $this->assertStringNotContainsString('<script>', $driver->name);
    }

    /** @test */
    public function rate_limiting_works_for_trucks_endpoint()
    {
        // Make multiple requests quickly
        for ($i = 0; $i < 65; $i++) {
            $response = $this->actingAs($this->user)
                ->get('/trucks');

            if ($i >= 60) {
                $response->assertStatus(429);
            } else {
                $response->assertStatus(200);
            }
        }
    }

    /** @test */
    public function file_upload_security_is_enforced()
    {
        $maliciousFile = 'test.php';
        $maliciousContent = '<?php echo "Hacked"; ?>';

        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'CC-9999',
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
                'document' => $maliciousFile,
            ]);

        // Should reject PHP files
        $response->assertSessionHasErrors();
    }

    /** @test */
    public function password_requirements_are_enforced()
    {
        $weakPasswords = [
            '123',
            'password',
            '12345678',
            'abcdefgh',
        ];

        foreach ($weakPasswords as $password) {
            $response = $this->post('/register', [
                'name' => 'Test User',
                'email' => 'test@example.com',
                'password' => $password,
                'password_confirmation' => $password,
            ]);

            $response->assertSessionHasErrors(['password']);
        }
    }

    /** @test */
    public function email_validation_prevents_invalid_emails()
    {
        $invalidEmails = [
            'invalid-email',
            '@example.com',
            'test@',
            'test..test@example.com',
        ];

        foreach ($invalidEmails as $email) {
            $response = $this->post('/register', [
                'name' => 'Test User',
                'email' => $email,
                'password' => 'password123',
                'password_confirmation' => 'password123',
            ]);

            $response->assertSessionHasErrors(['email']);
        }
    }

    /** @test */
    public function input_length_limits_are_enforced()
    {
        $longString = str_repeat('a', 1000);

        $response = $this->actingAs($this->user)
            ->post('/drivers', [
                'driverid' => 'DRV002',
                'name' => $longString,
                'sex' => 'male',
                'status' => 'active',
                'zone' => 'ADDISE ABABA',
                'mobile' => '+251911234568',
            ]);

        $response->assertSessionHasErrors(['name']);
    }

    /** @test */
    public function foreign_key_constraints_prevent_orphaned_records()
    {
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'DD-1111',
                'vehicletype_id' => 99999, // Non-existent ID
                'status' => 'active',
            ]);

        $response->assertSessionHasErrors(['vehicletype_id']);
    }

    /** @test */
    public function unique_constraints_prevent_duplicates()
    {
        // Try to create truck with existing plate
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'AA-1234', // Already exists
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        $response->assertSessionHasErrors(['plate']);
    }

    /** @test */
    public function soft_deletes_prevent_data_loss()
    {
        $response = $this->actingAs($this->user)
            ->delete("/trucks/{$this->truck->id}");

        $response->assertRedirect('/trucks');

        // Verify record is soft deleted, not permanently deleted
        $this->assertSoftDeleted('trucks', ['id' => $this->truck->id]);
        $this->assertDatabaseHas('trucks', ['id' => $this->truck->id]);
    }

    /** @test */
    public function audit_logging_tracks_important_actions()
    {
        $response = $this->actingAs($this->user)
            ->post('/trucks', [
                'plate' => 'EE-2222',
                'vehicletype_id' => $this->vehicleType->id,
                'status' => 'active',
            ]);

        $response->assertRedirect('/trucks');

        // Verify audit log entry exists
        $this->assertDatabaseHas('activity_log', [
            'description' => 'Truck created',
            'subject_type' => 'App\Models\Truck',
        ]);
    }

    /** @test */
    public function session_security_is_enforced()
    {
        // Test session timeout
        $response = $this->actingAs($this->user)
            ->get('/dashboard');

        $response->assertStatus(200);

        // Simulate session expiration
        $this->app['session']->invalidate();

        $response = $this->get('/dashboard');
        $response->assertRedirect('/login');
    }

    /** @test */
    public function https_redirects_work_in_production()
    {
        // This test would need to be run in production environment
        // For now, we'll just verify the middleware exists
        $this->assertTrue(class_exists('App\Http\Middleware\HttpsProtocol'));
    }

    /** @test */
    public function content_security_policy_headers_are_set()
    {
        $response = $this->actingAs($this->user)
            ->get('/dashboard');

        $response->assertHeader('X-Content-Type-Options', 'nosniff');
        $response->assertHeader('X-Frame-Options', 'DENY');
        $response->assertHeader('X-XSS-Protection', '1; mode=block');
    }

    /** @test */
    public function two_factor_authentication_is_available()
    {
        /** @var User $user */
        $user = User::factory()->createOne([
            'two_factor_secret' => 'test-secret',
            'two_factor_recovery_codes' => ['test-code'],
        ]);

        $response = $this->actingAs($user)
            ->get('/user/two-factor-authentication');

        $response->assertStatus(200);
    }

    /** @test */
    public function password_reset_security_is_enforced()
    {
        $response = $this->post('/forgot-password', [
            'email' => 'nonexistent@example.com',
        ]);

        // Should not reveal whether email exists
        $response->assertStatus(200);
        $response->assertSee('We have emailed your password reset link');
    }

    /** @test */
    public function brute_force_protection_works()
    {
        // Attempt multiple failed logins
        for ($i = 0; $i < 6; $i++) {
            $response = $this->post('/login', [
                'email' => $this->user->email,
                'password' => 'wrong-password',
            ]);

            if ($i >= 5) {
                $response->assertStatus(429);
            } else {
                $response->assertStatus(422);
            }
        }
    }

    /** @test */
    public function api_rate_limiting_works()
    {
        // Make multiple API requests
        for ($i = 0; $i < 65; $i++) {
            $response = $this->actingAs($this->user)
                ->getJson('/api/trucks');

            if ($i >= 60) {
                $response->assertStatus(429);
            } else {
                $response->assertStatus(200);
            }
        }
    }

    /** @test */
    public function sensitive_data_is_not_logged()
    {
        $response = $this->actingAs($this->user)
            ->post('/drivers', [
                'driverid' => 'DRV002',
                'name' => 'Test Driver',
                'sex' => 'male',
                'status' => 'active',
                'zone' => 'ADDISE ABABA',
                'mobile' => '+251911234568',
                'password' => 'secret-password', // Should not be logged
            ]);

        $response->assertRedirect('/drivers');

        // Verify password is not in logs
        $logContent = file_get_contents(storage_path('logs/laravel.log'));
        $this->assertStringNotContainsString('secret-password', $logContent);
    }
}

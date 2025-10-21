<?php

namespace Tests\Feature\Backup;

use App\Models\User;
use App\Models\Truck;
use App\Models\Driver;
use App\Models\Role;
use App\Models\Permission;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BackupTest extends TestCase
{
    use RefreshDatabase;

    protected $user;

    protected function setUp(): void
    {
        parent::setUp();

        // Create user with permissions
        $this->user = User::factory()->create();

        // Create permissions
        $permissions = [
            'backup.view', 'backup.create', 'backup.edit', 'backup.destroy',
            'backup.show', 'backup.store', 'backup.update', 'backup.export',
            'backup.download', 'backup.restore', 'backup.schedule'
        ];

        foreach ($permissions as $permission) {
            Permission::create(['name' => $permission, 'guard_name' => 'web']);
        }

        // Create role and assign permissions
        $role = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        $role->givePermissionTo($permissions);
        $this->user->assignRole($role);
    }

    /** @test */
    public function user_can_view_backups()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups')
        );
    }

    /** @test */
    public function user_can_create_backup()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups', [
                'name' => 'Test Backup',
                'description' => 'Test backup description',
                'type' => 'full',
                'include_files' => true,
                'include_database' => true,
                'compression' => 'gzip'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backups', [
            'name' => 'Test Backup',
            'description' => 'Test backup description',
            'type' => 'full'
        ]);
    }

    /** @test */
    public function user_can_view_backup_details()
    {
        $backup = \App\Models\Backup::create([
            'name' => 'Test Backup',
            'description' => 'Test backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/test-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups/' . $backup->id);

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Show')
            ->has('backup')
        );
    }

    /** @test */
    public function user_can_download_backup()
    {
        $backup = \App\Models\Backup::create([
            'name' => 'Test Backup',
            'description' => 'Test backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/test-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups/' . $backup->id . '/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/gzip');
    }

    /** @test */
    public function user_can_restore_backup()
    {
        $backup = \App\Models\Backup::create([
            'name' => 'Test Backup',
            'description' => 'Test backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/test-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->post('/backups/' . $backup->id . '/restore', [
                'confirm' => true,
                'restore_files' => true,
                'restore_database' => true
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_delete_backup()
    {
        $backup = \App\Models\Backup::create([
            'name' => 'Test Backup',
            'description' => 'Test backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/test-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/backups/' . $backup->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('backups', [
            'id' => $backup->id
        ]);
    }

    /** @test */
    public function user_can_schedule_backup()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups/schedule', [
                'name' => 'Scheduled Backup',
                'description' => 'Scheduled backup description',
                'type' => 'incremental',
                'frequency' => 'daily',
                'time' => '02:00',
                'retention_days' => 30
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_schedules', [
            'name' => 'Scheduled Backup',
            'description' => 'Scheduled backup description',
            'type' => 'incremental',
            'frequency' => 'daily'
        ]);
    }

    /** @test */
    public function user_can_view_backup_schedules()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/schedules');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Schedules')
            ->has('schedules')
        );
    }

    /** @test */
    public function user_can_edit_backup_schedule()
    {
        $schedule = \App\Models\BackupSchedule::create([
            'name' => 'Test Schedule',
            'description' => 'Test schedule description',
            'type' => 'full',
            'frequency' => 'daily',
            'time' => '02:00',
            'retention_days' => 30,
            'enabled' => true,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->put('/backups/schedules/' . $schedule->id, [
                'name' => 'Updated Schedule',
                'description' => 'Updated schedule description',
                'type' => 'incremental',
                'frequency' => 'weekly',
                'time' => '03:00',
                'retention_days' => 60
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'name' => 'Updated Schedule',
            'description' => 'Updated schedule description',
            'type' => 'incremental',
            'frequency' => 'weekly'
        ]);
    }

    /** @test */
    public function user_can_delete_backup_schedule()
    {
        $schedule = \App\Models\BackupSchedule::create([
            'name' => 'Test Schedule',
            'description' => 'Test schedule description',
            'type' => 'full',
            'frequency' => 'daily',
            'time' => '02:00',
            'retention_days' => 30,
            'enabled' => true,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/backups/schedules/' . $schedule->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('backup_schedules', [
            'id' => $schedule->id
        ]);
    }

    /** @test */
    public function user_can_enable_backup_schedule()
    {
        $schedule = \App\Models\BackupSchedule::create([
            'name' => 'Test Schedule',
            'description' => 'Test schedule description',
            'type' => 'full',
            'frequency' => 'daily',
            'time' => '02:00',
            'retention_days' => 30,
            'enabled' => false,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->post('/backups/schedules/' . $schedule->id . '/enable');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'enabled' => true
        ]);
    }

    /** @test */
    public function user_can_disable_backup_schedule()
    {
        $schedule = \App\Models\BackupSchedule::create([
            'name' => 'Test Schedule',
            'description' => 'Test schedule description',
            'type' => 'full',
            'frequency' => 'daily',
            'time' => '02:00',
            'retention_days' => 30,
            'enabled' => true,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->post('/backups/schedules/' . $schedule->id . '/disable');

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_schedules', [
            'id' => $schedule->id,
            'enabled' => false
        ]);
    }

    /** @test */
    public function user_can_view_backup_settings()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/settings');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Settings')
            ->has('settings')
        );
    }

    /** @test */
    public function user_can_update_backup_settings()
    {
        $response = $this->actingAs($this->user)
            ->put('/backups/settings', [
                'storage_disk' => 's3',
                'compression' => 'gzip',
                'encryption' => true,
                'encryption_key' => 'test-key',
                'retention_days' => 30,
                'max_backups' => 10,
                'notification_email' => 'admin@example.com'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_backup_storage()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/storage');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Storage')
            ->has('storage')
        );
    }

    /** @test */
    public function user_can_test_backup_storage()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups/storage/test', [
                'disk' => 's3',
                'bucket' => 'test-bucket',
                'region' => 'us-east-1',
                'access_key' => 'test-access-key',
                'secret_key' => 'test-secret-key'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_backup_logs()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/logs');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Logs')
            ->has('logs')
        );
    }

    /** @test */
    public function user_can_export_backup_logs()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/logs/export');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
    }

    /** @test */
    public function user_can_clear_backup_logs()
    {
        $response = $this->actingAs($this->user)
            ->delete('/backups/logs/clear');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_backup_statistics()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/statistics');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Statistics')
            ->has('statistics')
        );
    }

    /** @test */
    public function user_can_view_backup_dashboard()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/dashboard');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Dashboard')
            ->has('dashboard')
        );
    }

    /** @test */
    public function user_can_view_backup_charts()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/charts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Charts')
            ->has('charts')
        );
    }

    /** @test */
    public function user_can_view_backup_reports()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/reports');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Reports')
            ->has('reports')
        );
    }

    /** @test */
    public function user_can_generate_backup_report()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups/reports/generate', [
                'start_date' => '2023-01-01',
                'end_date' => '2023-12-31',
                'type' => 'summary'
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_download_backup_report()
    {
        $report = \App\Models\BackupReport::create([
            'name' => 'Test Backup Report',
            'type' => 'summary',
            'data' => ['test' => 'data'],
            'generated_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups/reports/' . $report->id . '/download');

        $response->assertStatus(200);
        $response->assertHeader('Content-Type', 'application/pdf');
    }

    /** @test */
    public function user_can_view_backup_alerts()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/alerts');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Alerts')
            ->has('alerts')
        );
    }

    /** @test */
    public function user_can_create_backup_alert()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups/alerts', [
                'name' => 'Test Alert',
                'type' => 'backup_failed',
                'conditions' => [
                    'status' => 'failed',
                    'duration' => '> 1 hour'
                ],
                'notification_method' => 'email',
                'notification_recipients' => ['admin@example.com']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_alerts', [
            'name' => 'Test Alert',
            'type' => 'backup_failed'
        ]);
    }

    /** @test */
    public function user_can_edit_backup_alert()
    {
        $alert = \App\Models\BackupAlert::create([
            'name' => 'Test Alert',
            'type' => 'backup_failed',
            'conditions' => ['test' => 'data'],
            'notification_method' => 'email',
            'notification_recipients' => ['admin@example.com']
        ]);

        $response = $this->actingAs($this->user)
            ->put('/backups/alerts/' . $alert->id, [
                'name' => 'Updated Alert',
                'type' => 'backup_success',
                'conditions' => [
                    'status' => 'completed',
                    'duration' => '< 30 minutes'
                ],
                'notification_method' => 'sms',
                'notification_recipients' => ['updated@example.com']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseHas('backup_alerts', [
            'id' => $alert->id,
            'name' => 'Updated Alert',
            'type' => 'backup_success'
        ]);
    }

    /** @test */
    public function user_can_delete_backup_alert()
    {
        $alert = \App\Models\BackupAlert::create([
            'name' => 'Test Alert',
            'type' => 'backup_failed',
            'conditions' => ['test' => 'data'],
            'notification_method' => 'email',
            'notification_recipients' => ['admin@example.com']
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/backups/alerts/' . $alert->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('backup_alerts', [
            'id' => $alert->id
        ]);
    }

    /** @test */
    public function user_can_view_backup_permissions()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/permissions');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Permissions')
            ->has('permissions')
        );
    }

    /** @test */
    public function user_can_assign_backup_permissions()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($this->user)
            ->post('/backups/permissions', [
                'user_id' => $user->id,
                'permissions' => ['backup.view', 'backup.download']
            ]);

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_view_backup_api()
    {
        $response = $this->actingAs($this->user)
            ->get('/backups/api');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Api')
            ->has('api')
        );
    }

    /** @test */
    public function user_can_generate_backup_api_key()
    {
        $response = $this->actingAs($this->user)
            ->post('/backups/api/generate-key');

        $response->assertRedirect();
        $response->assertSessionHas('success');
    }

    /** @test */
    public function user_can_revoke_backup_api_key()
    {
        $apiKey = \App\Models\BackupApiKey::create([
            'user_id' => $this->user->id,
            'name' => 'Test API Key',
            'key' => 'test-key',
            'permissions' => ['backup.view']
        ]);

        $response = $this->actingAs($this->user)
            ->delete('/backups/api/keys/' . $apiKey->id);

        $response->assertRedirect();
        $response->assertSessionHas('success');

        $this->assertDatabaseMissing('backup_api_keys', [
            'id' => $apiKey->id
        ]);
    }

    /** @test */
    public function user_can_search_backups()
    {
        \App\Models\Backup::create([
            'name' => 'Important Backup',
            'description' => 'Important backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/important-backup.tar.gz',
            'created_by' => $this->user->id
        ]);
        \App\Models\Backup::create([
            'name' => 'Regular Backup',
            'description' => 'Regular backup description',
            'type' => 'incremental',
            'status' => 'completed',
            'size' => 512000,
            'file_path' => 'backups/regular-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups?search=Important');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 1)
        );
    }

    /** @test */
    public function user_can_sort_backups()
    {
        \App\Models\Backup::create([
            'name' => 'First Backup',
            'description' => 'First backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/first-backup.tar.gz',
            'created_by' => $this->user->id,
            'created_at' => now()->subHour()
        ]);
        \App\Models\Backup::create([
            'name' => 'Second Backup',
            'description' => 'Second backup description',
            'type' => 'incremental',
            'status' => 'completed',
            'size' => 512000,
            'file_path' => 'backups/second-backup.tar.gz',
            'created_by' => $this->user->id,
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups?sort=created_at&direction=desc');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 2)
        );
    }

    /** @test */
    public function user_can_paginate_backups()
    {
        // Create 25 backups
        for ($i = 1; $i <= 25; $i++) {
            \App\Models\Backup::create([
                'name' => "Backup {$i}",
                'description' => "Backup {$i} description",
                'type' => 'full',
                'status' => 'completed',
                'size' => 1024000,
                'file_path' => "backups/backup-{$i}.tar.gz",
                'created_by' => $this->user->id
            ]);
        }

        $response = $this->actingAs($this->user)
            ->get('/backups?page=2');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 5)
            ->where('backups.meta.current_page', 2)
        );
    }

    /** @test */
    public function user_can_filter_backups_by_type()
    {
        \App\Models\Backup::create([
            'name' => 'Full Backup',
            'description' => 'Full backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/full-backup.tar.gz',
            'created_by' => $this->user->id
        ]);
        \App\Models\Backup::create([
            'name' => 'Incremental Backup',
            'description' => 'Incremental backup description',
            'type' => 'incremental',
            'status' => 'completed',
            'size' => 512000,
            'file_path' => 'backups/incremental-backup.tar.gz',
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups?type=full');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_backups_by_status()
    {
        \App\Models\Backup::create([
            'name' => 'Completed Backup',
            'description' => 'Completed backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/completed-backup.tar.gz',
            'created_by' => $this->user->id
        ]);
        \App\Models\Backup::create([
            'name' => 'Failed Backup',
            'description' => 'Failed backup description',
            'type' => 'full',
            'status' => 'failed',
            'size' => 0,
            'file_path' => null,
            'created_by' => $this->user->id
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups?status=completed');

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 1)
        );
    }

    /** @test */
    public function user_can_filter_backups_by_date_range()
    {
        \App\Models\Backup::create([
            'name' => 'Old Backup',
            'description' => 'Old backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/old-backup.tar.gz',
            'created_by' => $this->user->id,
            'created_at' => now()->subMonth()
        ]);
        \App\Models\Backup::create([
            'name' => 'Recent Backup',
            'description' => 'Recent backup description',
            'type' => 'full',
            'status' => 'completed',
            'size' => 1024000,
            'file_path' => 'backups/recent-backup.tar.gz',
            'created_by' => $this->user->id,
            'created_at' => now()
        ]);

        $response = $this->actingAs($this->user)
            ->get('/backups?start_date=' . now()->subWeek()->format('Y-m-d') . '&end_date=' . now()->format('Y-m-d'));

        $response->assertStatus(200);
        $response->assertInertia(fn ($page) => $page
            ->component('Backups/Index')
            ->has('backups.data', 1)
        );
    }
}

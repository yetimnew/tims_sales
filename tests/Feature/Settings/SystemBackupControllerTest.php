<?php

namespace Tests\Feature\Settings;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia;
use Mockery;
use Tests\TestCase;

class SystemBackupControllerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        config([
            'backup.backup.destination.disks' => ['local'],
            'backup.backup.name' => 'Laravel',
        ]);

        Storage::fake('local');
    }

    public function test_authorized_user_can_view_backup_page(): void
    {
        Storage::disk('local')->put('Laravel/example.tims', 'encrypted-content');

        $user = User::factory()->create();
        $this->givePermissions($user, ['system.backup']);

        $response = $this->actingAs($user)->get('/settings/backups');

        $response->assertOk();
        $response->assertInertia(function (AssertableInertia $page) {
            $page->component('settings/backups')
                ->has('backups', 1)
                ->where('backups.0.filename', 'example.tims')
                ->where('backups.0.disk', 'local')
                ->where('backups.0.path', 'Laravel/example.tims');
        });
    }

    public function test_user_without_permission_cannot_access_backup_page(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->get('/settings/backups');

        $response->assertForbidden();
    }

    public function test_run_backup_invokes_artisan_command(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['system.backup']);

        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:run', Mockery::subset([
                '--only-db' => true,
                '--no-interaction' => true,
            ]))
            ->andReturn(0);

        $response = $this->actingAs($user)
            ->withHeader('Referer', '/settings/backups')
            ->post('/settings/backups/run');

        $response->assertRedirect('/settings/backups');
        $response->assertSessionHas('success', 'Backup created successfully.');
    }

    public function test_restore_existing_backup(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['system.backup']);

        Storage::disk('local')->put('Laravel/example.tims', 'encrypted-content');

        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:restore', Mockery::on(function (array $arguments) {
                return $arguments['--disk'] === 'local'
                    && $arguments['--backup'] === 'Laravel/example.zip'
                    && $arguments['--no-interaction'] === true;
            }))
            ->andReturn(0);

        $response = $this->actingAs($user)
            ->withHeader('Referer', '/settings/backups')
            ->post('/settings/backups/restore', [
                'disk' => 'local',
                'path' => 'Laravel/example.tims',
            ]);

        $response->assertRedirect('/settings/backups');
        $response->assertSessionHas('success', 'Backup restored successfully.');

        Storage::disk('local')->assertExists('Laravel/example.tims');
        Storage::disk('local')->assertMissing('Laravel/example.zip');
    }

    public function test_restore_from_upload(): void
    {
        $user = User::factory()->create();
        $this->givePermissions($user, ['system.backup']);

        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:restore', Mockery::on(function (array $arguments) {
                return $arguments['--disk'] === 'local'
                    && str_ends_with($arguments['--backup'], '.zip')
                    && $arguments['--no-interaction'] === true;
            }))
            ->andReturn(0);

        $uploaded = UploadedFile::fake()->create('manual-backup.tims', 1024, 'application/zip');

        $response = $this->actingAs($user)
            ->withHeader('Referer', '/settings/backups')
            ->post('/settings/backups/restore/upload', [
                'backup_file' => $uploaded,
            ]);

        $response->assertRedirect('/settings/backups');
        $response->assertSessionHas('success', 'Backup restored from upload.');

        $storedFiles = Storage::disk('local')->files('Laravel/uploads');
        $this->assertCount(1, $storedFiles);
        $this->assertStringEndsWith('.tims', $storedFiles[0]);
        Storage::disk('local')->assertMissing(preg_replace('/\.tims$/', '.zip', $storedFiles[0]));
    }
}

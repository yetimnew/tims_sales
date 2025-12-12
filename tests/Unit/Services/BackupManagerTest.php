<?php

namespace Tests\Unit\Services;

use App\Services\BackupManager;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use RuntimeException;
use Tests\TestCase;

class BackupManagerTest extends TestCase
{
    public function test_run_backup_invokes_artisan_command(): void
    {
        Artisan::shouldReceive('call')
            ->once()
            ->with('backup:run', [
                '--only-db' => true,
                '--no-interaction' => true,
            ]);

        $manager = new BackupManager;

        $manager->runBackup();
    }

    public function test_it_sets_systemroot_when_running_on_windows(): void
    {
        Artisan::shouldReceive('call')->once();

        putenv('SYSTEMROOT');
        unset($_ENV['SYSTEMROOT'], $_SERVER['SYSTEMROOT']);

        $manager = new class extends BackupManager
        {
            protected function runningOnWindows(): bool
            {
                return true;
            }

            protected function resolveSystemRoot(): ?string
            {
                return 'C:\\Windows';
            }
        };

        $manager->runBackup();

        $this->assertSame('C:\\Windows', getenv('SYSTEMROOT'));
        $this->assertSame('C:\\Windows', $_ENV['SYSTEMROOT']);
        $this->assertSame('C:\\Windows', $_SERVER['SYSTEMROOT']);

        putenv('SYSTEMROOT');
        unset($_ENV['SYSTEMROOT'], $_SERVER['SYSTEMROOT']);
    }

    public function test_it_deletes_a_backup_file(): void
    {
        Storage::fake('local');
        Storage::disk('local')->put('laravel-backup/example.tims', 'backup');

        $manager = new BackupManager;

        $manager->deleteBackup('local', 'laravel-backup/example.tims');

        $this->assertFalse(Storage::disk('local')->exists('laravel-backup/example.tims'));
    }

    public function test_it_throws_when_deleting_missing_backup(): void
    {
        Storage::fake('local');

        $manager = new BackupManager;

        $this->expectException(RuntimeException::class);
        $this->expectExceptionMessage('Backup file [laravel-backup/missing.tims] was not found on disk [local].');

        $manager->deleteBackup('local', 'laravel-backup/missing.tims');
    }
}

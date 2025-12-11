<?php

namespace Tests\Unit\Listeners;

use App\Listeners\RenameBackupToTims;
use Illuminate\Support\Facades\Storage;
use Spatie\Backup\BackupDestination\BackupDestination;
use Spatie\Backup\Events\BackupWasSuccessful;
use Tests\TestCase;

class RenameBackupToTimsTest extends TestCase
{
    public function test_it_renames_zip_backups_to_tims(): void
    {
        config([
            'backup.backup.destination.disks' => ['local'],
            'backup.backup.name' => 'Laravel',
        ]);

        Storage::fake('local');
        Storage::disk('local')->put('Laravel/backup-2025-01-01-000000.zip', 'encrypted-content');

        $destination = BackupDestination::create('local', 'Laravel');

        (new RenameBackupToTims)->handle(new BackupWasSuccessful($destination));

        Storage::disk('local')->assertMissing('Laravel/backup-2025-01-01-000000.zip');
        Storage::disk('local')->assertExists('Laravel/backup-2025-01-01-000000.tims');
    }

    public function test_it_ignores_non_zip_backups(): void
    {
        config([
            'backup.backup.destination.disks' => ['local'],
            'backup.backup.name' => 'Laravel',
        ]);

        Storage::fake('local');
        Storage::disk('local')->put('Laravel/manual-archive.tims', 'encrypted-content');

        $destination = BackupDestination::create('local', 'Laravel');

        (new RenameBackupToTims)->handle(new BackupWasSuccessful($destination));

        Storage::disk('local')->assertExists('Laravel/manual-archive.tims');
    }
}

<?php

namespace App\Listeners;

use Illuminate\Support\Str;
use Spatie\Backup\Events\BackupWasSuccessful;

class RenameBackupToTims
{
    public function handle(BackupWasSuccessful $event): void
    {
        $backupDestination = $event->backupDestination;

        $disk = $backupDestination->disk();

        if ($disk === null) {
            return;
        }

        $newestBackup = $backupDestination->fresh()->newestBackup();

        if ($newestBackup === null) {
            return;
        }

        $currentPath = $newestBackup->path();

        if (! Str::endsWith($currentPath, '.zip')) {
            return;
        }

        $renamedPath = preg_replace('/\.zip$/', '.tims', $currentPath);

        if ($renamedPath === null) {
            $renamedPath = $currentPath.'.tims';
        }

        if ($disk->exists($renamedPath)) {
            $disk->delete($renamedPath);
        }

        $disk->move($currentPath, $renamedPath);

        $backupDestination->fresh();
    }
}

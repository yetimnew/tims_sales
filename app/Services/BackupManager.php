<?php

namespace App\Services;

use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class BackupManager
{
    /**
     * @return array<int, string>
     */
    public function disks(): array
    {
        $configured = config('backup.backup.destination.disks', []);

        return array_values(array_filter($configured, static fn ($disk) => is_string($disk) && $disk !== ''));
    }

    public function backupName(): string
    {
        $name = (string) config('backup.backup.name', 'laravel-backup');

        return $name !== '' ? $name : 'laravel-backup';
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function listBackups(): array
    {
        $backups = [];
        $name = $this->backupName();

        foreach ($this->disks() as $diskName) {
            $disk = Storage::disk($diskName);
            $files = $disk->allFiles($name);

            foreach ($files as $path) {
                if (! Str::endsWith($path, '.tims')) {
                    continue;
                }

                $backups[] = [
                    'disk' => $diskName,
                    'path' => $path,
                    'filename' => basename($path),
                    'size' => $disk->size($path),
                    'last_modified' => Carbon::createFromTimestamp($disk->lastModified($path))->toDateTimeString(),
                ];
            }
        }

        usort(
            $backups,
            static fn ($a, $b) => strtotime((string) $b['last_modified']) <=> strtotime((string) $a['last_modified'])
        );

        return $backups;
    }

    public function runBackup(): void
    {
        Artisan::call('backup:run', [
            '--only-db' => true,
            '--no-interaction' => true,
        ]);
    }

    public function restoreFromPath(string $diskName, string $path, bool $cleanupOriginal = false): void
    {
        $disk = Storage::disk($diskName);

        if (! $disk->exists($path)) {
            throw new RuntimeException("Backup file [{$path}] was not found on disk [{$diskName}].");
        }

        $temporaryZipPath = $this->createTemporaryZipCopy($diskName, $path);

        try {
            Artisan::call('backup:restore', [
                '--disk' => $diskName,
                '--backup' => $temporaryZipPath,
                '--no-interaction' => true,
            ]);
        } finally {
            if ($disk->exists($temporaryZipPath)) {
                $disk->delete($temporaryZipPath);
            }

            if ($cleanupOriginal) {
                $disk->delete($path);
            }
        }
    }

    public function storeUpload(UploadedFile $file, ?string $diskName = null): array
    {
        $diskName ??= Arr::first($this->disks()) ?? 'local';
        $directory = $this->backupName().'/uploads';
        $safeName = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME)) ?: 'manual-backup';
        $filename = now()->format('Y-m-d-His').'-'.$safeName.'.tims';

        $path = $file->storeAs($directory, $filename, $diskName);

        if ($path === false) {
            throw new RuntimeException('Failed to store the uploaded backup file.');
        }

        return [
            'disk' => $diskName,
            'path' => $path,
        ];
    }

    private function createTemporaryZipCopy(string $diskName, string $path): string
    {
        $disk = Storage::disk($diskName);

        $zipPath = preg_replace('/\.tims$/', '.zip', $path);

        if ($zipPath === null || $zipPath === $path) {
            $zipPath = $path.'.zip';
        }

        if (! $disk->copy($path, $zipPath)) {
            throw new RuntimeException('Failed to prepare temporary archive for restore.');
        }

        return $zipPath;
    }
}

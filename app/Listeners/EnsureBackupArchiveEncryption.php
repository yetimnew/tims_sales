<?php

namespace App\Listeners;

use RuntimeException;
use Spatie\Backup\Events\BackupZipWasCreated;
use Spatie\Backup\Exceptions\BackupFailed;
use ZipArchive;

class EnsureBackupArchiveEncryption
{
    public function handle(BackupZipWasCreated $event): void
    {
        $password = config('backup.backup.password');

        if (! is_string($password) || trim($password) === '') {
            throw BackupFailed::from(new RuntimeException('Encrypted backups require BACKUP_ARCHIVE_PASSWORD to be configured.'));
        }

        $expectedAlgorithm = $this->resolveExpectedAlgorithm();

        if ($expectedAlgorithm === null) {
            throw BackupFailed::from(new RuntimeException('ZipArchive AES encryption support is missing. Install libzip with AES support to continue.'));
        }

        $zip = new ZipArchive;
        $openResult = $zip->open($event->pathToZip);

        if ($openResult !== true) {
            throw BackupFailed::from(new RuntimeException(
                "Failed to open backup archive [{$event->pathToZip}] for encryption validation. ZipArchive error code: {$openResult}"
            ));
        }

        try {
            $unencryptedEntries = [];

            for ($index = 0; $index < $zip->numFiles; $index++) {
                $stat = $zip->statIndex($index);

                if ($stat === false) {
                    $unencryptedEntries[] = '#'.$index;

                    continue;
                }

                $name = (string) ($stat['name'] ?? ('#'.$index));

                if ($this->isDirectory($name)) {
                    continue;
                }

                $method = $stat['encryption_method'] ?? null;

                if ($method !== $expectedAlgorithm) {
                    $unencryptedEntries[] = $name;
                }
            }

            if ($unencryptedEntries !== []) {
                throw BackupFailed::from(new RuntimeException(
                    'Encrypted backup validation failed; the following entries were not AES encrypted: '.implode(', ', $unencryptedEntries)
                ));
            }
        } catch (\Throwable $exception) {
            $zip->close();

            if (is_file($event->pathToZip)) {
                @unlink($event->pathToZip);
            }

            throw $exception;
        }

        $zip->close();
    }

    private function resolveExpectedAlgorithm(): ?int
    {
        $encryption = config('backup.backup.encryption');

        if ($encryption === 'default') {
            return defined(ZipArchive::class.'::EM_AES_256')
                ? ZipArchive::EM_AES_256
                : null;
        }

        return is_int($encryption) ? $encryption : null;
    }

    private function isDirectory(string $name): bool
    {
        return str_ends_with($name, '/');
    }
}

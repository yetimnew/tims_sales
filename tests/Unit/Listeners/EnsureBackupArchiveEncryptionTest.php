<?php

namespace Tests\Unit\Listeners;

use App\Listeners\EnsureBackupArchiveEncryption;
use Spatie\Backup\Events\BackupZipWasCreated;
use Spatie\Backup\Exceptions\BackupFailed;
use Tests\TestCase;
use ZipArchive;

class EnsureBackupArchiveEncryptionTest extends TestCase
{
    public function test_it_requires_a_backup_password(): void
    {
        config()->set('backup.backup.password', null);

        $listener = new EnsureBackupArchiveEncryption;

        $this->expectException(BackupFailed::class);

        $listener->handle(new BackupZipWasCreated('local/path/to.zip'));
    }

    public function test_it_rejects_archives_without_encryption(): void
    {
        $path = storage_path('app/test-unencrypted.zip');

        $zip = new ZipArchive;
        $this->assertSame(true, $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE));
        $this->assertSame(true, $zip->addFromString('db-dumps/database.sql', 'example content'));
        $zip->close();

        config()->set('backup.backup.password', 'top-secret');
        config()->set('backup.backup.encryption', 'default');

        $listener = new EnsureBackupArchiveEncryption;

        $this->expectException(BackupFailed::class);

        try {
            $listener->handle(new BackupZipWasCreated($path));
        } finally {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }

    public function test_it_allows_aes_encrypted_archives(): void
    {
        if (! defined(ZipArchive::class.'::EM_AES_256')) {
            $this->markTestSkipped('ZipArchive AES encryption is not supported on this system.');
        }

        $path = storage_path('app/test-encrypted.zip');

        $zip = new ZipArchive;
        $this->assertSame(true, $zip->open($path, ZipArchive::CREATE | ZipArchive::OVERWRITE));
        $this->assertSame(true, $zip->addFromString('db-dumps/database.sql', 'example content'));
        $this->assertSame(true, $zip->setPassword('top-secret'));
        if ($zip->setEncryptionName('db-dumps/database.sql', ZipArchive::EM_AES_256) !== true) {
            $zip->close();
            @unlink($path);
            $this->markTestSkipped('ZipArchive could not apply AES-256 encryption.');
        }
        $zip->close();

        config()->set('backup.backup.password', 'top-secret');
        config()->set('backup.backup.encryption', 'default');

        $listener = new EnsureBackupArchiveEncryption;

        try {
            $listener->handle(new BackupZipWasCreated($path));
            $this->assertFileExists($path);
        } finally {
            if (is_file($path)) {
                @unlink($path);
            }
        }
    }
}

# Encrypted Backup Workflow

This document captures the agreed approach for shipping encrypted TIMS backups with a custom `.tims` extension and a guided restore process. Follow these steps before building the UI or automation around backup management.

## 1. Goals

- Protect Spatie backup archives with strong password-based encryption.
- Rename generated archives to `.tims` without altering their encrypted ZIP payload.
- Provide a controlled restore path so only the application (or trusted operators) can decrypt and load backups.

## 2. Prerequisites

1. **Packages**
   - Install `spatie/laravel-backup` for scheduled exports.
   - Install `wnx/laravel-backup-restore` for password-aware restores.
2. **System tooling**
   - Ensure the host running backups has the `zip` binary available; Spatie shells out to it when encrypting.
3. **Secrets**
   - Generate a 32+ character password and add it to `.env` as `BACKUP_ARCHIVE_PASSWORD`.
4. **Permissions**
  - Create a dedicated permission such as `system.backup` and assign it to the Admin role only.
  - Gate controller routes and Inertia pages behind this permission so users without it never see backup or restore controls.

## 3. Implementation Steps

### 3.1 Enable Encryption in Spatie Backup

- Publish the package config: `php artisan vendor:publish --tag=backup-config --no-interaction`.
- Edit `config/backup.php`:
  ```php
  'backup' => [
      'password' => env('BACKUP_ARCHIVE_PASSWORD'),
      'encryption' => 'default',
  ],
  ```
- Confirm each configured backup disk also inherits or overrides the password as needed.
- Validate with `php artisan backup:run` and confirm the resulting archive cannot be opened without the password.

### 3.2 Rename Archives to `.tims`

- Create `app/Listeners/RenameBackupToTims.php` via `php artisan make:listener RenameBackupToTims --no-interaction`.
- In the listener’s `handle(BackupWasSuccessful $event)` method:
  - Resolve the disk with `Storage::disk($event->backupDestination->diskName())`.
  - Compute the new path by swapping `.zip` for `.tims` (fallback to appending when no match).
  - Move the file if it exists and the renamed target is free.
- Register the listener in `AppServiceProvider::boot()` using `Event::listen(BackupWasSuccessful::class, [RenameBackupToTims::class, 'handle']);`.
- Rerun the backup command and confirm the artifact is now saved as `*.tims`.

### 3.3 Controlled Restore Flow

- Require `wnx/laravel-backup-restore` and verify `backup:restore` appears in Artisan.
- Build an admin-only controller/UI that:
  - Authorises access via the new `system.backup` permission (use policies or middleware).
  - Lists available `.tims` files from the backup disk.
  - On restore, calls `Artisan::call('backup:restore', ['--backup' => $path, '--no-interaction' => true]);`.
  - Relies on `config('backup.backup.password')` so the same password decrypts the archive.
- Optionally queue the restore command to avoid long-running HTTP requests and surface status to the operator (notification, broadcast, or log entry).

## 4. Verification Checklist

- [ ] `.env` contains `BACKUP_ARCHIVE_PASSWORD` and it is injected into config cache.
- [ ] `php artisan backup:run --only-db` produces an encrypted archive ending in `.tims`.
- [ ] Attempting to unzip the file manually prompts for the configured password.
- [ ] Running `php artisan backup:restore --backup=latest --no-interaction` succeeds and reloads the database.
- [ ] The UI route for backups and restores is restricted to users with the `system.backup` permission.

## 5. Operational Notes

- Rotate `BACKUP_ARCHIVE_PASSWORD` on a defined cadence; document the rotation process because existing archives stay tied to the old password.
- Mirror the `.tims` files to off-site storage after encryption to maintain disaster recovery coverage.
- Log backup and restore attempts for auditability (e.g., use Spatie events for notifications or Telescope for quick inspection).
- After code changes touching this workflow, run targeted tests: the listener unit test, any feature tests for the restore UI, and a smoke backup command in a staging environment.

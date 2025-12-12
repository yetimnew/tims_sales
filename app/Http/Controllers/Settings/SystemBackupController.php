<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Services\BackupManager;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class SystemBackupController extends Controller
{
    public function __construct(private readonly BackupManager $backupManager) {}

    public function index(Request $request): Response
    {
        Gate::authorize('system.backup');

        $backups = array_map(
            fn (array $backup) => [
                'disk' => $backup['disk'],
                'path' => $backup['path'],
                'filename' => $backup['filename'],
                'size' => $backup['size'],
                'size_human' => $this->formatSize($backup['size']),
                'last_modified' => $backup['last_modified'],
            ],
            $this->backupManager->listBackups()
        );

        return Inertia::render('settings/backups', [
            'backups' => $backups,
            'disks' => $this->backupManager->disks(),
        ]);
    }

    public function run(Request $request): RedirectResponse
    {
        Gate::authorize('system.backup');

        try {
            $this->backupManager->runBackup();
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'backup' => 'We could not create a backup right now. Please try again.',
            ]);
        }

        return back()->with('success', 'Backup created successfully.');
    }

    public function restoreUpload(Request $request): RedirectResponse
    {
        Gate::authorize('system.backup');

        /** @var UploadedFile|null $uploaded */
        $uploaded = $request->file('backup_file');

        $request->validate([
            'backup_file' => [
                'required',
                File::default()
                    ->max(1024 * 500)
                    ->types(['application/zip', 'application/x-zip-compressed'])
                    ->extensions(['tims']),
            ],
        ]);

        if ($uploaded === null) {
            return back()->withErrors([
                'backup_file' => 'Please provide a backup file to restore.',
            ]);
        }

        try {
            $location = $this->backupManager->storeUpload($uploaded);
            $this->backupManager->restoreFromPath($location['disk'], $location['path']);
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'backup_file' => 'Restoring the uploaded backup failed. Review the archive and try again.',
            ]);
        }

        return back()->with('success', 'Backup restored from upload.');
    }

    public function restoreExisting(Request $request): RedirectResponse
    {
        Gate::authorize('system.backup');

        $validated = $request->validate([
            'disk' => [
                'required',
                'string',
                Rule::in($this->backupManager->disks()),
            ],
            'path' => ['required', 'string'],
        ]);

        if (! Str::endsWith($validated['path'], '.tims')) {
            return back()->withErrors([
                'path' => 'Only .tims archives created by the system can be restored.',
            ]);
        }

        if (! Storage::disk($validated['disk'])->exists($validated['path'])) {
            return back()->withErrors([
                'path' => 'The selected backup file could not be found.',
            ]);
        }

        try {
            $this->backupManager->restoreFromPath($validated['disk'], $validated['path']);
        } catch (RuntimeException $exception) {
            report($exception);

            return back()->withErrors([
                'path' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'path' => 'Restoring the selected backup failed. Please try again.',
            ]);
        }

        return back()->with('success', 'Backup restored successfully.');
    }

    public function download(Request $request): StreamedResponse
    {
        Gate::authorize('system.backup');

        $disk = $request->query('disk');
        $path = $request->query('path');

        if (! is_string($disk) || ! in_array($disk, $this->backupManager->disks(), true)) {
            abort(404);
        }

        if (! is_string($path) || ! Str::endsWith($path, '.tims')) {
            abort(404);
        }

        $storage = Storage::disk($disk);

        if (! $storage->exists($path)) {
            abort(404);
        }

        $filename = basename($path);

        return $storage->download($path, $filename, [
            'Content-Type' => 'application/octet-stream',
        ]);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Gate::authorize('system.backup');

        $validated = $request->validate([
            'disk' => [
                'required',
                'string',
                Rule::in($this->backupManager->disks()),
            ],
            'path' => ['required', 'string'],
        ]);

        if (! Str::endsWith($validated['path'], '.tims')) {
            return back()->withErrors([
                'path' => 'Only backups created by the system can be removed.',
            ]);
        }

        try {
            $this->backupManager->deleteBackup($validated['disk'], $validated['path']);
        } catch (RuntimeException $exception) {
            report($exception);

            return back()->withErrors([
                'path' => $exception->getMessage(),
            ]);
        } catch (Throwable $exception) {
            report($exception);

            return back()->withErrors([
                'path' => 'We could not remove that backup right now. Please try again.',
            ]);
        }

        return back()->with('success', 'Backup deleted successfully.');
    }

    private function formatSize(int|float $bytes): string
    {
        $bytes = (float) $bytes;

        if ($bytes <= 0) {
            return '0 B';
        }

        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $power = (int) floor(log($bytes, 1024));
        $power = min($power, count($units) - 1);

        $formatted = $bytes / pow(1024, $power);

        return number_format($formatted, $power === 0 ? 0 : 2).' '.$units[$power];
    }
}

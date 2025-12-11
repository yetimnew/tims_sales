import { useMemo, useState } from 'react';
import { Head, Form, router, usePage } from '@inertiajs/react';
import SystemBackupController from '@/actions/App/Http/Controllers/Settings/SystemBackupController';
import backupsRoutes from '@/routes/settings/backups';
import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';
import HeadingSmall from '@/components/heading-small';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Loader2, RefreshCcw, ShieldCheck, Upload, History } from 'lucide-react';

interface BackupRecord {
    disk: string;
    path: string;
    filename: string;
    size: number;
    size_human: string;
    last_modified: string;
}

type PageProps = {
    flash?: { success?: string; error?: string };
    errors?: Record<string, string>;
};

type Props = {
    backups: BackupRecord[];
    disks: string[];
};

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'System backups',
        href: backupsRoutes.index().url,
    },
];

const formatDateTime = (value: string): string => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
};

export default function BackupSettings({ backups, disks }: Props) {
    const page = usePage<PageProps>();
    const [restoringPath, setRestoringPath] = useState<string | null>(null);

    const backupError = page.props.errors?.backup;
    const restoreError = page.props.errors?.path;
    const uploadError = page.props.errors?.backup_file;

    const latestBackup = useMemo(() => backups.at(0) ?? null, [backups]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System backups" />

            <SettingsLayout>
                <div className="space-y-8">
                    <HeadingSmall
                        title="System backup management"
                        description="Create encrypted .tims backups and restore them directly from the TIMS admin console."
                    />

                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <ShieldCheck className="h-5 w-5" />
                                    Create new backup
                                </CardTitle>
                                <CardDescription>
                                    Generates an encrypted archive using the configured BACKUP_ARCHIVE_PASSWORD and stores it in the backup disk.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Form
                                    {...SystemBackupController.run.form()}
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <div className="flex items-center gap-3">
                                            <Button type="submit" disabled={processing} className="gap-2">
                                                {processing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <RefreshCcw className="h-4 w-4" />
                                                )}
                                                {processing ? 'Creating backup…' : 'Create backup now'}
                                            </Button>
                                            <InputError message={backupError} />
                                        </div>
                                    )}
                                </Form>

                                <dl className="grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div className="flex items-center justify-between">
                                        <dt>Destination disks</dt>
                                        <dd className="font-medium text-slate-900 dark:text-slate-100">
                                            {disks.length ? disks.join(', ') : '—'}
                                        </dd>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <dt>Latest backup</dt>
                                        <dd className="font-medium text-slate-900 dark:text-slate-100">
                                            {latestBackup ? formatDateTime(latestBackup.last_modified) : 'No backups yet'}
                                        </dd>
                                    </div>
                                </dl>
                            </CardContent>
                        </Card>

                        <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Upload className="h-5 w-5" />
                                    Restore from uploaded backup
                                </CardTitle>
                                <CardDescription>
                                    Upload an encrypted .tims archive created by TIMS to restore the database.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...SystemBackupController.restoreUpload.form()}
                                    encType="multipart/form-data"
                                    options={{ preserveScroll: true }}
                                >
                                    {({ processing }) => (
                                        <div className="space-y-3">
                                            <div>
                                                <Input type="file" name="backup_file" accept=".tims" />
                                                <InputError message={uploadError} />
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <Button type="submit" disabled={processing} className="gap-2">
                                                    {processing ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Upload className="h-4 w-4" />
                                                    )}
                                                    {processing ? 'Restoring…' : 'Restore uploaded backup'}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>
                    </div>

                    <Card className="border border-slate-200 bg-white/95 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader>
                            <CardTitle className="text-lg">Existing backups</CardTitle>
                            <CardDescription>
                                Manage encrypted backups generated by TIMS. Restoring will overwrite the current database.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="min-w-[220px]">Filename</TableHead>
                                            <TableHead>Disk</TableHead>
                                            <TableHead>Size</TableHead>
                                            <TableHead>Created</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {backups.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                                    No backups found yet. Create one to get started.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            backups.map((backup) => (
                                                <TableRow key={`${backup.disk}-${backup.path}`}>
                                                    <TableCell className="font-medium">{backup.filename}</TableCell>
                                                    <TableCell>{backup.disk}</TableCell>
                                                    <TableCell>{backup.size_human}</TableCell>
                                                    <TableCell>{formatDateTime(backup.last_modified)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            className="gap-2"
                                                            disabled={restoringPath === backup.path}
                                                            onClick={() => {
                                                                setRestoringPath(backup.path);
                                                                router.post(
                                                                    SystemBackupController.restoreExisting.url(),
                                                                    {
                                                                        disk: backup.disk,
                                                                        path: backup.path,
                                                                    },
                                                                    {
                                                                        preserveScroll: true,
                                                                        onFinish: () => setRestoringPath(null),
                                                                    }
                                                                );
                                                            }}
                                                        >
                                                            {restoringPath === backup.path ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <History className="h-4 w-4" />
                                                            )}
                                                            Restore
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {restoreError ? (
                                <p className="text-sm text-rose-600 dark:text-rose-400">{restoreError}</p>
                            ) : null}
                        </CardContent>
                    </Card>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}

import { useMemo, useState } from 'react';
import { Form, router, usePage } from '@inertiajs/react';
import SystemBackupController from '@/actions/App/Http/Controllers/Settings/SystemBackupController';
import backupsRoutes from '@/routes/settings/backups';
import ListPageLayout from '@/components/layouts/list-page-layout';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ListingStatsHeader, type ListingStatDefinition } from '@/components/listing/stats-header';
import { ListingTableShell, type ListingTableColumn } from '@/components/listing/data-table-shell';
import { TableCell, TableRow } from '@/components/ui/table';
import { type BreadcrumbItem } from '@/types';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Download, History, Loader2, RefreshCcw, Trash2, Upload } from 'lucide-react';

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

const columns: ListingTableColumn[] = [
    {
        id: 'filename',
        label: 'Filename',
        className: 'min-w-[220px]',
    },
    {
        id: 'disk',
        label: 'Disk',
        className: 'min-w-[120px]',
    },
    {
        id: 'size',
        label: 'Size',
        className: 'min-w-[120px]',
    },
    {
        id: 'created',
        label: 'Created',
        className: 'min-w-[160px]',
    },
    {
        id: 'actions',
        label: 'Actions',
        align: 'right',
        className: 'min-w-[160px]',
    },
];

const formatDateTime = (value: string): string => {
    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return value;
    }

    return parsed.toLocaleString();
};

const formatBytes = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) {
        return '0 B';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(value) / Math.log(1024)), units.length - 1);
    const formatted = value / Math.pow(1024, exponent);

    return `${formatted.toFixed(exponent === 0 ? 0 : 2)} ${units[exponent]}`;
};

export default function BackupSettings({ backups, disks }: Props) {
    const page = usePage<PageProps>();
    const [restoringPath, setRestoringPath] = useState<string | null>(null);
    const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
    const [deletingPath, setDeletingPath] = useState<string | null>(null);
    const { toast } = useToast();

    const backupError = page.props.errors?.backup;
    const restoreError = page.props.errors?.path;
    const uploadError = page.props.errors?.backup_file;

    const latestBackup = useMemo(() => backups.at(0) ?? null, [backups]);
    const totalSize = useMemo(() => backups.reduce((accumulator, backup) => accumulator + backup.size, 0), [backups]);
    const statsDefinitions = useMemo<ListingStatDefinition[]>(() => {
        const formatter = new Intl.NumberFormat();

        return [
            {
                id: 'total-backups',
                label: 'Backups Available',
                value: formatter.format(backups.length),
                description: 'Encrypted TIMS archives ready to download or restore.',
            },
            {
                id: 'latest-backup',
                label: 'Latest Backup',
                value: latestBackup ? formatDateTime(latestBackup.last_modified) : '—',
                description: latestBackup ? latestBackup.disk : 'No backups generated yet.',
            },
            {
                id: 'storage-usage',
                label: 'Storage Usage',
                value: formatBytes(totalSize),
                description: 'Combined size of stored backups.',
            },
            {
                id: 'destination-disks',
                label: 'Destination Disks',
                value: disks.length ? disks.join(', ') : '—',
                description: 'Configured storage targets for new backups.',
            },
        ];
    }, [backups, disks, latestBackup, totalSize]);

    const extractFilename = (disposition: string | null, fallback: string): string => {
        if (!disposition) {
            return fallback;
        }

        const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);

        if (utf8Match?.[1]) {
            try {
                return decodeURIComponent(utf8Match[1]);
            } catch (error) {
                console.error('Failed to decode filename from header', error);
            }
        }

        const asciiMatch = disposition.match(/filename="?([^";]+)"?/i);

        return asciiMatch?.[1] ?? fallback;
    };

    const handleDownload = async (backup: BackupRecord): Promise<void> => {
        setDownloadingPath(backup.path);

        try {
            const response = await fetch(
                SystemBackupController.download.url({
                    query: {
                        disk: backup.disk,
                        path: backup.path,
                    },
                }),
                {
                    credentials: 'include',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Download failed');
            }

            const blob = await response.blob();
            const filename = extractFilename(response.headers.get('Content-Disposition'), backup.filename);
            const url = window.URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = filename;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            window.URL.revokeObjectURL(url);

            toast({
                title: 'Download started',
                description: `${filename} is being saved to your device.`,
                variant: 'success',
            });
        } catch (error) {
            console.error('Backup download failed', error);
            toast({
                title: 'Download failed',
                description: 'Please try again in a moment.',
                variant: 'destructive',
            });
        } finally {
            setDownloadingPath(null);
        }
    };

    const handleDelete = (backup: BackupRecord): void => {
        setDeletingPath(backup.path);

        router.delete(SystemBackupController.destroy.url(), {
            preserveScroll: true,
            data: {
                disk: backup.disk,
                path: backup.path,
            },
            onSuccess: () => {
                toast({
                    title: 'Backup deleted',
                    description: `${backup.filename} has been removed.`,
                    variant: 'success',
                });
            },
            onError: () => {
                toast({
                    title: 'Delete failed',
                    description: 'We could not remove that backup. Please try again.',
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setDeletingPath(null);
            },
        });
    };

    return (
        <ListPageLayout
            title="System Backups"
            description="Manage encrypted TIMS archives without leaving the main console."
            headTitle="System backups"
            breadcrumbs={breadcrumbs}
            tableTitle="Available backups"
            tableDescription="Download, restore, or delete encrypted archives. Restoring immediately replaces the current database."
            actions={
                <div className="flex flex-col items-end gap-2">
                    <Form action={SystemBackupController.run.url()} method="post" options={{ preserveScroll: true }}>
                        {({ processing }) => (
                            <Button type="submit" disabled={processing} className="gap-2">
                                {processing ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCcw className="h-4 w-4" />
                                )}
                                {processing ? 'Creating backup…' : 'Create backup'}
                            </Button>
                        )}
                    </Form>
                    {backupError ? (
                        <InputError message={backupError} />
                    ) : null}
                </div>
            }
            stats={
                <div className="space-y-4">
                    <ListingStatsHeader stats={statsDefinitions} orientation="row" />
                    <Card className="border border-slate-200 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/70">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Upload className="h-4 w-4" />
                                Restore from uploaded backup
                            </CardTitle>
                            <CardDescription>
                                Upload a TIMS-generated archive to restore the database from your device.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                action={SystemBackupController.restoreUpload.url()}
                                method="post"
                                encType="multipart/form-data"
                                options={{ preserveScroll: true }}
                            >
                                {({ processing }) => (
                                    <div className="space-y-3">
                                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                                            <Input type="file" name="backup_file" accept=".tims" className="max-w-xs" />
                                            <Button type="submit" disabled={processing} className="gap-2">
                                                {processing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Upload className="h-4 w-4" />
                                                )}
                                                {processing ? 'Restoring…' : 'Restore upload'}
                                            </Button>
                                        </div>
                                        <InputError message={uploadError} />
                                    </div>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                </div>
            }
        >
            <TooltipProvider delayDuration={150}>
                <ListingTableShell columns={columns}>
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
                                    <div className="flex items-center justify-end gap-2">
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    disabled={downloadingPath === backup.path}
                                                    onClick={() => handleDownload(backup)}
                                                    aria-label={`Download ${backup.filename}`}
                                                >
                                                    {downloadingPath === backup.path ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Download className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Download
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
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
                                                    aria-label={`Restore ${backup.filename}`}
                                                >
                                                    {restoringPath === backup.path ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <History className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Restore
                                            </TooltipContent>
                                        </Tooltip>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-rose-500 hover:text-rose-500"
                                                    disabled={deletingPath === backup.path}
                                                    onClick={() => handleDelete(backup)}
                                                    aria-label={`Delete ${backup.filename}`}
                                                >
                                                    {deletingPath === backup.path ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Trash2 className="h-4 w-4" />
                                                    )}
                                                </Button>
                                            </TooltipTrigger>
                                            <TooltipContent side="top">
                                                Delete
                                            </TooltipContent>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                    {restoreError ? (
                        <TableRow className="bg-rose-50/70 dark:bg-rose-950/30">
                            <TableCell colSpan={5} className="py-3 text-sm text-rose-600 dark:text-rose-300">
                                {restoreError}
                            </TableCell>
                        </TableRow>
                    ) : null}
                </ListingTableShell>
            </TooltipProvider>
        </ListPageLayout>
    );
}

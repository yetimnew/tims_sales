import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Activity,
    CheckCircle,
    AlertCircle,
    Calendar,
    Clock,
    BarChart3,
    Target,
    Navigation,
    FileText,
    User,
    MapPin,
    History,
    Hash,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations' },
];

interface User { id: number; name: string; }
interface ActivityLog { id: number; description: string; event: string; created_at: string; causer?: User; }
interface Operation {
    id: number; operationid: string; description?: string; status: string;
    startdate?: string; enddate?: string; volume?: number; km?: number; tariff?: number;
    closed?: boolean; created_at: string;
    customer?: { id: number; name: string };
    region?: { id: number; name: string };
    user?: { id: number; name: string };
}
interface OperationsShowProps { operation: Operation; activityLogs?: ActivityLog[]; }

export default function OperationsShow({ operation, activityLogs = [] }: OperationsShowProps) {
    const { hasPermission } = usePermissions();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/operations/${operation.id}`, {
            onSuccess: () => { setDeleteDialogOpen(false); setIsDeleting(false); },
            onError: () => { setIsDeleting(false); },
        });
    };

    const getStatusBadgeColor = (status: string | undefined | null) => {
        if (!status) {
            return 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700';
        }

        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800';
            case 'pending':
                return 'bg-amber-100 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800';
            case 'cancelled':
            case 'inactive':
                return 'bg-rose-100 text-rose-700 border border-rose-200 dark:bg-rose-900/30 dark:text-rose-200 dark:border-rose-800';
            default:
                return 'bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800';
        }
    };

    const formatDate = (value?: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatNumber = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const capitalize = (value?: string | null) => {
        if (!value) return 'Unknown';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Operation: ${operation.operationid}`} />
            <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl p-4">
                {/* Hero Header */}
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 via-purple-50 to-blue-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-purple-950/30 dark:to-blue-950/30">
                    <div className="flex flex-wrap items-center justify-between gap-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/operations')}
                                className="flex items-center gap-2 border-slate-300 bg-white/60 backdrop-blur hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/40 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Operations
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                                    <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{operation.operationid}</h1>
                                        <Badge className={`flex items-center gap-1 border text-sm font-medium ${getStatusBadgeColor(operation.status)}`}>
                                            {operation.status && <CheckCircle className="h-3.5 w-3.5" />}
                                            {capitalize(operation.status)}
                                        </Badge>
                                        <Badge className={`flex items-center gap-1 border text-sm font-medium ${operation.closed ? 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800' : 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:border-amber-800'}`}>
                                            {operation.closed ? <CheckCircle className="h-3.5 w-3.5" /> : <AlertCircle className="h-3.5 w-3.5" />}
                                            {operation.closed ? 'Closed' : 'Open'}
                                        </Badge>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Comprehensive view of the operation lifecycle and performance indicators.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-300">
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-900/50">
                                            <User className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                                            {operation.customer?.name || 'Unknown Customer'}
                                        </span>
                                        <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-900/50">
                                            <MapPin className="h-3.5 w-3.5 text-purple-600 dark:text-purple-300" />
                                            {operation.region?.name || 'No Region Assigned'}
                                        </span>
                                        {operation.user?.name && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-900/50">
                                                <Activity className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                                                Owner: {operation.user.name}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(hasPermission('operations.edit') || hasPermission('operations.destroy')) && (
                            <div className="flex flex-wrap items-center gap-2">
                                {hasPermission('operations.edit') && (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="gap-2 border-slate-300 bg-white/70 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:bg-slate-900/50 dark:hover:border-blue-700 dark:hover:bg-slate-800"
                                    >
                                        <Link href={`/operations/${operation.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                            Edit Operation
                                        </Link>
                                    </Button>
                                )}
                                {hasPermission('operations.destroy') && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="flex-1 space-y-6">
                            {/* Overview */}
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                                        Operation Overview
                                    </CardTitle>
                                    <CardDescription>Core identifiers, partners, and timeline</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Operation Reference</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{operation.operationid}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Internal identifier</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                                            <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
                                                <CheckCircle className="h-3.5 w-3.5" />
                                                {capitalize(operation.status)}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current lifecycle position</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Customer</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.customer?.name || 'N/A'}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Primary business partner</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Region</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.region?.name || 'N/A'}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Operational coverage</p>
                                        </div>
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Start Date</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                <Calendar className="h-4 w-4 text-blue-500" />
                                                {formatDate(operation.startdate)}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Planned kickoff</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">End Date</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                <Calendar className="h-4 w-4 text-purple-500" />
                                                {formatDate(operation.enddate)}
                                            </div>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Projected completion</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Metrics */}
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-emerald-100/70 dark:from-emerald-950/20 dark:to-emerald-900/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                        Key Metrics
                                    </CardTitle>
                                    <CardDescription>Operational volume, coverage, and tariff performance</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-4 sm:grid-cols-3">
                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Volume (MT)</p>
                                            <div className="mt-2 flex items-baseline gap-2">
                                                <Target className="h-4 w-4 text-emerald-500" />
                                                <span className="text-xl font-bold text-emerald-700 dark:text-emerald-200">{formatNumber(operation.volume)}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-300/80">Planned cargo throughput</p>
                                        </div>
                                        <div className="rounded-xl border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-800 dark:bg-sky-900/20">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">Distance (KM)</p>
                                            <div className="mt-2 flex items-baseline gap-2">
                                                <Navigation className="h-4 w-4 text-sky-500" />
                                                <span className="text-xl font-bold text-sky-700 dark:text-sky-200">{formatNumber(operation.km)}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-sky-600/80 dark:text-sky-300/80">Total route coverage</p>
                                        </div>
                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/20">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">Tariff</p>
                                            <div className="mt-2 flex items-baseline gap-2">
                                                <BarChart3 className="h-4 w-4 text-amber-500" />
                                                <span className="text-xl font-bold text-amber-700 dark:text-amber-200">{formatNumber(operation.tariff)}</span>
                                            </div>
                                            <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-300/80">Revenue per movement</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Description */}
                            {operation.description && (
                                <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                                    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <FileText className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                            Narrative Overview
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                                            {operation.description}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            {/* Activity Logs */}
                            {activityLogs.length > 0 && (
                                <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                                    <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <History className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                                            Activity History
                                        </CardTitle>
                                        <CardDescription>Auditable timeline of changes to this record</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <div className="space-y-4">
                                            {activityLogs.map((log) => (
                                                <div
                                                    key={log.id}
                                                    className="flex flex-col gap-2 rounded-xl border border-purple-100 bg-white/70 p-4 shadow-sm dark:border-purple-900/40 dark:bg-purple-950/20 md:flex-row md:items-center md:justify-between"
                                                >
                                                    <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                                                        <div className="flex flex-col text-xs font-semibold uppercase tracking-wide text-purple-600 dark:text-purple-300">
                                                            <span>{formatDate(log.created_at)}</span>
                                                            <span className="text-[11px] font-normal text-purple-500/80 dark:text-purple-200/70">
                                                                {new Date(log.created_at).toLocaleTimeString()}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-slate-800 dark:text-slate-100">{log.causer?.name || 'System'}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-300">{log.description}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        {/* Sidebar */}
                        <div className="w-full space-y-4 lg:w-80">
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                                    <CardDescription>At-a-glance administrative details</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5">
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <CheckCircle className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Status</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{capitalize(operation.status)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <Hash className="mt-0.5 h-4 w-4 text-purple-600 dark:text-purple-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Internal ID</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <Calendar className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Created</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(operation.created_at)}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        {operation.closed ? (
                                            <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        ) : (
                                            <AlertCircle className="mt-0.5 h-4 w-4 text-amber-600 dark:text-amber-300" />
                                        )}
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Closed</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.closed ? 'Yes' : 'No'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20">
                                    <CardTitle className="text-lg font-semibold">Stakeholders</CardTitle>
                                    <CardDescription>Key contacts linked to this operation</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-5">
                                    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Customer</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.customer?.name || 'Not assigned'}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Region</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.region?.name || 'Not specified'}</p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Account Owner</p>
                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.user?.name || 'System'}</p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                    <CardTitle className="text-lg font-semibold">Key Dates</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 p-5 text-sm text-slate-700 dark:text-slate-200">
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-blue-500" />
                                            Start Date
                                        </span>
                                        <span className="font-semibold">{formatDate(operation.startdate)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-indigo-500" />
                                            End Date
                                        </span>
                                        <span className="font-semibold">{formatDate(operation.enddate)}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-slate-500" />
                                            Created On
                                        </span>
                                        <span className="font-semibold">{formatDate(operation.created_at)}</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Operation"
                description={`Are you sure you want to delete operation ${operation.operationid}? This action cannot be undone.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

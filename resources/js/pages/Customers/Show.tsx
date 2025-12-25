import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { toast } from '@/hooks/use-toast';
import {
    ArrowLeft,
    Edit,
    Trash2,
    Phone,
    Mail,
    MapPin,
    Activity,
    Target,
    Calendar,
    Building2,
    User,
    Navigation,
    PiggyBank,
    Hash,
    History,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Customers', href: '/customers' },
];

interface User { id: number; name: string; }
interface ActivityLog { id: number; description: string; event: string; created_at: string; causer?: User; }
interface Customer { id: number; name: string; contact_person?: string; phone?: string; email?: string; address?: string; status: string; created_at: string; }
interface ActiveOperation {
    id: number;
    operationid: string;
    status: string;
    startdate?: string | null;
    enddate?: string | null;
    volume?: number | null;
    km?: number | null;
    tariff?: number | null;
    totalTrips: number;
    completedTrips: number;
    inProgressTrips: number;
    deliveredTonnage: number;
    remainingTonnage: number;
    completionRate: number | null;
    totalDistance: number;
    totalCost: number;
    lastDispatch?: string | null;
}
interface CustomersShowProps {
    customer: Customer;
    activityLogs?: ActivityLog[];
    activeOperations?: ActiveOperation[];
    activeOperationsCount?: number;
}

export default function CustomersShow({ customer, activityLogs = [], activeOperations = [], activeOperationsCount }: CustomersShowProps) {
    const { hasPermission } = usePermissions();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/customers/${customer.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: '✅ Customer Deleted',
                    description: `${customer.name} has been removed successfully.`,
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const errorMessage = errors && typeof errors === 'object' && 'message' in errors
                    ? String(errors.message)
                    : 'An unexpected error occurred while deleting the customer.';
                toast({
                    title: '❌ Delete Failed',
                    description: errorMessage,
                    variant: 'destructive',
                });
            },
        });
    };

    const getStatusColor = (status: string) => {
        return status === 'active'
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
    };

    const formatDate = (value?: string | null) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return 'N/A';
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions) => {
        if (value === null || value === undefined) return 'N/A';
        return Number(value).toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
            ...options,
        });
    };

    const activeOpsCount = activeOperationsCount ?? activeOperations.length;

    const aggregate = activeOperations.reduce(
        (acc, operation) => {
            acc.totalTrips += operation.totalTrips;
            acc.completedTrips += operation.completedTrips;
            acc.inProgressTrips += operation.inProgressTrips;
            acc.totalVolume += operation.volume ?? 0;
            acc.deliveredVolume += operation.deliveredTonnage ?? 0;
            acc.totalDistance += operation.totalDistance ?? 0;
            acc.totalCost += operation.totalCost ?? 0;
            return acc;
        },
        {
            totalTrips: 0,
            completedTrips: 0,
            inProgressTrips: 0,
            totalVolume: 0,
            deliveredVolume: 0,
            totalDistance: 0,
            totalCost: 0,
        }
    );

    const deliveredPercentage = aggregate.totalVolume > 0
        ? Math.min(Math.max((aggregate.deliveredVolume / aggregate.totalVolume) * 100, 0), 100)
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Customer: ${customer.name}`} />
            <div className="flex h-full flex-1 flex-col overflow-hidden rounded-xl p-4">
                <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 via-sky-50 to-indigo-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900/60 dark:to-indigo-950/30">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex flex-wrap items-start gap-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/customers')}
                                className="flex items-center gap-2 border-slate-300 bg-white/60 backdrop-blur hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/40 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Customers
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="rounded-2xl bg-white/70 p-3 shadow-sm dark:bg-slate-900/60">
                                    <Building2 className="h-6 w-6 text-indigo-600 dark:text-indigo-300" />
                                </div>
                                <div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{customer.name}</h1>
                                        <Badge className={`flex items-center gap-1 border text-sm font-medium ${getStatusColor(customer.status)}`}>
                                            {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                                        </Badge>
                                        {activeOpsCount > 0 && (
                                            <Badge className="flex items-center gap-1 border text-sm font-medium bg-blue-100 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/30 dark:text-blue-200">
                                                <Activity className="h-3.5 w-3.5" />
                                                {activeOpsCount} active operations
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                        Strategic partner overview and live operation performance snapshot.
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600 dark:text-slate-300">
                                        {customer.contact_person && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-medium shadow-sm dark:bg-slate-900/40">
                                                <User className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-300" />
                                                {customer.contact_person}
                                            </span>
                                        )}
                                        {customer.phone && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-medium shadow-sm dark:bg-slate-900/40">
                                                <Phone className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-300" />
                                                {customer.phone}
                                            </span>
                                        )}
                                        {customer.email && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 font-medium shadow-sm dark:bg-slate-900/40">
                                                <Mail className="h-3.5 w-3.5 text-blue-600 dark:text-blue-300" />
                                                {customer.email}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(hasPermission('customers.edit') || hasPermission('customers.destroy')) && (
                            <div className="flex flex-wrap items-center gap-2">
                                {hasPermission('customers.edit') && (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="gap-2 border-slate-300 bg-white/70 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:bg-slate-900/50 dark:hover:border-indigo-700 dark:hover:bg-slate-800"
                                    >
                                        <Link href={`/customers/${customer.id}/edit`}>
                                            <Edit className="h-4 w-4" />
                                            Edit Customer
                                        </Link>
                                    </Button>
                                )}
                                {hasPermission('customers.destroy') && (
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

                    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Active Operations</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{activeOpsCount}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Currently monitored engagements</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Trips Completed</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{aggregate.completedTrips}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Across all active operations</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Delivered Volume</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">{formatNumber(aggregate.deliveredVolume)} MT</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Against planned commitments</p>
                        </div>
                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Volume Completion</p>
                            <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-slate-100">
                                {deliveredPercentage !== null ? `${deliveredPercentage.toFixed(1)}%` : 'N/A'}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Aggregate delivery progress</p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1">
                    <div className="flex flex-col gap-6 lg:flex-row">
                        <div className="flex-1 space-y-6">
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                        Customer Overview
                                    </CardTitle>
                                    <CardDescription>Core identifiers and relationship contacts</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Customer Name</p>
                                            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{customer.name}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Primary account reference</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Customer Status</p>
                                            <Badge className={`mt-3 w-fit ${getStatusColor(customer.status)}`}>
                                                {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                                            </Badge>
                                            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Operational availability</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Contact Person</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{customer.contact_person || 'N/A'}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Primary liaison</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Email</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{customer.email || 'N/A'}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Send reports and updates</p>
                                        </div>
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Phone</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{customer.phone || 'N/A'}</p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Support & escalation</p>
                                        </div>
                                        <div className="rounded-xl border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Account Created</p>
                                            <div className="mt-2 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                <Calendar className="h-4 w-4 text-indigo-500" />
                                                {formatDate(customer.created_at)}
                                            </div>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Relationship inception</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {customer.address && (
                                <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                    <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <MapPin className="h-5 w-5 text-slate-600 dark:text-slate-300" />
                                            Address Details
                                        </CardTitle>
                                        <CardDescription>Physical location on record</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200 whitespace-pre-wrap">
                                            {customer.address}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}

                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Activity className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                        Active Operations
                                    </CardTitle>
                                    <CardDescription>Snapshot of live engagements and their progress</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4 p-6">
                                    {activeOperations.length > 0 ? (
                                        activeOperations.map((operation) => {
                                            const tripCompletion = operation.totalTrips > 0
                                                ? Math.min(Math.max((operation.completedTrips / operation.totalTrips) * 100, 0), 100)
                                                : 0;
                                            const volumeCompletion = operation.completionRate ?? (operation.volume && operation.volume > 0
                                                ? Math.min(Math.max((operation.deliveredTonnage / operation.volume) * 100, 0), 100)
                                                : 0);

                                            return (
                                                <div
                                                    key={operation.id}
                                                    className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                                                >
                                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                Operation {operation.operationid}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                Last dispatch: {formatDate(operation.lastDispatch)}
                                                            </p>
                                                        </div>
                                                        <Badge className={`text-xs font-semibold ${getStatusColor(operation.status)}`}>
                                                            {operation.status.charAt(0).toUpperCase() + operation.status.slice(1)}
                                                        </Badge>
                                                    </div>

                                                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                                        <div>
                                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                                Trip Progress
                                                            </p>
                                                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{operation.completedTrips} completed</span>
                                                                <span>{operation.totalTrips} total</span>
                                                            </div>
                                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                                                    style={{ width: `${tripCompletion}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                                Volume Progress
                                                            </p>
                                                            <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                                                                <span>{formatNumber(operation.deliveredTonnage)} MT</span>
                                                                <span>{formatNumber(operation.remainingTonnage)} MT left</span>
                                                            </div>
                                                            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                <div
                                                                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600"
                                                                    style={{ width: `${Math.min(Math.max(volumeCompletion ?? 0, 0), 100)}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 grid gap-3 text-xs text-slate-500 dark:text-slate-400 sm:grid-cols-3">
                                                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
                                                            <Activity className="h-4 w-4 text-blue-600" />
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide">Trips in progress</p>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{operation.inProgressTrips}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
                                                            <Target className="h-4 w-4 text-emerald-600" />
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide">Completion</p>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {operation.completionRate !== null ? `${operation.completionRate.toFixed(1)}%` : 'N/A'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2 rounded-lg bg-muted/40 p-3">
                                                            <Calendar className="h-4 w-4 text-purple-600" />
                                                            <div>
                                                                <p className="text-[11px] uppercase tracking-wide">Started</p>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(operation.startdate)}</p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
                                                        <span className="rounded-full bg-muted px-3 py-1 font-medium text-slate-900 dark:text-slate-100">
                                                            <Navigation className="mr-1 inline h-3.5 w-3.5 align-middle text-blue-500" />
                                                            {formatNumber(operation.totalDistance)} km travelled
                                                        </span>
                                                        <span className="rounded-full bg-muted px-3 py-1 font-medium text-slate-900 dark:text-slate-100">
                                                            <PiggyBank className="mr-1 inline h-3.5 w-3.5 align-middle text-emerald-500" />
                                                            {formatNumber(operation.totalCost)} Birr cost
                                                        </span>
                                                        {operation.tariff !== null && operation.tariff !== undefined && (
                                                            <span className="rounded-full bg-muted px-3 py-1 font-medium text-slate-900 dark:text-slate-100">
                                                                Tariff {formatNumber(operation.tariff)}
                                                            </span>
                                                        )}
                                                    </div>

                                                    <div className="mt-4 flex justify-end">
                                                        <Button variant="outline" asChild size="sm">
                                                            <Link href={`/operations/${operation.id}`} className="text-xs">
                                                                View operation
                                                            </Link>
                                                        </Button>
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div className="rounded-lg border border-dashed border-slate-300/60 p-6 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:text-slate-400">
                                            This customer has no active operations.
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {activityLogs.length > 0 && (
                                <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                    <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20">
                                        <CardTitle className="flex items-center gap-2 text-xl">
                                            <History className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                                            Activity History
                                        </CardTitle>
                                        <CardDescription>Auditable timeline of changes to this account</CardDescription>
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

                        <div className="w-full space-y-4 lg:w-80">
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
                                    <CardTitle className="text-lg font-semibold">Snapshot</CardTitle>
                                    <CardDescription>Key metrics at a glance</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5">
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <Hash className="mt-0.5 h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Customer ID</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{customer.id}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <Activity className="mt-0.5 h-4 w-4 text-blue-600 dark:text-blue-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Trips In Progress</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{aggregate.inProgressTrips}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <Navigation className="mt-0.5 h-4 w-4 text-sky-600 dark:text-sky-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Distance Covered</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatNumber(aggregate.totalDistance)} km</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <PiggyBank className="mt-0.5 h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Cost</p>
                                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatNumber(aggregate.totalCost)} Birr</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/20">
                                    <CardTitle className="text-lg font-semibold">Contact Details</CardTitle>
                                    <CardDescription>Reach out directly</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5 text-sm text-slate-700 dark:text-slate-200">
                                    <div className="flex items-start gap-3">
                                        <User className="h-4 w-4 text-indigo-600 dark:text-indigo-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Contact Person</p>
                                            <p className="mt-1 font-semibold text-slate-900 dark:text-slate-100">{customer.contact_person || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Phone className="h-4 w-4 text-emerald-600 dark:text-emerald-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Phone</p>
                                            <p className="mt-1 font-mono text-slate-900 dark:text-slate-100">{customer.phone || 'N/A'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <Mail className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                        <div>
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Email</p>
                                            <p className="mt-1 text-slate-900 dark:text-slate-100">{customer.email || 'N/A'}</p>
                                        </div>
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
                title="Delete Customer"
                description={`Are you sure you want to delete ${customer.name}? This action cannot be undone.`}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}


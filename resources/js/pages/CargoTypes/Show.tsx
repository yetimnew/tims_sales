import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity,
    ArrowLeft,
    Boxes,
    CalendarDays,
    ClipboardCheck,
    Package,
    ShieldCheck,
    SlidersHorizontal,
    SquarePen,
    Trash2,
} from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ActivityLogTable } from '@/components/activity-log-table';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Cargo Types',
        href: '/cargo-types',
    },
    {
        title: 'View',
        href: '#',
    },
];

interface User {
    id: number;
    name: string;
}

interface ActivityLog {
    id: number;
    description: string;
    event: string;
    created_at: string;
    causer?: User;
    properties?: Record<string, any>;
}

interface CargoType {
    id: number;
    name: string;
    category: string;
    weight_per_cubic_meter?: number;
    handling_requirements?: string;
    safety_requirements?: string;
    requires_special_equipment: boolean;
    created_at: string;
    updated_at: string;
}

interface CargoTypesShowProps {
    cargoType: CargoType;
    activityLogs?: ActivityLog[];
}

const formatDate = (value?: string | null) => {
    if (!value) {
        return 'Not recorded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
};

const formatDateTime = (value?: string | null) => {
    if (!value) {
        return 'Not recorded';
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return 'Not recorded';
    }

    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const formatWeight = (value?: number | null) => {
    if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) {
        return 'Not provided';
    }

    return `${value.toLocaleString(undefined, {
        minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
        maximumFractionDigits: 2,
    })} kg / m³`;
};

const getCategoryBadgeClasses = (category: string) => {
    const normalized = category.toLowerCase();
    if (normalized.includes('construct')) {
        return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
    }
    if (normalized.includes('agri')) {
        return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300';
    }
    if (normalized.includes('industrial')) {
        return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300';
    }
    return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300';
};

export default function CargoTypesShow({ cargoType, activityLogs = [] }: CargoTypesShowProps) {
    const { hasPermission } = usePermissions();
    const { toast } = useToast();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const activityLogRows = useMemo(() => {
        return (activityLogs ?? []).map((log) => ({
            id: log.id,
            action: log.event ?? 'updated',
            description: log.description,
            user: {
                name: log.causer?.name ?? 'System',
            },
            created_at: log.created_at,
            old_values: (log.properties?.old as Record<string, unknown>) ?? undefined,
            new_values: (log.properties?.attributes as Record<string, unknown>) ?? undefined,
        }));
    }, [activityLogs]);

    const handleDelete = () => {
        setIsDeleting(true);
        router.delete(`/cargo-types/${cargoType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: 'Cargo type deleted',
                    description: 'The cargo classification has been removed.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                const description = errors && typeof errors === 'object'
                    ? Object.values(errors as Record<string, unknown>)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value): value is string => typeof value === 'string')
                        .join('\n')
                    : 'Unable to delete this cargo type. Please review any blockers and try again.';
                toast({
                    title: 'Delete failed',
                    description,
                    variant: 'destructive',
                });
            },
        });
    };

    const weightDisplay = formatWeight(cargoType.weight_per_cubic_meter);

    const detailTiles = [
        {
            title: 'Category',
            icon: <Boxes className="h-4 w-4 text-blue-600" />,
            content: (
                <Badge className={`border ${getCategoryBadgeClasses(cargoType.category)}`}>
                    {cargoType.category}
                </Badge>
            ),
        },
        {
            title: 'Weight Density',
            icon: <SlidersHorizontal className="h-4 w-4 text-emerald-600" />,
            content: (
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {weightDisplay}
                </span>
            ),
        },
        {
            title: 'Special Equipment',
            icon: <ShieldCheck className="h-4 w-4 text-amber-600" />,
            content: cargoType.requires_special_equipment ? (
                <Badge className="border border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200">
                    Required
                </Badge>
            ) : (
                <Badge className="border border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300">
                    Standard Handling
                </Badge>
            ),
        },
        {
            title: 'Last Updated',
            icon: <CalendarDays className="h-4 w-4 text-purple-600" />,
            content: (
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {formatDate(cargoType.updated_at)}
                </span>
            ),
        },
    ];

    const quickReference = [
        {
            label: 'Recorded On',
            value: formatDateTime(cargoType.created_at),
            icon: CalendarDays,
        },
        {
            label: 'Category',
            value: cargoType.category,
            icon: Package,
        },
        {
            label: 'Density',
            value: weightDisplay,
            icon: SlidersHorizontal,
        },
        {
            label: 'Special Equipment',
            value: cargoType.requires_special_equipment ? 'Required for safe handling' : 'Not required',
            icon: ShieldCheck,
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Cargo Type: ${cargoType.name}`} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                <div className="rounded-2xl border border-slate-200/70 bg-gradient-to-r from-slate-50 via-white to-rose-50/60 p-6 shadow-sm dark:border-slate-800/70 dark:from-slate-900 dark:via-slate-950 dark:to-rose-950/20">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => router.get('/cargo-types')}
                                className="w-fit gap-2 border border-slate-200 bg-white/80 px-3 py-1.5 text-sm text-slate-600 shadow-sm transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Cargo Types
                            </Button>
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-rose-100 p-3 text-rose-600 shadow-sm dark:bg-rose-900/30 dark:text-rose-300">
                                    <Package className="h-6 w-6" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                                        {cargoType.name}
                                    </h1>
                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                        Comprehensive profile for this cargo classification.
                                    </p>
                                </div>
                            </div>
                        </div>
                        {(hasPermission('cargotypes.edit') || hasPermission('cargotypes.destroy')) && (
                            <div className="flex flex-wrap items-center gap-2">
                                {hasPermission('cargotypes.edit') && (
                                    <Button asChild variant="outline" className="gap-2 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40">
                                        <Link href={`/cargo-types/${cargoType.id}/edit`}>
                                            <SquarePen className="h-4 w-4" />
                                            Edit Cargo Type
                                        </Link>
                                    </Button>
                                )}
                                {hasPermission('cargotypes.destroy') && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="gap-2 border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-950/40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Delete Cargo Type
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {detailTiles.map((tile) => (
                        <Card key={tile.title} className="border border-slate-200/70 shadow-sm transition hover:border-rose-200 hover:shadow-md dark:border-slate-800/70 dark:hover:border-rose-700/60">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 px-4 py-3">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {tile.title}
                                </CardTitle>
                                {tile.icon}
                            </CardHeader>
                            <CardContent className="px-4 pb-4 pt-0">
                                {tile.content}
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-2 border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <ClipboardCheck className="h-4 w-4 text-rose-600" />
                                <CardTitle className="text-lg">Operational Guidance</CardTitle>
                            </div>
                            <CardDescription>Handling insight and safety protocols for this cargo type</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 py-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Handling Requirements</h3>
                                <p className="whitespace-pre-wrap rounded-lg border border-slate-200/60 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    {cargoType.handling_requirements || 'No special handling instructions documented.'}
                                </p>
                            </div>
                            <div>
                                <h3 className="mb-2 text-sm font-semibold text-slate-800 dark:text-slate-200">Safety Requirements</h3>
                                <p className="whitespace-pre-wrap rounded-lg border border-slate-200/60 bg-white/80 p-4 text-sm shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    {cargoType.safety_requirements || 'No safety guidance has been provided for this cargo type yet.'}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-blue-600" />
                                <CardTitle className="text-lg">Quick Reference</CardTitle>
                            </div>
                            <CardDescription>Key attributes summarised for dispatch planning</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 py-6">
                            {quickReference.map((item) => (
                                <div key={item.label} className="flex items-start gap-3 rounded-lg border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-slate-800/60 dark:bg-slate-900/50">
                                    <item.icon className="mt-0.5 h-4 w-4 text-slate-500 dark:text-slate-400" />
                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            {item.label}
                                        </p>
                                        <p className="text-sm font-medium text-slate-900 dark:text-slate-200">
                                            {item.value}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {activityLogRows.length > 0 && (
                    <Card className="border border-slate-200/70 shadow-sm dark:border-slate-800/70">
                        <CardHeader className="border-b border-slate-200/70 bg-slate-50/70 dark:border-slate-800/60 dark:bg-slate-900/40">
                            <div className="flex items-center gap-2">
                                <Activity className="h-4 w-4 text-slate-600" />
                                <CardTitle className="text-lg">Activity Log</CardTitle>
                            </div>
                            <CardDescription>Recent actions and updates for this cargo type</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ActivityLogTable logs={activityLogRows} />
                        </CardContent>
                    </Card>
                )}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Cargo Type"
                description={`Are you sure you want to delete \"${cargoType.name}\"? This action cannot be undone.`}
                itemName={cargoType.name}
                onConfirm={handleDelete}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

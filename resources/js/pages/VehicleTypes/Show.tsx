import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Settings, Edit, Trash2, Truck, ArrowLeft, Activity, ChevronRight, Calendar } from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useMemo, useState } from 'react';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: {
        name: string;
    };
    created_at: string;
    old_values?: Record<string, unknown>;
    new_values?: Record<string, unknown>;
}

interface VehicleTypeTruck {
    id: number;
    plate: string;
    status?: string | null;
    created_at?: string | null;
}

interface VehicleType {
    id: number;
    name: string;
    description?: string;
    created_at: string;
    updated_at: string;
    trucks?: { data: VehicleTypeTruck[] } | VehicleTypeTruck[];
}

interface VehicleTypesShowProps {
    vehicleType: VehicleType;
    activityLogs?: ActivityLog[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Vehicle Types',
        href: '/vehicletypes',
    },
    {
        title: 'Details',
        href: '#',
    },
];

const numberFormatter = new Intl.NumberFormat('en-ET');

function formatDate(date?: string | null): string {
    if (!date) {
        return 'Not available';
    }

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
        return 'Not available';
    }

    return parsedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });
}

export default function VehicleTypesShow({ vehicleType, activityLogs = [] }: VehicleTypesShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const trucksRaw = Array.isArray(vehicleType.trucks) ? vehicleType.trucks : vehicleType.trucks?.data;
    const trucks: VehicleTypeTruck[] = Array.isArray(trucksRaw) ? trucksRaw : [];

    const overviewSummaryItems = useMemo(
        () => [
            {
                key: 'associated-trucks',
                label: 'Associated Trucks',
                value: numberFormatter.format(trucks.length),
                helper:
                    trucks.length === 1
                        ? 'Truck currently using this type'
                        : 'Trucks currently using this type',
            },
            {
                key: 'created',
                label: 'Created',
                value: formatDate(vehicleType.created_at),
                helper: 'Initial catalogue entry',
            },
            {
                key: 'updated',
                label: 'Last Updated',
                value: formatDate(vehicleType.updated_at),
                helper: 'Most recent modification',
            },
        ],
        [trucks.length, vehicleType.created_at, vehicleType.updated_at],
    );

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/vehicletypes/${vehicleType.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehicleType.name} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-4">
                <DetailHeader
                    leading={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/vehicletypes')}
                            className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Vehicle Types
                        </Button>
                    }
                    icon={<Settings className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                    title={vehicleType.name}
                    subtitle="Overview of this vehicle class and its assigned fleet"
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-200">
                                <ChevronRight className="mr-1 h-3.5 w-3.5" />
                                Fleet Catalogue
                            </Badge>
                            <Button
                                variant="outline"
                                asChild
                                className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:hover:bg-indigo-950/40"
                            >
                                <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit
                                </Link>
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(true)}
                                className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-700/60 dark:text-red-300 dark:hover:bg-red-950/50"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                <DetailSummaryGrid items={overviewSummaryItems} className="xl:grid-cols-3" />

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <DetailSectionCard
                        icon={<Settings className="h-5 w-5 text-indigo-600" />}
                        title="Vehicle Type Information"
                        description="Descriptive details for fleet managers"
                        headerClassName="from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20"
                        contentClassName="space-y-6"
                    >
                        <div className="space-y-1">
                            <p className="text-sm font-medium text-muted-foreground">Name</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">{vehicleType.name}</p>
                        </div>
                        {vehicleType.description ? (
                            <div className="space-y-2 rounded-lg border border-slate-200 bg-white/80 p-4 text-sm text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
                                {vehicleType.description}
                            </div>
                        ) : (
                            <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-muted-foreground dark:border-slate-700">
                                No description provided.
                            </div>
                        )}
                    </DetailSectionCard>

                    <DetailSectionCard
                        icon={<Calendar className="h-5 w-5 text-emerald-600" />}
                        title="Record Timeline"
                        description="System-generated audit metadata"
                        headerClassName="from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20"
                        contentClassName="space-y-5 text-sm"
                    >
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Created</p>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(vehicleType.created_at)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/40">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <div>
                                <p className="text-xs font-medium text-muted-foreground">Last Updated</p>
                                <p className="font-semibold text-slate-900 dark:text-slate-100">{formatDate(vehicleType.updated_at)}</p>
                            </div>
                        </div>
                    </DetailSectionCard>
                </div>

                <DetailSectionCard
                    icon={<Truck className="h-5 w-5 text-orange-600" />}
                    title={`Associated Trucks (${trucks.length})`}
                    description="Trucks currently configured with this type"
                    headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20"
                >
                    {trucks.length > 0 ? (
                        <div className="grid gap-4 md:grid-cols-2">
                            {trucks.map((truck) => (
                                <div
                                    key={truck.id}
                                    className="flex flex-col gap-4 rounded-lg border border-slate-200 bg-white/80 p-4 shadow-sm transition hover:border-blue-200 hover:bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Link href={`/trucks/${truck.id}`} className="text-base font-semibold text-blue-600 hover:underline dark:text-blue-300">
                                                {truck.plate}
                                            </Link>
                                            <p className="text-xs text-muted-foreground">Created: {formatDate(truck.created_at)}</p>
                                        </div>
                                        <Badge className="rounded-full border border-slate-200 bg-slate-50 text-xs font-medium text-slate-600 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                                            {truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown'}
                                        </Badge>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Activity className="h-4 w-4" />
                                        Last serviced data is available on the truck profile.
                                    </div>
                                    <div className="flex gap-2">
                                        <Button asChild size="sm" variant="outline" className="flex-1">
                                            <Link href={`/trucks/${truck.id}`}>View Truck</Link>
                                        </Button>
                                        <Button asChild size="sm" variant="outline" className="flex-1 border-blue-200 text-blue-600 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-200 dark:hover:bg-blue-950/40">
                                            <Link href={`/driver-trucks?truck_id=${truck.id}`}>Assignments</Link>
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-muted-foreground">
                            <Truck className="mx-auto mb-4 h-12 w-12 opacity-60" />
                            <p>No trucks currently reference this vehicle type.</p>
                            <p className="mt-1 text-sm">Assign the type to a truck to populate this section.</p>
                        </div>
                    )}
                </DetailSectionCard>

                {activityLogs && activityLogs.length > 0 ? (
                    <DetailSectionCard
                        icon={<Activity className="h-5 w-5 text-slate-600" />}
                        title="Activity Log"
                        description="Recent events recorded for this vehicle type"
                        headerClassName="from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10"
                    >
                        <ActivityLogTable logs={activityLogs} />
                    </DetailSectionCard>
                ) : null}
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Vehicle Type"
                description="Are you sure you want to delete this vehicle type? This action cannot be undone and will remove all associated records."
                itemName={vehicleType.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}




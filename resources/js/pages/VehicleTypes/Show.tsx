import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Settings,
    Edit,
    Trash2,
    Truck,
    Calendar,
    ArrowLeft,
    Activity,
    ChevronRight,
} from 'lucide-react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';

interface ActivityLog {
    id: number;
    action: 'created' | 'updated' | 'deleted';
    description: string;
    user?: {
        name: string;
    };
    created_at: string;
    old_values?: Record<string, any>;
    new_values?: Record<string, any>;
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

    const insightCards = useMemo(() => ([
        {
            label: 'Associated Trucks',
            value: trucks.length,
            tone: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200',
        },
        {
            label: 'Created',
            value: formatDate(vehicleType.created_at),
            tone: 'bg-slate-100 text-slate-700 dark:bg-slate-900/50 dark:text-slate-200',
        },
        {
            label: 'Last Updated',
            value: formatDate(vehicleType.updated_at),
            tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
        },
    ]), [trucks.length, vehicleType.created_at, vehicleType.updated_at]);

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/vehicletypes/${vehicleType.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flat()
                        .filter((message): message is string => typeof message === 'string')
                        .join('\n');

                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={vehicleType.name} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto rounded-xl p-4">
                <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 via-blue-50 to-indigo-50 p-6 shadow-sm dark:border-slate-700 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/30">
                    <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/vehicletypes')}
                                className="w-full gap-2 border-slate-300 bg-white/80 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900/60 dark:hover:bg-slate-800 lg:w-auto"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Vehicle Types
                            </Button>
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-blue-100 p-3 dark:bg-blue-900/30">
                                    <Settings className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{vehicleType.name}</h1>
                                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                                        Overview of this vehicle class and its assigned fleet
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1 text-sm font-medium text-blue-700 dark:border-blue-700/60 dark:bg-blue-950/40 dark:text-blue-200">
                                <ChevronRight className="h-4 w-4" />
                                Fleet Catalogue
                            </div>
                            <Button variant="outline" asChild className="border-slate-300 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-blue-950/40">
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
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {insightCards.map((card) => (
                        <Card key={card.label} className="border-0 bg-gradient-to-br from-white to-muted/20 shadow-md dark:from-slate-900/60 dark:to-slate-900/20">
                            <CardHeader className="border-b bg-gradient-to-r from-white/90 to-transparent dark:from-slate-900/50">
                                <CardTitle className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                    {card.label}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                <span className={`rounded-full px-3 py-1 text-sm font-semibold ${card.tone}`}>
                                    {card.value}
                                </span>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                <Settings className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                Vehicle Type Information
                            </CardTitle>
                            <CardDescription>Descriptive details for fleet managers</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 pt-6">
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
                        </CardContent>
                    </Card>

                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20">
                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                Record Timeline
                            </CardTitle>
                            <CardDescription>System-generated audit metadata</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-5 pt-6 text-sm">
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
                        </CardContent>
                    </Card>
                </div>

                <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                    <CardHeader className="border-b bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950/30 dark:to-amber-950/20">
                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                            <Truck className="h-5 w-5 text-orange-600 dark:text-orange-300" />
                            Associated Trucks ({trucks.length})
                        </CardTitle>
                        <CardDescription>Trucks currently configured with this type</CardDescription>
                    </CardHeader>
                    <CardContent>
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
                                                <p className="text-xs text-muted-foreground">
                                                    Created: {formatDate(truck.created_at)}
                                                </p>
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
                    </CardContent>
                </Card>

                {activityLogs && activityLogs.length > 0 && (
                    <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                        <CardHeader className="border-b bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
                            <CardTitle className="flex items-center gap-2 text-lg">
                                <Activity className="h-5 w-5 text-slate-600" />
                                Activity Log
                            </CardTitle>
                            <CardDescription>Recent events recorded for this vehicle type</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ActivityLogTable logs={activityLogs} />
                        </CardContent>
                    </Card>
                )}
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




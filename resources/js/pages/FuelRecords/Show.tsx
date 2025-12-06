import { type ComponentProps, type ReactNode, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { ArrowLeft, Fuel, Truck, User, MapPin, Calendar, DollarSign, FileText, Edit, Trash2, Hash, TrendingUp, BarChart3, History, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';

interface FuelRecord {
    id: number;
    fuel_date: string;
    fuel_quantity_liters: number;
    fuel_price_per_liter: number;
    total_cost: number;
    fuel_station: string;
    fuel_type: string;
    odometer_reading?: number;
    receipt_number?: string;
    notes?: string;
    driverTruck?: {
        id: number;
        truck?: {
            id: number;
            plate: string;
            model: string;
        };
        driver?: {
            id: number;
            name: string;
            license_number: string;
        };
    };
    user?: {
        id: number;
        name: string;
    };
    created_at: string;
    updated_at: string;
}

interface FuelRecordsShowProps {
    fuelRecord: FuelRecord | null;
    activityLogs?: ActivityLog[];
}

const breadcrumbs = (fuelRecord: FuelRecord | null): BreadcrumbItem[] => [
    {
        title: 'Fuel Records',
        href: '/fuel-records',
    },
    {
        title: fuelRecord?.fuel_station || 'Fuel Record',
        href: fuelRecord ? `/fuel-records/${fuelRecord.id}` : '/fuel-records',
    },
];

const numberFormatter = new Intl.NumberFormat('en-ET');

const currencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});

const longDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
});

const formatDate = (value?: string | null): string => {
    if (!value) {
        return 'N/A';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'N/A';
    }

    return longDateFormatter.format(parsed);
};

const formatDateTime = (value?: string | null): string => {
    if (!value) {
        return 'N/A';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'N/A';
    }

    return dateTimeFormatter.format(parsed);
};

const formatCurrency = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return currencyFormatter.format(value);
};

const formatNumber = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return numberFormatter.format(value);
};

const formatLiters = (value?: number | null): string => {
    const formatted = formatNumber(value);

    return formatted === 'N/A' ? formatted : `${formatted} L`;
};

const formatKilometers = (value?: number | null): string => {
    const formatted = formatNumber(value);

    return formatted === 'N/A' ? formatted : `${formatted} km`;
};

interface ActivityLog {
    id: number;
    description: string;
    created_at: string;
    causer?: {
        name?: string;
    };
}

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

interface DetailTileProps {
    icon: LucideIcon;
    label: string;
    value: ReactNode;
    highlight?: boolean;
    badgeVariant?: BadgeVariant;
}

const DetailTile = ({ icon: Icon, label, value, highlight = false, badgeVariant }: DetailTileProps) => {
    const containerClasses = highlight
        ? 'rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30'
        : 'rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40';

    const iconWrapperClasses = highlight
        ? 'rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30'
        : 'rounded-lg bg-slate-100 p-1.5 dark:bg-slate-900/30';

    const valueClasses = highlight
        ? 'mt-2 text-lg font-semibold text-green-900 dark:text-green-100'
        : 'mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100';

    const renderedValue = badgeVariant && typeof value === 'string'
        ? (
            <Badge variant={badgeVariant} className="w-fit px-3 py-1 text-sm">
                {value}
            </Badge>
        )
        : value;

    const iconColorClasses = highlight
        ? 'text-green-600 dark:text-green-400'
        : 'text-slate-600 dark:text-slate-400';

    return (
        <div className={containerClasses}>
            <div className="flex items-center gap-3">
                <div className={iconWrapperClasses}>
                    <Icon className={`h-4 w-4 ${iconColorClasses}`} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
            <div className={valueClasses}>{renderedValue}</div>
        </div>
    );
};

export default function FuelRecordsShow({ fuelRecord, activityLogs = [] }: FuelRecordsShowProps) {
    const { hasPermission } = usePermissions();

    // Early return if fuelRecord is not available
    if (!fuelRecord) {
        return (
            <AppLayout breadcrumbs={breadcrumbs(fuelRecord)}>
                <Head title="Fuel Record" />
                <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                    <div className="bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950/20 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Loading...</h1>
                            <p className="text-slate-600 dark:text-slate-400 mt-2">Please wait while we load the fuel record details.</p>
                        </div>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/fuel-records/${fuelRecord.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
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

    const getFuelTypeBadgeVariant = (fuelType: string) => {
        switch (fuelType.toLowerCase()) {
            case 'diesel': return 'default';
            case 'petrol': return 'secondary';
            default: return 'outline';
        }
    };

    const summaryItems = useMemo(
        () => [
            {
                key: 'fuel-date',
                label: 'Fuel Date',
                value: formatDate(fuelRecord.fuel_date),
                helper: fuelRecord.fuel_station,
            },
            {
                key: 'quantity',
                label: 'Quantity',
                value: formatLiters(fuelRecord.fuel_quantity_liters),
                helper: `Price ${formatCurrency(fuelRecord.fuel_price_per_liter)} / L`,
            },
            {
                key: 'total-cost',
                label: 'Total Cost',
                value: formatCurrency(fuelRecord.total_cost),
                helper: fuelRecord.receipt_number ? `Receipt ${fuelRecord.receipt_number}` : 'Receipt not provided',
            },
            {
                key: 'fuel-type',
                label: 'Fuel Type',
                value: (
                    <Badge variant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)} className="flex w-fit items-center gap-1 px-3 py-1 text-sm">
                        {fuelRecord.fuel_type}
                    </Badge>
                ),
                valueClassName: 'text-base font-medium',
                helper: fuelRecord.driverTruck?.truck?.plate ? `Truck ${fuelRecord.driverTruck.truck.plate}` : 'No truck linked',
            },
        ],
        [fuelRecord],
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs(fuelRecord)}>
            <Head title={`Fuel Record - ${fuelRecord.fuel_station}`} />
            <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-4">
                <DetailHeader
                    leading={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/fuel-records')}
                            className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Fuel Records
                        </Button>
                    }
                    icon={<Fuel className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                    title={fuelRecord.fuel_station}
                    subtitle={`Fuel record on ${formatDate(fuelRecord.fuel_date)}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:border-green-700/60 dark:bg-green-950/30 dark:text-green-300">
                                <DollarSign className="h-4 w-4" />
                                {formatCurrency(fuelRecord.total_cost)}
                            </div>
                            {hasPermission('fuel-records.edit') ? (
                                <Button
                                    variant="outline"
                                    asChild
                                    className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600 dark:hover:bg-indigo-950/40"
                                >
                                    <Link href={`/fuel-records/${fuelRecord.id}/edit`}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Edit Record
                                    </Link>
                                </Button>
                            ) : null}
                            {hasPermission('fuel-records.destroy') ? (
                                <Button
                                    variant="outline"
                                    onClick={handleDeleteClick}
                                    className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-700/60 dark:text-red-300 dark:hover:bg-red-950/50"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            ) : null}
                        </div>
                    }
                />

                <DetailSummaryGrid items={summaryItems} className="xl:grid-cols-4" />

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <Activity className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="analytics" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" />
                            Analytics
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 mt-6 flex-1 overflow-y-auto">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="flex-1 space-y-6">
                                <DetailSectionCard
                                    icon={<Fuel className="h-5 w-5 text-indigo-600" />}
                                    title="Fuel Record Details"
                                    description="Complete information about this refueling event"
                                    headerClassName="from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                                    contentClassName="space-y-6"
                                >
                                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                                        <DetailTile
                                            icon={Calendar}
                                            label="Fuel Date"
                                            value={formatDate(fuelRecord.fuel_date)}
                                        />
                                        <DetailTile
                                            icon={MapPin}
                                            label="Fuel Station"
                                            value={fuelRecord.fuel_station}
                                        />
                                        <DetailTile
                                            icon={Fuel}
                                            label="Fuel Type"
                                            value={fuelRecord.fuel_type}
                                            badgeVariant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)}
                                        />
                                        <DetailTile
                                            icon={Fuel}
                                            label="Quantity"
                                            value={formatLiters(fuelRecord.fuel_quantity_liters)}
                                        />
                                        <DetailTile
                                            icon={DollarSign}
                                            label="Price / Liter"
                                            value={`${formatCurrency(fuelRecord.fuel_price_per_liter)} / L`}
                                        />
                                        <DetailTile
                                            icon={DollarSign}
                                            label="Total Cost"
                                            value={formatCurrency(fuelRecord.total_cost)}
                                            highlight
                                        />
                                    </div>

                                    <div className="grid gap-6 md:grid-cols-2">
                                        {fuelRecord.odometer_reading ? (
                                            <DetailTile
                                                icon={TrendingUp}
                                                label="Odometer Reading"
                                                value={formatKilometers(fuelRecord.odometer_reading)}
                                            />
                                        ) : null}

                                        {fuelRecord.receipt_number ? (
                                            <DetailTile
                                                icon={FileText}
                                                label="Receipt Number"
                                                value={fuelRecord.receipt_number}
                                            />
                                        ) : null}
                                    </div>

                                    {fuelRecord.notes ? (
                                        <div className="rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40">
                                            <div className="flex items-center gap-3">
                                                <div className="rounded-lg bg-slate-100 p-1.5 dark:bg-slate-900/30">
                                                    <FileText className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                </div>
                                                <span className="text-sm font-medium text-muted-foreground">Notes</span>
                                            </div>
                                            <p className="mt-3 text-sm text-slate-900 dark:text-slate-100 whitespace-pre-wrap">
                                                {fuelRecord.notes}
                                            </p>
                                        </div>
                                    ) : null}
                                </DetailSectionCard>

                                <DetailSectionCard
                                    icon={<Hash className="h-5 w-5 text-purple-600" />}
                                    title="Record Information"
                                    description="System metadata and audit trail"
                                    headerClassName="from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                                >
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <DetailTile
                                            icon={Calendar}
                                            label="Created"
                                            value={formatDateTime(fuelRecord.created_at)}
                                        />
                                        <DetailTile
                                            icon={Calendar}
                                            label="Last Updated"
                                            value={formatDateTime(fuelRecord.updated_at)}
                                        />
                                        <DetailTile
                                            icon={Hash}
                                            label="System ID"
                                            value={`#${fuelRecord.id}`}
                                        />
                                        <DetailTile
                                            icon={User}
                                            label="Created By"
                                            value={fuelRecord.user?.name ?? 'Unknown'}
                                        />
                                    </div>
                                </DetailSectionCard>
                            </div>

                            <div className="w-full space-y-4 lg:w-80">
                                <DetailSectionCard
                                    icon={<Truck className="h-4 w-4 text-indigo-600" />}
                                    title="Vehicle & Driver"
                                    headerClassName="from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                                    contentClassName="space-y-4"
                                >
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="font-medium text-muted-foreground">Truck</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {fuelRecord.driverTruck?.truck?.plate ?? 'Unknown'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {fuelRecord.driverTruck?.truck?.model ?? 'Model not specified'}
                                        </p>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/80 p-4 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="font-medium text-muted-foreground">Driver</p>
                                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                            {fuelRecord.driverTruck?.driver?.name ?? 'Unknown'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            License: {fuelRecord.driverTruck?.driver?.license_number ?? 'N/A'}
                                        </p>
                                    </div>
                                </DetailSectionCard>

                                <DetailSectionCard
                                    icon={<Edit className="h-4 w-4 text-purple-600" />}
                                    title="Quick Actions"
                                    description="Common operations and management tasks"
                                    headerClassName="from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                                    contentClassName="space-y-3"
                                >
                                    {hasPermission('fuel-records.edit') ? (
                                        <Button asChild className="w-full justify-start">
                                            <Link href={`/fuel-records/${fuelRecord.id}/edit`}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Edit Record
                                            </Link>
                                        </Button>
                                    ) : null}
                                    {hasPermission('fuel-records.destroy') ? (
                                        <Button
                                            variant="destructive"
                                            className="w-full justify-start"
                                            onClick={handleDeleteClick}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4" />
                                            Delete Record
                                        </Button>
                                    ) : null}
                                </DetailSectionCard>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="mt-6 flex-1 overflow-y-auto">
                        <DetailSectionCard
                            icon={<BarChart3 className="h-5 w-5 text-emerald-600" />}
                            title="Fuel Analytics"
                            description="Consumption analysis and insights for this fuel record"
                            headerClassName="from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                        >
                            <div className="py-12 text-center">
                                <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                                <h3 className="mb-2 text-lg font-semibold text-muted-foreground">Analytics Coming Soon</h3>
                                <p className="text-sm text-muted-foreground">
                                    Advanced fuel consumption analytics and efficiency calculations will be available here.
                                </p>
                            </div>
                        </DetailSectionCard>
                    </TabsContent>

                    <TabsContent value="history" className="mt-6 flex-1 overflow-y-auto">
                        <DetailSectionCard
                            icon={<History className="h-5 w-5 text-slate-600" />}
                            title="Activity History"
                            description="Audit trail for this fuel record"
                            headerClassName="from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10"
                        >
                            <ActivityLogTable logs={activityLogs} />
                        </DetailSectionCard>
                    </TabsContent>
                </Tabs>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    title="Delete Fuel Record"
                    description={`Are you sure you want to delete the fuel record from ${fuelRecord.fuel_station}? This action cannot be undone.`}
                    itemName={`${fuelRecord.fuel_station} - ${fuelRecord.total_cost.toLocaleString()} ETB`}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            </div>
        </AppLayout>
    );
}

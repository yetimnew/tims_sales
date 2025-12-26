import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Ban, BarChart3, History, ShieldCheck, CheckCircle, Calendar, User, ArrowLeft, Edit, Trash2, Hash, Activity, Truck, ArrowUpRight } from 'lucide-react';
import AppLayout from '@/layouts/app-layout';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { useState } from 'react';

interface ActivityLog {
    id: number;
    description: string;
    causer?: { name?: string };
    created_at: string;
    properties?: Record<string, unknown>;
}

type DriverAssignment = {
    id: number;
    driver_id?: number | null;
    driverid?: string | null;
    truck_id?: number | null;
    plate?: string | null;
    date_recived?: string | null;
    date_detach?: string | null;
    is_attached: boolean;
    status?: string | null;
    truck?: {
        id: number;
        plate: string;
    } | null;
};

type DriverPerformance = {
    id: number;
    driver_truck_id?: number | null;
    DateDispach?: string | null;
    DistanceWCargo?: number | null;
    DistanceWOCargo?: number | null;
    fuelInLitter?: number | null;
    fuelInBirr?: number | null;
    comment?: string | null;
    load_phase?: string | null;
    satus?: string | null;
    tonkm?: number | null;
    cargo_volume_mt?: number | null;
    cargo_weight_kg?: number | null;
    cargo_weight_tons?: number | null;
    is_returned?: boolean;
    returned_date?: string | null;
    total_distance_km?: number | null;
    trip_duration_days?: number | null;
    driver_truck?: {
        id: number;
        plate?: string | null;
        status?: string | null;
        is_attached?: boolean;
        date_recived?: string | null;
        date_detach?: string | null;
    } | null;
    origin?: {
        id: number;
        name: string;
    } | null;
    destination?: {
        id: number;
        name: string;
    } | null;
    operation?: {
        id: number;
        number?: string | null;
        status?: string | null;
    } | null;
};

type DriverSafety = {
    id: number;
    incident_date?: string | null;
    incident_type?: string | null;
    description?: string | null;
    severity?: string | null;
    damage_cost?: number | null;
    location?: string | null;
    resolution?: string | null;
    reported_by?: number | null;
};

interface Driver {
    id: number;
    driverid: string;
    name: string;
    sex?: string | null;
    birthdate?: string | null;
    zone?: string | null;
    woreda?: string | null;
    kebele?: string | null;
    housenumber?: string | null;
    mobile?: string | null;
    hireddate?: string | null;
    status?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
    performances?: DriverPerformance[];
    driverTrucks?: DriverAssignment[];
    safetyRecords?: DriverSafety[];
}

interface DriversShowProps {
    driver: Driver;
    activityLogs?: ActivityLog[];
    performanceSummary?: {
        total_records: number;
        total_distance_km: number;
        total_trips: number;
        total_cargo_tonnage: number;
        avg_fuel_efficiency: number | null;
        avg_customer_rating: number | null;
        safety_incidents: number;
        total_fuel_liters?: number;
        total_fuel_cost?: number;
    };
    safetySummary?: {
        total_records: number;
        accidents: number;
        violations: number;
        warnings: number;
        critical: number;
        major: number;
        minor: number;
        total_damage_cost: number;
    };
    counts?: {
        trucks: number;
        assignments: number;
        performances: number;
        performance_records: number;
        safety_records: number;
        fuel_records: number;
    };
    gradeReport?: GradeReport;
}

type GradeCategoryKey = 'performance' | 'efficiency' | 'safety' | 'compliance' | 'engagement';

type GradeCategoryDetails = {
    score: number;
    metrics: Record<string, number | null>;
};

type GradeWeights = {
    performance_weight: number;
    efficiency_weight: number;
    safety_weight: number;
    compliance_weight: number;
    engagement_weight: number;
};

interface GradeReport {
    overall: {
        score: number;
        letter: string;
    };
    weights: GradeWeights;
    categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
    metrics?: {
        driver?: Record<string, number | null>;
        peer_averages?: Record<string, number | null>;
    };
}

type GradeCategoryConfigEntry = {
    label: string;
    description: string;
    metrics: Array<{
        key: string;
        label: string;
        formatter: (value: number | null | undefined) => string;
    }>;
};

type GradeCategoryView = {
    key: GradeCategoryKey;
    label: string;
    description: string;
    score: number;
    weight: number | null;
    metrics: Array<{ label: string; value: string }>;
};

const numberFormatter = new Intl.NumberFormat('en-ET');

const currencyFormatter = new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
});

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', options).format(value);
    }

    return numberFormatter.format(value);
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
    const formatted = formatNumber(value, {
        minimumFractionDigits: maximumFractionDigits,
        maximumFractionDigits,
    });

    return formatted === 'N/A' ? formatted : `${formatted} KM`;
};

const formatTons = (value?: number | null, maximumFractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: value > 0 && value < 1 ? maximumFractionDigits : 0,
        maximumFractionDigits,
    })} t`;
};

const formatFuelEfficiency = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/L`;
};

const formatCurrency = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', {
            style: 'currency',
            currency: 'ETB',
            maximumFractionDigits: 2,
            ...options,
        }).format(value);
    }

    return currencyFormatter.format(value);
};

const formatCurrencyPerKilometer = (value?: number | null): string => {
    const formatted = formatCurrency(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

    return formatted === 'N/A' ? formatted : `${formatted} / KM`;
};

const formatRating = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5`;
};

const formatPercentFromRatio = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${(value * 100).toFixed(maximumFractionDigits)}%`;
};

const formatDaysValue = (value?: number | null, maximumFractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    const rounded = Number(value.toFixed(maximumFractionDigits));

    if (rounded === 1) {
        return '1 day';
    }

    const formatted = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(maximumFractionDigits);

    return `${formatted} days`;
};

const gradeCategoryConfig: Record<GradeCategoryKey, GradeCategoryConfigEntry> = {
    performance: {
        label: 'Performance',
        description: 'Trips completed and distance delivered.',
        metrics: [
            {
                key: 'total_trips',
                label: 'Trips',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },


            {
                key: 'total_distance_km',
                label: 'Distance',
                formatter: value => formatKilometers(value, 0),
            },
            {
                key: 'total_cargo_tonnage',
                label: 'Cargo',
                formatter: value => formatTons(value, 1),
            },
            {
                key: 'performance_records',
                label: 'Performance Records',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
        ],
    },
    efficiency: {
        label: 'Efficiency',
        description: 'Fuel economy and customer feedback.',
        metrics: [
            {
                key: 'avg_fuel_efficiency',
                label: 'Fuel Efficiency',
                formatter: formatFuelEfficiency,
            },
            {
                key: 'avg_customer_rating',
                label: 'Rating',
                formatter: formatRating,
            },
            {
                key: 'fuel_cost_per_km',
                label: 'Fuel Cost / KM',
                formatter: formatCurrencyPerKilometer,
            },
        ],
    },
    safety: {
        label: 'Safety',
        description: 'Incidents, accidents, and risk exposure.',
        metrics: [
            {
                key: 'safety_incidents',
                label: 'Incidents',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'accidents',
                label: 'Accidents',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'safety_damage_cost',
                label: 'Damage Cost',
                formatter: formatCurrency,
            },
            {
                key: 'safety_risk_score',
                label: 'Risk Score',
                formatter: value => formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }),
            },
        ],
    },
    compliance: {
        label: 'Compliance',
        description: 'Policy adherence and recorded violations.',
        metrics: [
            {
                key: 'violations',
                label: 'Violations',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'warnings',
                label: 'Warnings',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'recorded_violations',
                label: 'Logged Violations',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
        ],
    },
    engagement: {
        label: 'Engagement',
        description: 'Assignments and tenure within the fleet.',
        metrics: [
            {
                key: 'active_assignments',
                label: 'Active Assignments',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'total_assignments',
                label: 'Total Assignments',
                formatter: value => formatNumber(value, { maximumFractionDigits: 0 }),
            },
            {
                key: 'avg_assignment_duration_days',
                label: 'Avg Assignment Duration',
                formatter: value => formatDaysValue(value ?? null, 1),
            },
            {
                key: 'active_assignment_ratio',
                label: 'Active Ratio',
                formatter: value => formatPercentFromRatio(value ?? null, 0),
            },
            {
                key: 'days_employed',
                label: 'Days Employed',
                formatter: value => formatDaysValue(value ?? null, 0),
            },
        ],
    },
};

const DRIVER_DETAIL_SKELETON_STORAGE_KEY = 'drivers.show.shouldShowSkeleton';

function DriverDetailSkeleton() {
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-4">
            <div className="rounded-lg border border-slate-200 bg-gradient-to-r from-slate-50 to-indigo-50 p-6 dark:border-slate-700 dark:from-slate-900 dark:to-indigo-950/30">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-11 w-11 rounded-full" />
                        <div className="space-y-3">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <Skeleton key={index} className="h-9 w-28 rounded-lg" />
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                {Array.from({ length: 5 }).map((_, index) => (
                    <div
                        key={index}
                        className="rounded-xl border-0 bg-gradient-to-br from-white to-indigo-50 p-5 shadow-lg dark:from-slate-900 dark:to-indigo-950/20"
                    >
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="mt-3 h-8 w-36" />
                        <Skeleton className="mt-2 h-3 w-28" />
                    </div>
                ))}

            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-100/80 p-4 dark:border-slate-800 dark:bg-slate-900/60">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {Array.from({ length: 4 }).map((_, index) => (
                        <Skeleton key={index} className="h-9 w-full rounded-lg" />
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                <div className="flex-1 space-y-6">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div
                            key={index}
                            className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/60"
                        >
                            <Skeleton className="h-5 w-44" />
                            <Skeleton className="h-4 w-64" />
                            <div className="space-y-3">
                                {Array.from({ length: 4 }).map((__, innerIndex) => (
                                    <Skeleton key={innerIndex} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="w-full lg:w-80 space-y-4">
                    {Array.from({ length: 2 }).map((_, index) => (
                        <div
                            key={index}
                            className="rounded-xl border border-slate-200 bg-white p-5 shadow-md dark:border-slate-800 dark:bg-slate-900/60"
                        >
                            <Skeleton className="h-5 w-40" />
                            <div className="mt-4 space-y-3">
                                {Array.from({ length: 5 }).map((__, innerIndex) => (
                                    <Skeleton key={innerIndex} className="h-4 w-full" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-md dark:border-slate-800 dark:bg-slate-900/60">
                <Skeleton className="h-5 w-48" />
                <div className="space-y-3">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <Skeleton key={index} className="h-4 w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Drivers', href: '/drivers' },
];

export default function DriversShow({ driver, activityLogs = [], performanceSummary, safetySummary, counts, gradeReport }: DriversShowProps) {
    const { hasPermission } = usePermissions();
    const canViewDriverList = hasPermission('drivers.view');
    const canEditDriver = hasPermission('drivers.edit');
    const canDeleteDriver = hasPermission('drivers.destroy');
    const canDeactivateDriver = hasPermission('drivers.deactivate');
    const canActivateDriver = hasPermission('drivers.activate');
    const canViewDriverTruckAssignments = hasPermission('driver-trucks.view');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [deactivateError, setDeactivateError] = useState<string | null>(null);
    const [activateError, setActivateError] = useState<string | null>(null);

    const { isLoading } = useListingLoading({
        storageKey: DRIVER_DETAIL_SKELETON_STORAGE_KEY,
        isDataReady: Boolean(driver?.id),
        onlySamePath: true,
        targetPath: (pathname) => pathname.startsWith('/drivers/') && pathname !== '/drivers' && !pathname.includes('/edit') && !pathname.includes('/create'),
        initialIsLoading: true,
    });

    const showDeactivateButton = canDeactivateDriver && driver.status !== 'inactive';
    const showActivateButton = canActivateDriver && driver.status === 'inactive';
    const showActionButtons = canEditDriver || canDeleteDriver || showDeactivateButton || showActivateButton;

    const overallGrade = gradeReport?.overall ?? null;
    const gradeWeights = gradeReport?.weights ?? null;
    const gradeCategories: GradeCategoryView[] = gradeReport
        ? (Object.entries(gradeCategoryConfig) as Array<[GradeCategoryKey, GradeCategoryConfigEntry]>)
              .map(([key, config]) => {
                  const category = gradeReport.categories?.[key];

                  if (!category) {
                      return null;
                  }

                  const metricsSource = category.metrics ?? {};
                  const weightKey = `${key}_weight` as keyof GradeWeights;

                  return {
                      key,
                      label: config.label,
                      description: config.description,
                      score: category.score,
                      weight: gradeWeights ? gradeWeights[weightKey] : null,
                      metrics: config.metrics.map(metric => ({
                          label: metric.label,
                          value: metric.formatter((metricsSource as Record<string, number | null | undefined>)[metric.key]),
                      })),
                  } satisfies GradeCategoryView;
              })
              .filter((category): category is GradeCategoryView => Boolean(category))
        : [];

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/drivers/${driver.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    toast({
                        title: '❌ Delete Failed',
                        description: messages || 'Unable to delete this driver. Please resolve any blocking records first.',
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Delete Failed',
                        description: 'An unexpected error occurred while deleting the driver. Please try again.',
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    const handleDeactivateConfirm = () => {
        setDeactivateError(null);
        setIsDeactivating(true);
        router.post(`/drivers/${driver.id}/deactivate`, {}, {
            onSuccess: () => {
                setDeactivateDialogOpen(false);
                setDeactivateError(null);
            },
            onError: (errors: Record<string, string>) => {
                setDeactivateError(errors.error ?? 'Failed to deactivate driver. Please try again.');
            },
            onFinish: () => {
                setIsDeactivating(false);
            },
        });
    };

    const handleActivateConfirm = () => {
        setActivateError(null);
        setIsActivating(true);
        router.post(`/drivers/${driver.id}/activate`, {}, {
            onSuccess: () => {
                setActivateDialogOpen(false);
                setActivateError(null);
            },
            onError: (errors: Record<string, string>) => {
                setActivateError(errors.error ?? 'Failed to activate driver. Please try again.');
            },
            onFinish: () => {
                setIsActivating(false);
            },
        });
    };

    const formatDateDisplay = (value?: string | null) => {
        if (!value) {
            return 'N/A';
        }

        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const getStatusBadgeColor = (status?: string | null) => {
        if (!status) {
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }

        switch (status.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const getSexBadgeColor = (sex?: string | null) => {
        if (!sex) {
            return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }

        const value = sex.toLowerCase();

        switch (value) {
            case 'male':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
            case 'female':
                return 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    };

    const statusLabel = driver.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Unknown';
    const sexLabel = driver.sex ? driver.sex.charAt(0).toUpperCase() + driver.sex.slice(1) : 'Unknown';

    const totalAssignments = counts?.assignments ?? driver.driverTrucks?.length ?? 0;
    const activeAssignmentsCount = driver.driverTrucks?.filter(assignment => assignment.is_attached).length ?? 0;
    const totalDistanceLabel = performanceSummary ? formatKilometers(performanceSummary.total_distance_km, 0) : 'N/A';
    const totalTripsLabel = performanceSummary ? formatNumber(performanceSummary.total_trips, { maximumFractionDigits: 0 }) : 'N/A';
    const fuelEfficiencyLabel = performanceSummary ? formatFuelEfficiency(performanceSummary.avg_fuel_efficiency) : 'N/A';
    const averageRatingLabel = performanceSummary ? formatRating(performanceSummary.avg_customer_rating) : 'N/A';
    const safetyIncidentCountLabel = safetySummary
        ? formatNumber(safetySummary.total_records, { maximumFractionDigits: 0 })
        : 'N/A';
    const totalDamageCostLabel = safetySummary ? formatCurrency(safetySummary.total_damage_cost ?? null) : null;

    const overviewSummaryCards = [
        {
            key: 'status',
            label: 'Status',
            value: (
                <Badge className={`flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>
                    {statusLabel}
                </Badge>
            ),
            helper: `Gender: ${sexLabel}`,
        },
        {
            key: 'assignments',
            label: 'Assignments',
            value: formatNumber(totalAssignments, { maximumFractionDigits: 0 }),
            helper:
                activeAssignmentsCount > 0
                    ? `${activeAssignmentsCount} active right now`
                    : 'No active assignments',
        },
        {
            key: 'trips',
            label: 'Trips Completed',
            value: totalTripsLabel,
            helper: performanceSummary ? `Distance ${totalDistanceLabel}` : 'No performance data yet',
        },
        {
            key: 'efficiency',
            label: 'Fuel Efficiency',
            value: fuelEfficiencyLabel,
            helper: performanceSummary ? `Avg rating ${averageRatingLabel}` : 'No rating yet',
        },
        {
            key: 'safety',
            label: 'Safety Incidents',
            value: safetyIncidentCountLabel,
            helper: totalDamageCostLabel ? `Damage ${totalDamageCostLabel}` : 'No recorded damage costs',
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Driver - ${driver.name}`} />
            {isLoading ? (
                <DriverDetailSkeleton />
            ) : (
                <div className="flex flex-1 min-h-0 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <DetailHeader
                    leading={
                        canViewDriverList ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/drivers')}
                                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Drivers
                            </Button>
                        ) : null
                    }
                    icon={<User className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                    title={driver.name}
                    subtitle="Comprehensive driver profile and performance"
                    actions={
                        showActionButtons ? (
                            <div className="flex gap-2">
                                {canEditDriver ? (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600"
                                    >
                                        <Link href={`/drivers/${driver.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Driver
                                        </Link>
                                    </Button>
                                ) : null}
                                {showDeactivateButton ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setDeactivateError(null);
                                            setDeactivateDialogOpen(true);
                                        }}
                                        className="border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </Button>
                                ) : null}
                                {showActivateButton ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setActivateError(null);
                                            setActivateDialogOpen(true);
                                        }}
                                        className="border-emerald-200 text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                    </Button>
                                ) : null}
                                {canDeleteDriver ? (
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Driver
                                    </Button>
                                ) : null}
                            </div>
                        ) : null
                    }
                />

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <CheckCircle className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" /> Performance
                        </TabsTrigger>
                        <TabsTrigger value="safety" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <ShieldCheck className="h-4 w-4" /> Safety
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" /> History
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview */}
                    <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                        <DetailSummaryGrid items={overviewSummaryCards} />
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                <DetailSectionCard
                                    icon={<User className="h-5 w-5 text-indigo-600" />}
                                    title="Basic Information"
                                    description="Personal and professional details"
                                >
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                <Badge className={`mt-1 flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>{statusLabel}</Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Gender</p>
                                                <Badge className={`mt-1 flex w-fit items-center gap-1 ${getSexBadgeColor(driver.sex)}`}>{sexLabel}</Badge>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Driver ID</p>
                                                    <p className="mt-1 text-sm font-mono">{driver.driverid}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Mobile</p>
                                                    <p className="mt-1 text-sm">{driver.mobile || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Zone</p>
                                                    <p className="mt-1 text-sm">{driver.zone || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Woreda</p>
                                                    <p className="mt-1 text-sm">{driver.woreda || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t pt-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Kebele</p>
                                                    <p className="mt-1 text-sm">{driver.kebele || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">House Number</p>
                                                    <p className="mt-1 text-sm">{driver.housenumber || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DetailSectionCard>
                                <DetailSectionCard
                                    icon={<Truck className="h-5 w-5 text-blue-600" />}
                                    title="Truck Assignments"
                                    description="Recent vehicles paired with this driver"
                                    actions={
                                        canViewDriverTruckAssignments && driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                                            <Button variant="link" size="sm" className="px-0" asChild>
                                                <Link href={`/driver-trucks?driver_id=${driver.id}`} className="flex items-center gap-1 text-blue-600 dark:text-blue-300">
                                                    View all
                                                    <ArrowUpRight className="h-4 w-4" />
                                                </Link>
                                            </Button>
                                        ) : null
                                    }
                                >
                                    <div className="space-y-4">
                                        {driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                                            driver.driverTrucks.map((assignment) => {
                                                const plate = assignment.truck?.plate ?? assignment.plate ?? 'N/A';
                                                const assignmentStatusLabel = assignment.status
                                                    ? `${assignment.status.charAt(0).toUpperCase()}${assignment.status.slice(1)}`
                                                    : assignment.is_attached
                                                        ? 'Active'
                                                        : 'Detached';

                                                return (
                                                    <div key={assignment.id} className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/10 p-4 space-y-3">
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{plate}</p>
                                                                <p className="text-xs text-muted-foreground">Assignment #{assignment.id}</p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>{assignment.is_attached ? 'Attached' : 'Detached'}</Badge>
                                                                <Badge variant="outline" className="text-xs">{assignmentStatusLabel}</Badge>
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                                                            <div><span className="font-medium">Assigned:</span> {formatDateDisplay(assignment.date_recived)}</div>
                                                            <div><span className="font-medium">Detached:</span> {formatDateDisplay(assignment.date_detach)}</div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                            <span className="text-xs text-muted-foreground">Status note: {assignmentStatusLabel}</span>
                                                            {canViewDriverTruckAssignments && (
                                                                <Button variant="link" size="sm" className="px-0" asChild>
                                                                    <Link
                                                                        href={`/drivers/${driver.id}/assignments/${assignment.id}/performances`}
                                                                        className="flex items-center gap-1"
                                                                    >
                                                                        View assignment
                                                                        <ArrowUpRight className="h-4 w-4" />
                                                                    </Link>
                                                                </Button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="text-center py-8 text-sm text-muted-foreground">
                                                <Truck className="mx-auto mb-3 h-10 w-10 opacity-60" />
                                                <p>No truck assignments recorded for this driver yet.</p>
                                            </div>
                                        )}
                                    </div>
                                </DetailSectionCard>
                                <DetailSectionCard
                                    icon={<Calendar className="h-5 w-5 text-green-600" />}
                                    title="Employment Information"
                                    description="Hiring and employment details"
                                    headerClassName="from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                                >
                                    <div className="grid gap-4">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Birthdate</p>
                                            <p className="mt-1 text-sm">{formatDateDisplay(driver.birthdate)}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">Hired Date</p>
                                            <p className="mt-1 text-sm">{formatDateDisplay(driver.hireddate)}</p>
                                        </div>
                                    </div>
                                </DetailSectionCard>
                                <DetailSectionCard
                                    title="Record Information"
                                    description="System-generated metadata"
                                    titleClassName="text-lg"
                                >
                                    <div className="grid gap-4 text-sm">
                                        <div>
                                            <p className="font-medium text-muted-foreground">Created</p>
                                            <p className="mt-1">{formatDateDisplay(driver.created_at)}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-muted-foreground">Last Updated</p>
                                            <p className="mt-1">{formatDateDisplay(driver.updated_at)}</p>
                                        </div>
                                    </div>
                                </DetailSectionCard>
                            </div>
                            <div className="w-full lg:w-80 space-y-4">
                                {overallGrade && gradeCategories.length > 0 && (
                                    <DetailSectionCard
                                        icon={
                                            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                                                <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        }
                                        title="Driver Grade"
                                        description="Weighted comparison against peer drivers"
                                        titleClassName="text-lg"
                                        headerClassName="from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20"
                                    >
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Overall grade</p>
                                                    <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-100">{overallGrade.letter}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Score</p>
                                                    <p className="mt-1 text-3xl font-semibold text-slate-900 dark:text-slate-100">
                                                        {formatNumber(overallGrade.score, {
                                                            minimumFractionDigits: 1,
                                                            maximumFractionDigits: 1,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                {gradeCategories.map(category => (
                                                    <div key={category.key} className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900/40">
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{category.label}</p>
                                                                <p className="text-xs text-muted-foreground">{category.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">{formatNumber(category.score, { maximumFractionDigits: 0 })}%</p>
                                                                {category.weight !== null ? (
                                                                    <p className="text-xs text-muted-foreground">Weight {category.weight}%</p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 h-2 rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-indigo-500"
                                                                style={{ width: `${Math.min(Math.max(category.score, 0), 100)}%` }}
                                                            />
                                                        </div>
                                                        <div className="mt-3 grid gap-2 text-xs">
                                                            {category.metrics.map(metric => (
                                                                <div key={`${category.key}-${metric.label}`} className="flex items-center justify-between text-muted-foreground">
                                                                    <span>{metric.label}</span>
                                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">{metric.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </DetailSectionCard>
                                )}
                                <DetailSectionCard
                                    icon={<CheckCircle className="h-4 w-4 text-indigo-600" />}
                                    title="Quick Status"
                                    titleClassName="text-lg"
                                    headerClassName="from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20"
                                    contentClassName="p-4 space-y-4"
                                >
                                    <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 dark:border-indigo-800 dark:bg-indigo-950/20">
                                        <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Current Status</p>
                                        <Badge className={`mt-2 flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>{statusLabel}</Badge>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
                                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Driver Name</p>
                                        <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{driver.name}</p>
                                    </div>
                                </DetailSectionCard>
                                {counts && (
                                    <DetailSectionCard
                                        icon={
                                            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                                                <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                        }
                                        title="Related Counts"
                                        description="Summary of linked records"
                                        titleClassName="text-lg"
                                        headerClassName="from-indigo-50 to-violet-50 dark:from-indigo-950/20 dark:to-violet-950/20"
                                        contentClassName="p-4 space-y-3 text-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Trucks</span>
                                            <span className="font-semibold">{counts.trucks}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Assignments</span>
                                            <span className="font-semibold">{counts.assignments}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Performances</span>
                                            <span className="font-semibold">{counts.performances}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Performance Records</span>
                                            <span className="font-semibold">{counts.performance_records}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Safety Records</span>
                                            <span className="font-semibold">{counts.safety_records}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Fuel Records</span>
                                            <span className="font-semibold">{counts.fuel_records}</span>
                                        </div>
                                    </DetailSectionCard>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Performance */}
                    <TabsContent value="performance" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1 space-y-6">
                                <DetailSectionCard
                                    icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
                                    title="Performance Overview"
                                    description="Aggregated operational metrics"
                                    headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                                >
                                    {performanceSummary ? (
                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                                                    <p className="text-xs text-muted-foreground">Records</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatNumber(performanceSummary.total_records)}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
                                                    <p className="text-xs text-muted-foreground">Distance (KM)</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatKilometers(performanceSummary.total_distance_km, 0)}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                                                    <p className="text-xs text-muted-foreground">Trips</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatNumber(performanceSummary.total_trips)}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800">
                                                    <p className="text-xs text-muted-foreground">Cargo (T)</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatTons(performanceSummary.total_cargo_tonnage, 1)}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800">
                                                    <p className="text-xs text-muted-foreground">Fuel Eff (KM/L)</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency)}</p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-800">
                                                    <p className="text-xs text-muted-foreground">Avg Rating</p>
                                                    <p className="mt-1 text-2xl font-bold">{formatRating(performanceSummary.avg_customer_rating)}</p>
                                                </div>
                                            </div>
                                    ) : (
                                        <div className="py-8 text-center"><BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 text-lg font-semibold">No performance data</h3><p className="text-muted-foreground mb-4">Performance metrics will be displayed here when available.</p></div>
                                    )}
                                </DetailSectionCard>
                                <DetailSectionCard
                                    icon={<Activity className="h-4 w-4 text-orange-600" />}
                                    title="Recent Performance Records"
                                    description="Latest operational entries (via assignments)"
                                    titleClassName="text-lg"
                                    headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                                >
                                    {driver.performances && driver.performances.length > 0 ? (
                                            <div className="space-y-3">
                                                {driver.performances.slice(0, 10).map((perf) => (
                                                    <div key={perf.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 flex flex-col gap-2">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-sm font-medium">Performance #{perf.id}</span>
                                                            <Badge variant="secondary" className="text-xs">{perf.load_phase || 'N/A'}</Badge>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                            <div><span className="font-medium">Route:</span> {[perf.origin?.name, perf.destination?.name].filter(Boolean).join(' → ') || 'N/A'}</div>
                                                            <div><span className="font-medium">Assignment:</span> {perf.driver_truck?.plate || 'N/A'}</div>
                                                            <div><span className="font-medium">Operation:</span> {perf.operation?.number || 'N/A'}</div>
                                                            <div><span className="font-medium">Status:</span> {perf.is_returned ? 'Returned' : 'In Transit'}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                            <div><span className="font-medium">Total Distance:</span> {formatKilometers(perf.total_distance_km ?? null, 1)}</div>
                                                            <div><span className="font-medium">Distance WCargo:</span> {formatKilometers(perf.DistanceWCargo ?? null, 1)}</div>
                                                            <div><span className="font-medium">Distance WOCargo:</span> {formatKilometers(perf.DistanceWOCargo ?? null, 1)}</div>
                                                            <div><span className="font-medium">Ton-KM:</span> {formatNumber(perf.tonkm ?? null, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                            <div><span className="font-medium">Fuel (L):</span> {formatNumber(perf.fuelInLitter ?? null, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                            <div><span className="font-medium">Fuel (Birr):</span> {formatCurrency(perf.fuelInBirr ?? null)}</div>
                                                            <div><span className="font-medium">Cargo (T):</span> {formatTons(perf.cargo_weight_tons ?? perf.cargo_volume_mt ?? null, 1)}</div>
                                                            <div><span className="font-medium">Trip Duration:</span> {perf.trip_duration_days !== null && perf.trip_duration_days !== undefined ? formatDaysValue(perf.trip_duration_days, 0) : 'N/A'}</div>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                                                            <div><span className="font-medium">Returned Date:</span> {formatDateDisplay(perf.returned_date)}</div>
                                                            <div><span className="font-medium">Assignment Status:</span> {perf.driver_truck?.is_attached ? 'Active' : 'Detached'}</div>
                                                        </div>
                                                        {perf.comment && <p className="text-xs line-clamp-3">{perf.comment}</p>}
                                                    </div>
                                                ))}
                                            </div>
                                    ) : (
                                        <div className="py-8 text-center"><BarChart3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h3 className="mb-2 text-lg font-semibold">No performance records</h3><p className="text-muted-foreground mb-4">Records will appear here once they are created.</p></div>
                                    )}
                                </DetailSectionCard>
                            </div>
                            <div className="w-full lg:w-80 space-y-4">
                                <DetailSectionCard
                                    icon={<BarChart3 className="h-4 w-4 text-orange-600" />}
                                    title="Quick Metrics"
                                    titleClassName="text-lg"
                                    headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                                    contentClassName="p-4 space-y-3 text-sm"
                                >
                                    {performanceSummary ? (
                                            <>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Distance (KM)</span><span className="font-semibold">{formatKilometers(performanceSummary.total_distance_km, 0)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Trips</span><span className="font-semibold">{formatNumber(performanceSummary.total_trips)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Cargo (T)</span><span className="font-semibold">{formatTons(performanceSummary.total_cargo_tonnage, 1)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Eff</span><span className="font-semibold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Avg Rating</span><span className="font-semibold">{formatRating(performanceSummary.avg_customer_rating)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Safety Incidents</span><span className="font-semibold">{formatNumber(performanceSummary.safety_incidents)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Used (L)</span><span className="font-semibold">{formatNumber(performanceSummary.total_fuel_liters ?? null, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Cost</span><span className="font-semibold">{formatCurrency(performanceSummary.total_fuel_cost ?? null)}</span></div>
                                            </>
                                        ) : <p className="text-muted-foreground">No metrics available.</p>}
                                </DetailSectionCard>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Safety */}
                    <TabsContent value="safety" className="space-y-6 h-full overflow-y-auto">
                        <DetailSectionCard
                            icon={<ShieldCheck className="h-5 w-5 text-red-600 dark:text-red-400" />}
                            title="Safety Overview"
                            description="Incidents and safety performance"
                            titleClassName="text-lg"
                            headerClassName="from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20"
                            contentClassName="space-y-6"
                        >
                                {safetySummary ? (
                                    <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-center"><p className="text-xs text-muted-foreground">Total</p><p className="text-lg font-semibold">{safetySummary.total_records}</p></div>
                                        <div className="p-3 rounded-lg bg-orange-50 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800 text-center"><p className="text-xs text-muted-foreground">Accidents</p><p className="text-lg font-semibold">{safetySummary.accidents}</p></div>
                                        <div className="p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-center"><p className="text-xs text-muted-foreground">Violations</p><p className="text-lg font-semibold">{safetySummary.violations}</p></div>
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-center"><p className="text-xs text-muted-foreground">Warnings</p><p className="text-lg font-semibold">{safetySummary.warnings}</p></div>
                                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-center"><p className="text-xs text-muted-foreground">Critical</p><p className="text-lg font-semibold">{safetySummary.critical}</p></div>
                                        <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-800 text-center"><p className="text-xs text-muted-foreground">Major</p><p className="text-lg font-semibold">{safetySummary.major}</p></div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-center"><p className="text-xs text-muted-foreground">Minor</p><p className="text-lg font-semibold">{safetySummary.minor}</p></div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8"><ShieldCheck className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No safety data</h3><p className="text-muted-foreground mb-4">Safety metrics will appear when records exist.</p></div>
                                )}
                                {driver.safetyRecords && driver.safetyRecords.length > 0 ? (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                        {driver.safetyRecords.slice(0, 15).map((rec) => {
                                            const severityLabel = rec.severity ? `${rec.severity.charAt(0).toUpperCase()}${rec.severity.slice(1)} severity` : 'Severity unknown';

                                            return (
                                                <div key={rec.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <Badge className="text-xs" variant="secondary">{rec.incident_type ?? 'Incident'}</Badge>
                                                            <span className="text-sm font-medium capitalize">{severityLabel}</span>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Date: {formatDateDisplay(rec.incident_date)}</span>
                                                    </div>
                                                    {rec.description && <p className="text-xs line-clamp-3">{rec.description}</p>}
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                        <div><span className="font-medium">Location:</span> {rec.location || 'N/A'}</div>
                                                        <div><span className="font-medium">Damage:</span> {formatCurrency(rec.damage_cost ?? null)}</div>
                                                        <div><span className="font-medium">Reported By:</span> {rec.reported_by ?? 'N/A'}</div>
                                                        <div><span className="font-medium">Resolution:</span> {rec.resolution || '—'}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-center py-8"><AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No safety records</h3><p className="text-muted-foreground mb-4">Safety incidents will appear here when logged.</p></div>
                                )}
                        </DetailSectionCard>
                    </TabsContent>

                    {/* History */}
                    <TabsContent value="history" className="space-y-6 h-full overflow-y-auto">
                        <DetailSectionCard
                            icon={<History className="h-5 w-5" />}
                            title="Activity History"
                            description="Audit trail of driver changes"
                            titleClassName="text-lg"
                        >
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="text-center py-8"><History className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No activity history</h3><p className="text-muted-foreground">Activity logs will appear here as changes are made.</p></div>
                                )}
                        </DetailSectionCard>
                    </TabsContent>
                </Tabs>
            </div>
            )}
            {canDeleteDriver && (
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        setDeleteDialogOpen(open);
                        if (!open) {
                            setIsDeleting(false);
                        }
                    }}
                    title="Delete Driver"
                    description="Are you sure you want to delete this driver? This action cannot be undone and will remove all associated records."
                    itemName={driver.name}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                />
            )}
            {canDeactivateDriver && (
                <DeleteConfirmationDialog
                    open={deactivateDialogOpen}
                    onOpenChange={(open) => {
                        setDeactivateDialogOpen(open);
                        if (!open) {
                            setIsDeactivating(false);
                            setDeactivateError(null);
                        }
                    }}
                    title="Deactivate Driver"
                    description="This driver will be marked as inactive and removed from active workflows."
                    itemName={driver.name}
                    onConfirm={handleDeactivateConfirm}
                    confirmLabel="Deactivate"
                    isLoading={isDeactivating}
                    errorMessage={deactivateError}
                    supportingText="You can activate this driver again at any time from this page."
                />
            )}
            {canActivateDriver && (
                <DeleteConfirmationDialog
                    open={activateDialogOpen}
                    onOpenChange={(open) => {
                        setActivateDialogOpen(open);
                        if (!open) {
                            setIsActivating(false);
                            setActivateError(null);
                        }
                    }}
                    title="Activate Driver"
                    description="This driver will be marked as active and available for new assignments."
                    itemName={driver.name}
                    onConfirm={handleActivateConfirm}
                    confirmLabel="Activate"
                    isLoading={isActivating}
                    isDangerous={false}
                    errorMessage={activateError}
                    supportingText="Only drivers with completed onboarding should be activated."
                />
            )}
        </AppLayout>
    );
}

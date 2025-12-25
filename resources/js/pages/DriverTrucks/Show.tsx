import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { toast } from '@/hooks/use-toast';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity,
    AlertCircle,
    ArrowLeft,
    ArrowUpRight,
    Award,
    BarChart3,
    CheckCircle,
    Clock,
    Edit,
    History,
    Truck,
    User,
    UserX,
    XCircle,
} from 'lucide-react';

interface DriverTruck {
    id: number;
    driver_id: number;
    truck_id: number;
    plate: string;
    driverid: string;
    date_recived: string;
    date_detach?: string;
    reason?: string;
    is_attached: boolean;
    status?: string | number | null;
    driver: {
        id: number;
        name: string;
        driverid: string;
    };
    truck: {
        id: number;
        plate: string;
    };
    created_at: string;
    updated_at: string;
}

interface Performance {
    id: number;
    trip?: string | null;
    DateDispach?: string | null;
    CargoVolumMT?: number | null;
    operation?: {
        customer?: {
            name?: string | null;
        } | null;
    } | null;
    origin?: {
        name?: string | null;
    } | null;
    destination?: {
        name?: string | null;
    } | null;
}

interface ActivityLog {
    id: number;
    description: string;
    created_at: string;
    causer?: {
        name: string;
    };
}

interface Props {
    driverTruck: DriverTruck;
    performances: Performance[];
    dateDifference?: string;
    activityLogs: ActivityLog[];
    gradeReport?: GradeReport;
}

type GradeCategoryKey = 'performance' | 'efficiency' | 'consistency';

type GradeCategoryDetails = {
    score: number;
    metrics: Record<string, number | null>;
};

type GradeWeights = {
    performance_weight: number;
    efficiency_weight: number;
    consistency_weight: number;
};

interface GradeReport {
    overall: {
        score: number;
        letter: string;
    };
    weights: GradeWeights;
    categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
    metrics?: {
        assignment?: Record<string, number | null>;
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
    metrics: Array<{
        label: string;
        value: string;
    }>;
};

const gradeCategoryOrder: GradeCategoryKey[] = ['performance', 'efficiency', 'consistency'];

const numberFormatter = new Intl.NumberFormat('en-ET');

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    if (options) {
        return new Intl.NumberFormat('en-ET', options).format(value);
    }

    return numberFormatter.format(value);
};

const formatPercentFromRatio = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${(value * 100).toFixed(maximumFractionDigits)}%`;
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: maximumFractionDigits,
        maximumFractionDigits,
    })} KM`;
};

const formatCurrencyPerKm = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })} / KM`;
};

const formatDays = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    const rounded = Number(value.toFixed(1));

    if (rounded === 1) {
        return '1 day';
    }

    const formatted = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);

    return `${formatted} days`;
};

const formatScore = (value?: number | null, maximumFractionDigits = 1): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return Number(value).toFixed(maximumFractionDigits);
};

const formatWeight = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${Number(value).toFixed(0)}%`;
};

const buildTripLabel = (performance: Performance): string => {
    if (performance.trip && performance.trip.trim().length > 0) {
        return performance.trip.trim();
    }

    return `Trip #${performance.id}`;
};

const formatVolume = (value?: number | null): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
};

const buildRouteLabel = (performance: Performance): string => {
    const origin = performance.origin?.name?.trim();
    const destination = performance.destination?.name?.trim();

    if (!origin && !destination) {
        return 'N/A';
    }

    return `${origin ?? 'Unknown origin'} → ${destination ?? 'Unknown destination'}`;
};

const gradeCategoryConfig: Record<GradeCategoryKey, GradeCategoryConfigEntry> = {
    performance: {
        label: 'Performance',
        description: 'Trips completed, distance covered, and ton-kilometres delivered.',
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
                key: 'avg_trip_distance_km',
                label: 'Avg Trip Distance',
                formatter: value => formatKilometers(value, 1),
            },
            {
                key: 'ton_km_per_trip',
                label: 'Ton-KM / Trip',
                formatter: value => formatNumber(value, { maximumFractionDigits: 1 }),
            },
        ],
    },
    efficiency: {
        label: 'Efficiency',
        description: 'Fuel usage and cost efficiency across trips.',
        metrics: [
            {
                key: 'km_per_liter',
                label: 'KM per Liter',
                formatter: value => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            },
            {
                key: 'fuel_cost_per_km',
                label: 'Fuel Cost / KM',
                formatter: formatCurrencyPerKm,
            },
            {
                key: 'avg_trip_distance_km',
                label: 'Avg Trip Distance',
                formatter: value => formatKilometers(value, 1),
            },
        ],
    },
    consistency: {
        label: 'Consistency',
        description: 'Trip completion and turnaround performance.',
        metrics: [
            {
                key: 'trip_completion_rate',
                label: 'Completion Rate',
                formatter: value => formatPercentFromRatio(value, 0),
            },
            {
                key: 'avg_trip_duration_days',
                label: 'Avg Trip Duration',
                formatter: formatDays,
            },
        ],
    },
};

export default function Show({ driverTruck, performances, dateDifference, activityLogs, gradeReport }: Props) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const overallGrade = gradeReport?.overall ?? null;
    const gradeWeights = gradeReport?.weights ?? null;

    const gradeCategories: GradeCategoryView[] = useMemo(() => {
        if (!gradeReport?.categories) {
            return [];
        }

        return (Object.entries(gradeCategoryConfig) as Array<[GradeCategoryKey, GradeCategoryConfigEntry]>)
            .map(([key, config]) => {
                const category = gradeReport.categories?.[key];

                if (!category) {
                    return null;
                }

                const weightKey = `${key}_weight` as keyof GradeWeights;

                return {
                    key,
                    label: config.label,
                    description: config.description,
                    score: category.score,
                    weight: gradeWeights ? gradeWeights[weightKey] : null,
                    metrics: config.metrics.map(metric => ({
                        label: metric.label,
                        value: metric.formatter(category.metrics?.[metric.key] ?? null),
                    })),
                } satisfies GradeCategoryView;
            })
            .filter((category): category is GradeCategoryView => Boolean(category));
    }, [gradeReport, gradeWeights]);

    if (!driverTruck || !driverTruck.driver || !driverTruck.truck) {
        return (
            <AppLayout breadcrumbs={[]}>
                <div className="flex h-64 items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-lg font-semibold text-gray-900">Loading...</h2>
                        <p className="text-gray-600">Please wait while we load the assignment data.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const breadcrumbs: BreadcrumbItem[] = [
        {
            title: 'Driver-Truck Assignments',
            href: '/driver-trucks',
        },
        {
            title: `${driverTruck.driver.name} – ${driverTruck.truck.plate}`,
            href: `/driver-trucks/${driverTruck.id}`,
        },
    ];

    const formatDate = (value?: string) => {
        if (!value) {
            return 'N/A';
        }

        return new Date(value).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatDateTime = (value?: string) => {
        if (!value) {
            return 'N/A';
        }

        return new Date(value).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const assignmentStatus = driverTruck.is_attached ? 'Attached' : 'Detached';
    const assignmentStatusBadgeClass = driverTruck.is_attached
        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-200'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200';
    const assignmentStatusCardClass = driverTruck.is_attached
        ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200'
        : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/20 dark:text-rose-200';
    const overviewSummaryItems = [
        {
            key: 'assignment-id',
            label: 'Assignment ID',
            value: `#${driverTruck.id}`,
            helper: `Driver ID ${driverTruck.driver.driverid}`,
        },
        {
            key: 'performances',
            label: 'Performances',
            value: formatNumber(performances.length, { maximumFractionDigits: 0 }),
            helper: 'Linked performance records',
        },
        {
            key: 'duration',
            label: 'Duration',
            value: dateDifference ?? 'N/A',
            helper: `Assigned ${formatDate(driverTruck.date_recived)}`,
        },
        {
            key: 'status',
            label: 'Status',
            value: (
                <Badge className={`flex w-fit items-center gap-1 ${assignmentStatusBadgeClass}`}>
                    {driverTruck.is_attached ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                    {assignmentStatus}
                </Badge>
            ),
            valueClassName: 'text-base font-semibold',
            helper: driverTruck.status ? `Note: ${String(driverTruck.status)}` : 'No status notes recorded',
        },
    ];

    const handleDeleteConfirm = () => {
        setIsDeleting(true);
        router.delete(`/driver-trucks/${driverTruck.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                toast({
                    title: '✅ Assignment Deleted',
                    description: 'The driver-truck assignment has been removed successfully.',
                });
            },
            onError: (errors) => {
                setIsDeleting(false);

                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((message): message is string => Boolean(message && message.length));

                    toast({
                        title: '❌ Delete Failed',
                        description: errorMessages.length > 0 
                            ? errorMessages.join('\n')
                            : 'Unable to delete this assignment. Please resolve any blocking records first.',
                        variant: 'destructive',
                    });
                } else {
                    toast({
                        title: '❌ Delete Failed',
                        description: 'An unexpected error occurred while deleting the assignment. Please try again.',
                        variant: 'destructive',
                    });
                }
            },
        });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Assignment: ${driverTruck.driver.name} - ${driverTruck.truck.plate}`} />

            <div className="flex min-h-0 flex-1 flex-col gap-6 rounded-xl p-4">
                <DetailHeader
                    leading={
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.get('/driver-trucks')}
                            className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back to Assignments
                        </Button>
                    }
                    icon={<Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                    title={`${driverTruck.driver.name} · ${driverTruck.truck.plate}`}
                    subtitle="Detailed overview of the driver-truck assignment lifecycle"
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                asChild
                                className="border-slate-300 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-600 dark:hover:bg-blue-950/40"
                            >
                                <Link href={`/driver-trucks/${driverTruck.id}/edit`}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Edit Assignment
                                </Link>
                            </Button>
                            {driverTruck.is_attached ? (
                                <Button
                                    variant="outline"
                                    asChild
                                    className="border-amber-200 text-amber-700 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/40"
                                >
                                    <Link href={`/driver-trucks/${driverTruck.id}/detach`}>
                                        <UserX className="mr-2 h-4 w-4" />
                                        Detach Driver
                                    </Link>
                                </Button>
                            ) : null}
                            <Button
                                variant="outline"
                                onClick={() => setDeleteDialogOpen(true)}
                                className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/40"
                            >
                                <AlertCircle className="mr-2 h-4 w-4" />
                                Delete
                            </Button>
                        </div>
                    }
                />

                <DetailSummaryGrid items={overviewSummaryItems} />

                <Tabs defaultValue="overview" className="flex flex-1 flex-col overflow-hidden">
                    <TabsList className="grid w-full grid-cols-3 rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
                        <TabsTrigger
                            value="overview"
                            className="flex items-center gap-2 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600"
                        >
                            <CheckCircle className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger
                            value="performances"
                            className="flex items-center gap-2 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600"
                        >
                            <BarChart3 className="h-4 w-4" />
                            Performances ({performances.length})
                        </TabsTrigger>
                        <TabsTrigger
                            value="activity"
                            className="flex items-center gap-2 rounded-lg font-medium transition-all duration-200 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600"
                        >
                            <History className="h-4 w-4" />
                            Activity
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="h-full overflow-y-auto space-y-6">
                        <div className="flex flex-col gap-6 lg:flex-row">
                            <div className="flex-1 space-y-6">
                                <DetailSectionCard
                                    icon={<CheckCircle className="h-5 w-5 text-indigo-600" />}
                                    title="Assignment Summary"
                                    description="Snapshot of the assignment timeline and status"
                                    headerClassName="from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20"
                                    contentClassName="grid gap-4 md:grid-cols-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Driver</p>
                                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {driverTruck.driver.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">ID: {driverTruck.driver.driverid}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Truck</p>
                                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                            {driverTruck.truck.plate}
                                        </p>
                                        <p className="text-xs text-muted-foreground">Assignment plate: {driverTruck.plate}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Assigned On</p>
                                        <p className="mt-1 text-sm">{formatDate(driverTruck.date_recived)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Detached On</p>
                                        <p className="mt-1 text-sm">{formatDate(driverTruck.date_detach)}</p>
                                    </div>
                                    {dateDifference ? (
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium text-muted-foreground">Assignment Duration</p>
                                            <p className="mt-1 text-sm font-semibold text-indigo-600 dark:text-indigo-300">{dateDifference}</p>
                                        </div>
                                    ) : null}
                                    {driverTruck.reason ? (
                                        <div className="md:col-span-2">
                                            <p className="text-sm font-medium text-muted-foreground">Detachment Reason</p>
                                            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">{driverTruck.reason}</p>
                                        </div>
                                    ) : null}
                                </DetailSectionCard>

                                <DetailSectionCard
                                    icon={<Clock className="h-5 w-5 text-slate-600" />}
                                    title="System Metadata"
                                    description="Audit information recorded for this assignment"
                                    headerClassName="from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10"
                                    contentClassName="grid gap-4 md:grid-cols-2"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Created At</p>
                                        <p className="mt-1 text-sm">{formatDateTime(driverTruck.created_at)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                                        <p className="mt-1 text-sm">{formatDateTime(driverTruck.updated_at)}</p>
                                    </div>
                                </DetailSectionCard>
                            </div>

                            <div className="w-full space-y-4 lg:w-80">
                                {gradeReport ? (
                                    <DetailSectionCard
                                        icon={<Award className="h-5 w-5 text-amber-600" />}
                                        title="Assignment Grade"
                                        description="Relative performance compared with similar pairings"
                                        headerClassName="from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
                                        contentClassName="space-y-4"
                                    >
                                        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-800/60 dark:bg-amber-950/40">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                                                    Overall Score
                                                </p>
                                                <div className="mt-1 flex items-baseline gap-3">
                                                    <span className="text-3xl font-bold text-amber-800 dark:text-amber-100">
                                                        {overallGrade ? formatScore(overallGrade.score) : 'N/A'}
                                                    </span>
                                                    <span className="text-sm text-muted-foreground">
                                                        {overallGrade ? `${formatScore(overallGrade.score)} / 100` : 'Waiting for data'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl font-semibold text-amber-700 dark:bg-amber-500/20 dark:text-amber-200">
                                                {overallGrade?.letter ?? '—'}
                                            </div>
                                        </div>

                                        {gradeWeights ? (
                                            <div className="grid grid-cols-3 gap-2 text-xs">
                                                {gradeCategoryOrder.map((key) => {
                                                    const weightKey = `${key}_weight` as keyof GradeWeights;
                                                    const weightValue = gradeWeights[weightKey];
                                                    const config = gradeCategoryConfig[key];

                                                    return (
                                                        <div
                                                            key={`weight-${key}`}
                                                            className="rounded-md border border-amber-200 bg-white/70 p-2 text-center dark:border-amber-800/50 dark:bg-amber-950/30"
                                                        >
                                                            <p className="text-xs font-semibold text-amber-700 dark:text-amber-200">{config.label}</p>
                                                            <p className="mt-1 font-medium text-slate-800 dark:text-slate-100">
                                                                {formatWeight(weightValue)}
                                                            </p>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : null}

                                        {gradeCategories.length > 0 ? (
                                            <div className="space-y-3">
                                                {gradeCategories.map((category) => (
                                                    <div
                                                        key={`grade-${category.key}`}
                                                        className="rounded-lg border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/50"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {category.label}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">{category.description}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                                                                    {formatScore(category.score)}
                                                                </p>
                                                                {category.weight !== null ? (
                                                                    <p className="text-xs text-muted-foreground">Weight {formatWeight(category.weight)}</p>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 grid grid-cols-1 gap-2">
                                                            {category.metrics.map((metric) => (
                                                                <div
                                                                    key={`${category.key}-${metric.label}`}
                                                                    className="flex items-center justify-between rounded-md bg-slate-100/70 px-2 py-1 text-xs dark:bg-slate-900/60"
                                                                >
                                                                    <span className="text-muted-foreground">{metric.label}</span>
                                                                    <span className="font-medium text-slate-900 dark:text-slate-100">{metric.value}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground">
                                                Grade insights will appear once enough performance data has been recorded for this assignment.
                                            </p>
                                        )}
                                    </DetailSectionCard>
                                ) : (
                                    <DetailSectionCard
                                        icon={<Award className="h-5 w-5 text-amber-600" />}
                                        title="Assignment Grade"
                                        description="Relative performance compared with similar pairings"
                                        headerClassName="from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20"
                                    >
                                        <p className="text-sm text-muted-foreground">
                                            Grade analytics will become available after more performance data is captured for this driver-truck pairing.
                                        </p>
                                    </DetailSectionCard>
                                )}

                                <DetailSectionCard
                                    icon={<Activity className="h-5 w-5 text-emerald-600" />}
                                    title="Current Status"
                                    headerClassName="from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20"
                                    contentClassName="space-y-3"
                                >
                                    <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${assignmentStatusCardClass}`}>
                                        <span>{assignmentStatus}</span>
                                    </div>
                                    <div className="rounded-lg border border-slate-200 bg-white/60 p-3 text-sm dark:border-slate-700 dark:bg-slate-900/40">
                                        <p className="font-medium text-muted-foreground">Operational Notes</p>
                                        <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                                            {driverTruck.status ? String(driverTruck.status) : 'No additional status notes recorded.'}
                                        </p>
                                    </div>
                                </DetailSectionCard>

                                <DetailSectionCard
                                    icon={<User className="h-5 w-5 text-purple-600" />}
                                    title="Driver Snapshot"
                                    headerClassName="from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20"
                                    contentClassName="space-y-2 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Name</span>
                                        <span className="font-semibold">{driverTruck.driver.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Identifier</span>
                                        <span className="font-mono text-xs">{driverTruck.driver.driverid}</span>
                                    </div>
                                </DetailSectionCard>

                                <DetailSectionCard
                                    icon={<Truck className="h-5 w-5 text-orange-600" />}
                                    title="Truck Snapshot"
                                    headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                                    contentClassName="space-y-2 text-sm"
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Plate</span>
                                        <span className="font-semibold">{driverTruck.truck.plate}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Assignment Plate</span>
                                        <span className="font-mono text-xs">{driverTruck.plate}</span>
                                    </div>
                                </DetailSectionCard>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="performances" className="h-full overflow-y-auto space-y-6">
                        <DetailSectionCard
                            icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
                            title="Performance Records"
                            description="Operational history captured for this pairing"
                            headerClassName="from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20"
                        >
                            {performances.length > 0 ? (
                                <div className="max-h-[520px] overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
                                    <Table>
                                        <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                                            <TableRow>
                                                <TableHead>Trip</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Customer</TableHead>
                                                <TableHead>Route</TableHead>
                                                <TableHead className="text-right">Volume (MT)</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {performances.map((performance) => (
                                                <TableRow key={performance.id}>
                                                    <TableCell className="font-medium">
                                                        <Link
                                                            href={`/performances/${performance.id}`}
                                                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-300 hover:underline"
                                                        >
                                                            {buildTripLabel(performance)}
                                                            <ArrowUpRight className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </TableCell>
                                                    <TableCell>{formatDate(performance.DateDispach ?? undefined)}</TableCell>
                                                    <TableCell>{performance.operation?.customer?.name?.trim() || 'N/A'}</TableCell>
                                                    <TableCell>{buildRouteLabel(performance)}</TableCell>
                                                    <TableCell className="text-right font-medium">{formatVolume(performance.CargoVolumMT)}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                                    <p>No performance records found for this assignment.</p>
                                    <p className="mt-2 text-sm">Performance entries will appear once linked operations are recorded.</p>
                                </div>
                            )}
                        </DetailSectionCard>
                    </TabsContent>

                    <TabsContent value="activity" className="h-full overflow-y-auto space-y-6">
                        <DetailSectionCard
                            icon={<History className="h-5 w-5 text-slate-600" />}
                            title="Activity Log"
                            description="Recent events recorded for this assignment"
                            headerClassName="from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10"
                        >
                            {activityLogs.length > 0 ? (
                                <div className="space-y-3">
                                    {activityLogs.map((log) => (
                                        <div
                                            key={log.id}
                                            className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/70 dark:border-slate-700 dark:bg-slate-900/50 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                                        >
                                            <div className="rounded-lg bg-blue-100 p-2 dark:bg-blue-900/30">
                                                <Activity className="h-4 w-4 text-blue-600 dark:text-blue-300" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-slate-800 dark:text-slate-100">{log.description}</p>
                                                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    <span>{formatDateTime(log.created_at)}</span>
                                                    {log.causer?.name ? (
                                                        <>
                                                            <span>•</span>
                                                            <span>by {log.causer.name}</span>
                                                        </>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-muted-foreground">
                                    <Activity className="mx-auto mb-4 h-12 w-12 opacity-60" />
                                    <p>No activity recorded for this assignment yet.</p>
                                    <p className="mt-2 text-sm">Updates will appear here as changes are made.</p>
                                </div>
                            )}
                        </DetailSectionCard>
                    </TabsContent>
                </Tabs>
            </div>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete Assignment"
                description="Are you sure you want to delete this driver-truck assignment? This action cannot be undone."
                itemName={`${driverTruck.driver.name} ↔ ${driverTruck.truck.plate}`}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

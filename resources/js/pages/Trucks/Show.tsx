import { useState, useMemo, useCallback } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailHeader } from '@/components/detail/detail-header';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import {
    Activity,
    ArrowLeft,
    ArrowUpRight,
    Ban,
    BarChart3,
    Calendar,
    CheckCircle,
    DollarSign,
    Edit,
    Hash,
    History,
    Truck,
    Trash2,
    Wrench,
    XCircle,
    Clock,
    User,
} from 'lucide-react';

type VehicleType = {
    id: number;
    name: string;
};

type ActivityLog = {
    id: number;
    description: string;
    causer?: {
        name?: string;
    };
    created_at: string;
    properties?: Record<string, unknown>;
};

type DriverAssignment = {
    id: number;
    driver_id: number | null;
    driverid: string | null;
    date_recived?: string | null;
    date_detach?: string | null;
    is_attached: boolean;
    status: string | null;
    driver?: {
        id: number;
        name: string;
        driverid: string;
    } | null;
};

type PerformanceRecord = {
    id: number;
    driver_truck_id: number | null;
    DateDispach?: string | null;
    DistanceWCargo?: number | null;
    DistanceWOCargo?: number | null;
    fuelInLitter?: number | null;
    fuelInBirr?: number | null;
    load_phase?: string | null;
    comment?: string | null;
    satus?: string | null;
    tonkm?: number | null;
    cargo_volume_mt?: number | null;
    cargo_weight_kg?: number | null;
    cargo_weight_tons?: number | null;
    is_returned?: boolean;
    returned_date?: string | null;
    total_distance_km?: number | null;
    trip_duration_days?: number | null;
    origin?: {
        id: number;
        name: string;
    } | null;
    destination?: {
        id: number;
        name: string;
    } | null;
};

type MaintenanceRecord = {
    id: number;
    maintenance_type_id?: number | null;
    scheduled_date?: string | null;
    completed_date?: string | null;
    odometer_reading?: number | null;
    cost?: number | null;
    description?: string | null;
    service_provider?: string | null;
    status?: string | null;
    is_overdue?: boolean;
};

type GradeCategoryKey = 'utilization' | 'efficiency' | 'reliability' | 'financial' | 'compliance';

type GradeCategoryMetrics = Record<string, number | null>;

type GradeCategoryDetails = {
    score: number;
    metrics: GradeCategoryMetrics;
};

type GradeWeights = {
    utilization_weight: number;
    efficiency_weight: number;
    reliability_weight: number;
    financial_weight: number;
    compliance_weight: number;
};

type UtilizationMetrics = {
    window_days: number;
    service_days: number;
    idle_days: number;
    unknown_days: number;
    total_days: number;
    utilization_rate: number | null;
    idle_rate: number | null;
};

type FinancialMetrics = {
    window_days: number;
    total_revenue: number;
    total_cost: number;
    total_profit: number;
    avg_revenue_per_truck: number;
    ton_km: number;
    ton_km_per_birr: number | null;
};

type StaffingMetrics = {
    window_days: number;
    average_tenure_days: number | null;
    assignment_count: number;
    truck_count_with_assignments: number;
    short_tenure_threshold_days: number;
    high_churn_truck_count: number;
    high_churn_trucks: Array<{
        truck_id: number;
        truck_plate: string | null;
        average_tenure_days: number;
        assignment_count: number;
    }>;
    flagged_truck_ids: number[];
};

interface GradeReport {
    overall: {
        score: number;
        letter: string;
    };
    weights: GradeWeights;
    categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
    metrics?: {
        truck?: Record<string, number | null>;
        peer_averages?: Record<string, number | null>;
    };
}

interface TruckDetails {
    id: number;
    plate: string;
    vehicletype_id: number;
    chasisNumber?: string | null;
    engineNumber?: string | null;
    tyreSyze?: string | null;
    serviceIntervalKM?: number | null;
    purchasePrice?: number | null;
    productionDate?: string | null;
    serviceStartDate?: string | null;
    status: string;
    created_at?: string | null;
    updated_at?: string | null;
    vehicleType?: VehicleType | null;
    driverTrucks?: DriverAssignment[];
    maintenanceRecords?: MaintenanceRecord[];
    performances?: PerformanceRecord[];
    utilization?: UtilizationMetrics | null;
    financial?: FinancialMetrics | null;
    staffing?: StaffingMetrics | null;
}

interface TrucksShowProps {
    truck: TruckDetails;
    activityLogs?: ActivityLog[];
    counts?: {
        drivers: number;
        performances: number;
        driverAssignments: number;
        maintenance: number;
    };
    performanceSummary?: {
        total_records: number;
        main_trip_records: number;
        completed_trips: number;
        open_trips: number;
        total_distance_km: number;
        total_loaded_distance_km: number;
        total_empty_distance_km: number;
        total_fuel_liters: number;
        fuel_cost_birr: number;
        avg_distance_per_record: number;
        avg_trip_distance_km: number;
        avg_loaded_distance_km: number | null;
        avg_empty_distance_km: number | null;
        avg_fuel_efficiency_km_per_liter: number | null;
        avg_trip_duration_days: number | null;
        total_ton_km: number;
        avg_ton_km_per_trip: number | null;
        total_payload_tons: number;
        avg_payload_tons_per_trip: number | null;
        total_cargo_volume_mt: number;
        avg_cargo_volume_mt_per_trip: number | null;
        trip_completion_rate: number | null;
    };
    maintenanceSummary?: {
        total_records: number;
        completed: number;
        scheduled: number;
        overdue: number;
        total_cost: number;
    };
    gradeReport?: GradeReport;
}

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Trucks', href: '/trucks' }];

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

const shortDateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
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

const formatPercent = (value?: number | null, maximumFractionDigits = 0): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${(value * 100).toFixed(maximumFractionDigits)}%`;
};

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

const formatShortDate = (value?: string | null): string => {
    if (!value) {
        return 'N/A';
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
        return 'N/A';
    }

    return shortDateFormatter.format(parsed);
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

const formatKilometersWithPrecision = (value?: number | null, maximumFractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) {
        return 'N/A';
    }

    return `${formatNumber(value, {
        minimumFractionDigits: maximumFractionDigits,
        maximumFractionDigits,
    })} KM`;
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

const formatDays = (value?: number | null, maximumFractionDigits = 0): string => {
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

const gradeCategoryConfig: Record<GradeCategoryKey, {
    label: string;
    description: string;
    metrics: Array<{
        key: string;
        label: string;
        formatter: (value: number | null) => string;
    }>;
}> = {
    utilization: {
        label: 'Utilization',
        description: 'Distance covered and assignment activity.',
        metrics: [
            {
                key: 'total_distance_km',
                label: 'Distance',
                formatter: value => formatKilometers(value ?? null),
            },
            {
                key: 'performance_records',
                label: 'Performance records',
                formatter: value => formatNumber(value ?? null),
            },
        ],
    },
    efficiency: {
        label: 'Efficiency',
        description: 'Fuel economy and cost per kilometre.',
        metrics: [
            {
                key: 'avg_km_per_liter',
                label: 'KM per liter',
                formatter: value =>
                    value === null || value === undefined
                        ? 'N/A'
                        : `${formatNumber(value, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })} KM/L`,
            },
            {
                key: 'fuel_cost_per_km',
                label: 'Fuel cost per KM',
                formatter: value =>
                    value === null || value === undefined
                        ? 'N/A'
                        : `${formatCurrency(value, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                          })} / KM`,
            },
        ],
    },
    reliability: {
        label: 'Reliability',
        description: 'Maintenance completion and overdue tasks.',
        metrics: [
            {
                key: 'maintenance_completion_rate',
                label: 'Completion rate',
                formatter: value => formatPercent(value ?? null, 0),
            },
            {
                key: 'maintenance_overdue_records',
                label: 'Overdue tasks',
                formatter: value => formatNumber(value ?? null),
            },
        ],
    },
    financial: {
        label: 'Financial',
        description: 'Recent maintenance spend and asset cost.',
        metrics: [
            {
                key: 'maintenance_total_cost_last_year',
                label: 'Maintenance (12 mo.)',
                formatter: value => formatCurrency(value ?? null),
            },
            {
                key: 'purchase_price',
                label: 'Purchase price',
                formatter: value => formatCurrency(value ?? null),
            },
        ],
    },
    compliance: {
        label: 'Compliance',
        description: 'Status changes affecting availability.',
        metrics: [
            {
                key: 'downtime_changes_90d',
                label: 'Downtime events (90d)',
                formatter: value => formatNumber(value ?? null),
            },
            {
                key: 'status_changes_90d',
                label: 'Status changes (90d)',
                formatter: value => formatNumber(value ?? null),
            },
        ],
    },
};

export default function TrucksShow({ truck, activityLogs = [], counts, performanceSummary, maintenanceSummary, gradeReport }: TrucksShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const { hasPermission } = usePermissions();
    const canEditTruck = hasPermission('trucks.edit');
    const canDeleteTruck = hasPermission('trucks.destroy');
    const canDeactivateTruck = hasPermission('trucks.deactivate');
    const canActivateTruck = hasPermission('trucks.activate');
    const canViewTruckList = hasPermission('trucks.view');
    const canViewDriverTruckAssignments = hasPermission('driver-trucks.view');
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
    const [isDeactivating, setIsDeactivating] = useState(false);
    const [deactivateError, setDeactivateError] = useState<string | null>(null);
    const [activateDialogOpen, setActivateDialogOpen] = useState(false);
    const [isActivating, setIsActivating] = useState(false);
    const [activateError, setActivateError] = useState<string | null>(null);
    const showDeactivateButton = canDeactivateTruck && truck.status !== 'inactive';
    const showActivateButton = canActivateTruck && truck.status === 'inactive';
    const showActionButtons = canEditTruck || canDeleteTruck || showDeactivateButton || showActivateButton;

    const driverAssignments = truck.driverTrucks ?? [];
    const maintenanceRecords = truck.maintenanceRecords ?? [];
    const performanceRecords = truck.performances ?? [];
    const financial = truck.financial ?? null;
    const staffing = truck.staffing ?? null;

    // Memoize financial calculations to avoid recalculation on every render
    const financialCalculations = useMemo(() => {
        const financialWindowDays = financial?.window_days ?? 30;
        const totalRevenue = financial?.total_revenue ?? null;
        const totalCost = financial?.total_cost ?? null;
        const totalProfit = financial?.total_profit ?? null;
        const averageRevenuePerTruck = financial?.avg_revenue_per_truck ?? null;
        const totalTonKmFinancial = financial?.ton_km ?? null;
        const tonKmPerBirr = financial?.ton_km_per_birr ?? null;
        
        return {
            financialWindowDays,
            totalRevenue,
            totalCost,
            totalProfit,
            averageRevenuePerTruck,
            totalTonKmFinancial,
            tonKmPerBirr,
            revenueDisplay: formatCurrency(totalRevenue),
            costDisplay: formatCurrency(totalCost),
            profitDisplay: formatCurrency(totalProfit),
            avgRevenueDisplay: formatCurrency(averageRevenuePerTruck),
            tonKmPerBirrDisplay: tonKmPerBirr !== null && tonKmPerBirr !== undefined
                ? `${tonKmPerBirr.toFixed(2)} ton-km / ETB`
                : 'N/A',
        };
    }, [financial]);

    const {
        financialWindowDays,
        totalRevenue,
        totalCost,
        totalProfit,
        averageRevenuePerTruck,
        totalTonKmFinancial,
        tonKmPerBirr,
        revenueDisplay,
        costDisplay,
        profitDisplay,
        avgRevenueDisplay,
        tonKmPerBirrDisplay,
    } = financialCalculations;
    // Memoize staffing calculations
    const staffingCalculations = useMemo(() => {
        const staffingWindowDays = staffing?.window_days ?? 180;
        const averageTenureDays = staffing?.average_tenure_days ?? null;
        const highChurnThresholdDays = staffing?.short_tenure_threshold_days ?? 0;
        const highChurnAssignments = staffing?.assignment_count ?? 0;
        const averageTenureDisplay = averageTenureDays !== null ? formatDays(averageTenureDays, 1) : 'N/A';
        const isHighChurn = (staffing?.high_churn_trucks ?? []).some((entry) => entry.truck_id === truck.id);
        const churnStatusLabel = isHighChurn ? 'High churn risk' : 'Stable assignments';
        const churnStatusHelper = isHighChurn
            ? `Average tenure ${averageTenureDisplay} across ${highChurnAssignments} assignment${highChurnAssignments === 1 ? '' : 's'} (< ${highChurnThresholdDays} days)`
            : `${highChurnAssignments} assignment${highChurnAssignments === 1 ? '' : 's'} reviewed · Threshold ${highChurnThresholdDays} days`;
        
        return {
            staffingWindowDays,
            averageTenureDays,
            highChurnThresholdDays,
            highChurnAssignments,
            averageTenureDisplay,
            isHighChurn,
            churnStatusLabel,
            churnStatusHelper,
        };
    }, [staffing, truck.id]);

    const {
        staffingWindowDays,
        averageTenureDays,
        highChurnThresholdDays,
        highChurnAssignments,
        averageTenureDisplay,
        isHighChurn,
        churnStatusLabel,
        churnStatusHelper,
    } = staffingCalculations;

    // Memoize performance summary calculations
    const performanceCalculations = useMemo(() => {
        const totalDistanceKm = performanceSummary?.total_distance_km ?? null;
        const totalLoadedDistanceKm = performanceSummary?.total_loaded_distance_km ?? null;
        const totalEmptyDistanceKm = performanceSummary?.total_empty_distance_km ?? null;
        const totalFuelCost = performanceSummary?.fuel_cost_birr ?? null;
        const avgFuelEfficiency = performanceSummary?.avg_fuel_efficiency_km_per_liter ?? null;
        const totalTrips = performanceSummary?.total_records ?? 0;
        const completedTrips = performanceSummary?.completed_trips ?? 0;
        const openTrips = performanceSummary?.open_trips ?? 0;
        const mainTripRecords = performanceSummary?.main_trip_records ?? 0;
        const avgTripDistanceKm = performanceSummary?.avg_trip_distance_km ?? null;
        const avgLoadedDistanceKm = performanceSummary?.avg_loaded_distance_km ?? null;
        const avgEmptyDistanceKm = performanceSummary?.avg_empty_distance_km ?? null;
        const avgTripDurationDays = performanceSummary?.avg_trip_duration_days ?? null;
        const totalTonKm = performanceSummary?.total_ton_km ?? null;
        const avgTonKmPerTrip = performanceSummary?.avg_ton_km_per_trip ?? null;
        const totalPayloadTons = performanceSummary?.total_payload_tons ?? null;
        const avgPayloadTonsPerTrip = performanceSummary?.avg_payload_tons_per_trip ?? null;
        const tripCompletionRate = performanceSummary?.trip_completion_rate ?? null;
        
        return {
            totalDistanceKm,
            totalLoadedDistanceKm,
            totalEmptyDistanceKm,
            totalFuelCost,
            avgFuelEfficiency,
            totalTrips,
            completedTrips,
            openTrips,
            mainTripRecords,
            avgTripDistanceKm,
            avgLoadedDistanceKm,
            avgEmptyDistanceKm,
            avgTripDurationDays,
            totalTonKm,
            avgTonKmPerTrip,
            totalPayloadTons,
            avgPayloadTonsPerTrip,
            tripCompletionRate,
        };
    }, [performanceSummary]);

    const {
        totalDistanceKm,
        totalLoadedDistanceKm,
        totalEmptyDistanceKm,
        totalFuelCost,
        avgFuelEfficiency,
        totalTrips,
        completedTrips,
        openTrips,
        mainTripRecords,
        avgTripDistanceKm,
        avgLoadedDistanceKm,
        avgEmptyDistanceKm,
        avgTripDurationDays,
        totalTonKm,
        avgTonKmPerTrip,
        totalPayloadTons,
        avgPayloadTonsPerTrip,
        tripCompletionRate,
    } = performanceCalculations;

    // Memoize utilization calculations
    const utilizationCalculations = useMemo(() => {
        const utilization = truck.utilization ?? null;
        const utilizationWindowDays = utilization?.window_days ?? 30;
        const utilizationRate = utilization?.utilization_rate ?? null;
        const utilizationRateDisplay = utilizationRate !== null ? formatPercent(utilizationRate, 0) : 'N/A';
        const utilizationServiceDays = utilization?.service_days ?? null;
        const utilizationIdleDays = utilization?.idle_days ?? null;
        const utilizationUnknownDays = utilization?.unknown_days ?? null;
        
        return {
            utilization,
            utilizationWindowDays,
            utilizationRate,
            utilizationRateDisplay,
            utilizationServiceDays,
            utilizationIdleDays,
            utilizationUnknownDays,
        };
    }, [truck.utilization]);

    const {
        utilization,
        utilizationWindowDays,
        utilizationRate,
        utilizationRateDisplay,
        utilizationServiceDays,
        utilizationIdleDays,
        utilizationUnknownDays,
    } = utilizationCalculations;

    const maintenanceCost = maintenanceSummary?.total_cost ?? null;

    // Memoize vehicle highlights array to avoid recreation on every render
    const vehicleHighlights = useMemo(() => [
        {
            label: 'Purchase Price',
            value: formatCurrency(truck.purchasePrice ?? null),
        },
        {
            label: 'Service Interval',
            value: formatKilometers(truck.serviceIntervalKM),
        },
        {
            label: `Revenue (${financialWindowDays}d)`,
            value: revenueDisplay,
        },
        {
            label: 'Net Profit',
            value: profitDisplay,
        },
        {
            label: 'Operating Cost',
            value: costDisplay,
        },
        {
            label: 'Ton-KM per ETB',
            value: tonKmPerBirrDisplay,
        },
        {
            label: `Driver Tenure (${staffingWindowDays}d)`,
            value: averageTenureDisplay,
        },
        {
            label: 'Churn Status',
            value: churnStatusLabel,
        },
        {
            label: `Utilization (${utilizationWindowDays}d)`,
            value: utilizationRateDisplay,
        },
        {
            label: 'Service Days',
            value: formatDays(utilizationServiceDays ?? null),
        },
        {
            label: 'Idle Days',
            value: formatDays(utilizationIdleDays ?? null),
        },
        {
            label: 'Unknown Days',
            value: formatDays(utilizationUnknownDays ?? null),
        },
        {
            label: 'Trips Logged',
            value: formatNumber(totalTrips || null),
        },
        {
            label: 'Trips Completed',
            value: formatNumber(completedTrips || null),
        },
        {
            label: 'Trip Completion Rate',
            value: formatPercent(tripCompletionRate, 0),
        },
        {
            label: 'Total Distance',
            value: formatKilometers(totalDistanceKm),
        },
        {
            label: 'Loaded Distance',
            value: formatKilometers(totalLoadedDistanceKm),
        },
        {
            label: 'Fuel Cost To Date',
            value: formatCurrency(totalFuelCost),
        },
        {
            label: 'Avg Fuel Efficiency',
            value:
                avgFuelEfficiency !== null
                    ? `${formatNumber(avgFuelEfficiency, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                      })} KM/L`
                    : 'N/A',
        },
        {
            label: 'Maintenance Spend',
            value: formatCurrency(maintenanceCost),
        },
        {
            label: 'Avg Revenue / Truck',
            value: avgRevenueDisplay,
        },
        {
            label: 'Total Ton-KM',
            value: formatNumber(totalTonKmFinancial ?? null, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
            }),
        },
    ], [
        truck.purchasePrice,
        truck.serviceIntervalKM,
        financialWindowDays,
        revenueDisplay,
        profitDisplay,
        costDisplay,
        tonKmPerBirrDisplay,
        staffingWindowDays,
        averageTenureDisplay,
        churnStatusLabel,
        utilizationWindowDays,
        utilizationRateDisplay,
        utilizationServiceDays,
        utilizationIdleDays,
        utilizationUnknownDays,
        totalTrips,
        completedTrips,
        tripCompletionRate,
        totalDistanceKm,
        totalLoadedDistanceKm,
        totalFuelCost,
        avgFuelEfficiency,
        maintenanceCost,
        avgRevenueDisplay,
        totalTonKmFinancial,
    ]);

    // Memoize overview summary cards to avoid recreation on every render
    const overviewSummaryCards = useMemo(() => [
        {
            label: `Revenue (${financialWindowDays}d)`,
            value: revenueDisplay,
            helper: tonKmPerBirr !== null && tonKmPerBirr !== undefined
                ? `Ton-km per ETB: ${tonKmPerBirr.toFixed(2)}`
                : 'Ton-km per ETB pending',
        },
        {
            label: `Utilization (${utilizationWindowDays}d)`,
            value: utilizationRateDisplay,
            helper: utilization
                ? `Service ${formatDays(utilizationServiceDays ?? null)} / Idle ${formatDays(utilizationIdleDays ?? null)}`
                : 'Recent availability snapshot',
        },
        {
            label: `Driver Tenure (${staffingWindowDays}d)`,
            value: averageTenureDisplay,
            helper: churnStatusHelper,
        },
        {
            label: 'Trips Completed',
            value: formatNumber(completedTrips || null),
            helper: 'Confirmed round trips',
        },
        {
            label: 'Trip Completion Rate',
            value: formatPercent(tripCompletionRate, 0),
            helper: 'Closed vs. dispatched',
        },
        {
            label: 'Total Distance',
            value: formatKilometers(totalDistanceKm),
            helper: 'Lifetime distance logged',
        },
        {
            label: 'Avg Fuel Efficiency',
            value:
                avgFuelEfficiency !== null
                    ? `${formatNumber(avgFuelEfficiency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/L`
                    : 'N/A',
            helper: 'Across recorded trips',
        },
    ], [
        financialWindowDays,
        revenueDisplay,
        tonKmPerBirr,
        utilizationWindowDays,
        utilizationRateDisplay,
        utilizationServiceDays,
        utilizationIdleDays,
        staffingWindowDays,
        averageTenureDisplay,
        churnStatusHelper,
        completedTrips,
        tripCompletionRate,
        totalDistanceKm,
        avgFuelEfficiency,
    ]);

    // Memoize performance overview cards
    const performanceOverviewCards = useMemo(() => [
        {
            label: 'Trips Logged',
            value: formatNumber(totalTrips),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Trips Completed',
            value: formatNumber(completedTrips),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Trips In Progress',
            value: formatNumber(openTrips),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Main Trip Legs',
            value: formatNumber(mainTripRecords),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
    ], [totalTrips, completedTrips, openTrips, mainTripRecords]);

    // Memoize distance overview cards
    const distanceOverviewCards = useMemo(() => [
        {
            label: 'Total Distance (KM)',
            value: formatKilometers(totalDistanceKm),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Loaded Distance (KM)',
            value: formatKilometers(totalLoadedDistanceKm),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Empty Distance (KM)',
            value: formatKilometers(totalEmptyDistanceKm),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Fuel Used (L)',
            value: formatNumber(performanceSummary?.total_fuel_liters ?? null),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
    ], [totalDistanceKm, totalLoadedDistanceKm, totalEmptyDistanceKm, performanceSummary?.total_fuel_liters]);

    // Memoize efficiency overview cards
    const efficiencyOverviewCards = useMemo(() => [
        {
            label: 'Fuel Cost',
            value: formatCurrency(performanceSummary?.fuel_cost_birr ?? null),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Distance / Trip',
            value: formatKilometersWithPrecision(avgTripDistanceKm, 2),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'KM per Liter',
            value: avgFuelEfficiency !== null
                ? `${formatNumber(avgFuelEfficiency, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/L`
                : 'N/A',
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Trip Completion',
            value: formatPercent(tripCompletionRate, 0),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Trip Duration',
            value: formatDays(avgTripDurationDays),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Payload',
            value: formatTons(avgPayloadTonsPerTrip),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
    ], [totalFuelCost, avgTripDistanceKm, avgFuelEfficiency, tripCompletionRate, avgTripDurationDays, avgPayloadTonsPerTrip, performanceSummary?.fuel_cost_birr]);

    // Memoize trip insight cards
    const tripInsightCards = useMemo(() => [
        {
            label: 'Avg Loaded Distance',
            value: formatKilometersWithPrecision(avgLoadedDistanceKm, 2),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Empty Distance',
            value: formatKilometersWithPrecision(avgEmptyDistanceKm, 2),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Ton-KM / Trip',
            value: avgTonKmPerTrip !== null
                ? formatNumber(avgTonKmPerTrip, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                : 'N/A',
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Total Ton-KM',
            value: formatNumber(totalTonKm ?? null, { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Total Payload',
            value: formatTons(totalPayloadTons, 2),
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
        {
            label: 'Avg Cargo Volume',
            value: performanceSummary?.avg_cargo_volume_mt_per_trip !== undefined && performanceSummary?.avg_cargo_volume_mt_per_trip !== null
                ? `${formatNumber(performanceSummary.avg_cargo_volume_mt_per_trip, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m³`
                : 'N/A',
            className: 'bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700',
        },
    ], [avgLoadedDistanceKm, avgEmptyDistanceKm, avgTonKmPerTrip, totalTonKm, totalPayloadTons, performanceSummary?.avg_cargo_volume_mt_per_trip]);

    const overallGrade = gradeReport?.overall ?? null;
    const gradeWeights = gradeReport?.weights ?? null;
    const gradeCategories = gradeReport
        ? (Object.entries(gradeCategoryConfig) as Array<[
              GradeCategoryKey,
              (typeof gradeCategoryConfig)[GradeCategoryKey],
          ]>)
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
                          value: metric.formatter(metricsSource[metric.key] ?? null),
                      })),
                  };
              })
              .filter(Boolean) as Array<{
                  key: GradeCategoryKey;
                  label: string;
                  description: string;
                  score: number;
                  weight: number | null;
                  metrics: Array<{ label: string; value: string }>;
              }>
        : [];

    // Memoize event handlers to prevent unnecessary re-renders
    const handleDeactivateConfirm = useCallback(() => {
        if (!showDeactivateButton) {
            return;
        }

        setIsDeactivating(true);
        router.post(`/trucks/${truck.id}/deactivate`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setDeactivateDialogOpen(false);
                setDeactivateError(null);
            },
            onError: (errors) => {
                const messages = errors && typeof errors === 'object'
                    ? Object.values(errors)
                          .flatMap((value) => (Array.isArray(value) ? value : [value]))
                          .filter((value) => Boolean(value))
                          .join('\n')
                    : null;

                const fallback = 'Unable to deactivate this truck. Please try again.';
                const message = messages || fallback;
                setDeactivateError(message);
                toast({
                    title: 'Deactivate failed',
                    description: message,
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setIsDeactivating(false);
            },
        });
    }, [showDeactivateButton, truck.id]);

    const handleDeleteConfirm = useCallback(() => {
        if (!canDeleteTruck) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/trucks/${truck.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setIsDeleting(false);
                setDeleteError(null);
                toast({
                    title: 'Truck deleted',
                    description: `${truck.plate} has been removed from the fleet.`,
                });
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    const fallback = 'Unable to delete this truck. Please resolve any blocking records first.';
                    setDeleteError(messages || fallback);

                    toast({
                        title: 'Delete failed',
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    const fallback = 'An unexpected error occurred while deleting the truck. Please try again.';
                    setDeleteError(fallback);
                    toast({
                        title: 'Delete failed',
                        description: fallback,
                        variant: 'destructive',
                    });
                }
            },
        });
    }, [canDeleteTruck, truck.id, truck.plate]);

    const handleActivateConfirm = useCallback(() => {
        if (!showActivateButton) {
            return;
        }

        setIsActivating(true);
        router.post(`/trucks/${truck.id}/activate`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setActivateDialogOpen(false);
                setActivateError(null);
            },
            onError: (errors) => {
                const messages = errors && typeof errors === 'object'
                    ? Object.values(errors)
                          .flatMap((value) => (Array.isArray(value) ? value : [value]))
                          .filter((value) => Boolean(value))
                          .join('\n')
                    : null;

                const fallback = 'Unable to activate this truck. Please try again.';
                const message = messages || fallback;
                setActivateError(message);
                toast({
                    title: 'Activate failed',
                    description: message,
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setIsActivating(false);
            },
        });
    }, [showActivateButton, truck.id]);

    const getStatusBadgeColor = useCallback((status: string | undefined | null) => {
        if (!status) return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';

        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
        }
    }, []);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`View Truck - ${truck.plate}`} />
            <div className="flex flex-1 min-h-0 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <DetailHeader
                    leading={
                        canViewTruckList ? (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.get('/trucks')}
                                className="flex items-center gap-2 border-slate-300 hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-800"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Trucks
                            </Button>
                        ) : null
                    }
                    icon={<Truck className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />}
                    title={truck.plate}
                    subtitle="Comprehensive truck profile and fleet insights"
                    actions={
                        showActionButtons ? (
                            <>
                                {showActivateButton && (
                                    <Button
                                        variant="default"
                                        onClick={() => {
                                            setActivateError(null);
                                            setActivateDialogOpen(true);
                                        }}
                                        className="bg-green-600 hover:bg-green-700"
                                        disabled={isActivating}
                                    >
                                        <CheckCircle className="mr-2 h-4 w-4" />
                                        Activate
                                    </Button>
                                )}
                                {showDeactivateButton && (
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setDeactivateError(null);
                                            setDeactivateDialogOpen(true);
                                        }}
                                        className="border-amber-200 text-amber-600 hover:border-amber-300 hover:bg-amber-50 hover:text-amber-700"
                                        disabled={isDeactivating}
                                    >
                                        <Ban className="mr-2 h-4 w-4" />
                                        Deactivate
                                    </Button>
                                )}
                                {canEditTruck && (
                                    <Button
                                        variant="outline"
                                        asChild
                                        className="border-slate-300 hover:border-indigo-300 hover:bg-indigo-50 dark:border-slate-600"
                                    >
                                        <Link href={`/trucks/${truck.id}/edit`}>
                                            <Edit className="mr-2 h-4 w-4" />
                                            Edit Truck
                                        </Link>
                                    </Button>
                                )}
                                {canDeleteTruck && (
                                    <Button
                                        variant="outline"
                                        onClick={() => setDeleteDialogOpen(true)}
                                        className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 hover:text-red-700"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Truck
                                    </Button>
                                )}
                            </>
                        ) : null
                    }
                />

                <Tabs defaultValue="overview" className="flex-1 overflow-hidden flex flex-col">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                        <TabsTrigger value="overview" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="maintenance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <Wrench className="h-4 w-4" />
                            Maintenance
                        </TabsTrigger>
                        <TabsTrigger value="performance" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <BarChart3 className="h-4 w-4" />
                            Performance
                        </TabsTrigger>
                        <TabsTrigger value="history" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:shadow-md data-[state=active]:border data-[state=active]:border-slate-200 dark:data-[state=active]:bg-slate-700 dark:data-[state=active]:border-slate-600 rounded-lg transition-all duration-200 font-medium">
                            <History className="h-4 w-4" />
                            History
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 h-full overflow-y-auto">
                        <DetailSummaryGrid items={overviewSummaryCards} />
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Main Details */}
                            <div className="flex-1 space-y-6">
                                {/* Enhanced Basic Information */}
                                <DetailSectionCard
                                    icon={<Truck className="h-5 w-5 text-indigo-600" />}
                                    title="Basic Information"
                                    description="Core truck details and specifications"
                                >
                                    <div className="grid gap-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Status</p>
                                                <Badge className={`mt-1 flex w-fit items-center gap-1 ${getStatusBadgeColor(truck.status)}`}>
                                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                    {truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">Vehicle Type</p>
                                                <p className="mt-1 text-sm font-semibold">{truck.vehicleType?.name || 'Unknown'}</p>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Chassis Number</p>
                                                    <p className="mt-1 text-sm font-mono">{truck.chasisNumber || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Engine Number</p>
                                                    <p className="mt-1 text-sm font-mono">{truck.engineNumber || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-200 pt-4 dark:border-slate-700">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Tyre Size</p>
                                                    <p className="mt-1 text-sm">{truck.tyreSyze || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-muted-foreground">Service Interval</p>
                                                    <p className="mt-1 text-sm">{formatKilometers(truck.serviceIntervalKM)}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </DetailSectionCard>

                                <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                    <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <CardTitle className="flex items-center gap-2 text-xl">
                                                    <User className="h-5 w-5 text-indigo-600" />
                                                    Driver Assignments
                                                </CardTitle>
                                                <CardDescription className="text-base">
                                                    Current and past driver assignments for this truck
                                                </CardDescription>
                                            </div>
                                            {driverAssignments.length > 0 && canViewDriverTruckAssignments && (
                                                <Button variant="link" size="sm" className="px-0" asChild>
                                                    <Link
                                                        href={`/driver-trucks?truck_id=${truck.id}`}
                                                        className="flex items-center gap-1 text-blue-600 dark:text-blue-300"
                                                    >
                                                        View all
                                                        <ArrowUpRight className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                            )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 p-4">
                                        {driverAssignments.length > 0 ? (
                                            driverAssignments.map((assignment) => {
                                                const driverName = assignment.driver?.name ?? 'Unknown driver';
                                                const driverCode = assignment.driver?.driverid ?? assignment.driverid ?? 'N/A';
                                                const assignmentStatusLabel = assignment.status
                                                    ? `${assignment.status.charAt(0).toUpperCase()}${assignment.status.slice(1)}`
                                                    : assignment.is_attached
                                                        ? 'Active'
                                                        : 'Detached';
                                                const assignedOn = formatShortDate(assignment.date_recived);
                                                const detachedOn = assignment.date_detach ? formatShortDate(assignment.date_detach) : '—';

                                                return (
                                                    <div
                                                        key={assignment.id}
                                                        className="rounded-xl border border-blue-200 dark:border-blue-800 bg-blue-50/60 dark:bg-blue-950/10 p-4 space-y-3"
                                                    >
                                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                                            <div>
                                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">{driverName}</p>
                                                                <p className="text-xs text-muted-foreground">Assignment #{assignment.id}</p>
                                                            </div>
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>
                                                                    {assignment.is_attached ? 'Attached' : 'Detached'}
                                                                </Badge>
                                                                <Badge variant="outline" className="text-xs">
                                                                    {assignmentStatusLabel}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="grid gap-3 text-xs text-muted-foreground md:grid-cols-2">
                                                            <div>
                                                                <span className="font-medium">Driver ID:</span> {driverCode}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Assigned:</span> {assignedOn}
                                                            </div>
                                                            <div>
                                                                <span className="font-medium">Detached:</span> {detachedOn}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                            <span className="text-xs text-muted-foreground">Status note: {assignmentStatusLabel}</span>
                                                            {canViewDriverTruckAssignments && (
                                                                <Button variant="link" size="sm" className="px-0" asChild>
                                                                    <Link
                                                                        href={`/trucks/${truck.id}/assignments/${assignment.id}/performances`}
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
                                                <User className="mx-auto mb-3 h-10 w-10 opacity-60" />
                                                <p>No driver assignments recorded for this truck yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Financial Information & Vehicle Highlights */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                                                    <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                                Financial Information
                                            </CardTitle>
                                            <CardDescription className="text-base">
                                                Purchase and pricing details
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="space-y-6">
                                                {/* Purchase Price */}
                                                <div className="flex items-center justify-between p-4 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
                                                    <div>
                                                        <p className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Purchase Price</p>
                                                        <p className="mt-1 text-2xl font-semibold text-emerald-900 dark:text-emerald-200">{formatCurrency(truck.purchasePrice)}</p>
                                                    </div>
                                                    <div className="p-3 bg-white/70 dark:bg-emerald-900/40 rounded-lg">
                                                        <DollarSign className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                                                    </div>
                                                </div>

                                                {/* Dates Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Calendar className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Production Date</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(truck.productionDate)}</p>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Clock className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Service Start</p>
                                                        </div>
                                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formatDate(truck.serviceStartDate)}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/20">
                                        <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                    <Activity className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                Vehicle Highlights
                                            </CardTitle>
                                            <CardDescription>Key operating metrics</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="grid grid-cols-1 gap-4 text-sm">
                                                {vehicleHighlights.map(item => (
                                                    <div
                                                        key={item.label}
                                                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white/70 dark:bg-slate-900/40 p-4"
                                                    >
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                            {item.label}
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.value}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Timestamps */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Record Information</CardTitle>
                                        <CardDescription>System-generated metadata</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="grid gap-4 text-sm">
                                            <div>
                                                <p className="font-medium text-muted-foreground">Created</p>
                                                <p className="mt-1">{formatDate(truck.created_at)}</p>
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">Last Updated</p>
                                                <p className="mt-1">{formatDate(truck.updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar */}
                            <div className="w-full lg:w-80 space-y-4">
                                {overallGrade && (
                                    <Card className="shadow-lg border-0 bg-gradient-to-br from-background to-muted/30">
                                        <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b">
                                            <CardTitle className="flex items-center gap-2 text-lg">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                    <BarChart3 className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                Truck Grade
                                            </CardTitle>
                                            <CardDescription>
                                                Weighted comparison against peer trucks
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 p-4">
                                            <div className="flex items-center justify-between rounded-lg border border-indigo-100 bg-white/70 p-4 dark:border-indigo-900/40 dark:bg-indigo-900/10">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                                        Overall grade
                                                    </p>
                                                    <p className="mt-1 text-4xl font-bold text-slate-900 dark:text-slate-100">
                                                        {overallGrade.letter}
                                                    </p>
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
                                                    <div
                                                        key={category.key}
                                                        className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/40 p-3"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                                    {category.label}
                                                                </p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {category.description}
                                                                </p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                                                                    {formatNumber(category.score, { maximumFractionDigits: 0 })}%
                                                                </p>
                                                                {category.weight !== null && (
                                                                    <p className="text-xs text-muted-foreground">
                                                                        Weight {category.weight}%
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 h-2 rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-indigo-500"
                                                                style={{
                                                                    width: `${Math.min(Math.max(category.score, 0), 100)}%`,
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="mt-3 grid gap-2 text-xs">
                                                            {category.metrics.map(metric => (
                                                                <div
                                                                    key={`${category.key}-${metric.label}`}
                                                                    className="flex items-center justify-between text-muted-foreground"
                                                                >
                                                                    <span>{metric.label}</span>
                                                                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                                                                        {metric.value}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                                {/* Status Card */}
                                <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                                <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                            </div>
                                            Quick Status
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <div className="space-y-4">
                                            <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-4 border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Current Status</p>
                                                <Badge className={`mt-2 flex items-center gap-1 w-fit ${getStatusBadgeColor(truck.status)}`}>
                                                    {truck.status === 'active' && <CheckCircle className="h-3 w-3" />}
                                                    {truck.status === 'maintenance' && <Wrench className="h-3 w-3" />}
                                                    {truck.status === 'inactive' && <XCircle className="h-3 w-3" />}
                                                    {truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown'}
                                                </Badge>
                                            </div>
                                            <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-4 border border-slate-200 dark:border-slate-700">
                                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Plate Number</p>
                                                <p className="mt-2 text-lg font-mono font-bold text-slate-900 dark:text-slate-100">{truck.plate}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {counts && (
                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                                                    <Hash className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                                </div>
                                                Related Counts
                                            </CardTitle>
                                            <CardDescription>Summary of related records</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-4 space-y-3 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Drivers</span>
                                                <span className="font-semibold">{counts.drivers}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Performances</span>
                                                <span className="font-semibold">{counts.performances}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Driver Assignments</span>
                                                <span className="font-semibold">{counts.driverAssignments}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground">Maintenance</span>
                                                <span className="font-semibold">{counts.maintenance}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Recent Performances */}
                                {performanceRecords.length > 0 && (
                                    <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                        <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                            <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                                    <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                                </div>
                                                Recent Activities
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-4">
                                            <div className="rounded-lg bg-orange-50 dark:bg-orange-950/20 p-4 border border-orange-200 dark:border-orange-800">
                                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                                    {performanceRecords.length} performance record{performanceRecords.length !== 1 ? 's' : ''} available
                                                </p>
                                                <div className="mt-2 flex items-center gap-2">
                                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                                                    <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">Active monitoring</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="maintenance" className="space-y-6 h-full overflow-y-auto">
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                    <Wrench className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                                    Maintenance Overview
                                </CardTitle>
                                <CardDescription>Track scheduled and completed services</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {maintenanceSummary && (
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                        <div className="p-3 rounded-lg bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800 text-center">
                                            <p className="text-xs text-muted-foreground">Total</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.total_records}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-center">
                                            <p className="text-xs text-muted-foreground">Completed</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.completed}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-center">
                                            <p className="text-xs text-muted-foreground">Scheduled</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.scheduled}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-center">
                                            <p className="text-xs text-muted-foreground">Overdue</p>
                                            <p className="text-lg font-semibold">{maintenanceSummary.overdue}</p>
                                        </div>
                                        <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-center">
                                            <p className="text-xs text-muted-foreground">Total Cost</p>
                                            <p className="text-lg font-semibold">{formatCurrency(maintenanceSummary.total_cost)}</p>
                                        </div>
                                    </div>
                                )}

                                {maintenanceRecords.length > 0 ? (
                                    <div className="space-y-3 max-h-[480px] overflow-y-auto pr-2 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                                        {maintenanceRecords.map((rec) => (
                                            <div key={rec.id} className="p-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 flex flex-col gap-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="text-xs" variant={rec.status === 'completed' ? 'default' : rec.is_overdue ? 'destructive' : 'secondary'}>
                                                            {rec.status ?? 'Unknown'}
                                                        </Badge>
                                                        <span className="text-sm font-medium">{rec.maintenance_type_id ? `Type #${rec.maintenance_type_id}` : 'Maintenance'}</span>
                                                    </div>
                                                    <span className="text-xs text-muted-foreground">Odometer: {formatNumber(rec.odometer_reading)}</span>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                                    <div>
                                                        <span className="font-medium">Scheduled:</span> {formatShortDate(rec.scheduled_date)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Completed:</span> {rec.completed_date ? formatShortDate(rec.completed_date) : '—'}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Cost:</span> {formatCurrency(rec.cost)}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Provider:</span> {rec.service_provider ?? 'N/A'}
                                                    </div>
                                                </div>
                                                {rec.description && (
                                                    <p className="text-xs line-clamp-3">{rec.description}</p>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No maintenance records</h3>
                                        <p className="text-muted-foreground mb-4">Maintenance records will appear here when they are created.</p>
                                        <Button variant="outline">
                                            <Wrench className="mr-2 h-4 w-4" />
                                            Schedule Maintenance
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6 h-full overflow-y-auto">
                        <div className="flex flex-col lg:flex-row gap-6">
                            {/* Metrics Summary */}
                            <div className="flex-1 space-y-6">
                                <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                        <CardTitle className="flex items-center gap-2 text-xl text-slate-900 dark:text-slate-100">
                                            <BarChart3 className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                                            Performance Overview
                                        </CardTitle>
                                        <CardDescription className="text-base">Operational performance and fuel efficiency</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performanceSummary ? (
                                            <div className="space-y-6">
                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                    {performanceOverviewCards.map(({ label, value, className }) => (
                                                        <div key={label} className={`p-4 rounded-lg ${className}`}>
                                                            <p className="text-xs text-muted-foreground">{label}</p>
                                                            <p className="mt-1 text-2xl font-bold">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                                    {distanceOverviewCards.map(({ label, value, className }) => (
                                                        <div key={label} className={`p-4 rounded-lg ${className}`}>
                                                            <p className="text-xs text-muted-foreground">{label}</p>
                                                            <p className="mt-1 text-2xl font-bold">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                    {efficiencyOverviewCards.map(({ label, value, className }) => (
                                                        <div key={label} className={`p-4 rounded-lg ${className}`}>
                                                            <p className="text-xs text-muted-foreground">{label}</p>
                                                            <p className="mt-1 text-2xl font-bold">{value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No performance data</h3>
                                                <p className="text-muted-foreground mb-4">Performance metrics will be displayed here when available.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                            <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                            Trip Insights
                                        </CardTitle>
                                        <CardDescription>Distance mix, payload, and productivity per trip</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performanceSummary ? (
                                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                                {tripInsightCards.map(({ label, value, className }) => (
                                                    <div key={label} className={`p-4 rounded-lg ${className}`}>
                                                        <p className="text-xs text-muted-foreground">{label}</p>
                                                        <p className="mt-1 text-2xl font-bold">{value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No trip statistics yet</h3>
                                                <p className="text-muted-foreground mb-4">Trip insights will appear once performance records are captured.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Recent Performance Records */}
                                <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                            <Activity className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            Recent Performance Records
                                        </CardTitle>
                                        <CardDescription>Latest operational entries</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        {performanceRecords.length > 0 ? (
                                            <div className="space-y-3">
                                                {performanceRecords.map((perf) => {
                                                    const dispatchDate = perf.DateDispach ? formatShortDate(perf.DateDispach) : null;
                                                    const returnedDate = perf.returned_date ? formatShortDate(perf.returned_date) : null;
                                                    const routeLabel = [perf.origin?.name, perf.destination?.name]
                                                        .filter(Boolean)
                                                        .join(' → ');
                                                    const totalTripDistance = perf.total_distance_km !== null && perf.total_distance_km !== undefined
                                                        ? formatKilometersWithPrecision(perf.total_distance_km, 2)
                                                        : 'N/A';
                                                    const loadedDistance = formatKilometersWithPrecision(perf.DistanceWCargo ?? null, 1);
                                                    const emptyDistance = formatKilometersWithPrecision(perf.DistanceWOCargo ?? null, 1);
                                                    const fuelLiters = perf.fuelInLitter !== null && perf.fuelInLitter !== undefined
                                                        ? `${formatNumber(perf.fuelInLitter, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`
                                                        : 'N/A';
                                                    const fuelBirr = formatCurrency(perf.fuelInBirr);
                                                    const payloadTons = formatTons(perf.cargo_weight_tons, 2);
                                                    const tonKm = perf.tonkm !== null && perf.tonkm !== undefined
                                                        ? formatNumber(perf.tonkm, { minimumFractionDigits: 0, maximumFractionDigits: 0 })
                                                        : 'N/A';
                                                    const tripDuration = formatDays(perf.trip_duration_days);
                                                    const tripStatus = perf.is_returned ? 'Completed' : 'In Progress';

                                                    return (
                                                        <div key={perf.id} className="p-4 rounded-lg border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20 flex flex-col gap-2">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex flex-col gap-1">
                                                                    <span className="text-sm font-medium">Trip #{perf.id}</span>
                                                                    {dispatchDate && (
                                                                        <span className="text-xs text-muted-foreground">Dispatched {dispatchDate}</span>
                                                                    )}
                                                                    {routeLabel && (
                                                                        <span className="text-xs text-muted-foreground">{routeLabel}</span>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant={perf.is_returned ? 'default' : 'secondary'} className="text-xs">
                                                                        {tripStatus}
                                                                    </Badge>
                                                                    {perf.load_phase && (
                                                                        <Badge variant="outline" className="text-xs capitalize">
                                                                            {perf.load_phase}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 text-xs text-muted-foreground">
                                                                <div><span className="font-medium">Total Distance:</span> {totalTripDistance}</div>
                                                                <div><span className="font-medium">Loaded / Empty:</span> {loadedDistance} · {emptyDistance}</div>
                                                                <div><span className="font-medium">Fuel:</span> {fuelLiters}</div>
                                                                <div><span className="font-medium">Fuel Cost:</span> {fuelBirr}</div>
                                                                <div><span className="font-medium">Payload:</span> {payloadTons}</div>
                                                                <div><span className="font-medium">Ton-KM:</span> {tonKm}</div>
                                                                <div><span className="font-medium">Duration:</span> {tripDuration}</div>
                                                                <div><span className="font-medium">Returned:</span> {returnedDate ?? '—'}</div>
                                                            </div>
                                                            {perf.comment && <p className="text-xs line-clamp-3">{perf.comment}</p>}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="text-center py-8">
                                                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                                <h3 className="text-lg font-semibold mb-2">No performance records</h3>
                                                <p className="text-muted-foreground mb-4">Records will appear here once they are created.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Sidebar mimic for consistency (optional quick stats) */}
                            <div className="w-full lg:w-80 space-y-4">
                                <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                                    <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                        <CardTitle className="flex items-center gap-2 text-lg text-slate-900 dark:text-slate-100">
                                            <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                                            Quick Metrics
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-3 text-sm">
                                        {performanceSummary ? (
                                            <>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Distance (KM)</span><span className="font-semibold">{formatNumber(performanceSummary.total_distance_km)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel (L)</span><span className="font-semibold">{formatNumber(performanceSummary.total_fuel_liters)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fuel Cost</span><span className="font-semibold">{formatCurrency(performanceSummary.fuel_cost_birr)}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">Avg Dist/Record</span><span className="font-semibold">{formatNumber(performanceSummary.avg_distance_per_record, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>
                                                <div className="flex items-center justify-between"><span className="text-muted-foreground">KM / Liter</span><span className="font-semibold">{performanceSummary.avg_fuel_efficiency_km_per_liter !== null
                                                    ? formatNumber(performanceSummary.avg_fuel_efficiency_km_per_liter, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                                    : 'N/A'}</span></div>
                                            </>
                                        ) : (
                                            <p className="text-muted-foreground">No metrics available.</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>

                    <TabsContent value="history" className="space-y-6 h-full overflow-y-auto">
                        <Card className="shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60">
                            <CardHeader className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40">
                                <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
                                    <History className="h-5 w-5" />
                                    Activity History
                                </CardTitle>
                                <CardDescription>Complete audit trail of all truck activities</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {activityLogs && activityLogs.length > 0 ? (
                                    <ActivityLogTable logs={activityLogs} />
                                ) : (
                                    <div className="text-center py-8">
                                        <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No activity history</h3>
                                        <p className="text-muted-foreground">
                                            Activity logs will appear here as changes are made
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Deactivate Confirmation Dialog */}
            {showDeactivateButton && (
                <DeleteConfirmationDialog
                    open={deactivateDialogOpen}
                    onOpenChange={(open) => {
                        setDeactivateDialogOpen(open);
                        if (!open) {
                            setDeactivateError(null);
                        }
                    }}
                    title="Deactivate Truck"
                    description="Mark this truck as inactive so it no longer appears in active operations."
                    itemName={truck.plate}
                    onConfirm={handleDeactivateConfirm}
                    isLoading={isDeactivating}
                    errorMessage={deactivateError}
                    confirmLabel="Deactivate Truck"
                    cancelLabel="Cancel"
                    isDangerous={false}
                    supportingText="You can reactivate the truck later from the trucks management section."
                />
            )}

            {showActivateButton && (
                <DeleteConfirmationDialog
                    open={activateDialogOpen}
                    onOpenChange={(open) => {
                        setActivateDialogOpen(open);
                        if (!open) {
                            setActivateError(null);
                        }
                    }}
                    title="Activate Truck"
                    description="Set this truck back to active status so it appears in operations."
                    itemName={truck.plate}
                    onConfirm={handleActivateConfirm}
                    isLoading={isActivating}
                    errorMessage={activateError}
                    confirmLabel="Activate Truck"
                    cancelLabel="Cancel"
                    isDangerous={false}
                    supportingText="Ensure prerequisite checks are complete before returning this truck to service."
                />
            )}

            {/* Delete Confirmation Dialog */}
            {canDeleteTruck && (
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={(open) => {
                        setDeleteDialogOpen(open);
                        if (!open) {
                            setDeleteError(null);
                        }
                    }}
                    title="Delete Truck"
                    description="Delete this truck and remove it from all fleet records?"
                    itemName={truck.plate}
                    onConfirm={handleDeleteConfirm}
                    isLoading={isDeleting}
                    errorMessage={deleteError}
                    confirmLabel="Delete Truck"
                />
            )}

        </AppLayout>
    );
}




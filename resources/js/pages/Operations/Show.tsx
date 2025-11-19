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
    CalendarDays,
    Clock,
    BarChart3,
    Target,
    Navigation,
    FileText,
    User,
    MapPin,
    History,
    Hash,
    Building2,
    Globe2,
    UserCircle,
    Milestone,
    CircleDollarSign,
    TrendingUp,
    Zap,
    Truck,
    Handshake,
    GitMerge,
    HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Operations', href: '/operations' },
];

interface User { id: number; name: string; }
interface ActivityLog { id: number; description: string; event: string; created_at: string; causer?: User; }
interface OperationDestination {
    scope?: string | null;
    name?: string | null;
    reference_id?: number | null;
    reference_type?: string | null;
}

interface Operation {
    id: number; operationid: string; description?: string; status: string;
    startdate?: string; enddate?: string; volume?: number; km?: number; tariff?: number;
    closed?: boolean; created_at: string;
    customer?: { id: number; name: string };
    destination_scope?: string | null;
    destination_name?: string | null;
    destination_reference_id?: number | null;
    destination_reference_type?: string | null;
    destination?: OperationDestination | null;
    user?: { id: number; name: string };
}
interface PerformanceTotals {
    plannedVolume: number | null;
    totalTrips: number;
    completedTrips: number;
    ongoingTrips: number;
    returnRate: number;
    totalTonnage: number;
    remainingTonnage: number;
    completionRate: number | null;
    averageTonPerTrip: number | null;
    totalDistance: number | null;
    totalTonKm?: number | null;
    plannedTonKm?: number | null;
    tonKmCompletionRate?: number | null;
    loadedDistance?: number | null;
    emptyDistance?: number | null;
    loadFactor?: number | null;
    emptyBackhaulShare?: number | null;
}

interface PerformanceFinancials {
    totalCost: number | null;
    averageCostPerTrip: number | null;
    averageCostPerTon: number | null;
    costPerTonKm?: number | null;
}

interface PerformanceEconomics {
    totalTonKm: number | null;
    plannedTonKm: number | null;
    tonKmCompletionRate: number | null;
    averageTonKmPerTrip: number | null;
    actualRevenue: number | null;
    potentialRevenue: number | null;
    revenueGap: number | null;
    grossMarginValue: number | null;
    grossMarginPercent: number | null;
    costPerTonKm: number | null;
    yieldPerTrip: number | null;
    yieldPerTon: number | null;
    loadFactor: number | null;
    emptyBackhaulShare: number | null;
    loadedDistance: number | null;
    emptyDistance: number | null;
}

interface PerformanceInsights {
    totals: PerformanceTotals;
    financial: PerformanceFinancials;
    economics?: PerformanceEconomics | null;
    trends: {
        timeline: Array<{ date: string; trips: number; tonnage: number }>;
        tonnageBreakdown: Array<{ label: string; value: number }>;
    };
}

type ExecutionMode = 'company' | 'vendor' | 'hybrid' | 'pending';

interface TransportExecution {
    companyTrips: number;
    vendorTrips: number;
    companyTonnage: number;
    vendorTonnage: number;
    companyTonKm: number;
    vendorTonKm: number;
    companyCost: number;
    vendorCost: number;
    totalCost: number;
    companyTripShare: number | null;
    vendorTripShare: number | null;
    companyTonnageShare: number | null;
    vendorTonnageShare: number | null;
    companyTonKmShare: number | null;
    vendorTonKmShare: number | null;
    companyCostShare: number | null;
    vendorCostShare: number | null;
    companyAverageTonPerTrip: number | null;
    vendorAverageTonPerTrip: number | null;
    companyAverageTonKmPerTrip: number | null;
    vendorAverageTonKmPerTrip: number | null;
    companyCostPerTonKm: number | null;
    vendorCostPerTonKm: number | null;
    executionMode: ExecutionMode;
}

interface OperationsShowProps {
    operation: Operation;
    activityLogs?: ActivityLog[];
    performanceInsights?: PerformanceInsights | null;
    transportExecution?: TransportExecution | null;
}

export default function OperationsShow({ operation, activityLogs = [], performanceInsights, transportExecution: transportExecutionProp }: OperationsShowProps) {
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

    const formatNumber = (value?: number | null, fractionDigits = 2) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return numericValue.toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        });
    };

    const capitalize = (value?: string | null) => {
        if (!value) return 'Unknown';
        return value.charAt(0).toUpperCase() + value.slice(1);
    };

    const formatCurrency = (value?: number | null) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return `${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} Birr`;
    };

    const clampPercentage = (value: number, upperBound = 130) => {
        if (!Number.isFinite(value)) {
            return 0;
        }

        return Math.max(0, Math.min(value, upperBound));
    };

    const formatPercent = (value?: number | null, fractionDigits = 1) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return `${numericValue.toFixed(fractionDigits)}%`;
    };

    const formatShareLabel = (value?: number | null, fractionDigits = 1) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        if (numericValue === 0) {
            return '0%';
        }

        if (Math.abs(numericValue) < 0.1) {
            return '≈0%';
        }

        return `${numericValue.toFixed(fractionDigits)}%`;
    };

    const formatPointDelta = (value?: number | null) => {
        if (value === null || value === undefined) {
            return null;
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return null;
        }

        if (numericValue === 0) {
            return '0 pts';
        }

        const precision = Math.abs(numericValue) >= 10 ? 0 : 1;
        const formatted = Math.abs(numericValue).toFixed(precision);

        return `${numericValue > 0 ? '+' : '-'}${formatted} pts`;
    };

    const calculateShareVariance = (share?: number | null, baseline?: number | null) => {
        if (share === null || share === undefined || baseline === null || baseline === undefined) {
            return { diff: null, baseline: null } as const;
        }

        const shareValue = Number(share);
        const baselineValue = Number(baseline);

        if (!Number.isFinite(shareValue) || !Number.isFinite(baselineValue)) {
            return { diff: null, baseline: null } as const;
        }

        if (Math.abs(baselineValue) < 1e-3) {
            return { diff: null, baseline: null } as const;
        }

        return {
            diff: Number((shareValue - baselineValue).toFixed(1)),
            baseline: baselineValue,
        } as const;
    };

    const formatCurrencyPerUnit = (value?: number | null, unit?: string) => {
        if (value === null || value === undefined) {
            return 'N/A';
        }

        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        const formatted = numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
        return `${formatted} Birr${unit ? ` / ${unit}` : ''}`;
    };

    const formatOptionalNumber = (value?: number | null, suffix = '') => {
        if (value === null || value === undefined) return 'N/A';
        return `${formatNumber(value)}${suffix}`;
    };

    const startDate = operation.startdate ? new Date(operation.startdate) : null;
    const endDate = operation.enddate ? new Date(operation.enddate) : null;
    const createdDate = operation.created_at ? new Date(operation.created_at) : null;
    const durationInDays = startDate && endDate
        ? Math.max(Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)), 0)
        : null;
    const expectedRevenue = operation.volume !== undefined && operation.volume !== null
        && operation.tariff !== undefined && operation.tariff !== null
        ? Number(operation.volume) * Number(operation.tariff)
        : null;

    const destination = operation.destination ?? {
        scope: operation.destination_scope ?? null,
        name: operation.destination_name ?? null,
        reference_id: operation.destination_reference_id ?? null,
        reference_type: operation.destination_reference_type ?? null,
    } satisfies OperationDestination;

    const destinationScopeLabels: Record<string, string> = {
        region: 'Region',
        zone: 'Zone',
        woreda: 'Woreda',
        place: 'Place',
    };

    const destinationScopeKey = destination.scope ?? operation.destination_scope ?? null;
    const destinationScopeLabel = destinationScopeKey
        ? destinationScopeLabels[String(destinationScopeKey).toLowerCase()]
            ?? capitalize(String(destinationScopeKey))
        : null;

    const destinationName = destination.name ?? operation.destination_name ?? 'Not specified';

    const totals = performanceInsights?.totals ?? {
        plannedVolume: null,
        totalTrips: 0,
        completedTrips: 0,
        ongoingTrips: 0,
        returnRate: 0,
        totalTonnage: 0,
        remainingTonnage: 0,
        completionRate: null,
        averageTonPerTrip: null,
        totalDistance: null,
        totalTonKm: null,
        plannedTonKm: null,
        tonKmCompletionRate: null,
        loadedDistance: null,
        emptyDistance: null,
        loadFactor: null,
        emptyBackhaulShare: null,
    } satisfies PerformanceTotals;

    const financials = performanceInsights?.financial ?? {
        totalCost: null,
        averageCostPerTrip: null,
        averageCostPerTon: null,
        costPerTonKm: null,
    } satisfies PerformanceFinancials;

    const economics = performanceInsights?.economics ?? {
        totalTonKm: totals.totalTonKm ?? null,
        plannedTonKm: totals.plannedTonKm ?? null,
        tonKmCompletionRate: totals.tonKmCompletionRate ?? null,
        averageTonKmPerTrip: null,
        actualRevenue: null,
        potentialRevenue: null,
        revenueGap: null,
        grossMarginValue: null,
        grossMarginPercent: null,
        costPerTonKm: financials.costPerTonKm ?? null,
        yieldPerTrip: null,
        yieldPerTon: null,
        loadFactor: totals.loadFactor ?? null,
        emptyBackhaulShare: totals.emptyBackhaulShare ?? null,
        loadedDistance: totals.loadedDistance ?? null,
        emptyDistance: totals.emptyDistance ?? null,
    } satisfies PerformanceEconomics;

    const fallbackTonKm = Number(economics.totalTonKm ?? totals.totalTonKm ?? 0);
    const transportExecution = transportExecutionProp ?? {
        companyTrips: totals.totalTrips,
        vendorTrips: 0,
        companyTonnage: totals.totalTonnage ?? 0,
        vendorTonnage: 0,
        companyTonKm: fallbackTonKm,
        vendorTonKm: 0,
        companyCost: financials.totalCost ?? 0,
        vendorCost: 0,
        totalCost: financials.totalCost ?? 0,
        companyTripShare: totals.totalTrips > 0 ? 100 : null,
        vendorTripShare: totals.totalTrips > 0 ? 0 : null,
        companyTonnageShare: (totals.totalTonnage ?? 0) > 0 ? 100 : null,
        vendorTonnageShare: (totals.totalTonnage ?? 0) > 0 ? 0 : null,
        companyTonKmShare: fallbackTonKm > 0 ? 100 : null,
        vendorTonKmShare: fallbackTonKm > 0 ? 0 : null,
        companyCostShare: (financials.totalCost ?? 0) > 0 ? 100 : null,
        vendorCostShare: (financials.totalCost ?? 0) > 0 ? 0 : null,
        companyAverageTonPerTrip: totals.averageTonPerTrip ?? null,
        vendorAverageTonPerTrip: null,
        companyAverageTonKmPerTrip: economics.averageTonKmPerTrip ?? null,
        vendorAverageTonKmPerTrip: null,
        companyCostPerTonKm: financials.costPerTonKm ?? economics.costPerTonKm ?? null,
        vendorCostPerTonKm: null,
        executionMode: totals.totalTrips > 0 ? 'company' : 'pending',
    } satisfies TransportExecution;

    const executionModeConfig: Record<ExecutionMode, {
        label: string;
        description: string;
        badgeClass: string;
        chipClass: string;
        icon: LucideIcon;
    }> = {
        company: {
            label: 'Company Fleet',
            description: 'Trips executed using internal fleet resources.',
            badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:border-emerald-800',
            chipClass: 'text-emerald-700 dark:text-emerald-200',
            icon: Truck,
        },
        vendor: {
            label: 'Vendor Managed',
            description: 'Fulfilled entirely via vendor partners.',
            badgeClass: 'bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-200 dark:border-sky-800',
            chipClass: 'text-sky-700 dark:text-sky-200',
            icon: Handshake,
        },
        hybrid: {
            label: 'Hybrid Execution',
            description: 'Mix of company fleet and vendor partners.',
            badgeClass: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200 dark:border-purple-800',
            chipClass: 'text-purple-700 dark:text-purple-200',
            icon: GitMerge,
        },
        pending: {
            label: 'No Trips Logged',
            description: 'Log either fleet or outsourced trips to analyse execution mix.',
            badgeClass: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-900/40 dark:text-slate-200 dark:border-slate-700',
            chipClass: 'text-slate-700 dark:text-slate-200',
            icon: HelpCircle,
        },
    };

    const executionProfile = executionModeConfig[transportExecution.executionMode] ?? executionModeConfig.pending;
    const ExecutionIcon = executionProfile.icon;
    const totalTripsMix = transportExecution.companyTrips + transportExecution.vendorTrips;
    const totalTonnageMix = transportExecution.companyTonnage + transportExecution.vendorTonnage;
    const totalTonKmMix = transportExecution.companyTonKm + transportExecution.vendorTonKm;
    const companyTripShareLabel = formatShareLabel(transportExecution.companyTripShare);
    const vendorTripShareLabel = formatShareLabel(transportExecution.vendorTripShare);
    const companyTonnageShareLabel = formatShareLabel(transportExecution.companyTonnageShare);
    const vendorTonnageShareLabel = formatShareLabel(transportExecution.vendorTonnageShare);
    const companyTonKmShareLabel = formatShareLabel(transportExecution.companyTonKmShare);
    const vendorTonKmShareLabel = formatShareLabel(transportExecution.vendorTonKmShare);
    const companyCostShareLabel = formatShareLabel(transportExecution.companyCostShare);
    const vendorCostShareLabel = formatShareLabel(transportExecution.vendorCostShare);
    const companyAverageTonPerTripLabel = formatOptionalNumber(transportExecution.companyAverageTonPerTrip, ' MT');
    const vendorAverageTonPerTripLabel = formatOptionalNumber(transportExecution.vendorAverageTonPerTrip, ' MT');
    const companyAverageTonKmPerTripLabel = formatOptionalNumber(transportExecution.companyAverageTonKmPerTrip, ' ton-km');
    const vendorAverageTonKmPerTripLabel = formatOptionalNumber(transportExecution.vendorAverageTonKmPerTrip, ' ton-km');
    const companyTonKmLabel = formatOptionalNumber(transportExecution.companyTonKm, ' ton-km');
    const vendorTonKmLabel = formatOptionalNumber(transportExecution.vendorTonKm, ' ton-km');
    const companyCostLabel = formatCurrency(transportExecution.companyCost);
    const vendorCostLabel = formatCurrency(transportExecution.vendorCost);
    const totalCostLabel = formatCurrency(transportExecution.totalCost);
    const companyCostPerTonKmLabel = formatCurrencyPerUnit(transportExecution.companyCostPerTonKm ?? null, 'ton-km');
    const vendorCostPerTonKmLabel = formatCurrencyPerUnit(transportExecution.vendorCostPerTonKm ?? null, 'ton-km');

    const timelineData = performanceInsights?.trends?.timeline ?? [];
    const tonnageBreakdown = performanceInsights?.trends?.tonnageBreakdown ?? [];
    const hasTimelineData = timelineData.length > 0;
    const hasTonnageData = tonnageBreakdown.some((item) => item.value > 0);
    const pieColors = ['#6366f1', '#8b5cf6', '#22c55e'];

    const completionPercentage = totals.completionRate ?? ((totals.plannedVolume && totals.plannedVolume > 0)
        ? Number(((totals.totalTonnage / totals.plannedVolume) * 100).toFixed(2))
        : null);
    const completionLabel = completionPercentage === null ? 'N/A' : `${completionPercentage.toFixed(1)}%`;
    const completionValue = completionPercentage ?? 0;
    const completionBarWidth = Math.max(0, Math.min(completionValue, 100));
    const tonKmCompletion = economics.tonKmCompletionRate ?? null;
    const tonKmCompletionLabel = tonKmCompletion === null ? 'N/A' : `${tonKmCompletion.toFixed(1)}%`;
    const tonKmCompletionBarWidth = Math.max(0, Math.min(tonKmCompletion ?? 0, 100));
    const tripProgressLabel = totals.totalTrips > 0
        ? `${totals.completedTrips} / ${totals.totalTrips}`
        : '0';
    const loadFactorLabel = economics.loadFactor === null ? 'N/A' : `${economics.loadFactor.toFixed(1)}%`;
    const emptyShareLabel = economics.emptyBackhaulShare === null ? 'N/A' : `${economics.emptyBackhaulShare.toFixed(1)}%`;
    const loadFactorBarWidth = Math.max(0, Math.min(economics.loadFactor ?? 0, 100));
    const emptyShareBarWidth = Math.max(0, Math.min(economics.emptyBackhaulShare ?? 0, 100));
    const plannedTonKm = economics.plannedTonKm ?? totals.plannedTonKm ?? null;
    const deliveredTonKm = economics.totalTonKm ?? totals.totalTonKm ?? null;
    const remainingTonKm = plannedTonKm !== null && deliveredTonKm !== null
        ? Math.max(plannedTonKm - deliveredTonKm, 0)
        : null;
    const deliveredTonKmLabel = formatOptionalNumber(deliveredTonKm, ' ton-km');
    const plannedTonKmLabel = formatOptionalNumber(plannedTonKm, ' ton-km');
    const remainingTonKmLabel = formatOptionalNumber(remainingTonKm, ' ton-km');
    const loadedDistanceLabel = formatOptionalNumber(economics.loadedDistance, ' km');
    const emptyDistanceLabel = formatOptionalNumber(economics.emptyDistance, ' km');

    const contractTariff = operation.tariff !== undefined && operation.tariff !== null && Number.isFinite(Number(operation.tariff))
        ? Number(operation.tariff)
        : null;
    const realisedTariffPerTonKm = deliveredTonKm !== null
        && deliveredTonKm > 0
        && economics.actualRevenue !== null
        ? Number((economics.actualRevenue / deliveredTonKm).toFixed(2))
        : null;
    const tariffVariance = contractTariff !== null && realisedTariffPerTonKm !== null
        ? Number((realisedTariffPerTonKm - contractTariff).toFixed(2))
        : null;
    const tariffVarianceLabel = tariffVariance !== null
        ? `${tariffVariance >= 0 ? '+' : ''}${formatNumber(tariffVariance)} Birr/ton-km`
        : 'N/A';
    const tariffVarianceTone = tariffVariance !== null && tariffVariance < 0 ? 'text-rose-600' : 'text-emerald-600';

    const loadFactorTarget = 85;
    const loadFactorVariance = economics.loadFactor !== null
        ? Number((economics.loadFactor - loadFactorTarget).toFixed(1))
        : null;
    const loadFactorVarianceLabel = loadFactorVariance !== null
        ? `${loadFactorVariance >= 0 ? '+' : ''}${loadFactorVariance.toFixed(1)} pts`
        : 'N/A';
    const loadFactorVarianceTone = loadFactorVariance !== null && loadFactorVariance < 0 ? 'text-rose-600' : 'text-emerald-600';

    const emptyShareTarget = 15;
    const emptyShareVariance = economics.emptyBackhaulShare !== null
        ? Number((economics.emptyBackhaulShare - emptyShareTarget).toFixed(1))
        : null;
    const emptyShareVarianceLabel = emptyShareVariance !== null
        ? `${emptyShareVariance >= 0 ? '+' : ''}${emptyShareVariance.toFixed(1)} pts`
        : 'N/A';
    const emptyShareVarianceTone = emptyShareVariance !== null && emptyShareVariance > 0 ? 'text-rose-600' : 'text-emerald-600';

    const returnRateTarget = 92;
    const returnRateShare = totals.totalTrips > 0 ? Number(Number(totals.returnRate).toFixed(1)) : null;
    const returnRateDelta = returnRateShare !== null
        ? Number((returnRateShare - returnRateTarget).toFixed(1))
        : null;
    const returnRateLabel = formatShareLabel(returnRateShare);
    const returnRateDeltaLabel = returnRateDelta !== null
        ? `${returnRateDelta >= 0 ? '+' : ''}${returnRateDelta.toFixed(1)} pts`
        : 'N/A';
    const returnRateTone = returnRateDelta !== null && returnRateDelta < 0 ? 'text-amber-600' : 'text-emerald-600';

    const tonnageContribution = completionPercentage !== null ? Number(completionPercentage.toFixed(1)) : null;
    const tonKmContribution = tonKmCompletion !== null ? Number(tonKmCompletion.toFixed(1)) : null;
    const revenueRealisationShare = economics.actualRevenue !== null
        && economics.potentialRevenue !== null
        && economics.potentialRevenue > 0
        ? Number(((economics.actualRevenue / economics.potentialRevenue) * 100).toFixed(1))
        : null;
    const costToRevenueShare = economics.actualRevenue !== null
        && economics.actualRevenue > 0
        && financials.totalCost !== null
        ? Number(((financials.totalCost / economics.actualRevenue) * 100).toFixed(1))
        : null;
    const contributionMetrics = [
        {
            label: 'Tonnage Completion',
            value: tonnageContribution,
            helper: 'Delivered tonnage versus planned volume',
            benchmark: 100,
            benchmarkLabel: 'Plan completion',
        },
        {
            label: 'Ton-km Realisation',
            value: tonKmContribution,
            helper: 'Delivered ton-km versus contract plan',
            benchmark: 100,
            benchmarkLabel: 'Plan completion',
        },
        {
            label: 'Revenue Realisation',
            value: revenueRealisationShare,
            helper: 'Recognised revenue versus potential contract revenue',
            benchmark: 100,
            benchmarkLabel: 'Contract revenue',
        },
        {
            label: 'Return Rate',
            value: returnRateShare,
            helper: `Trips returned against ${returnRateTarget}% target`,
            benchmark: returnRateTarget,
            benchmarkLabel: 'Return rate target',
        },
        {
            label: 'Cost Absorption',
            value: costToRevenueShare,
            helper: 'Operating cost as a share of realised revenue',
            benchmark: 70,
            benchmarkLabel: 'Suggested ≤ 70%',
        },
    ].filter((metric) => metric.value !== null);

    const industryBenchmarks = {
        fuelEfficiency: 2.8,
        loadFactor: loadFactorTarget,
        emptyShare: emptyShareTarget,
    } as const;

    const relationshipMatrix: Array<{
        label: string;
        value: string;
        description: string;
        icon: LucideIcon;
        iconClassName: string;
    }> = [
        {
            label: 'Customer',
            value: operation.customer?.name || 'Not assigned',
            description: operation.customer?.name
                ? 'Account receiving service delivery'
                : 'Attach a customer to unlock CRM insights',
            icon: Building2,
            iconClassName: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        },
        {
            label: 'Destination',
            value: destinationName || 'Not specified',
            description: destinationScopeLabel
                ? `${destinationScopeLabel} target location`
                : 'Assign a destination for clearer logistics reporting',
            icon: Globe2,
            iconClassName: 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
        },
        {
            label: 'Account Owner',
            value: operation.user?.name || 'System',
            description: operation.user?.name
                ? 'Responsible stakeholder overseeing execution'
                : 'No user associated with this record',
            icon: UserCircle,
            iconClassName: 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200',
        },
        {
            label: 'Lifecycle Status',
            value: capitalize(operation.status),
            description: operation.closed ? 'Marked as closed in the system' : 'Currently open and in progress',
            icon: CheckCircle,
            iconClassName: 'border-amber-200 bg-amber-50 text-amber-600 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200',
        },
    ];

    const metrics: Array<{
        label: string;
        value: string;
        helper: string;
        icon: LucideIcon;
        containerClass: string;
        iconClass: string;
    }> = [
        {
            label: 'Volume (MT)',
            value: formatNumber(operation.volume),
            helper: 'Planned cargo throughput',
            icon: Target,
            containerClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
            iconClass: 'text-emerald-600 dark:text-emerald-300',
        },
        {
            label: 'Distance (KM)',
            value: formatNumber(operation.km),
            helper: 'Total projected coverage',
            icon: Navigation,
            containerClass: 'border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-900/20',
            iconClass: 'text-sky-600 dark:text-sky-300',
        },
        {
            label: 'Tariff',
            value: (() => {
                const tariffValue = formatNumber(operation.tariff);
                return tariffValue === 'N/A' ? 'N/A' : `${tariffValue} Birr`;
            })(),
            helper: `Revenue per movement${tariffVarianceLabel !== 'N/A' ? ` (${tariffVarianceLabel}` : ''}${tariffVarianceLabel !== 'N/A' ? ')' : ''}`,
            icon: BarChart3,
            containerClass: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
            iconClass: 'text-amber-600 dark:text-amber-300',
        },
        {
            label: 'Cycle Length',
            value: durationInDays !== null ? `${durationInDays} day${durationInDays === 1 ? '' : 's'}` : 'Awaiting schedule',
            helper: 'Derived from start and end dates',
            icon: CalendarDays,
            containerClass: 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20',
            iconClass: 'text-indigo-600 dark:text-indigo-300',
        },
        {
            label: 'Trip Progress',
            value: totals.totalTrips > 0 ? tripProgressLabel : '0',
            helper: totals.totalTrips > 0 ? 'Completed vs logged trips' : 'No trips recorded yet',
            icon: Activity,
            containerClass: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
            iconClass: 'text-blue-600 dark:text-blue-300',
        },
        {
            label: 'Return Rate',
            value: returnRateLabel,
            helper: totals.totalTrips > 0 ? `Trips successfully closed (${returnRateDeltaLabel})` : 'Trips successfully closed',
            icon: Clock,
            containerClass: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30',
            iconClass: 'text-slate-600 dark:text-slate-200',
        },
        {
            label: 'Ton-Km Delivered',
            value: formatOptionalNumber(economics.totalTonKm ?? totals.totalTonKm ?? null, ' ton-km'),
            helper: 'Sum of loaded tonnage × km',
            icon: TrendingUp,
            containerClass: 'border-cyan-200 bg-cyan-50 dark:border-cyan-800 dark:bg-cyan-900/20',
            iconClass: 'text-cyan-600 dark:text-cyan-300',
        },
        {
            label: 'Load Factor',
            value: loadFactorLabel,
            helper: `Share of km travelled under load${loadFactorVarianceLabel !== 'N/A' ? ` (${loadFactorVarianceLabel} vs ${loadFactorTarget}% target)` : ''}`,
            icon: Zap,
            containerClass: 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20',
            iconClass: 'text-green-600 dark:text-green-300',
        },
        {
            label: 'Tonnage Remaining',
            value: formatNumber(totals.remainingTonnage ?? 0),
            helper: totals.plannedVolume ? 'Outstanding volume vs plan' : 'No planned volume set',
            icon: Milestone,
            containerClass: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
            iconClass: 'text-purple-600 dark:text-purple-300',
        },
    ];

    if (expectedRevenue !== null) {
        const projectedRevenue = formatNumber(expectedRevenue);
        metrics.push({
            label: 'Revenue Potential',
            value: projectedRevenue === 'N/A' ? 'N/A' : `${projectedRevenue} Birr`,
            helper: 'Volume × tariff estimate',
            icon: CircleDollarSign,
            containerClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
            iconClass: 'text-emerald-600 dark:text-emerald-300',
        });
    }

    const economicsHighlights: Array<{
        label: string;
        value: string;
        helper: string;
        icon: LucideIcon;
        containerClass: string;
        iconClass: string;
        secondary?: string;
    }> = [
        {
            label: 'Actual Revenue Realised',
            value: formatCurrency(economics.actualRevenue),
            helper: 'Recognised ton-km × tariff (IFRS 15)',
            icon: CircleDollarSign,
            containerClass: 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20',
            iconClass: 'text-emerald-600 dark:text-emerald-300',
        },
        {
            label: 'Revenue Potential',
            value: formatCurrency(economics.potentialRevenue),
            helper: 'Planned ton-km × tariff baseline',
            icon: Target,
            containerClass: 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/20',
            iconClass: 'text-indigo-600 dark:text-indigo-300',
            secondary: tonKmCompletionLabel !== 'N/A' ? `${tonKmCompletionLabel} ton-km completion` : undefined,
        },
        {
            label: 'Revenue Gap',
            value: formatCurrency(economics.revenueGap),
            helper: 'Variance between plan and actual',
            icon: AlertCircle,
            containerClass: 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20',
            iconClass: 'text-amber-600 dark:text-amber-300',
        },
        {
            label: 'Gross Margin',
            value: formatCurrency(economics.grossMarginValue),
            helper: 'Revenue minus direct operating cost',
            icon: BarChart3,
            containerClass: 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20',
            iconClass: 'text-blue-600 dark:text-blue-300',
            secondary: economics.grossMarginPercent !== null ? formatPercent(economics.grossMarginPercent) : undefined,
        },
        {
            label: 'Cost per Ton-Km',
            value: formatCurrencyPerUnit(economics.costPerTonKm ?? financials.costPerTonKm ?? null, 'ton-km'),
            helper: `Unit cost benchmark (target ${formatCurrencyPerUnit(contractTariff, 'ton-km')})`,
            icon: Navigation,
            containerClass: 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/30',
            iconClass: 'text-slate-600 dark:text-slate-200',
        },
        {
            label: 'Yield Efficiency',
            value: economics.yieldPerTrip === null ? 'N/A' : `${formatCurrency(economics.yieldPerTrip)} / trip`,
            helper: 'Revenue realisation per closed trip',
            icon: Activity,
            containerClass: 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/20',
            iconClass: 'text-purple-600 dark:text-purple-300',
            secondary: economics.yieldPerTon === null ? undefined : `${formatCurrency(economics.yieldPerTon)} / MT`,
        },
    ];

    const timelineItems: Array<{
        label: string;
        value: string;
        description: string;
        icon: LucideIcon;
        iconWrapperClass: string;
    }> = [
        {
            label: 'Record Created',
            value: formatDate(operation.created_at),
            description: createdDate
                ? createdDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                })
                : 'Timestamp unavailable',
            icon: Clock,
            iconWrapperClass: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-200',
        },
        {
            label: 'Kickoff',
            value: formatDate(operation.startdate),
            description: startDate ? 'Scheduled start of execution' : 'Start date pending',
            icon: CalendarDays,
            iconWrapperClass: 'border-blue-200 bg-blue-50 text-blue-600 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        },
        {
            label: 'Projected Completion',
            value: formatDate(operation.enddate),
            description: endDate ? 'Planned wrap-up window' : 'End date pending',
            icon: Milestone,
            iconWrapperClass: 'border-purple-200 bg-purple-50 text-purple-600 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
        },
    ];

    const stakeholderSummary = relationshipMatrix.filter((item) => item.label !== 'Lifecycle Status');

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
                                        <Badge className={`flex items-center gap-1 border text-sm font-medium ${executionProfile.badgeClass}`}>
                                            <ExecutionIcon className="h-3.5 w-3.5" />
                                            {executionProfile.label}
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
                                            {destinationName || 'No Destination Assigned'}
                                        </span>
                                        {operation.user?.name && (
                                            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-900/50">
                                                <Activity className="h-3.5 w-3.5 text-green-600 dark:text-green-300" />
                                                Owner: {operation.user.name}
                                            </span>
                                        )}
                                        <span className={`inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-sm font-medium shadow-sm dark:bg-slate-900/50 ${executionProfile.chipClass}`}>
                                            <ExecutionIcon className="h-3.5 w-3.5" />
                                            Execution: {executionProfile.label}
                                        </span>
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
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Destination</p>
                                            <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{destinationName || 'N/A'}</p>
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                                {destinationScopeLabel ? `${destinationScopeLabel} coverage` : 'Destination scope pending'}
                                            </p>
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
                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40 md:col-span-2">
                                        <div className="flex flex-wrap items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Transport Execution</p>
                                                <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">{executionProfile.label}</p>
                                                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{executionProfile.description}</p>
                                            </div>
                                            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${executionProfile.badgeClass}`}>
                                                <ExecutionIcon className="h-3.5 w-3.5" />
                                                {executionProfile.label}
                                            </span>
                                        </div>
                                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
                                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
                                                    <span>Company Fleet</span>
                                                    <span>{companyTripShareLabel}</span>
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-emerald-700 dark:text-emerald-100">
                                                    {formatNumber(transportExecution.companyTrips, 0)} trips · {formatNumber(transportExecution.companyTonnage)} MT
                                                </p>
                                                <p className="mt-1 text-xs text-emerald-600/80 dark:text-emerald-300/80">Ton-km share {companyTonKmShareLabel}</p>
                                            </div>
                                            <div className="rounded-lg border border-sky-200 bg-sky-50 p-4 shadow-sm dark:border-sky-800 dark:bg-sky-900/20">
                                                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300">
                                                    <span>Vendor Partners</span>
                                                    <span>{vendorTripShareLabel}</span>
                                                </div>
                                                <p className="mt-2 text-sm font-semibold text-sky-700 dark:text-sky-100">
                                                    {formatNumber(transportExecution.vendorTrips, 0)} trips · {formatNumber(transportExecution.vendorTonnage)} MT
                                                </p>
                                                <p className="mt-1 text-xs text-sky-600/80 dark:text-sky-300/80">Ton-km share {vendorTonKmShareLabel}</p>
                                            </div>
                                        </div>
                                        <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                                            <div className="flex items-center justify-between">
                                                <span>Total trips tracked</span>
                                                <span className="font-semibold text-foreground">{formatNumber(totalTripsMix, 0)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Total tonnage handled</span>
                                                <span className="font-semibold text-foreground">{formatNumber(totalTonnageMix)}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span>Total ton-km delivered</span>
                                                <span className="font-semibold text-foreground">{formatOptionalNumber(totalTonKmMix, ' ton-km')}</span>
                                            </div>
                                        </div>
                                        <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                                            <div>Trip mix: {companyTripShareLabel} company · {vendorTripShareLabel} vendor</div>
                                            <div>Tonnage mix: {companyTonnageShareLabel} company · {vendorTonnageShareLabel} vendor</div>
                                            <div>Ton-km mix: {companyTonKmShareLabel} company · {vendorTonKmShareLabel} vendor</div>
                                            <div>Cost mix: {companyCostShareLabel} company · {vendorCostShareLabel} vendor</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Relationship Matrix */}
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/25 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Globe2 className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                                        Relationship Matrix
                                    </CardTitle>
                                    <CardDescription>Visualise how this operation connects to key entities</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {relationshipMatrix.map((item) => (
                                            <div
                                                key={item.label}
                                                className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${item.iconClassName}`}>
                                                        <item.icon className="h-5 w-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                            {item.label}
                                                        </p>
                                                        <p className="mt-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {item.value}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Performance Health */}
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <Target className="h-5 w-5 text-indigo-600 dark:text-indigo-300" />
                                        Performance Health
                                    </CardTitle>
                                    <CardDescription>Trip execution and volume progress against plan</CardDescription>
                                </CardHeader>
                                <CardContent className="p-6">
                                    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.65fr)_minmax(0,0.35fr)]">
                                        <div className="space-y-4">
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/30">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Completed Trips</p>
                                                    <p className="mt-3 text-2xl font-bold text-emerald-700 dark:text-emerald-100">{totals.completedTrips}</p>
                                                    <p className="mt-2 text-xs text-emerald-600/80 dark:text-emerald-300/80">Out of {totals.totalTrips} logged trips</p>
                                                </div>
                                                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm dark:border-amber-800 dark:bg-amber-900/30">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-300">Trips In Progress</p>
                                                    <p className="mt-3 text-2xl font-bold text-amber-700 dark:text-amber-100">{totals.ongoingTrips}</p>
                                                    <p className="mt-2 text-xs text-amber-600/80 dark:text-amber-300/80">Awaiting return confirmation</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <div className="flex items-start justify-between gap-4">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Volume &amp; Yield</p>
                                                        <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                            {formatNumber(totals.totalTonnage ?? 0)} MT delivered
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">{deliveredTonKmLabel} realised</p>
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                                            {completionLabel}
                                                        </span>
                                                        <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                            Ton-km {tonKmCompletionLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Tonnage</p>
                                                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all"
                                                                style={{ width: `${completionBarWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Ton-Km</p>
                                                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-teal-500 transition-all"
                                                                style={{ width: `${tonKmCompletionBarWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-3 grid gap-2 text-[11px] text-muted-foreground sm:grid-cols-2">
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>Plan:</span>
                                                        <span>{totals.plannedVolume ? `${formatNumber(totals.plannedVolume)} MT` : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>Remaining:</span>
                                                        <span>{totals.plannedVolume ? `${formatNumber(totals.remainingTonnage ?? 0)} MT` : 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>Ton-km Plan:</span>
                                                        <span>{plannedTonKmLabel}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between gap-2">
                                                        <span>Ton-km Gap:</span>
                                                        <span>{remainingTonKmLabel}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 grid gap-1 text-[11px] text-muted-foreground sm:grid-cols-2">
                                                    <div>Trip mix: {companyTripShareLabel} company · {vendorTripShareLabel} vendor</div>
                                                    <div>Tonnage mix: {companyTonnageShareLabel} company · {vendorTonnageShareLabel} vendor</div>
                                                    <div>Ton-km mix: {companyTonKmShareLabel} company · {vendorTonKmShareLabel} vendor</div>
                                                    <div>Cost mix: {companyCostShareLabel} company · {vendorCostShareLabel} vendor</div>
                                                </div>
                                                <div className="mt-4 rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Source mix snapshot</p>
                                                    <div className="mt-2 grid gap-2 text-xs sm:grid-cols-2">
                                                        <div>
                                                            <p className="font-semibold text-emerald-700 dark:text-emerald-200">Company Fleet</p>
                                                            <p className="text-muted-foreground">{formatNumber(transportExecution.companyTonnage)} MT · {companyTonKmLabel}</p>
                                                            <p className="text-muted-foreground">Avg load {companyAverageTonPerTripLabel}</p>
                                                            <p className="text-muted-foreground">Avg ton-km / trip {companyAverageTonKmPerTripLabel}</p>
                                                            <p className="text-muted-foreground">Cost / ton-km {companyCostPerTonKmLabel}</p>
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-sky-700 dark:text-sky-200">Vendor Partners</p>
                                                            <p className="text-muted-foreground">{formatNumber(transportExecution.vendorTonnage)} MT · {vendorTonKmLabel}</p>
                                                            <p className="text-muted-foreground">Avg load {vendorAverageTonPerTripLabel}</p>
                                                            <p className="text-muted-foreground">Avg ton-km / trip {vendorAverageTonKmPerTripLabel}</p>
                                                            <p className="text-muted-foreground">Cost / ton-km {vendorCostPerTonKmLabel}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 sm:grid-cols-2">
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Average Load per Trip</p>
                                                        <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatOptionalNumber(totals.averageTonPerTrip, ' MT')}</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">Helps gauge trip efficiency</p>
                                                </div>
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Total Distance Covered</p>
                                                    <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">{formatOptionalNumber(totals.totalDistance, ' km')}</p>
                                                    <p className="mt-1 text-xs text-muted-foreground">Cumulative distance for this operation</p>
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Transport Timeline</p>
                                                        <p className="mt-1 text-xs text-muted-foreground">Daily tonnage and trip cadence</p>
                                                    </div>
                                                    <span className="text-xs font-medium text-muted-foreground">Last 14 dispatch days</span>
                                                </div>
                                                <div className="mt-4 h-48">
                                                    {hasTimelineData ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={timelineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                                                                <defs>
                                                                    <linearGradient id="colorTonnage" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                    </linearGradient>
                                                                    <linearGradient id="colorTrips" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.3)" />
                                                                <XAxis dataKey="date" tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                                <Tooltip
                                                                    cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                                                                    contentStyle={{
                                                                        backgroundColor: 'var(--background)',
                                                                        borderRadius: '0.75rem',
                                                                        border: '1px solid hsl(var(--border))',
                                                                        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.18)',
                                                                    }}
                                                                />
                                                                <Area type="monotone" dataKey="tonnage" name="Tonnage (MT)" stroke="#6366f1" strokeWidth={2} fill="url(#colorTonnage)" />
                                                                <Area type="monotone" dataKey="trips" name="Trips" stroke="#22c55e" strokeWidth={2} fill="url(#colorTrips)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                            No trip data recorded yet
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Volume Completion</p>
                                                <p className="mt-1 text-xs text-muted-foreground">Achieved vs remaining tonnage</p>
                                                <div className="relative mt-4 h-48 w-full">
                                                    {hasTonnageData ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={tonnageBreakdown}
                                                                    dataKey="value"
                                                                    nameKey="label"
                                                                    innerRadius={60}
                                                                    outerRadius={90}
                                                                    paddingAngle={4}
                                                                    stroke="none"
                                                                >
                                                                    {tonnageBreakdown.map((entry, index) => (
                                                                        <Cell key={entry.label} fill={pieColors[index % pieColors.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <Tooltip
                                                                    formatter={(value, name) => [`${Number(value).toFixed(2)} MT`, String(name)]}
                                                                    contentStyle={{
                                                                        backgroundColor: 'var(--background)',
                                                                        borderRadius: '0.75rem',
                                                                        border: '1px solid hsl(var(--border))',
                                                                        boxShadow: '0 10px 40px rgba(15, 23, 42, 0.18)',
                                                                    }}
                                                                />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                            No volume movement yet
                                                        </div>
                                                    )}

                                                    {hasTonnageData && (
                                                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                                                            <span className="text-sm font-semibold text-foreground">{completionLabel}</span>
                                                            <span className="text-xs text-muted-foreground">Complete</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                                    {tonnageBreakdown.map((entry, index) => (
                                                        <div key={entry.label} className="flex items-center justify-between">
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className="h-2.5 w-2.5 rounded-full"
                                                                    style={{ backgroundColor: pieColors[index % pieColors.length] }}
                                                                />
                                                                <span className="font-medium text-foreground">{entry.label}</span>
                                                            </div>
                                                            <span className="font-semibold text-foreground">{formatNumber(entry.value ?? 0)} MT</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Financial Snapshot</p>
                                                <div className="mt-3 space-y-3 text-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Company Fleet Cost</span>
                                                        <span className="font-semibold text-foreground">{companyCostLabel}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Vendor Partner Cost</span>
                                                        <span className="font-semibold text-foreground">{vendorCostLabel}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Total Cost (Blended)</span>
                                                        <span className="font-semibold text-foreground">{totalCostLabel}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Company Avg Cost / Trip</span>
                                                        <span className="font-semibold text-foreground">{formatCurrency(financials.averageCostPerTrip)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Company Avg Cost / MT</span>
                                                        <span className="font-semibold text-foreground">{formatCurrency(financials.averageCostPerTon)}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Company Cost / Ton-Km</span>
                                                        <span className="font-semibold text-foreground">{formatCurrencyPerUnit(financials.costPerTonKm ?? economics.costPerTonKm ?? null, 'ton-km')}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-muted-foreground">Vendor Cost / Ton-Km</span>
                                                        <span className="font-semibold text-foreground">{vendorCostPerTonKmLabel}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 rounded-lg border border-indigo-100 bg-indigo-50/70 p-3 text-xs text-indigo-700 shadow-sm dark:border-indigo-900/50 dark:bg-indigo-950/30 dark:text-indigo-200">
                                                    {totals.totalTrips > 0
                                                        ? `Return rate at ${returnRateLabel} (${returnRateDeltaLabel} vs ${returnRateTarget}%) with ${tripProgressLabel} trips closed. Cost mix ${companyCostShareLabel} company / ${vendorCostShareLabel} vendor.`
                                                        : 'Log trip performances against this operation to begin monitoring financial efficiency.'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Economics Dashboard */}
                            <Card className="border-0 bg-gradient-to-br from-background to-muted/20 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-emerald-50 to-cyan-50 dark:from-emerald-950/20 dark:to-cyan-950/20">
                                    <CardTitle className="flex items-center gap-2 text-xl">
                                        <CircleDollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-300" />
                                        Economics Dashboard
                                    </CardTitle>
                                    <CardDescription>Ton-km revenue recognition, margins, and distance mix insights</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-6">
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {economicsHighlights.map((highlight) => {
                                            const Icon = highlight.icon;
                                            return (
                                                <div
                                                    key={highlight.label}
                                                    className={`rounded-xl border p-4 shadow-sm ${highlight.containerClass}`}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                                {highlight.label}
                                                            </p>
                                                            <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100">
                                                                {highlight.value}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                                                {highlight.helper}
                                                            </p>
                                                            {highlight.secondary && (
                                                                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-300/90">
                                                                    {highlight.secondary}
                                                                </p>
                                                            )}
                                                        </div>
                                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/70 text-foreground shadow-sm dark:bg-slate-900/40">
                                                            <Icon className={`h-5 w-5 ${highlight.iconClass}`} />
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    <div className="grid gap-4 lg:grid-cols-2">
                                        <div className="rounded-2xl border border-emerald-200 bg-white/80 p-5 shadow-sm dark:border-emerald-800 dark:bg-slate-900/40">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">Ton-Km Realisation</p>
                                                    <p className="mt-1 text-sm font-semibold text-foreground">{deliveredTonKmLabel}</p>
                                                    <p className="text-xs text-muted-foreground">Plan baseline {plannedTonKmLabel}</p>
                                                </div>
                                                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                                                    {tonKmCompletionLabel}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-xs text-muted-foreground">
                                                Recognised ton-kilometres align performance obligations with IFRS 15, ensuring revenue is booked as freight work is delivered.
                                            </p>
                                            <div className="mt-4 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500 transition-all"
                                                    style={{ width: `${tonKmCompletionBarWidth}%` }}
                                                />
                                            </div>
                                            <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>Revenue realised</span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(economics.actualRevenue)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>Revenue potential</span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(economics.potentialRevenue)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>Gross margin</span>
                                                    <span className="font-semibold text-foreground">{formatCurrency(economics.grossMarginValue)}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-2">
                                                    <span>Unit cost</span>
                                                    <span className="font-semibold text-foreground">{formatCurrencyPerUnit(economics.costPerTonKm, 'ton-km')}</span>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid gap-2 text-xs text-muted-foreground">
                                                <div className="flex items-center justify-between">
                                                    <span>Realised tariff</span>
                                                    <span className="font-semibold text-foreground">{realisedTariffPerTonKm !== null ? `${formatNumber(realisedTariffPerTonKm)} Birr/ton-km` : 'N/A'}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span>Tariff variance</span>
                                                    <span className={`font-semibold ${tariffVarianceTone}`}>{tariffVarianceLabel}</span>
                                                </div>
                                            </div>
                                        </div>

                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Distance Mix</p>
                                                        <p className="mt-1 text-sm font-semibold text-foreground">Network balance by tonnage flow</p>
                                                    </div>
                                                    <div className="text-right text-xs text-muted-foreground">
                                                        <p>Loaded share: <span className={`font-semibold ${loadFactorVarianceTone}`}>{loadFactorLabel}</span></p>
                                                        <p>Empty share: <span className={`font-semibold ${emptyShareVarianceTone}`}>{emptyShareLabel}</span></p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-3">
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>Loaded distance</span>
                                                            <span className="font-semibold text-foreground">{loadedDistanceLabel}</span>
                                                        </div>
                                                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all"
                                                                style={{ width: `${loadFactorBarWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>Empty distance</span>
                                                            <span className="font-semibold text-foreground">{emptyDistanceLabel}</span>
                                                        </div>
                                                        <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-muted">
                                                            <div
                                                                className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500 transition-all"
                                                                style={{ width: `${emptyShareBarWidth}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                                    <div className="flex items-center justify-between">
                                                        <span>Load factor target</span>
                                                        <span className={`font-semibold ${loadFactorVarianceTone}`}>{loadFactorTarget}% ({loadFactorVarianceLabel})</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span>Empty share cap</span>
                                                        <span className={`font-semibold ${emptyShareVarianceTone}`}>{emptyShareTarget}% ({emptyShareVarianceLabel})</span>
                                                    </div>
                                                </div>
                                                <p className="mt-4 text-xs text-muted-foreground">
                                                    Prioritise consolidating backhauls where empty ratios climb above industry benchmarks to protect tonne-km yield and margin.
                                                </p>
                                            </div>
                                        {contributionMetrics.length > 0 && (
                                            <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Contribution Mix</p>
                                                        <p className="mt-1 text-sm font-semibold text-foreground">How contract delivery compares to plan</p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 space-y-4">
                                                    {contributionMetrics.map((metric) => {
                                                        const shareValue = metric.value ?? null;
                                                        const { diff, baseline } = calculateShareVariance(shareValue, metric.benchmark);
                                                        const barWidth = clampPercentage(shareValue ?? 0);
                                                        const deltaLabel = formatPointDelta(diff);
                                                        return (
                                                            <div key={metric.label} className="space-y-2">
                                                                <div className="flex items-center justify-between text-sm">
                                                                    <span className="text-muted-foreground" title={metric.helper}>{metric.label}</span>
                                                                    <span className="font-semibold text-foreground">{formatShareLabel(shareValue)}</span>
                                                                </div>
                                                                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                    <div
                                                                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500"
                                                                        style={{ width: `${barWidth}%` }}
                                                                    />
                                                                </div>
                                                                {deltaLabel ? (
                                                                    <p className={`text-[11px] ${diff !== null && diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                        {deltaLabel} {metric.benchmarkLabel}
                                                                        {baseline !== null ? ` (${formatShareLabel(baseline)})` : ''}
                                                                    </p>
                                                                ) : baseline !== null ? (
                                                                    <p className="text-[11px] text-muted-foreground">
                                                                        {metric.benchmarkLabel}: {formatShareLabel(baseline)}
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
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
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                        {metrics.map((metric) => {
                                            const Icon = metric.icon;
                                            return (
                                                <div
                                                    key={metric.label}
                                                    className={`rounded-xl border ${metric.containerClass} p-4 shadow-sm`}
                                                >
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
                                                        {metric.label}
                                                    </p>
                                                    <div className="mt-2 flex items-baseline gap-2">
                                                        <Icon className={`h-4 w-4 ${metric.iconClass}`} />
                                                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                                                            {metric.value}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                                        {metric.helper}
                                                    </p>
                                                </div>
                                            );
                                        })}
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
                                <CardContent className="space-y-3 p-5">
                                    {stakeholderSummary.map((item) => (
                                        <div
                                            key={item.label}
                                            className="rounded-lg border border-slate-200 bg-white/70 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                                        >
                                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                {item.label}
                                            </p>
                                            <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                {item.value}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                                {item.description}
                                            </p>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>

                            <Card className="border-0 bg-gradient-to-br from-background to-muted/30 shadow-lg">
                                <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20">
                                    <CardTitle className="text-lg font-semibold">Key Dates</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 p-5">
                                    {timelineItems.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                            <div
                                                key={item.label}
                                                className="flex items-start gap-3 rounded-lg border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/40"
                                            >
                                                <div className={`flex h-10 w-10 items-center justify-center rounded-lg border ${item.iconWrapperClass}`}>
                                                    <Icon className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                                        {item.label}
                                                    </p>
                                                    <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">
                                                        {item.value}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
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

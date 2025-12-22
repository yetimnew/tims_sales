import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import {
    Activity, DollarSign, Edit2, Trash2, ArrowLeft,
    CheckCircle, Clock, MapPin, User, Truck, Building2, Route,
    Fuel, Package, Calendar, FileText, AlertCircle,
    Download, Printer, BarChart3, Target, Navigation,
    ExternalLink, Phone, PieChart as PieIcon
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: 'Show', href: '#' },
];

interface DriverTruckAssignment {
    id: number;
    driver?: {
        id: number;
        name: string;
        license?: string;
        phone?: string;
    } | null;
    truck?: {
        id: number;
        plate: string;
        model?: string;
        capacity?: number;
    } | null;
}

interface Performance {
    id: number;
    FOnumber: string;
    load_phase?: string | null;
    load_completion?: string | null;
    DateDispach: string;
    satus: string;
    operation_id: number;
    driver_truck_id: number;
    orgion_id: number;
    destination_id: number;
    DistanceWCargo: number;
    DistanceWOCargo: number;
    tonkm: number;
    CargoVolumMT: number;
    fuelInLitter: number;
    fuelInBirr: number;
    perdiem: number;
    other: number;
    comment: string;
    is_returned: boolean;
    returned_date: string;
    operation?: {
        id: number;
        operationid: string;
        tariff?: number | null;
        km?: number | null;
        volume?: number | null;
        customer: {
            id: number;
            name: string;
            email?: string;
            phone?: string;
        };
    };
    driverTruck?: DriverTruckAssignment | null;
    driver_truck?: DriverTruckAssignment | null;
    origin?: {
        id: number;
        name: string;

    };
    destination?: {
        id: number;
        name: string;
    };
}

interface ShowProps {
    performance: Performance;
    activityLogs?: any[];
    operationInsights?: OperationInsights | null;
}

interface OperationInsights {
    overview: {
        plannedVolume: number | null;
        totalTrips: number;
        completedTrips: number;
        ongoingTrips: number;
        totalTonnage: number;
        remainingTonnage: number;
        completionRate: number | null;
    };
    economics?: OperationEconomics | null;
    tripEconomics?: TripEconomics | null;
    performanceShare: {
        tonnageShare: number | null;
        distanceShare: number | null;
        costShare: number | null;
        plannedContribution: number | null;
        tonnage: number;
        distance: number;
        cost: number;
        tonKm: number;
    };
    trends: {
        recentTrips: Array<{
            id: number;
            foNumber: string;
            date: string;
            tonnage: number;
            distance: number;
            cost: number;
            highlight: boolean;
        }>;
        statusBreakdown: Array<{
            label: string;
            value: number;
        }>;
    };
}

interface OperationEconomics {
    tariff: number | null;
    totalTonKm: number | null;
    plannedTonKm: number | null;
    tonKmCompletionRate: number | null;
    actualRevenue: number | null;
    totalCost: number | null;
    costPerTonKm: number | null;
    grossMarginValue: number | null;
    grossMarginPercent: number | null;
    loadFactor: number | null;
    emptyBackhaulShare: number | null;
    loadedDistance: number | null;
    emptyDistance: number | null;
}

interface TripEconomics {
    tariff: number | null;
    tonKm: number | null;
    actualRevenue: number | null;
    cost: number | null;
    costPerTonKm: number | null;
    grossMarginValue: number | null;
    grossMarginPercent: number | null;
    yieldPerTon: number | null;
    yieldPerKm: number | null;
    loadFactor: number | null;
    emptyBackhaulShare: number | null;
    distanceWithCargo: number | null;
    distanceWithoutCargo: number | null;
}

export default function PerformancesShow({ performance, activityLogs, operationInsights }: ShowProps) {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    const formatDisplayDate = (value?: string | null) => {
        if (!value) return 'N/A';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) {
            return 'N/A';
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const formatNumberDisplay = (value?: number | null, fractionDigits = 2) => {
        if (value === null || value === undefined) return 'N/A';
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return numericValue.toLocaleString('en-US', {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
        });
    };

    const formatCurrencyDisplay = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return `${numericValue.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })} Birr`;
    };

    const formatPercentDisplay = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        return `${Number(value).toFixed(1)}%`;
    };

    const formatShareLabel = (value?: number | null) => {
        if (value === null || value === undefined) return 'N/A';
        const numericValue = Number(value);
        if (!Number.isFinite(numericValue)) {
            return 'N/A';
        }

        return `${numericValue.toFixed(1)}%`;
    };

    const calculateShareVariance = (share?: number | null, baseline?: number | null) => {
        if (share === null || share === undefined || baseline === null || baseline === undefined) {
            return { diff: null, baseline: null };
        }

        const shareValue = Number(share);
        const baselineValue = Number(baseline);

        if (!Number.isFinite(shareValue) || !Number.isFinite(baselineValue)) {
            return { diff: null, baseline: null };
        }

        if (Math.abs(baselineValue) > 100) {
            return { diff: null, baseline: null };
        }

        return {
            diff: Number((shareValue - baselineValue).toFixed(1)),
            baseline: baselineValue,
        };
    };

    const formatCurrencyPerUnit = (value?: number | null, unit?: string) => {
        if (value === null || value === undefined) return 'N/A';
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

    // Ensure all values are numbers for calculations
    const dwc = parseFloat(performance.DistanceWCargo as any) || 0;
    const dwo = parseFloat(performance.DistanceWOCargo as any) || 0;
    const cvm = parseFloat(performance.CargoVolumMT as any) || 0;
    const fib = parseFloat(performance.fuelInBirr as any) || 0;
    const per = parseFloat(performance.perdiem as any) || 0;
    const oth = parseFloat(performance.other as any) || 0;
    const fil = parseFloat(performance.fuelInLitter as any) || 0;

    const totalDistance = dwc + dwo;
    const tonKm = dwc * cvm;
    const totalCost = fib + per + oth;
    const fuelEfficiency = fil > 0 ? (totalDistance / fil) : 0;
    const costPerKm = totalDistance > 0 ? (totalCost / totalDistance) : 0;

    const operationRef = performance.operation;
    const driverAssignment = performance.driverTruck ?? performance.driver_truck ?? null;
    const driver = driverAssignment?.driver ?? null;
    const truck = driverAssignment?.truck ?? null;
    const foNumber = performance.FOnumber || 'N/A';
    const operationLink = operationRef ? `/operations/${operationRef.id}` : undefined;
    const dispatchDateLabel = formatDisplayDate(performance.DateDispach);
    const returnedDateLabel = performance.is_returned ? formatDisplayDate(performance.returned_date) : 'Pending';
    const truckCapacity = truck?.capacity ?? 0;
    const loadUtilization = truckCapacity > 0 ? Math.min((cvm / truckCapacity) * 100, 100) : null;
    const loadUtilizationLabel = loadUtilization !== null ? `${loadUtilization.toFixed(0)}%` : 'N/A';
    const loadUtilizationTarget = 85;
    const loadUtilizationStatus = loadUtilization !== null ? (loadUtilization >= loadUtilizationTarget ? 'On target' : 'Below target') : 'N/A';
    const distanceMixLabel = `${formatNumberDisplay(dwc, 0)} km / ${formatNumberDisplay(dwo, 0)} km`;
    const originName = performance.origin?.name || 'N/A';
    const destinationName = performance.destination?.name || 'N/A';

    const operationOverview = operationInsights?.overview;
    const performanceShare = operationInsights?.performanceShare;
    const operationTrends = operationInsights?.trends;
    const operationEconomics = operationInsights?.economics ?? null;
    const tripEconomics = operationInsights?.tripEconomics ?? null;

    const tonnageShareValue = performanceShare?.tonnageShare ?? null;
    const tonnageShareBenchmark = operationOverview?.completionRate ?? null;
    const distanceShareBenchmark = tonnageShareValue;
    const costShareBenchmark = tonnageShareValue;
    const planContributionBenchmark = operationEconomics?.tonKmCompletionRate ?? null;

    const completionRate = operationOverview?.completionRate;
    const completionLabel = completionRate !== null && completionRate !== undefined
        ? `${completionRate.toFixed(1)}%`
        : 'N/A';
    const completionBarWidth = completionRate !== null && completionRate !== undefined
        ? Math.max(0, Math.min(completionRate, 100))
        : 0;
    const statusData = operationTrends?.statusBreakdown ?? ([] as Array<{ label: string; value: number }>);
    const hasStatusData = statusData.some((item) => item.value > 0);
    const timelineData = operationTrends?.recentTrips ?? ([] as Array<{
        id: number;
        foNumber: string;
        date: string;
        tonnage: number;
        distance: number;
        cost: number;
        highlight: boolean;
    }>);
    const hasTimelineData = timelineData.length > 0;
    const piePalette = ['#6366f1', '#22c55e', '#f97316'];
    const statusPalette = ['#22c55e', '#f97316', '#0ea5e9'];

    const tariff = tripEconomics?.tariff ?? operationRef?.tariff ?? null;
    const actualRevenueRaw = tripEconomics?.actualRevenue ?? (tariff !== null ? Number((tonKm * tariff).toFixed(2)) : null);
    const costPerTonKmRaw = tripEconomics?.costPerTonKm ?? (tonKm > 0 ? Number((totalCost / tonKm).toFixed(2)) : null);
    const grossMarginValueRaw = tripEconomics?.grossMarginValue ?? (actualRevenueRaw !== null ? Number((actualRevenueRaw - totalCost).toFixed(2)) : null);
    const grossMarginPercentRaw = tripEconomics?.grossMarginPercent ?? (
        actualRevenueRaw !== null && actualRevenueRaw !== 0
            ? Number(((grossMarginValueRaw ?? 0) / actualRevenueRaw * 100).toFixed(2))
            : null
    );
    const yieldPerTonRaw = tripEconomics?.yieldPerTon ?? (cvm > 0 && actualRevenueRaw !== null
        ? Number((actualRevenueRaw / cvm).toFixed(2))
        : null);
    const yieldPerKmRaw = tripEconomics?.yieldPerKm ?? (totalDistance > 0 && actualRevenueRaw !== null
        ? Number((actualRevenueRaw / totalDistance).toFixed(2))
        : null);
    const tripLoadFactor = tripEconomics?.loadFactor ?? (totalDistance > 0
        ? Number(((dwc / totalDistance) * 100).toFixed(2))
        : null);
    const tripEmptyShare = tripEconomics?.emptyBackhaulShare ?? (totalDistance > 0
        ? Number(((dwo / totalDistance) * 100).toFixed(2))
        : null);
    const distanceWithCargoLabel = formatNumberDisplay(tripEconomics?.distanceWithCargo ?? dwc);
    const distanceWithoutCargoLabel = formatNumberDisplay(tripEconomics?.distanceWithoutCargo ?? dwo);
    const tariffLabel = tariff !== null ? formatCurrencyPerUnit(tariff, 'ton-km') : 'N/A';
    const grossMarginPercentLabel = formatPercentDisplay(grossMarginPercentRaw);
    const actualRevenueLabel = formatCurrencyDisplay(actualRevenueRaw);
    const grossMarginValueLabel = formatCurrencyDisplay(grossMarginValueRaw);
    const costPerTonKmLabel = formatCurrencyPerUnit(costPerTonKmRaw, 'ton-km');
    const yieldPerTonLabel = yieldPerTonRaw !== null ? formatCurrencyPerUnit(yieldPerTonRaw, 'MT') : 'N/A';
    const yieldPerKmLabel = yieldPerKmRaw !== null ? formatCurrencyPerUnit(yieldPerKmRaw, 'km') : 'N/A';
    const loadFactorLabel = tripLoadFactor !== null ? `${tripLoadFactor.toFixed(1)}%` : 'N/A';
    const emptyShareLabel = tripEmptyShare !== null ? `${tripEmptyShare.toFixed(1)}%` : 'N/A';
    const operationCostBenchmark = operationEconomics?.costPerTonKm ?? null;
    const costPerTonKmVariance = operationCostBenchmark !== null && costPerTonKmRaw !== null ? Number((costPerTonKmRaw - operationCostBenchmark).toFixed(2)) : null;
    const costVarianceLabel = costPerTonKmVariance !== null ? `${costPerTonKmVariance > 0 ? '+' : ''}${formatNumberDisplay(costPerTonKmVariance)} Birr/ton-km` : 'N/A';
    const costVarianceTone = costPerTonKmVariance !== null && costPerTonKmVariance > 0 ? 'text-rose-600' : 'text-emerald-600';
    const grossMarginColor = grossMarginValueRaw !== null && grossMarginValueRaw < 0
        ? 'text-rose-600'
        : 'text-emerald-600';
    const contractTariffBenchmark = operationRef?.tariff ?? null;
    const realizedTariff = tripEconomics?.tariff ?? null;
    const tariffVariance = realizedTariff !== null && contractTariffBenchmark !== null ? Number((realizedTariff - contractTariffBenchmark).toFixed(2)) : null;
    const tariffVarianceLabel = tariffVariance !== null ? `${tariffVariance >= 0 ? '+' : ''}${formatNumberDisplay(tariffVariance)} Birr/ton-km` : 'N/A';
    const operationRevenueLabel = formatCurrencyDisplay(operationEconomics?.actualRevenue ?? null);
    const operationCostPerTonKmLabel = formatCurrencyPerUnit(operationEconomics?.costPerTonKm ?? null, 'ton-km');
    const operationGrossMarginValueLabel = formatCurrencyDisplay(operationEconomics?.grossMarginValue ?? null);
    const operationGrossMarginPercentLabel = formatPercentDisplay(operationEconomics?.grossMarginPercent ?? null);
    const operationTonKmLabel = operationEconomics?.totalTonKm !== undefined && operationEconomics?.totalTonKm !== null
        ? `${formatNumberDisplay(operationEconomics.totalTonKm)} ton-km`
        : 'N/A';
    const operationPlannedTonKmLabel = operationEconomics?.plannedTonKm !== undefined && operationEconomics?.plannedTonKm !== null
        ? `${formatNumberDisplay(operationEconomics.plannedTonKm)} ton-km`
        : 'N/A';
    const operationTonKmCompletionLabel = operationEconomics?.tonKmCompletionRate !== null && operationEconomics?.tonKmCompletionRate !== undefined
        ? `${operationEconomics.tonKmCompletionRate.toFixed(1)}%`
        : 'N/A';
    const operationLoadFactorLabel = operationEconomics?.loadFactor !== null && operationEconomics?.loadFactor !== undefined
        ? `${operationEconomics.loadFactor.toFixed(1)}%`
        : 'N/A';
    const operationEmptyShareLabel = operationEconomics?.emptyBackhaulShare !== null && operationEconomics?.emptyBackhaulShare !== undefined
        ? `${operationEconomics.emptyBackhaulShare.toFixed(1)}%`
        : 'N/A';
    const returnRateValue = operationOverview?.totalTrips && operationOverview.totalTrips > 0
        ? (operationOverview.completedTrips / operationOverview.totalTrips) * 100
        : null;
    const returnRateLabel = formatPercentDisplay(returnRateValue);
    const returnRateTarget = 92;
    const returnRateDelta = returnRateValue !== null ? Number((returnRateValue - returnRateTarget).toFixed(1)) : null;

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            'active': 'bg-blue-100 text-blue-800 border-blue-200',
            'inactive': 'bg-gray-100 text-gray-800 border-gray-200',
            'completed': 'bg-green-100 text-green-800 border-green-200',
            'cancelled': 'bg-red-100 text-red-800 border-red-200',
            'in_progress': 'bg-blue-100 text-blue-800 border-blue-200',
            'pending': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'returned': 'bg-green-100 text-green-800 border-green-200',
        };
        return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getLoadPhaseColor = (phase?: string | null) => {
        const colors: Record<string, string> = {
            'main': 'bg-purple-100 text-purple-800 border-purple-200',
            'return': 'bg-orange-100 text-orange-800 border-orange-200',
            'empty': 'bg-gray-100 text-gray-800 border-gray-200',
        };
        return colors[phase?.toLowerCase() ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getLoadCompletionColor = (completion?: string | null) => {
        const colors: Record<string, string> = {
            'full': 'bg-emerald-100 text-emerald-700 border-emerald-200',
            'partial': 'bg-amber-100 text-amber-700 border-amber-200',
        };
        return colors[completion?.toLowerCase() ?? ''] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    const getStatusIcon = (status: string) => {
        const icons: Record<string, ReactNode> = {
            'completed': <CheckCircle className="h-3.5 w-3.5" />,
            'returned': <CheckCircle className="h-3.5 w-3.5" />,
            'in_progress': <Clock className="h-3.5 w-3.5" />,
            'active': <Activity className="h-3.5 w-3.5" />,
            'pending': <Clock className="h-3.5 w-3.5" />,
            'cancelled': <AlertCircle className="h-3.5 w-3.5" />,
        };
        return icons[status?.toLowerCase()] || <Activity className="h-3.5 w-3.5" />;
    };

    const industryBenchmarks = {
        fuelEfficiency: 2.8,
        emptyBackhaulShare: 15,
    } as const;
    const fuelEfficiencyBenchmarkLabel = `${formatNumberDisplay(industryBenchmarks.fuelEfficiency)} km/l`;
    const fuelEfficiencyDelta = Number((fuelEfficiency - industryBenchmarks.fuelEfficiency).toFixed(2));
    const fuelEfficiencyDeltaLabel = Number.isFinite(fuelEfficiencyDelta)
        ? `${fuelEfficiencyDelta >= 0 ? '+' : ''}${formatNumberDisplay(fuelEfficiencyDelta)} km/l`
        : null;
    const emptyBackhaulBenchmarkLabel = `${industryBenchmarks.emptyBackhaulShare}%`;
    const recentAverageLoadedDistance = hasTimelineData
        ? Number(
              (
                  timelineData.reduce((total, trip) => total + (Number.isFinite(trip.distance) ? trip.distance : 0), 0) /
                  timelineData.length
              ).toFixed(1)
          )
        : null;
    const recentAverageLoadedDistanceLabel =
        recentAverageLoadedDistance !== null ? `${formatNumberDisplay(recentAverageLoadedDistance, 1)} km` : 'N/A';

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`FO ${foNumber}`} />
            <div className="flex flex-1 flex-col overflow-hidden p-4">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto pr-1 pb-6">
                    {/* Header */}
                    <Card className="border shadow-sm">
                        <CardContent className="flex flex-col gap-6 p-6">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <Link
                                        href="/performances"
                                        className="transition-colors text-muted-foreground hover:text-foreground"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </Link>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <h1 className="text-2xl font-semibold text-foreground">FO {foNumber}</h1>
                                            <Badge className={`${getStatusColor(performance.satus)} border font-medium`}>
                                                {getStatusIcon(performance.satus)}
                                                <span className="ml-1">
                                                    {performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}
                                                </span>
                                            </Badge>
                                            {performance.load_phase ? (
                                                <Badge className={`${getLoadPhaseColor(performance.load_phase)} border font-medium capitalize`}>
                                                    {performance.load_phase}
                                                </Badge>
                                            ) : null}
                                            {performance.load_completion ? (
                                                <Badge className={`${getLoadCompletionColor(performance.load_completion)} border font-medium capitalize`}>
                                                    {performance.load_completion}
                                                </Badge>
                                            ) : null}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            FO Reference <span className="font-semibold text-primary">{foNumber}</span>
                                        </p>
                                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                            {operationRef && operationLink && (
                                                <Link
                                                    href={operationLink}
                                                    className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground transition-colors hover:text-primary"
                                                >
                                                    <Building2 className="h-3.5 w-3.5 text-purple-600" />
                                                    Operation {operationRef.operationid}
                                                    <ExternalLink className="h-3 w-3" />
                                                </Link>
                                            )}
                                            {driver?.name && (
                                                driver?.id ? (
                                                    <Link
                                                        href={`/drivers/${driver.id}`}
                                                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground transition-colors hover:text-primary"
                                                    >
                                                        <User className="h-3.5 w-3.5 text-blue-600" />
                                                        {driver.name}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                                                        <User className="h-3.5 w-3.5 text-blue-600" />
                                                        {driver.name}
                                                    </span>
                                                )
                                            )}
                                            {truck?.plate && (
                                                truck?.id ? (
                                                    <Link
                                                        href={`/trucks/${truck.id}`}
                                                        className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground transition-colors hover:text-primary"
                                                    >
                                                        <Truck className="h-3.5 w-3.5 text-amber-600" />
                                                        {truck.plate}
                                                        <ExternalLink className="h-3 w-3" />
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 font-medium text-foreground">
                                                        <Truck className="h-3.5 w-3.5 text-amber-600" />
                                                        {truck.plate}
                                                    </span>
                                                )
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Route Visualization */}
                            <div className="flex flex-wrap items-center gap-4 rounded-lg border bg-muted/30 p-4">
                                <div className="min-w-[160px] flex-1 flex flex-col gap-2 md:flex-row md:items-center md:gap-3">
                                    <div className="rounded-lg bg-primary/10 p-3">
                                        <MapPin className="h-5 w-5 text-purple-600" />
                                    </div>
                                    <div className="md:mt-0">
                                        <p className="text-xs text-muted-foreground">Origin</p>
                                        <p className="font-semibold text-foreground">{performance.origin?.name || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="h-px w-12 bg-gradient-to-r from-purple-400/60 to-pink-400/60" />
                                    <Navigation className="h-5 w-5 text-purple-500" />
                                    <div className="h-px w-12 bg-gradient-to-r from-purple-400/60 to-pink-400/60" />
                                </div>
                                <div className="min-w-[160px] flex flex-1 flex-col-reverse gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
                                    <div className="text-right md:order-1 md:mt-0">
                                        <p className="text-xs text-muted-foreground">Destination</p>
                                        <p className="font-semibold text-foreground">{performance.destination?.name || 'N/A'}</p>
                                    </div>
                                    <div className="rounded-lg bg-pink-100 p-3 dark:bg-pink-900/30">
                                        <MapPin className="h-5 w-5 text-pink-600" />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Main Layout */}
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.32fr)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.32fr)]">
                        <div className="space-y-6">
                            {/* Detailed Information */}
                            <Card className="border shadow-sm">
                                <CardHeader className="border-b bg-muted/30">
                                    <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                        <div className="rounded-lg bg-purple-100 p-2 dark:bg-purple-900/30">
                                            <Activity className="h-5 w-5 text-purple-600" />
                                        </div>
                                        Detailed Information
                                    </CardTitle>
                                    <CardDescription>Complete performance metrics and analysis</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6 p-6">
                                    <Tabs defaultValue="details" className="flex flex-col gap-4">
                                        <TabsList className="grid w-full grid-cols-2 gap-2 rounded-lg bg-muted/60 p-2 sm:grid-cols-4">
                                            <TabsTrigger value="details" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <Activity className="h-4 w-4" />
                                                <span className="hidden sm:inline">Details</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="financial" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <DollarSign className="h-4 w-4" />
                                                <span className="hidden sm:inline">Financial</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="route" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <MapPin className="h-4 w-4" />
                                                <span className="hidden sm:inline">Route</span>
                                            </TabsTrigger>
                                            <TabsTrigger value="activity" className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm">
                                                <CheckCircle className="h-4 w-4" />
                                                <span className="hidden sm:inline">Activity</span>
                                            </TabsTrigger>
                                        </TabsList>

                                        {/* TAB 1: DETAILS */}
                                        <TabsContent value="details" className="space-y-6">
                                            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                                                {/* Movement Overview */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                            <Activity className="h-3.5 w-3.5 text-purple-600" />
                                                        </div>
                                                        Movement Overview
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-purple-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Operation Reference</p>
                                                            <p className="font-medium text-foreground">{operationRef?.operationid ?? 'N/A'}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">FO Number</p>
                                                            <p className="font-medium text-foreground">{foNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Dispatch Date</p>
                                                            <p className="font-medium text-foreground flex items-center gap-1">
                                                                <Calendar className="h-3 w-3" />
                                                                {dispatchDateLabel}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Load Details</p>
                                                            <div className="flex flex-wrap gap-2 pt-1">
                                                                {performance.load_phase ? (
                                                                    <Badge className={`${getLoadPhaseColor(performance.load_phase)} border capitalize`}>
                                                                        {performance.load_phase}
                                                                    </Badge>
                                                                ) : null}
                                                                {performance.load_completion ? (
                                                                    <Badge className={`${getLoadCompletionColor(performance.load_completion)} border capitalize`}>
                                                                        {performance.load_completion}
                                                                    </Badge>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Cargo Information */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 rounded">
                                                            <Package className="h-3.5 w-3.5 text-cyan-600" />
                                                        </div>
                                                        Cargo Information
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-cyan-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Cargo Volume</p>
                                                            <p className="font-medium text-foreground break-words">{`${formatNumberDisplay(cvm)} MT`}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Ton-KM Efficiency</p>
                                                            <p className="font-medium text-foreground break-words">{`${formatNumberDisplay(tonKm)} ton-km`}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Load Utilization</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-cyan-500 to-cyan-600"
                                                                        style={{ width: `${loadUtilization ?? 0}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-xs font-medium">
                                                                    {loadUtilizationLabel}
                                                                </span>
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center justify-between text-[11px] text-muted-foreground">
                                                                <span>Target ≥ {loadUtilizationTarget}%</span>
                                                                {loadUtilization !== null && (
                                                                    <span className={`font-semibold ${loadUtilization >= loadUtilizationTarget ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                                        {loadUtilizationStatus}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Return Status</p>
                                                            <p className="font-medium text-foreground flex items-center gap-1">
                                                                {performance.is_returned ? (
                                                                    <>
                                                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                                                        Returned
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Clock className="h-3 w-3 text-yellow-600" />
                                                                        Not Returned
                                                                    </>
                                                                )}
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">Return rate target ≥ {returnRateTarget}%</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status & Notes */}
                                                <div className="space-y-4 md:col-span-2">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                            <FileText className="h-3.5 w-3.5 text-blue-600" />
                                                        </div>
                                                        Status & Comments
                                                    </h3>
                                                    <div className="space-y-3 pl-4 border-l-2 border-blue-200">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Current Status</p>
                                                            <Badge className={`${getStatusColor(performance.satus)} border mt-1`}>
                                                                {getStatusIcon(performance.satus)}
                                                                <span className="ml-1">{performance.satus?.charAt(0).toUpperCase() + performance.satus?.slice(1)}</span>
                                                            </Badge>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground">Comments</p>
                                                            <p className="font-medium text-foreground text-sm mt-1 p-3 bg-muted/30 rounded-lg border">
                                                                {performance.comment || 'No comments provided'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 2: FINANCIAL */}
                                        <TabsContent value="financial" className="flex-1 overflow-auto pr-1">
                                            <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
                                                {/* Cost Breakdown */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-green-100 dark:bg-green-900/30 rounded">
                                                            <DollarSign className="h-3.5 w-3.5 text-green-600" />
                                                        </div>
                                                        Cost Breakdown
                                                    </h3>
                                                    <div className="space-y-3">
                                                        <div className="rounded-xl border border-emerald-200 bg-emerald-50/90 p-4 shadow-sm dark:border-emerald-800 dark:bg-emerald-900/20">
                                                            <div className="flex items-start justify-between gap-3">
                                                                <div>
                                                                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-200">Revenue Recognised</p>
                                                                    <p className="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-100">{actualRevenueLabel}</p>
                                                                    <p className="mt-1 text-xs text-emerald-700/80 dark:text-emerald-200/80">Ton-km × tariff in line with IFRS 15 delivery milestones</p>
                                                                </div>
                                                                <span className="rounded-md bg-white/70 px-3 py-1 text-[11px] font-semibold text-emerald-700 shadow-sm dark:bg-emerald-950/40 dark:text-emerald-200">
                                                                    {grossMarginPercentLabel !== 'N/A' ? `Margin ${grossMarginPercentLabel}` : 'Tariff driven'}
                                                                </span>
                                                            </div>
                                                            <div className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span>Tariff</span>
                                                                    <span className="font-semibold text-foreground">{tariffLabel}</span>
                                                                </div>
                                                                <div className="flex items-center justify-between gap-2">
                                                                    <span>Yield / Ton</span>
                                                                    <span className="font-semibold text-foreground">{yieldPerTonLabel}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                                                <span className="text-sm text-muted-foreground">Fuel Cost</span>
                                                                <span className="font-semibold text-foreground break-words">{formatCurrencyDisplay(fib)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                                                <span className="text-sm text-muted-foreground">Per Diem</span>
                                                                <span className="font-semibold text-foreground break-words">{formatCurrencyDisplay(per)}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                                                <span className="text-sm text-muted-foreground">Other Costs</span>
                                                                <span className="font-semibold text-foreground break-words">{formatCurrencyDisplay(oth)}</span>
                                                            </div>
                                                            <div className="rounded-lg border bg-muted/30 p-3">
                                                                <p className="text-sm text-muted-foreground">Cost / Ton-km</p>
                                                                <p className="mt-1 text-lg font-semibold text-foreground break-words">{costPerTonKmLabel}</p>
                                                                <p className="text-[11px] text-muted-foreground">Variance vs contract: <span className={`font-semibold ${costVarianceTone}`}>{costVarianceLabel}</span></p>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                                                <span className="text-sm text-muted-foreground">Yield / Km</span>
                                                                <span className="font-semibold text-foreground">{yieldPerKmLabel}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
                                                                <span className="text-sm text-muted-foreground">Load Factor</span>
                                                                <span className="font-semibold text-foreground">{loadFactorLabel}</span>
                                                            </div>
                                                        </div>

                                                        <Separator />

                                                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                            <div className="flex items-center justify-between rounded-lg border-2 border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
                                                                <span className="font-semibold text-foreground">Total Cost</span>
                                                                <span className="text-xl font-bold text-green-600 dark:text-green-300 break-words">{formatCurrencyDisplay(totalCost)}</span>
                                                            </div>
                                                            <div className="rounded-lg border bg-muted/30 p-3">
                                                                <p className="text-sm text-muted-foreground">Gross Margin</p>
                                                                <p className={`mt-1 text-xl font-bold ${grossMarginColor}`}>{grossMarginValueLabel}</p>
                                                                <p className="text-xs text-muted-foreground">Revenue less direct operating cost</p>
                                                            </div>
                                                        </div>
                                                        <div className="rounded-lg border border-dashed border-emerald-300 bg-emerald-50/40 p-3 dark:border-emerald-800/70 dark:bg-emerald-900/10">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-muted-foreground">Cost variance vs contract</span>
                                                                <span className={`text-sm font-semibold ${costVarianceTone}`}>{costVarianceLabel}</span>
                                                            </div>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">Benchmark: {operationCostBenchmark !== null ? formatCurrencyPerUnit(operationCostBenchmark, 'ton-km') : 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Performance Metrics */}
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded">
                                                            <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                                                        </div>
                                                        Performance Metrics
                                                    </h3>
                                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Cost per Kilometer</p>
                                                            <p className="text-2xl font-bold text-blue-600 break-words">{formatNumberDisplay(costPerKm)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Birr/km</p>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">Contract benchmark: {operationCostBenchmark !== null ? formatCurrencyPerUnit(operationCostBenchmark, 'ton-km') : 'N/A'}</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Efficiency</p>
                                                            <p className="text-2xl font-bold text-orange-600 break-words">{formatNumberDisplay(fuelEfficiency)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">km/liter</p>
                                                            <p className="mt-1 text-[11px] text-muted-foreground">Benchmark: {fuelEfficiencyBenchmarkLabel}{fuelEfficiencyDeltaLabel ? ` (${fuelEfficiencyDeltaLabel})` : ''}</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Consumed</p>
                                                            <p className="text-2xl font-bold text-purple-600 break-words">{formatNumberDisplay(fil)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">liters</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Ton-Km Delivered</p>
                                                            <p className="text-2xl font-bold text-purple-600 break-words">{formatNumberDisplay(tonKm)}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Loaded distance × tonnage</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Empty Backhaul Share</p>
                                                            <p className="text-2xl font-bold text-amber-600">{emptyShareLabel}</p>
                                                            <p className="text-xs text-muted-foreground mt-1">Distance without cargo ÷ total distance (target ≤ {emptyBackhaulBenchmarkLabel})</p>
                                                        </div>
                                                        <div className="rounded-lg border bg-muted/30 p-4">
                                                            <p className="text-xs text-muted-foreground mb-1">Distance Mix</p>
                                                            <p className="text-sm font-semibold text-foreground">{distanceWithCargoLabel} km loaded</p>
                                                            <p className="text-xs text-muted-foreground mt-1">{distanceWithoutCargoLabel} km empty</p>
                                                            <p className="text-[11px] text-muted-foreground mt-1">Recent avg loaded: {recentAverageLoadedDistanceLabel}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 3: ROUTE */}
                                        <TabsContent value="route" className="flex-1 overflow-auto pr-1">
                                            <div className="grid grid-cols-1 gap-6 pb-4 md:grid-cols-2">
                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-purple-100 dark:bg-purple-900/30 rounded">
                                                            <Route className="h-3.5 w-3.5 text-purple-600" />
                                                        </div>
                                                        Distance Analysis
                                                    </h3>
                                                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">With Cargo</span>
                                                            <span className="font-semibold text-foreground break-words">{`${formatNumberDisplay(dwc)} km`}</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-purple-500 to-purple-600"
                                                                style={{width: `${Math.min(dwc / (totalDistance || 1) * 100, 100)}%`}}
                                                            ></div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm text-muted-foreground">Without Cargo</span>
                                                            <span className="font-semibold text-foreground break-words">{`${formatNumberDisplay(dwo)} km`}</span>
                                                        </div>
                                                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-gradient-to-r from-amber-500 to-amber-600"
                                                                style={{width: `${Math.min(dwo / (totalDistance || 1) * 100, 100)}%`}}
                                                            ></div>
                                                        </div>
                                                        <Separator />
                                                        <div className="flex justify-between items-center pt-2">
                                                            <span className="font-semibold text-foreground">Total Distance</span>
                                                            <span className="text-lg font-bold text-purple-600 break-words">{`${formatNumberDisplay(totalDistance)} km`}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-4">
                                                    <h3 className="font-semibold text-foreground flex items-center gap-2 text-sm">
                                                        <div className="p-1.5 bg-orange-100 dark:bg-orange-900/30 rounded">
                                                            <Fuel className="h-3.5 w-3.5 text-orange-600" />
                                                        </div>
                                                        Fuel Analysis
                                                    </h3>
                                                    <div className="space-y-4 p-4 bg-muted/30 rounded-lg border">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-2">Fuel Consumed</p>
                                                            <p className="text-3xl font-bold text-orange-600 break-words">{`${formatNumberDisplay(fil)} L`}</p>
                                                        </div>
                                                        <Separator />
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Efficiency Rate</p>
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-gradient-to-r from-green-500 to-green-600"
                                                                        style={{ width: `${Math.min(fuelEfficiency * 10, 100)}%` }}
                                                                    ></div>
                                                                </div>
                                                                <span className="text-sm font-semibold break-words">{`${formatNumberDisplay(fuelEfficiency)} km/L`}</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-muted-foreground mb-1">Fuel Cost</p>
                                                            <p className="text-lg font-semibold text-foreground break-words">{formatCurrencyDisplay(fib)}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </TabsContent>

                                        {/* TAB 4: ACTIVITY LOG */}
                                        <TabsContent value="activity" className="flex-1 overflow-auto pr-1">
                                            {activityLogs && activityLogs.length > 0 ? (
                                                <ActivityLogTable logs={activityLogs} />
                                            ) : (
                                                <div className="p-12 text-center">
                                                    <div className="inline-flex p-4 bg-muted/50 rounded-full mb-4">
                                                        <CheckCircle className="h-12 w-12 text-muted-foreground opacity-50" />
                                                    </div>
                                                    <p className="text-muted-foreground font-medium">No activity logged yet</p>
                                                    <p className="text-sm text-muted-foreground mt-1">Activity will appear here when actions are performed</p>
                                                </div>
                                            )}
                                        </TabsContent>
                                    </Tabs>
                                </CardContent>
                            </Card>

                            {operationInsights && (
                                <Card className="border shadow-sm">
                                    <CardHeader className="border-b bg-muted/30">
                                        <CardTitle className="flex items-center gap-2 text-base font-semibold">
                                            <div className="rounded-lg bg-indigo-100 p-2 dark:bg-indigo-900/30">
                                                <PieIcon className="h-5 w-5 text-indigo-600" />
                                            </div>
                                            Operation Context
                                        </CardTitle>
                                        <CardDescription>How this performance contributes to the overarching operation</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6 p-6">
                                        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,0.3fr)]">
                                            <div className="space-y-6">
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operation Progress</p>
                                                            <p className="mt-1 text-sm text-muted-foreground">Delivered tonnage against the planned volume</p>
                                                        </div>
                                                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-200">
                                                            {completionLabel}
                                                        </span>
                                                    </div>
                                                    <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 transition-all"
                                                            style={{ width: `${completionBarWidth}%` }}
                                                        />
                                                    </div>
                                                    <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.totalTonnage !== undefined ? formatNumberDisplay(operationOverview?.totalTonnage) : 'N/A'} MT</p>
                                                            <p className="mt-1">Delivered so far</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.remainingTonnage !== undefined ? formatNumberDisplay(operationOverview?.remainingTonnage) : 'N/A'} MT</p>
                                                            <p className="mt-1">Outstanding volume</p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/40 p-3">
                                                            <p className="font-semibold text-foreground">{operationOverview?.plannedVolume ? formatNumberDisplay(operationOverview.plannedVolume) : 'N/A'} MT</p>
                                                            <p className="mt-1">Original plan</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {operationEconomics && (
                                                    <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operation Economics</p>
                                                        <p className="mt-1 text-sm text-muted-foreground">How the overall contract performs financially</p>
                                                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Actual Revenue</p>
                                                                <p className="mt-1 text-lg font-semibold text-foreground">{operationRevenueLabel}</p>
                                                                <p className="mt-2 text-xs text-muted-foreground">Tariff × delivered ton-km</p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Cost per Ton-Km</p>
                                                                <p className="mt-1 text-lg font-semibold text-foreground">{operationCostPerTonKmLabel}</p>
                                                                <p className="mt-2 text-xs text-muted-foreground">Total operating cost spread across delivered ton-km</p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Gross Margin</p>
                                                                <div className="mt-1 flex items-baseline gap-2">
                                                                    <span className="text-lg font-semibold text-foreground">{operationGrossMarginValueLabel}</span>
                                                                    <span className={`text-xs font-semibold ${operationEconomics.grossMarginValue !== null && operationEconomics.grossMarginValue < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                                        {operationGrossMarginPercentLabel}
                                                                    </span>
                                                                </div>
                                                                <p className="mt-2 text-xs text-muted-foreground">Revenue less direct operating cost</p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Load & Empty Mix</p>
                                                                <div className="mt-1 space-y-1 text-sm font-semibold text-foreground">
                                                                    <p>Load factor: {operationLoadFactorLabel}</p>
                                                                    <p>Empty share: {operationEmptyShareLabel}</p>
                                                                </div>
                                                                <p className="mt-2 text-xs text-muted-foreground">Share of total distance achieved with cargo</p>
                                                            </div>
                                                        </div>
                                                        <Separator className="my-4" />
                                                        <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide">Delivered Ton-Km</p>
                                                                <p className="mt-1 text-sm font-semibold text-foreground">{operationTonKmLabel}</p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide">Planned Ton-Km</p>
                                                                <p className="mt-1 text-sm font-semibold text-foreground">{operationPlannedTonKmLabel}</p>
                                                            </div>
                                                            <div className="rounded-lg bg-muted/30 p-3">
                                                                <p className="text-[11px] uppercase tracking-wide">Ton-Km Completion</p>
                                                                <p className="mt-1 text-sm font-semibold text-foreground">{operationTonKmCompletionLabel}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Performance Contribution</p>
                                                    <div className="mt-4 space-y-4">
                                                        {[
                                                            {
                                                                label: 'Tonnage Share',
                                                                value: tonnageShareValue,
                                                                benchmark: tonnageShareBenchmark,
                                                                benchmarkLabel: 'Operation completion',
                                                                tooltip: 'Share of delivered tonnage vs planned operation tonnage',
                                                            },
                                                            {
                                                                label: 'Distance Share',
                                                                value: performanceShare?.distanceShare,
                                                                benchmark: distanceShareBenchmark,
                                                                benchmarkLabel: 'Tonnage share baseline',
                                                                tooltip: 'Share of contract distance executed by this FO compared to its tonnage share footprint',
                                                            },
                                                            {
                                                                label: 'Cost Share',
                                                                value: performanceShare?.costShare,
                                                                benchmark: costShareBenchmark,
                                                                benchmarkLabel: 'Tonnage share baseline',
                                                                tooltip: 'Share of contract operating cost consumed relative to tonnage footprint',
                                                            },
                                                            {
                                                                label: 'Plan Contribution',
                                                                value: performanceShare?.plannedContribution,
                                                                benchmark: planContributionBenchmark,
                                                                benchmarkLabel: 'Ton-km completion',
                                                                tooltip: 'Contribution towards planned ton-km output',
                                                            },
                                                        ].map((item) => {
                                                            const { diff, baseline } = calculateShareVariance(item.value, item.benchmark);
                                                            return (
                                                                <div key={item.label} className="space-y-2">
                                                                    <div className="flex items-center justify-between text-sm">
                                                                        <span className="text-muted-foreground" title={item.tooltip}>{item.label}</span>
                                                                        <span className="font-semibold text-foreground">{formatShareLabel(item.value)}</span>
                                                                    </div>
                                                                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                                                        <div
                                                                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-purple-700"
                                                                            style={{ width: `${Math.max(0, Math.min(item.value ?? 0, 100))}%` }}
                                                                        />
                                                                    </div>
                                                                    {diff !== null ? (
                                                                        <p className={`text-[11px] ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                            {diff >= 0 ? '+' : ''}{diff} pts {item.benchmarkLabel ? `vs ${item.benchmarkLabel}` : 'vs benchmark'}{baseline !== null ? ` (${formatShareLabel(baseline)})` : ''}
                                                                        </p>
                                                                    ) : (baseline !== null && item.benchmarkLabel) ? (
                                                                        <p className="text-[11px] text-muted-foreground">
                                                                            {item.benchmarkLabel}: {formatShareLabel(baseline)}
                                                                        </p>
                                                                    ) : null}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                    <div className="mt-4 grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">FO Tonnage</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                                {performanceShare?.tonnage !== undefined && performanceShare?.tonnage !== null
                                                                    ? `${formatNumberDisplay(performanceShare.tonnage)} MT`
                                                                    : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">FO Distance</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">
                                                                {performanceShare?.distance !== undefined && performanceShare?.distance !== null
                                                                    ? `${formatNumberDisplay(performanceShare.distance)} km`
                                                                    : 'N/A'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-lg bg-muted/30 p-3">
                                                            <p className="text-[11px] uppercase tracking-wide">FO Cost</p>
                                                            <p className="mt-1 text-sm font-semibold text-foreground">{formatCurrencyDisplay(performanceShare?.cost)}</p>
                                                            {performanceShare?.cost !== undefined && performanceShare?.cost !== null && operationEconomics?.totalCost
                                                                ? (
                                                                    <p className="text-[11px] text-muted-foreground mt-1">
                                                                        Share of contract cost: {formatShareLabel(operationEconomics.totalCost > 0 ? (performanceShare.cost / operationEconomics.totalCost) * 100 : null)}
                                                                    </p>
                                                                )
                                                                : null}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Operation Timeline</p>
                                                            <p className="mt-1 text-xs text-muted-foreground">Recent FO records for this operation</p>
                                                        </div>
                                                        <span className="text-xs text-muted-foreground">Last {timelineData.length} records</span>
                                                    </div>
                                                    <div className="mt-4 h-52">
                                                        {hasTimelineData ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <AreaChart data={timelineData} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
                                                                    <defs>
                                                                        <linearGradient id="performanceTonnage" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.6} />
                                                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                                                                        </linearGradient>
                                                                        <linearGradient id="performanceDistance" x1="0" y1="0" x2="0" y2="1">
                                                                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.4} />
                                                                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                                                        </linearGradient>
                                                                    </defs>
                                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.25)" />
                                                                    <XAxis dataKey="date" tick={{ fill: 'rgba(71, 85, 105, 0.9)', fontSize: 12 }} axisLine={false} tickLine={false} />
                                                                    <Tooltip
                                                                        cursor={{ fill: 'rgba(99, 102, 241, 0.08)' }}
                                                                        contentStyle={{
                                                                            backgroundColor: 'var(--background)',
                                                                            borderRadius: '0.75rem',
                                                                            border: '1px solid hsl(var(--border))',
                                                                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                                                                        }}
                                                                        formatter={(value, name, props) => {
                                                                            const foLabel = props?.payload?.foNumber ? `FO ${props.payload.foNumber}` : name;
                                                                            const suffix = name === 'Distance (km)' ? ' km' : name === 'Tonnage (MT)' ? ' MT' : '';
                                                                            const numericValue = typeof value === 'number' ? value : Number(value ?? 0);
                                                                            const formattedValue = formatNumberDisplay(Number.isFinite(numericValue) ? numericValue : null);
                                                                            return [`${formattedValue !== 'N/A' ? `${formattedValue}${suffix}` : 'N/A'}`, foLabel];
                                                                        }}
                                                                        labelFormatter={(_, payload) => {
                                                                            if (!payload || payload.length === 0) return '';
                                                                            const fo = payload[0]?.payload?.foNumber;
                                                                            return fo ? `FO ${fo}` : 'FO Number';
                                                                        }}
                                                                    />
                                                                    <Area type="monotone" dataKey="tonnage" name="Tonnage (MT)" stroke="#6366f1" strokeWidth={2} fill="url(#performanceTonnage)" />
                                                                    <Area type="monotone" dataKey="distance" name="Distance (km)" stroke="#22c55e" strokeWidth={2} fill="url(#performanceDistance)" />
                                                                </AreaChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                                No historical FO data
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-6">
                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">FO Performance Snapshot</p>
                                                    <div className="mt-3 space-y-3 text-sm">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Ton-KM</span>
                                                            <span className="font-semibold text-foreground">
                                                                {performanceShare?.tonKm !== undefined && performanceShare?.tonKm !== null
                                                                    ? `${formatNumberDisplay(performanceShare.tonKm)} ton-km`
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Cost Efficiency</span>
                                                            <span className="font-semibold text-foreground">
                                                                {Number.isFinite(costPerKm)
                                                                    ? `${formatNumberDisplay(costPerKm)} Birr/km`
                                                                    : 'N/A'}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-muted-foreground">Return Rate</span>
                                                            <span className="font-semibold text-foreground">{formatPercentDisplay(operationOverview?.totalTrips && operationOverview.totalTrips > 0 ? (operationOverview.completedTrips / operationOverview.totalTrips) * 100 : null)}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                            <span>Return delta vs target</span>
                                                            <span className={`font-semibold ${returnRateDelta !== null && returnRateDelta < 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                                {returnRateDelta !== null ? `${returnRateDelta >= 0 ? '+' : ''}${returnRateDelta.toFixed(1)} pts` : 'N/A'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/40">
                                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status Mix</p>
                                                    <div className="mt-4 h-48">
                                                        {hasStatusData ? (
                                                            <ResponsiveContainer width="100%" height="100%">
                                                                <PieChart>
                                                                    <Pie
                                                                        data={statusData}
                                                                        dataKey="value"
                                                                        nameKey="label"
                                                                        innerRadius={50}
                                                                        outerRadius={80}
                                                                        paddingAngle={4}
                                                                        stroke="none"
                                                                    >
                                                                        {statusData.map((entry, index) => (
                                                                            <Cell key={entry.label} fill={statusPalette[index % statusPalette.length]} />
                                                                        ))}
                                                                    </Pie>
                                                                    <Tooltip
                                                                        formatter={(value, name) => [`${value}`, name as string]}
                                                                        contentStyle={{
                                                                            backgroundColor: 'var(--background)',
                                                                            borderRadius: '0.75rem',
                                                                            border: '1px solid hsl(var(--border))',
                                                                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.15)',
                                                                        }}
                                                                    />
                                                                </PieChart>
                                                            </ResponsiveContainer>
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center rounded-lg bg-muted/40 text-sm text-muted-foreground">
                                                                No status distribution available
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                                                        {statusData.map((entry, index) => (
                                                            <div key={entry.label} className="flex items-center justify-between">
                                                                <div className="flex items-center gap-2">
                                                                    <span
                                                                        className="h-2.5 w-2.5 rounded-full"
                                                                        style={{ backgroundColor: statusPalette[index % statusPalette.length] }}
                                                                    />
                                                                    <span className="font-medium text-foreground">{entry.label}</span>
                                                                </div>
                                                                <span className="font-semibold text-foreground break-words">{formatNumberDisplay(entry.value, 0)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            )}
                        </div>

                        <div className="space-y-6">
                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Performance Snapshot</CardTitle>
                                    <CardDescription>Key metrics at a glance</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Distance</p>
                                                <div className="rounded-md bg-purple-100 p-1.5 dark:bg-purple-900/30">
                                                    <Route className="h-4 w-4 text-purple-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground break-words">{`${formatNumberDisplay(totalDistance)} km`}</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Ton-KM</p>
                                                <div className="rounded-md bg-cyan-100 p-1.5 dark:bg-cyan-900/30">
                                                    <Target className="h-4 w-4 text-cyan-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground break-words">{formatNumberDisplay(tonKm)}</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Total Cost</p>
                                                <div className="rounded-md bg-green-100 p-1.5 dark:bg-green-900/30">
                                                    <DollarSign className="h-4 w-4 text-green-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground break-words">{formatCurrencyDisplay(totalCost)}</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Fuel Efficiency</p>
                                                <div className="rounded-md bg-orange-100 p-1.5 dark:bg-orange-900/30">
                                                    <Fuel className="h-4 w-4 text-orange-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground break-words">{`${formatNumberDisplay(fuelEfficiency)} km/L`}</p>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3 sm:col-span-2">
                                            <div className="flex items-center justify-between">
                                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Cost per KM</p>
                                                <div className="rounded-md bg-blue-100 p-1.5 dark:bg-blue-900/30">
                                                    <BarChart3 className="h-4 w-4 text-blue-600" />
                                                </div>
                                            </div>
                                            <p className="mt-2 text-lg font-semibold text-foreground break-words">{`${formatNumberDisplay(costPerKm)} Birr/km`}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Operational Relationships</CardTitle>
                                    <CardDescription>Entity map for this performance record</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5 text-sm">
                                    <div className="space-y-3">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Operation Record</p>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-purple-100 p-2 dark:bg-purple-900/30">
                                                    <Building2 className="h-4 w-4 text-purple-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <p className="font-medium text-foreground">
                                                            {operationRef?.operationid ?? 'No operation linked'}
                                                        </p>
                                                        {operationLink && (
                                                            <Link
                                                                href={operationLink}
                                                                className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 transition-colors hover:text-purple-700"
                                                            >
                                                                View operation
                                                                <ExternalLink className="h-3 w-3" />
                                                            </Link>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">
                                                        {operationRef?.customer?.name
                                                            ? `Customer: ${operationRef.customer.name}`
                                                            : 'Attach a customer to improve reporting'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 font-medium dark:bg-slate-900/40">
                                                    <MapPin className="h-3 w-3" />
                                                    {originName} → {destinationName}
                                                </span>
                                                <span className="inline-flex items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 font-medium dark:bg-slate-900/40">
                                                    <Route className="h-3 w-3" />
                                                    {distanceMixLabel}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-blue-100 p-2 dark:bg-blue-900/30">
                                                    <User className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Driver</p>
                                                    {driver?.name ? (
                                                        driver.id ? (
                                                            <Link
                                                                href={`/drivers/${driver.id}`}
                                                                className="font-medium text-foreground transition-colors hover:text-primary"
                                                            >
                                                                {driver.name}
                                                            </Link>
                                                        ) : (
                                                            <p className="font-medium text-foreground">{driver.name}</p>
                                                        )
                                                    ) : (
                                                        <p className="font-medium text-foreground">Unassigned driver</p>
                                                    )}
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        {driver?.phone && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3" />
                                                                {driver.phone}
                                                            </div>
                                                        )}
                                                        {driver?.license && (
                                                            <div className="flex items-center gap-1">
                                                                <FileText className="h-3 w-3" />
                                                                License: {driver.license}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-lg border bg-muted/40 p-3">
                                            <div className="flex items-start gap-3">
                                                <div className="rounded-md bg-amber-100 p-2 dark:bg-amber-900/30">
                                                    <Truck className="h-4 w-4 text-amber-600" />
                                                </div>
                                                <div className="min-w-0 space-y-1">
                                                    <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Truck</p>
                                                    {truck?.plate ? (
                                                        truck.id ? (
                                                            <Link
                                                                href={`/trucks/${truck.id}`}
                                                                className="font-medium text-foreground transition-colors hover:text-primary"
                                                            >
                                                                {truck.plate}
                                                            </Link>
                                                        ) : (
                                                            <p className="font-medium text-foreground">{truck.plate}</p>
                                                        )
                                                    ) : (
                                                        <p className="font-medium text-foreground">Unassigned truck</p>
                                                    )}
                                                    <div className="space-y-1 text-xs text-muted-foreground">
                                                        {truck?.model && <p>Model: {truck.model}</p>}
                                                        {truckCapacity > 0 && <p>Capacity: {truckCapacity} MT</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <Separator />
                                    <div className="space-y-3 text-xs text-muted-foreground">
                                        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Lifecycle Checkpoints</p>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Calendar className="h-3.5 w-3.5 text-purple-600" />
                                                Dispatch
                                            </span>
                                            <span className="font-medium text-foreground">{dispatchDateLabel}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                                Return
                                            </span>
                                            <span className="font-medium text-foreground">
                                                {performance.is_returned ? returnedDateLabel : 'Pending return'}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between text-foreground">
                                            <span className="flex items-center gap-2 text-foreground">
                                                <Route className="h-3.5 w-3.5 text-blue-600" />
                                                Distance Mix
                                            </span>
                                            <span className="font-medium text-foreground">{distanceMixLabel}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
                                    <CardDescription>Download or share this record</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col gap-2">
                                    <Button variant="secondary" className="w-full justify-start gap-2">
                                        <Download className="h-4 w-4" />
                                        Export Report
                                    </Button>
                                    <Button variant="outline" className="w-full justify-start gap-2">
                                        <Printer className="h-4 w-4" />
                                        Print View
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3">
                        <Link href={`/performances/${performance.id}/edit`}>
                            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                                <Edit2 className="h-4 w-4" />
                                Edit Performance
                            </Button>
                        </Link>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(true)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200 hover:border-red-300 gap-2"
                        >
                            <Trash2 className="h-4 w-4" />
                            Delete
                        </Button>
                    </div>
                </div>

                {/* Delete Confirmation Dialog */}
                <DeleteConfirmationDialog
                    open={deleteDialogOpen}
                    onOpenChange={setDeleteDialogOpen}
                    onConfirm={() => {
                        window.location.href = `/performances/${performance.id}?_method=DELETE`;
                    }}
                    title="Delete Performance Record"
                    description={`Are you sure you want to delete performance record "${foNumber}"? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}

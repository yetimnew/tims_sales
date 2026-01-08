import { useMemo, useState } from 'react';
import { router } from '@inertiajs/react';
import type { BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Activity, BarChart3, CircleDollarSign, GaugeCircle, Layers, ShieldCheck } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import { formatCurrency, formatDecimal, formatInteger, formatPercentage, getFinancialTone, getMarginChipClass } from '@/components/reports/formatters';
import type { ReportSelectionOption } from '@/components/reports/types';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';
import { ReportPageLayout } from '@/components/report/report-page-layout';

type QueryParamValue = string | number | boolean | null | undefined | Array<string | number | boolean>;

interface TruckOption {
    id: number;
    plate: string;
}

interface VehicleTypeOption {
    id: number;
    name: string;
}

interface ReportRow {
    truck_id: number | null;
    plate: string;
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
    truck_status?: string | null;
    vehicle_type?: string | null;
}

interface ReportSummary {
    trips: number;
    tonnage: number;
    ton_km: number;
    distance_wc: number;
    distance_wo: number;
    distance_total: number;
    fuel_litres: number;
    fuel_cost: number;
    perdiem: number;
    work_on_going: number;
    other_cost: number;
    expense: number;
    revenue: number;
    profit: number;
    margin_percent: number | null;
}

interface Filters {
    from: string;
    to: string;
    truck_ids?: number[];
    vehicle_type_ids?: number[];
    statuses?: string[];
}

interface PerformanceByTruckProps {
    filters: Filters;
    rows: ReportRow[];
    summary: ReportSummary;
    trucks: TruckOption[];
    vehicleTypes: VehicleTypeOption[];
    statuses: string[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/performance-by-truck' },
    { title: 'Performance by Truck', href: '/reports/performance-by-truck' },
];

const formatStatusLabel = (value: string) =>
    value
        .split(/[_\s-]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

const getStatusBadgeClass = (status: string): string => {
    const normalized = status.toLowerCase();

    if (normalized === 'active') {
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-200';
    }

    if (normalized === 'inactive' || normalized === 'maintenance') {
        return 'bg-slate-200 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200';
    }

    return 'bg-slate-100 text-slate-600 dark:bg-slate-800/80 dark:text-slate-200';
};

const convertStatusesToIds = (statusValues: string[] | undefined, universe: string[]): number[] => {
    if (!Array.isArray(statusValues) || statusValues.length === 0) {
        return [];
    }

    return statusValues
        .map((status) => {
            const index = universe.indexOf(status);

            if (index === -1) {
                return null;
            }

            return index + 1;
        })
        .filter((value): value is number => typeof value === 'number');
};

const convertIdsToStatuses = (ids: number[], universe: string[]): string[] => {
    if (!Array.isArray(ids) || ids.length === 0) {
        return [];
    }

    return ids
        .map((id) => universe[id - 1])
        .filter((status): status is string => typeof status === 'string');
};

export default function PerformanceByTruck({ filters, rows = [], summary, trucks, vehicleTypes, statuses }: PerformanceByTruckProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.performance-by-truck.export');
    const {
        from,
        to,
        dateError,
        validateDateRange,
        handleDateChange: handleDateRangeChange,
        resetDateRange,
    } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [selectedTrucks, setSelectedTrucks] = useState<number[]>(filters?.truck_ids ?? []);
    const [selectedVehicleTypes, setSelectedVehicleTypes] = useState<number[]>(filters?.vehicle_type_ids ?? []);
    const [selectedStatusIds, setSelectedStatusIds] = useState<number[]>(() => convertStatusesToIds(filters?.statuses, statuses));
    const [filtersOpen, setFiltersOpen] = useState(false);

    const safeRows = Array.isArray(rows) ? rows : [];

    const truckSelectionOptions = useMemo<ReportSelectionOption[]>(
        () => trucks.map((option) => ({ id: option.id, label: option.plate ?? 'Unassigned' })),
        [trucks],
    );

    const vehicleTypeSelectionOptions = useMemo<ReportSelectionOption[]>(
        () => vehicleTypes.map((option) => ({ id: option.id, label: option.name ?? 'Unassigned' })),
        [vehicleTypes],
    );

    const statusSelectionOptions = useMemo<ReportSelectionOption[]>(
        () =>
            statuses.map((status, index) => ({
                id: index + 1,
                label: formatStatusLabel(status),
                description: status,
            })),
        [statuses],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if (selectedTrucks.length > 0) count += 1;
        if (selectedVehicleTypes.length > 0) count += 1;
        if (selectedStatusIds.length > 0) count += 1;

        return count;
    }, [from, to, selectedTrucks, selectedVehicleTypes, selectedStatusIds, filters?.from, filters?.to]);

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);
        const params: Record<string, QueryParamValue> = {};

        if (from) params.from = from;
        if (to) params.to = to;
        if (selectedTrucks.length > 0) params.truck_ids = selectedTrucks;
        if (selectedVehicleTypes.length > 0) params.vehicle_type_ids = selectedVehicleTypes;

        const statusValues = convertIdsToStatuses(selectedStatusIds, statuses);
        if (statusValues.length > 0) params.statuses = statusValues;

        router.get('/reports/performance-by-truck', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleReset = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedTrucks(filters?.truck_ids ?? []);
        setSelectedVehicleTypes(filters?.vehicle_type_ids ?? []);
        setSelectedStatusIds(convertStatusesToIds(filters?.statuses, statuses));
        setFiltersOpen(false);
        router.get('/reports/performance-by-truck', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!validateDateRange(from, to)) {
            return;
        }

        if (!canExport) {
            return;
        }

        const params = new URLSearchParams();

        if (from) params.set('from', from);
        if (to) params.set('to', to);

        if (selectedTrucks.length > 0) {
            selectedTrucks.forEach((truckId) => {
                params.append('truck_ids[]', String(truckId));
            });
        }

        if (selectedVehicleTypes.length > 0) {
            selectedVehicleTypes.forEach((typeId) => {
                params.append('vehicle_type_ids[]', String(typeId));
            });
        }

        const statusValues = convertIdsToStatuses(selectedStatusIds, statuses);
        if (statusValues.length > 0) {
            statusValues.forEach((status) => {
                params.append('statuses[]', status);
            });
        }

        const query = params.toString();
        const url = `/reports/performance-by-truck/export/${format}${query ? `?${query}` : ''}`;
        window.location.href = url;
    };

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total Trips',
                value: formatInteger(summary?.trips ?? safeRows.length),
                icon: Activity,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Tonnage (MT)',
                value: formatDecimal(summary?.tonnage ?? 0),
                icon: BarChart3,
                tone: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200',
            },
            {
                label: 'Fleet Revenue',
                value: formatCurrency(summary?.revenue ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-200',
            },
            {
                label: 'Net Margin',
                value: `${formatCurrency(summary?.profit ?? 0)} · ${formatPercentage(summary?.margin_percent ?? null)}`,
                icon: GaugeCircle,
                tone: 'bg-teal-100 text-teal-600 dark:bg-teal-500/20 dark:text-teal-200',
            },
        ],
        [safeRows.length, summary?.margin_percent, summary?.profit, summary?.revenue, summary?.tonnage, summary?.trips],
    );

    const appliedFrom = filters?.from ?? '';
    const appliedTo = filters?.to ?? '';
    const appliedTruckCount = filters?.truck_ids?.length ?? 0;
    const appliedVehicleTypeCount = filters?.vehicle_type_ids?.length ?? 0;
    const appliedStatusCount = filters?.statuses?.length ?? 0;

    const filterBadges = useMemo(
        () => [
            `From ${appliedFrom || '—'}`,
            `To ${appliedTo || '—'}`,
            appliedTruckCount > 0 ? `${appliedTruckCount} truck${appliedTruckCount > 1 ? 's' : ''}` : 'All trucks',
            appliedVehicleTypeCount > 0
                ? `${appliedVehicleTypeCount} vehicle type${appliedVehicleTypeCount > 1 ? 's' : ''}`
                : 'All vehicle types',
            appliedStatusCount > 0 ? `${appliedStatusCount} status${appliedStatusCount > 1 ? 'es' : ''}` : 'All statuses',
        ],
        [appliedFrom, appliedStatusCount, appliedTo, appliedTruckCount, appliedVehicleTypeCount],
    );

    const summaryMargin = summary?.margin_percent ?? null;

    return (
        <ReportPageLayout
            title="Performance by Truck"
            breadcrumbs={breadcrumbs}
            icon={<BarChart3 className="h-6 w-6" />}
            filters={
                <ReportFiltersDialog
                    open={filtersOpen}
                    onOpenChange={setFiltersOpen}
                    activeFilterCount={activeFilterCount}
                    from={from}
                    to={to}
                    onDateChange={handleDateRangeChange}
                    dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                    onReset={handleReset}
                    onApply={handleApplyFilters}
                    truckOptions={truckSelectionOptions}
                    selectedTrucks={selectedTrucks}
                    onTrucksChange={setSelectedTrucks}
                    operationOptions={vehicleTypeSelectionOptions}
                    selectedOperations={selectedVehicleTypes}
                    onOperationsChange={setSelectedVehicleTypes}
                    destinationOptions={statusSelectionOptions}
                    selectedDestinations={selectedStatusIds}
                    onDestinationsChange={setSelectedStatusIds}
                    showLimit={false}
                    showDriverFilter={false}
                    showTruckFilter
                    showOperationFilter={vehicleTypeSelectionOptions.length > 0}
                    showDestinationFilter={statusSelectionOptions.length > 0}
                    dateError={dateError}
                    title="Filter performance by truck"
                    description="Adjust the reporting window and focus on specific trucks, vehicle types, or statuses before generating the report."
                    truckFilterText={{ searchPlaceholder: 'Search plate...' }}
                    operationFilterText={{
                        label: 'Vehicle types',
                        triggerLabelWhenAll: 'All vehicle types',
                        summaryLabelWhenAll: 'All vehicle types included',
                        heading: 'Vehicle types',
                        searchPlaceholder: 'Search vehicle type...',
                        emptyMessage: 'No vehicle types found.',
                        icon: Layers,
                    }}
                    destinationFilterText={{
                        label: 'Statuses',
                        triggerLabelWhenAll: 'All statuses',
                        summaryLabelWhenAll: 'All statuses included',
                        heading: 'Truck statuses',
                        searchPlaceholder: 'Search status...',
                        emptyMessage: 'No statuses found.',
                        icon: ShieldCheck,
                    }}
                />
            }
            summarySection={<ReportSummaryGrid items={summaryItems} />}
            onRefresh={handleReset}
            onExportPdf={() => handleExport('pdf')}
            onExportExcel={() => handleExport('xlsx')}
            onExportCsv={() => handleExport('csv')}
            canExport={canExport}
            contentClassName="p-0"
        >
            <div className="space-y-4 p-6">
                <Card className="border border-slate-200 bg-slate-50/50 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                    <CardHeader className="space-y-3 border-b border-slate-200/60 pb-5 dark:border-slate-700/60">
                        <div className="space-y-1">
                            <CardTitle className="text-lg font-semibold text-slate-900 dark:text-slate-50">Truck Performance Detail</CardTitle>
                            <CardDescription className="text-sm">Revenue, expense, and utilisation metrics per truck.</CardDescription>
                            {filterBadges.length > 0 && (
                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                    {filterBadges.map((badge) => (
                                        <Badge key={badge} variant="outline">
                                            {badge}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader className="bg-slate-50/60 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/60 dark:text-slate-400">
                                        <TableRow className="divide-x divide-slate-200/40 dark:divide-slate-800/50">
                                            <TableHead className="whitespace-nowrap">Plate</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Trips</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Tonnage (MT)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Ton-KM</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WC)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Distance (WO)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Distance</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel (L)</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Fuel Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Perdiem</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Work Ongoing</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Other Cost</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Total Expense</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Revenue</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Profit</TableHead>
                                            <TableHead className="whitespace-nowrap text-right">Margin %</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {safeRows.length > 0 ? (
                                            safeRows.map((row) => {
                                                const marginValue = row.margin_percent ?? null;
                                                const profitTone = getFinancialTone(row.profit);

                                                return (
                                                    <TableRow
                                                        key={`${row.truck_id}-${row.plate}`}
                                                        className="divide-x divide-slate-200/40 odd:bg-white even:bg-slate-50/40 hover:bg-slate-100/60 dark:divide-slate-800/50 dark:odd:bg-slate-900/40 dark:even:bg-slate-900/20 dark:hover:bg-slate-800/50"
                                                    >
                                                        <TableCell className="min-w-[160px] space-y-1 text-left align-top">
                                                            <span className="block text-sm font-semibold text-slate-800 dark:text-slate-50">{row.plate}</span>
                                                            {(row.vehicle_type || row.truck_status) && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {row.vehicle_type && (
                                                                        <Badge variant="secondary" className="text-xs font-medium bg-slate-100 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                                                                            {row.vehicle_type}
                                                                        </Badge>
                                                                    )}
                                                                    {row.truck_status && (
                                                                        <Badge className={`text-xs font-medium ${getStatusBadgeClass(row.truck_status)}`}>
                                                                            {formatStatusLabel(row.truck_status)}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatInteger(row.trips)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.tonnage)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.ton_km)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wc)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_wo)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.distance_total)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatDecimal(row.fuel_litres)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.fuel_cost)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.perdiem)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.work_on_going)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.other_cost)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.expense)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right text-sm text-slate-700 dark:text-slate-100">{formatCurrency(row.revenue)}</TableCell>
                                                        <TableCell className={`whitespace-nowrap text-right text-sm font-semibold ${profitTone}`}>{formatCurrency(row.profit)}</TableCell>
                                                        <TableCell className="whitespace-nowrap text-right">
                                                            {marginValue === null ? (
                                                                <span className="text-sm text-muted-foreground">—</span>
                                                            ) : (
                                                                <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(marginValue)}`}>
                                                                    {formatPercentage(marginValue)}
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={16} className="py-10 text-center text-muted-foreground">
                                                    No data for the selected filters. Adjust your filters and generate the report again.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                    {safeRows.length > 0 && (
                                        <TableFooter>
                                            <TableRow className="divide-x divide-slate-200/60 bg-slate-100/80 font-semibold dark:divide-slate-800/50 dark:bg-slate-900/60">
                                                <TableCell>Total</TableCell>
                                                <TableCell className="text-right">{formatInteger(summary?.trips ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.tonnage ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.ton_km ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wc ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_wo ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.distance_total ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatDecimal(summary?.fuel_litres ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.fuel_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.perdiem ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.work_on_going ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.other_cost ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.expense ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(summary?.revenue ?? 0)}</TableCell>
                                                <TableCell className={`text-right ${getFinancialTone(summary?.profit ?? 0)}`}>{formatCurrency(summary?.profit ?? 0)}</TableCell>
                                                <TableCell className="text-right">
                                                    {summaryMargin === null ? (
                                                        <span className="text-sm text-muted-foreground">—</span>
                                                    ) : (
                                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ${getMarginChipClass(summaryMargin)}`}>
                                                            {formatPercentage(summaryMargin)}
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    )}
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
            </div>
        </ReportPageLayout>
    );
}









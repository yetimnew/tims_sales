import { useMemo, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ReportFiltersDialog } from '@/components/reports/report-filters-dialog';
import { ReportSummaryGrid, type ReportSummaryItem } from '@/components/reports/report-summary-grid';
import type { ReportSelectionOption } from '@/components/reports/types';
import { formatCurrency, formatInteger } from '@/components/reports/formatters';
import { AlertTriangle, CircleDollarSign, Download, Filter, ShieldAlert, Users } from 'lucide-react';
import { usePermissions } from '@/hooks/use-permissions';
import { REPORT_DATE_RANGE_DESCRIPTION, useReportDateRange } from '@/components/reports/use-report-date-range';

interface DriverOption {
    id: number;
    name: string;
}

interface NamedOption {
    value: string;
    label: string;
}

interface DriverSafetySummary {
    total_incidents: number;
    critical_incidents: number;
    major_incidents: number;
    minor_incidents: number;
    incident_type_variants: number;
    drivers_affected: number;
    total_damage_cost: number;
    average_damage_cost: number;
    days_since_last_incident: number | null;
}

interface SeverityBreakdownRow {
    severity: string;
    label: string;
    total: number;
    damage_cost_total: number;
}

interface IncidentTypeBreakdownRow {
    incident_type: string;
    label: string;
    total: number;
    critical_incidents: number;
    major_incidents: number;
    minor_incidents: number;
    damage_cost_total: number;
}

interface DriverLeaderboardRow {
    driver_id: number;
    driver_name: string;
    total: number;
    critical_incidents: number;
    major_incidents: number;
    minor_incidents: number;
    damage_cost_total: number;
}

interface TrendSeries {
    labels: string[];
    incidents: number[];
    damage_costs: number[];
}

interface PersonRef {
    id: number;
    name: string;
}

interface RecentIncidentRow {
    id: number;
    incident_date?: string | null;
    incident_type?: string | null;
    severity?: string | null;
    description?: string | null;
    location?: string | null;
    damage_cost?: number | null;
    resolution?: string | null;
    driver?: PersonRef | null;
    reported_by?: PersonRef | null;
    safety_score_impact?: number | null;
}

interface DriverSafetyReportProps {
    filters: {
        from: string;
        to: string;
        driver_ids?: number[];
        incident_types?: string[];
        severities?: string[];
    };
    summary: DriverSafetySummary;
    severityBreakdown: SeverityBreakdownRow[];
    incidentTypeBreakdown: IncidentTypeBreakdownRow[];
    driverLeaderboard: DriverLeaderboardRow[];
    trend: TrendSeries;
    recentIncidents: RecentIncidentRow[];
    options: {
        drivers: DriverOption[];
        incident_types: NamedOption[];
        severities: NamedOption[];
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Reports', href: '/reports/maintenance' },
    { title: 'Driver Safety', href: '/reports/driver-safety' },
];

export default function DriverSafetyReport({
    filters,
    summary,
    severityBreakdown,
    incidentTypeBreakdown,
    driverLeaderboard,
    trend,
    recentIncidents,
    options,
}: DriverSafetyReportProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('reports.driver-safety.export');

    const [filtersOpen, setFiltersOpen] = useState(false);
    const { from, to, dateError, handleDateChange, validateDateRange, resetDateRange } = useReportDateRange(filters?.from ?? '', filters?.to ?? '');
    const [selectedDrivers, setSelectedDrivers] = useState<number[]>(filters?.driver_ids ?? []);
    const [selectedIncidentTypes, setSelectedIncidentTypes] = useState<string[]>(filters?.incident_types ?? []);
    const [selectedSeverities, setSelectedSeverities] = useState<string[]>(filters?.severities ?? []);

    const driverOptions: ReportSelectionOption[] = useMemo(
        () => (options?.drivers ?? []).map((driver) => ({ id: driver.id, label: driver.name ?? `Driver #${driver.id}` })),
        [options?.drivers],
    );

    const incidentTypeOptions: ReportSelectionOption[] = useMemo(
        () => (options?.incident_types ?? []).map((option) => ({ id: option.value, label: option.label })),
        [options?.incident_types],
    );

    const severityOptions: ReportSelectionOption[] = useMemo(
        () => (options?.severities ?? []).map((option) => ({ id: option.value, label: option.label })),
        [options?.severities],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;

        if (from && from !== (filters?.from ?? '')) count += 1;
        if (to && to !== (filters?.to ?? '')) count += 1;
        if ((selectedDrivers ?? []).length > 0) count += 1;
        if ((selectedIncidentTypes ?? []).length > 0) count += 1;
        if ((selectedSeverities ?? []).length > 0) count += 1;

        return count;
    }, [from, to, selectedDrivers, selectedIncidentTypes, selectedSeverities, filters?.from, filters?.to]);

    const handleApplyFilters = () => {
        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        setFiltersOpen(false);

        const params: Record<string, unknown> = {
            from,
            to,
        };

        if (selectedDrivers.length > 0) {
            params['driver_ids'] = selectedDrivers;
        }

        if (selectedIncidentTypes.length > 0) {
            params['incident_types'] = selectedIncidentTypes;
        }

        if (selectedSeverities.length > 0) {
            params['severities'] = selectedSeverities;
        }

        router.get('/reports/driver-safety', params, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const handleResetFilters = () => {
        resetDateRange(filters?.from ?? '', filters?.to ?? '');
        setSelectedDrivers(filters?.driver_ids ?? []);
        setSelectedIncidentTypes(filters?.incident_types ?? []);
        setSelectedSeverities(filters?.severities ?? []);
        setFiltersOpen(false);
        router.get('/reports/driver-safety', {}, { preserveState: false, preserveScroll: true });
    };

    const handleExport = (format: 'csv' | 'xlsx' | 'pdf') => {
        if (!canExport) {
            return;
        }

        if (!validateDateRange(from, to)) {
            setFiltersOpen(true);

            return;
        }

        const params = new URLSearchParams();
        if (from) params.set('from', from);
        if (to) params.set('to', to);
        selectedDrivers.forEach((driverId) => params.append('driver_ids[]', String(driverId)));
        selectedIncidentTypes.forEach((value) => params.append('incident_types[]', value));
        selectedSeverities.forEach((value) => params.append('severities[]', value));

        window.location.href = `/reports/driver-safety/export/${format}${params.toString() ? `?${params.toString()}` : ''}`;
    };

    const summaryItems = useMemo<ReportSummaryItem[]>(
        () => [
            {
                label: 'Total incidents',
                value: formatInteger(summary?.total_incidents ?? 0),
                icon: ShieldAlert,
                tone: 'bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-200',
            },
            {
                label: 'Critical incidents',
                value: formatInteger(summary?.critical_incidents ?? 0),
                icon: AlertTriangle,
                tone: 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-200',
            },
            {
                label: 'Drivers affected',
                value: formatInteger(summary?.drivers_affected ?? 0),
                icon: Users,
                tone: 'bg-sky-100 text-sky-600 dark:bg-sky-500/20 dark:text-sky-200',
            },
            {
                label: 'Total damage cost',
                value: formatCurrency(summary?.total_damage_cost ?? 0),
                icon: CircleDollarSign,
                tone: 'bg-purple-100 text-purple-600 dark:bg-purple-500/20 dark:text-purple-200',
            },
        ],
        [summary?.total_incidents, summary?.critical_incidents, summary?.drivers_affected, summary?.total_damage_cost],
    );

    const averageDamageText = useMemo(() => formatCurrency(summary?.average_damage_cost ?? 0), [summary?.average_damage_cost]);

    const daysSinceLastIncidentText = useMemo(() => {
        if (summary?.days_since_last_incident === null || typeof summary?.days_since_last_incident === 'undefined') {
            return '—';
        }

        const value = summary.days_since_last_incident;
        if (value < 0) {
            return `${Math.abs(value)} days ahead`;
        }

        if (value === 0) {
            return '0 days (today)';
        }

        return `${value} days ago`;
    }, [summary?.days_since_last_incident]);

    const safeSeverityBreakdown = Array.isArray(severityBreakdown) ? severityBreakdown : [];
    const safeIncidentTypeBreakdown = Array.isArray(incidentTypeBreakdown) ? incidentTypeBreakdown : [];
    const safeDriverLeaderboard = Array.isArray(driverLeaderboard) ? driverLeaderboard : [];
    const safeTrend = trend ?? { labels: [], incidents: [], damage_costs: [] };
    const safeRecentIncidents = Array.isArray(recentIncidents) ? recentIncidents : [];

    return (
        <AppLayout title="Driver Safety Report" breadcrumbs={breadcrumbs}>
            <Head title="Driver Safety Report" />
            <div className="flex items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Driver Safety Report</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Monitor incident trends, severity mix, and driver exposure across the reporting window.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {canExport ? (
                        <Button type="button" variant="outline" onClick={() => handleExport('xlsx')} className="gap-2">
                            <Download className="h-4 w-4" />
                            Export XLSX
                        </Button>
                    ) : null}
                    <Button type="button" variant="outline" onClick={() => setFiltersOpen(true)} className="gap-2">
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </div>
            </div>

            <ReportSummaryGrid className="mt-8" items={summaryItems} />

            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Incident trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Period</TableHead>
                                        <TableHead className="text-right">Incidents</TableHead>
                                        <TableHead className="text-right">Damage cost</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {safeTrend.labels.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">
                                                No trend data in the selected window.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        safeTrend.labels.map((label, index) => (
                                            <TableRow key={label}>
                                                <TableCell>{label}</TableCell>
                                                <TableCell className="text-right">{formatInteger(safeTrend.incidents[index] ?? 0)}</TableCell>
                                                <TableCell className="text-right">{formatCurrency(safeTrend.damage_costs[index] ?? 0)}</TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Highlights</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Average damage</span>
                            <span className="text-slate-900 dark:text-white">{averageDamageText}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Incident categories</span>
                            <span className="text-slate-900 dark:text-white">{formatInteger(summary?.incident_type_variants ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Days since last incident</span>
                            <span className="text-slate-900 dark:text-white">{daysSinceLastIncidentText}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Major incidents</span>
                            <span className="text-slate-900 dark:text-white">{formatInteger(summary?.major_incidents ?? 0)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Minor incidents</span>
                            <span className="text-slate-900 dark:text-white">{formatInteger(summary?.minor_incidents ?? 0)}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Severity breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="text-right">Incidents</TableHead>
                                    <TableHead className="text-right">Damage cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeSeverityBreakdown.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center text-muted-foreground">
                                            No incidents recorded.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeSeverityBreakdown.map((row) => (
                                        <TableRow key={row.severity ?? row.label}>
                                            <TableCell className="capitalize">{row.label}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.total)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.damage_cost_total)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Incident type breakdown</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Incident type</TableHead>
                                    <TableHead className="text-right">Total</TableHead>
                                    <TableHead className="text-right">Critical</TableHead>
                                    <TableHead className="text-right">Major</TableHead>
                                    <TableHead className="text-right">Minor</TableHead>
                                    <TableHead className="text-right">Damage cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeIncidentTypeBreakdown.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No incident detail available.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeIncidentTypeBreakdown.map((row) => (
                                        <TableRow key={row.incident_type ?? row.label}>
                                            <TableCell className="capitalize">{row.label}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.total)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.critical_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.major_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.minor_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.damage_cost_total)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Driver exposure</CardTitle>
                    </CardHeader>
                    <CardContent className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Driver</TableHead>
                                    <TableHead className="text-right">Incidents</TableHead>
                                    <TableHead className="text-right">Critical</TableHead>
                                    <TableHead className="text-right">Major</TableHead>
                                    <TableHead className="text-right">Minor</TableHead>
                                    <TableHead className="text-right">Damage cost</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeDriverLeaderboard.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground">
                                            No drivers with incidents in this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeDriverLeaderboard.map((row) => (
                                        <TableRow key={row.driver_id}>
                                            <TableCell>{row.driver_name}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.total)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.critical_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.major_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatInteger(row.minor_incidents)}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.damage_cost_total)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-semibold">Recent incidents</CardTitle>
                    </CardHeader>
                    <CardContent className="max-h-[420px] overflow-y-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Driver</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Severity</TableHead>
                                    <TableHead className="text-right">Damage</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeRecentIncidents.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                                            No incidents in the selected period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    safeRecentIncidents.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>{row.incident_date ?? '—'}</TableCell>
                                            <TableCell>{row.driver?.name ?? 'Unassigned'}</TableCell>
                                            <TableCell className="capitalize">{row.incident_type ?? '—'}</TableCell>
                                            <TableCell className="capitalize">{row.severity ?? '—'}</TableCell>
                                            <TableCell className="text-right">{formatCurrency(row.damage_cost ?? 0)}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            <ReportFiltersDialog
                open={filtersOpen}
                onOpenChange={setFiltersOpen}
                activeFilterCount={activeFilterCount}
                from={from}
                to={to}
                onDateChange={handleDateChange}
                onReset={handleResetFilters}
                onApply={handleApplyFilters}
                dateError={dateError}
                dateRangeDescription={REPORT_DATE_RANGE_DESCRIPTION}
                selectedDrivers={selectedDrivers}
                onDriversChange={(ids) => setSelectedDrivers(ids)}
                driverOptions={driverOptions}
                selectedStatuses={selectedIncidentTypes}
                onStatusesChange={(values) => setSelectedIncidentTypes(values.map((value) => String(value)))}
                statusOptions={incidentTypeOptions}
                statusFilterText={{
                    label: 'Incident types',
                    triggerLabelWhenAll: 'All incident types',
                    summaryLabelWhenAll: 'All incident types included',
                    heading: 'Incident types',
                    searchPlaceholder: 'Search incident type...',
                }}
                selectedProviders={selectedSeverities}
                onProvidersChange={(values) => setSelectedSeverities(values.map((value) => String(value)))}
                providerOptions={severityOptions}
                providerFilterText={{
                    label: 'Severities',
                    triggerLabelWhenAll: 'All severities',
                    summaryLabelWhenAll: 'All severities included',
                    heading: 'Severities',
                    searchPlaceholder: 'Search severity...',
                }}
                showTruckFilter={false}
                showOperationFilter={false}
                showDestinationFilter={false}
                showStatusFilter={incidentTypeOptions.length > 0}
                showProviderFilter={severityOptions.length > 0}
                title="Filter driver safety data"
                description="Adjust the reporting window and filter by driver, incident type, or severity."
            />
        </AppLayout>
    );
}

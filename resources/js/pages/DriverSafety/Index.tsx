import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { toast } from '@/hooks/use-toast';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import {
    Plus,
    Eye,
    Edit,
    Search,
    Trash2,
    ShieldAlert,
    AlertTriangle,
    Megaphone,
    DollarSign,
    ChevronRight,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Driver Safety',
        href: '/driver-safety',
    },
];

interface DriverSummary {
    id: number;
    name: string;
}

interface SafetyRecord {
    id: number;
    driver_id: number;
    incident_date: string;
    incident_type: string;
    severity: string;
    description: string;
    damage_cost?: number | null;
    location?: string | null;
    driver?: DriverSummary | null;
}

interface DriverSafetyIndexProps {
    safetyRecords: {
        data: SafetyRecord[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
        per_page?: number | null;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    metrics: {
        total: number;
        accidents: number;
        violations: number;
        warnings: number;
        critical: number;
        major: number;
        minor: number;
        total_damage_cost: number;
        average_damage_cost: number;
    };
    filters: {
        search?: string | null;
        incident_type?: string | null;
        severity?: string | null;
        driver?: number | string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    incidentTypeOptions: Array<{ label: string; value: string }>;
    severityOptions: Array<{ label: string; value: string }>;
    driverOptions: DriverSummary[];
    perPageOptions: number[];
}

const SKELETON_FLAG_KEY = 'driver-safety.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id:
        | 'incident_date'
        | 'driver'
        | 'incident_type'
        | 'severity'
        | 'description'
        | 'damage_cost';
    label: string;
    sortKey?: string;
    align?: 'left' | 'center' | 'right';
}> = [
    { id: 'incident_date', label: 'Date', sortKey: 'incident_date' },
    { id: 'driver', label: 'Driver' },
    { id: 'incident_type', label: 'Type', sortKey: 'incident_type', align: 'center' },
    { id: 'severity', label: 'Severity', sortKey: 'severity', align: 'center' },
    { id: 'description', label: 'Description' },
    { id: 'damage_cost', label: 'Damage Cost', sortKey: 'damage_cost', align: 'right' },
];

type NavigateOverrides = {
    search?: string;
    incident_type?: string;
    severity?: string;
    driver?: string | number;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

const formatDate = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString();
};

const formatCurrency = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return 'ETB\u00a00.00';
    }

    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'ETB',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(value);
};

const getSeverityBadgeClass = (severity: string): string => {
    const normalized = severity.toLowerCase();
    if (normalized === 'critical') {
        return 'bg-red-500 text-white hover:bg-red-600';
    }
    if (normalized === 'major') {
        return 'bg-orange-500 text-white hover:bg-orange-600';
    }
    if (normalized === 'minor') {
        return 'bg-amber-500 text-white hover:bg-amber-600';
    }
    return 'bg-muted text-muted-foreground';
};

const getIncidentTypeBadgeClass = (incidentType: string): string => {
    const normalized = incidentType.toLowerCase();
    if (normalized === 'accident') {
        return 'bg-rose-500 text-white hover:bg-rose-600';
    }
    if (normalized === 'violation') {
        return 'bg-indigo-500 text-white hover:bg-indigo-600';
    }
    if (normalized === 'warning') {
        return 'bg-blue-500 text-white hover:bg-blue-600';
    }
    return 'bg-muted text-muted-foreground';
};

const formatCount = (value?: number | null): string => {
    if (typeof value !== 'number' || Number.isNaN(value)) {
        return '0';
    }

    return value.toLocaleString();
};

export default function DriverSafetyIndex({
    safetyRecords,
    metrics,
    filters,
    incidentTypeOptions,
    severityOptions,
    driverOptions,
    perPageOptions,
}: DriverSafetyIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewRecord = hasPermission('driver-safety.show');
    const canEditRecord = hasPermission('driver-safety.edit');
    const canDeleteRecord = hasPermission('driver-safety.destroy');
    const canCreateRecord = hasPermission('driver-safety.create');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedIncidentType, setSelectedIncidentType] = React.useState(filters?.incident_type ?? 'all');
    const [selectedSeverity, setSelectedSeverity] = React.useState(filters?.severity ?? 'all');
    const [selectedDriver, setSelectedDriver] = React.useState(filters?.driver ? String(filters.driver) : 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'incident_date');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'desc');
    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedRecord, setSelectedRecord] = React.useState<SafetyRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);
    const lastDeleteToast = React.useRef<string | null>(null);

    const isDataReady = Array.isArray(safetyRecords?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/driver-safety',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const safetyData = React.useMemo(() => {
        const records = safetyRecords?.data;
        return Array.isArray(records) ? records : [];
    }, [safetyRecords?.data]);
    const totalRecords = metrics?.total ?? safetyRecords?.total ?? safetyData.length ?? 0;
    const accidents = metrics?.accidents ?? 0;
    const warnings = metrics?.warnings ?? 0;
    const critical = metrics?.critical ?? 0;
    const major = metrics?.major ?? 0;
    const minor = metrics?.minor ?? 0;
    const totalDamageCost = metrics?.total_damage_cost ?? 0;
    const averageDamageCost = metrics?.average_damage_cost ?? 0;

    const rowOffset = Math.max((safetyRecords?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: NavigateOverrides = {}) => {
            const hasOverride = (key: keyof NavigateOverrides) =>
                Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextIncidentType = hasOverride('incident_type')
                ? overrides.incident_type
                : selectedIncidentType !== 'all'
                    ? selectedIncidentType
                    : undefined;

            const nextSeverity = hasOverride('severity')
                ? overrides.severity
                : selectedSeverity !== 'all'
                    ? selectedSeverity
                    : undefined;

            const nextDriver = hasOverride('driver')
                ? overrides.driver
                : selectedDriver !== 'all'
                    ? selectedDriver
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
                incident_type: nextIncidentType && nextIncidentType !== 'all' ? nextIncidentType : undefined,
                severity: nextSeverity && nextSeverity !== 'all' ? nextSeverity : undefined,
                driver: nextDriver && nextDriver !== 'all' ? nextDriver : undefined,
                sort: nextSort,
                direction: nextDirection,
                page: nextPage,
                per_page:
                    typeof nextPerPage === 'number' && Number.isFinite(nextPerPage) && nextPerPage > 0
                        ? nextPerPage
                        : undefined,
            };

            Object.keys(params).forEach((key) => {
                if (params[key] === undefined) {
                    delete params[key];
                }
            });

            if (typeof window !== 'undefined') {
                window.sessionStorage.setItem(SKELETON_FLAG_KEY, 'true');
            }

            router.get('/driver-safety', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedIncidentType, selectedSeverity, selectedDriver, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleIncidentTypeChange = (value: string) => {
        setSelectedIncidentType(value);
        handleNavigate({ incident_type: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleSeverityChange = (value: string) => {
        setSelectedSeverity(value);
        handleNavigate({ severity: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleDriverChange = (value: string) => {
        setSelectedDriver(value);
        handleNavigate({ driver: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = React.useCallback(
        (column: string) => {
            const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(newDirection);
            handleNavigate({ sort: column, direction: newDirection });
        },
        [handleNavigate, sortColumn, sortDirection],
    );

    const handleDeleteClick = (record: SafetyRecord) => {
        lastDeleteToast.current = null;
        setSelectedRecord(record);
        setDeleteDialogOpen(true);
        setDeleteError(null);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRecord) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/driver-safety/${selectedRecord.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedRecord(null);
                setIsDeleting(false);
                setDeleteError(null);
                const successMessage = 'The driver safety record was removed successfully.';
                if (lastDeleteToast.current !== successMessage) {
                    toast({
                        title: 'Safety record deleted',
                        description: successMessage,
                    });
                    lastDeleteToast.current = successMessage;
                }
            },
            onError: (errors) => {
                setIsDeleting(false);

                const fallback = 'Failed to delete safety record. Please review the requirements and try again.';
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    const message = messages || fallback;
                    setDeleteError(message);

                    if (lastDeleteToast.current !== message) {
                        toast({
                            title: '❌ Delete Failed',
                            description: message,
                            variant: 'destructive',
                        });
                        lastDeleteToast.current = message;
                    }
                } else {
                    setDeleteError(fallback);
                    if (lastDeleteToast.current !== fallback) {
                        toast({
                            title: '❌ Delete Failed',
                            description: fallback,
                            variant: 'destructive',
                        });
                        lastDeleteToast.current = fallback;
                    }
                }
            },
        });
    };

    const headerActions = (
        <>
            {canCreateRecord && (
                <Button asChild>
                    <Link href="/driver-safety/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Safety Record
                    </Link>
                </Button>
            )}
        </>
    );

    const statsDefinitions = [
        {
            id: 'total-records',
            label: 'Total Records',
            icon: <ShieldAlert className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalRecords)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-40" aria-hidden="true" />
            ) : (
                `${formatCount(critical)} critical incidents`
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'accidents',
            label: 'Accidents',
            icon: <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(accidents)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${formatCount(major)} major incidents`
            ),
            valueClassName: isTableLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'warnings',
            label: 'Warnings',
            icon: <Megaphone className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(warnings)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-36" aria-hidden="true" />
            ) : (
                `${formatCount(minor)} minor cases`
            ),
            valueClassName: isTableLoading ? undefined : 'text-amber-600',
        },
        {
            id: 'damage-cost',
            label: 'Damage Cost',
            icon: <DollarSign className="h-3.5 w-3.5 text-purple-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-24" aria-hidden="true" />
            ) : (
                formatCurrency(totalDamageCost)
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                `Avg ${formatCurrency(averageDamageCost)}`
            ),
            valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: `${option} / page`,
            })),
        [availablePerPageOptions],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...COLUMN_DEFINITIONS.map((column) => ({
                id: column.id,
                label: column.label,
                sortable: Boolean(column.sortKey),
                sortKey: column.sortKey,
                align: column.align,
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = safetyData.length > 0
        ? safetyData.map((record, index) => (
              <TableRow key={record.id} className="hover:bg-muted/50">
                  <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                  <TableCell className="font-medium">{formatDate(record.incident_date)}</TableCell>
                  <TableCell className="text-muted-foreground">{record.driver?.name || '—'}</TableCell>
                  <TableCell className="text-center">
                      <Badge className={getIncidentTypeBadgeClass(record.incident_type)}>{record.incident_type}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                      <Badge className={getSeverityBadgeClass(record.severity)}>{record.severity}</Badge>
                  </TableCell>
                  <TableCell className="max-w-sm truncate text-muted-foreground" title={record.description}>
                      {record.description || '—'}
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatCurrency(record.damage_cost ?? 0)}</TableCell>
                  <TableCell className="text-center">
                      <ListingRowActionsMenu
                          actions={[
                              canViewRecord && {
                                  label: 'View',
                                  icon: <Eye className="h-4 w-4" />,
                                  href: `/driver-safety/${record.id}`,
                              },
                              canEditRecord && {
                                  label: 'Edit',
                                  icon: <Edit className="h-4 w-4" />,
                                  href: `/driver-safety/${record.id}/edit`,
                              },
                              canDeleteRecord && {
                                  label: 'Delete',
                                  icon: <Trash2 className="h-4 w-4" />,
                                  danger: true,
                                  disabled: isDeleting && selectedRecord?.id === record.id,
                                  onSelect: () => handleDeleteClick(record),
                              },
                          ]}
                      />
                  </TableCell>
              </TableRow>
          ))
        : (
            <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                    No safety records found.
                    {canCreateRecord && (
                        <Link href="/driver-safety/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </TableCell>
            </TableRow>
        );

    const tableContent = (
        <div className="relative">
            <ListingTableShell
                columns={tableColumns}
                sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
            >
                {tableRows}
            </ListingTableShell>

            {isTableLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                    <img src="/images/loading-spinner.svg" alt="Loading safety records" className="h-12 w-12" />
                    <span className="text-sm text-muted-foreground">Loading safety records...</span>
                </div>
            )}
        </div>
    );

    const mobileItems = React.useMemo(
        () =>
            safetyData.map((record, index) => ({
                record,
                position: rowOffset + index + 1,
            })),
        [rowOffset, safetyData],
    );

    const mobileContent = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.record.driver?.name || 'Unassigned driver'}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => `${item.record.incident_type} • ${item.record.severity}`}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Date</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatDate(item.record.incident_date)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Description</span>
                        <span className="ml-3 text-right text-slate-900 dark:text-slate-100">
                            {item.record.description || '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Damage Cost</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatCurrency(item.record.damage_cost ?? 0)}</span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewRecord && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/driver-safety/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditRecord && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/driver-safety/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteRecord && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedRecord?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No safety records found.
                    {canCreateRecord && (
                        <Link href="/driver-safety/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
                </div>
            )}
        />
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search safety records...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <Select value={selectedIncidentType} onValueChange={handleIncidentTypeChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder="Incident type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All incident types</SelectItem>
                    {incidentTypeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedSeverity} onValueChange={handleSeverityChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All severities</SelectItem>
                    {severityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedDriver} onValueChange={handleDriverChange}>
                <SelectTrigger className="w-full min-w-[200px] sm:w-auto">
                    <SelectValue placeholder="Driver" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All drivers</SelectItem>
                    {driverOptions.map((driver) => (
                        <SelectItem key={driver.id} value={String(driver.id)}>
                            {driver.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Driver Safety"
                title="Driver Safety"
                description={`Monitor incidents across the fleet. Total: ${formatCount(totalRecords)}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Safety Records"
                tableDescription="Track incidents, severity, and impact"
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isTableLoading && safetyRecords?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={safetyRecords.links}
                            from={safetyRecords.from ?? undefined}
                            to={safetyRecords.to ?? undefined}
                            total={safetyRecords.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">{tableContent}</div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isTableLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading safety records" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading safety records...</span>
                        </div>
                    )}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedRecord(null);
                        setDeleteError(null);
                    }
                }}
                title="Delete Safety Record"
                description="Are you sure you want to delete this safety record? This action cannot be undone."
                itemName={
                    selectedRecord
                        ? `${selectedRecord.driver?.name || 'Driver'} – ${formatDate(selectedRecord.incident_date)}`
                        : undefined
                }
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}


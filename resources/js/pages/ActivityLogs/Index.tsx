import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ReportDateRangePicker } from '@/components/reports/report-date-range-picker';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Activity, ChevronRight, Clock, Download, Eye, FileSpreadsheet, Filter, History, Users } from 'lucide-react';
import { type BreadcrumbItem } from '@/types';

interface ActivityLogUserOption {
    id: number;
    name: string;
}

interface ActivityLogFilterOption {
    label: string;
    value: string;
}

interface ActivityLogEntry {
    id: number;
    action?: string | null;
    description: string;
    user?: { name: string } | null;
    created_at: string;
    old_values?: Record<string, unknown> | null;
    new_values?: Record<string, unknown> | null;
    log_name?: string | null;
    event?: string | null;
    subject_type?: string | null;
    subject_type_label?: string | null;
    subject_id?: number | string | null;
    subject_label?: string | null;
    causer_id?: number | null;
    causer_name?: string | null;
    batch_uuid?: string | null;
    changed_fields?: string[];
}

interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
}

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface ActivityLogsIndexProps {
    logs: {
        data: ActivityLogEntry[];
        meta: PaginationMeta;
        links: PaginationLink[];
    };
    metrics: {
        total: number;
        last_24_hours: number;
        last_7_days: number;
        unique_users: number;
    };
    filters: {
        from?: string | null;
        to?: string | null;
        causer_id?: number | null;
        action?: string | null;
        log_name?: string | null;
        subject_type?: string | null;
        search?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    filterOptions: {
        users: ActivityLogUserOption[];
        actions: ActivityLogFilterOption[];
        log_names: ActivityLogFilterOption[];
        subject_types: ActivityLogFilterOption[];
    };
    sortOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
}

type ActivityLogFilterDraft = {
    causerId: string;
    action: string;
    logName: string;
    subjectType: string;
    from: string;
    to: string;
};

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/activity-logs' },
];

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-emerald-100 text-emerald-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-rose-100 text-rose-800',
};

const SKELETON_FLAG_KEY = 'activity-logs.index.shouldShowSkeleton';

const DEFAULT_SORT = 'created_at';
const DEFAULT_DIRECTION: 'asc' | 'desc' = 'desc';

const dateFormatter = new Intl.DateTimeFormat('en-ET', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
});

function formatActionLabel(action?: string | null): string {
    if (!action) {
        return 'Activity';
    }

    return action.charAt(0).toUpperCase() + action.slice(1);
}

function buildQueryParams(params: Record<string, string | number | undefined>): Record<string, string> {
    const output: Record<string, string> = {};

    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
            return;
        }

        output[key] = String(value);
    });

    return output;
}

function resolveActionMeta(log: ActivityLogEntry): { badgeClass: string; label: string } {
    const rawAction = log.event ?? log.action ?? '';
    const normalized = rawAction ? rawAction.toLowerCase() : '';
    const badgeClass = ACTION_COLORS[normalized] ?? 'bg-slate-200 text-slate-700';

    return {
        badgeClass,
        label: formatActionLabel(normalized || undefined),
    };
}

export default function ActivityLogsIndex({ logs, metrics, filters, filterOptions, sortOptions, perPageOptions }: ActivityLogsIndexProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('activity-logs.export');
    const isDataReady = Array.isArray(logs?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/activity-logs',
        initialIsLoading: true,
    });

    const [searchTerm, setSearchTerm] = useState(filters.search ?? '');
    const [selectedUser, setSelectedUser] = useState(() => (filters.causer_id ? String(filters.causer_id) : 'all'));
    const [selectedAction, setSelectedAction] = useState(() => filters.action ?? 'all');
    const [selectedLogName, setSelectedLogName] = useState(() => filters.log_name ?? 'all');
    const [selectedSubjectType, setSelectedSubjectType] = useState(() => filters.subject_type ?? 'all');
    const [from, setFrom] = useState(filters.from ?? '');
    const [to, setTo] = useState(filters.to ?? '');
    const [perPage, setPerPage] = useState(() => String(filters.per_page ?? perPageOptions[0] ?? 25));
    const [sortColumn, setSortColumn] = useState(filters.sort ?? DEFAULT_SORT);
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters.direction ?? DEFAULT_DIRECTION);
    const [isFiltersOpen, setFiltersOpen] = useState(false);
    const [filterDraft, setFilterDraft] = useState<ActivityLogFilterDraft>(() => ({
        causerId: filters.causer_id ? String(filters.causer_id) : 'all',
        action: filters.action ?? 'all',
        logName: filters.log_name ?? 'all',
        subjectType: filters.subject_type ?? 'all',
        from: filters.from ?? '',
        to: filters.to ?? '',
    }));

    useEffect(() => {
        setSearchTerm(filters.search ?? '');
        setSelectedUser(filters.causer_id ? String(filters.causer_id) : 'all');
        setSelectedAction(filters.action ?? 'all');
        setSelectedLogName(filters.log_name ?? 'all');
        setSelectedSubjectType(filters.subject_type ?? 'all');
        setFrom(filters.from ?? '');
        setTo(filters.to ?? '');
        setPerPage(String(filters.per_page ?? perPageOptions[0] ?? 25));
        setSortColumn(filters.sort ?? DEFAULT_SORT);
        setSortDirection(filters.direction ?? DEFAULT_DIRECTION);
        setFilterDraft({
            causerId: filters.causer_id ? String(filters.causer_id) : 'all',
            action: filters.action ?? 'all',
            logName: filters.log_name ?? 'all',
            subjectType: filters.subject_type ?? 'all',
            from: filters.from ?? '',
            to: filters.to ?? '',
        });
    }, [filters, perPageOptions]);

    const perPageSelectOptions = useMemo(
        () => perPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
        [perPageOptions],
    );

    const activeFilterCount = useMemo(() => {
        let count = 0;
        if (selectedUser !== 'all') {
            count += 1;
        }
        if (selectedAction !== 'all') {
            count += 1;
        }
        if (selectedLogName !== 'all') {
            count += 1;
        }
        if (selectedSubjectType !== 'all') {
            count += 1;
        }
        if (from || to) {
            count += 1;
        }

        return count;
    }, [from, selectedAction, selectedLogName, selectedSubjectType, selectedUser, to]);

    const syncDraftFromState = useCallback(() => {
        setFilterDraft({
            causerId: selectedUser,
            action: selectedAction,
            logName: selectedLogName,
            subjectType: selectedSubjectType,
            from,
            to,
        });
    }, [from, selectedAction, selectedLogName, selectedSubjectType, selectedUser, to]);

    const handleFilterOpenChange = useCallback((open: boolean) => {
        setFiltersOpen(open);
        if (open) {
            syncDraftFromState();
        }
    }, [syncDraftFromState]);

    const handleDraftChange = useCallback((next: Partial<ActivityLogFilterDraft>) => {
        setFilterDraft((previous) => ({ ...previous, ...next }));
    }, []);

    const runNavigate = useCallback(
        (overrides: Record<string, string | number | undefined> = {}) => {
            const params = buildQueryParams({
                search: overrides.search ?? searchTerm.trim(),
                causer_id: overrides.causer_id ?? (selectedUser !== 'all' ? selectedUser : undefined),
                action: overrides.action ?? (selectedAction !== 'all' ? selectedAction : undefined),
                log_name: overrides.log_name ?? (selectedLogName !== 'all' ? selectedLogName : undefined),
                subject_type: overrides.subject_type ?? (selectedSubjectType !== 'all' ? selectedSubjectType : undefined),
                from: overrides.from ?? from,
                to: overrides.to ?? to,
                sort: overrides.sort ?? sortColumn,
                direction: overrides.direction ?? sortDirection,
                per_page: overrides.per_page ?? perPage,
                page: overrides.page,
            });

            router.get('/activity-logs', params, {
                preserveState: true,
                preserveScroll: true,
            });
        },
        [from, perPage, searchTerm, selectedAction, selectedLogName, selectedSubjectType, selectedUser, sortColumn, sortDirection, to],
    );

    const handleApplyFilters = useCallback(() => {
        const nextSelectedUser = filterDraft.causerId;
        const nextSelectedAction = filterDraft.action;
        const nextSelectedLogName = filterDraft.logName;
        const nextSelectedSubjectType = filterDraft.subjectType;
        const nextFrom = filterDraft.from ?? '';
        const nextTo = filterDraft.to ?? '';

        setSelectedUser(nextSelectedUser);
        setSelectedAction(nextSelectedAction);
        setSelectedLogName(nextSelectedLogName);
        setSelectedSubjectType(nextSelectedSubjectType);
        setFrom(nextFrom);
        setTo(nextTo);

        runNavigate({
            causer_id: nextSelectedUser !== 'all' ? nextSelectedUser : '',
            action: nextSelectedAction !== 'all' ? nextSelectedAction : '',
            log_name: nextSelectedLogName !== 'all' ? nextSelectedLogName : '',
            subject_type: nextSelectedSubjectType !== 'all' ? nextSelectedSubjectType : '',
            from: nextFrom,
            to: nextTo,
            page: 1,
        });

        setFiltersOpen(false);
    }, [filterDraft, runNavigate]);

    const handleResetFilters = useCallback(() => {
        handleDraftChange({
            causerId: 'all',
            action: 'all',
            logName: 'all',
            subjectType: 'all',
            from: '',
            to: '',
        });
    }, [handleDraftChange]);

    const handleSortToggle = useCallback(
        (column: string) => {
            const nextDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
            setSortColumn(column);
            setSortDirection(nextDirection);
            runNavigate({ sort: column, direction: nextDirection });
        },
        [runNavigate, sortColumn, sortDirection],
    );

    const buildExportUrl = useCallback(
        (path: string) => {
            const params = buildQueryParams({
                search: searchTerm.trim(),
                causer_id: selectedUser !== 'all' ? selectedUser : undefined,
                action: selectedAction !== 'all' ? selectedAction : undefined,
                log_name: selectedLogName !== 'all' ? selectedLogName : undefined,
                subject_type: selectedSubjectType !== 'all' ? selectedSubjectType : undefined,
                from,
                to,
                sort: sortColumn,
                direction: sortDirection,
            });

            const queryString = new URLSearchParams(params).toString();
            return queryString ? `${path}?${queryString}` : path;
        },
        [from, searchTerm, selectedAction, selectedLogName, selectedSubjectType, selectedUser, sortColumn, sortDirection, to],
    );

    const statsDefinitions = useMemo(() => [
        {
            id: 'total-logs',
            label: 'Total Logs',
            value: isLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : metrics.total.toLocaleString(),
            icon: <History className="h-4 w-4 text-slate-500" />,
        },
        {
            id: 'last-24-hours',
            label: 'Last 24 Hours',
            value: isLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : metrics.last_24_hours.toLocaleString(),
            icon: <Clock className="h-4 w-4 text-blue-500" />,
        },
        {
            id: 'last-7-days',
            label: 'Last 7 Days',
            value: isLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : metrics.last_7_days.toLocaleString(),
            icon: <Activity className="h-4 w-4 text-emerald-500" />,
        },
        {
            id: 'unique-users',
            label: 'Active Users',
            value: isLoading ? <Skeleton className="h-3.5 w-20" aria-hidden="true" /> : metrics.unique_users.toLocaleString(),
            icon: <Users className="h-4 w-4 text-purple-500" />,
        },
    ], [isLoading, metrics]);

    const tableData = useMemo(() => logs.data ?? [], [logs.data]);

    const metaPerPage = logs.meta?.per_page;
    const currentPage = logs.meta?.current_page ?? 1;

    const resolvedPerPageValue = useMemo(() => {
        if (typeof metaPerPage === 'number' && Number.isFinite(metaPerPage) && metaPerPage > 0) {
            return metaPerPage;
        }

        const numericPerPage = Number(perPage);
        if (Number.isFinite(numericPerPage) && numericPerPage > 0) {
            return numericPerPage;
        }

        if (perPageOptions.length > 0) {
            return perPageOptions[0];
        }

        return 25;
    }, [metaPerPage, perPage, perPageOptions]);

    const rowOffset = useMemo(() => (currentPage > 0 ? (currentPage - 1) * resolvedPerPageValue : 0), [currentPage, resolvedPerPageValue]);

    const tableColumns = useMemo(
        () => [
            { id: 'position', label: '#', align: 'center' as const, className: 'w-12' },
            { id: 'created_at', label: 'Timestamp', sortable: true, sortKey: 'created_at', className: 'min-w-[160px]' },
            { id: 'action', label: 'Action', sortable: true, sortKey: 'event', className: 'min-w-[120px]' },
            { id: 'description', label: 'Description', className: 'min-w-[220px]' },
            { id: 'user', label: 'User', sortable: true, sortKey: 'causer_name', className: 'min-w-[160px]' },
            { id: 'subject', label: 'Subject', sortable: true, sortKey: 'subject_type', className: 'min-w-[180px]' },
            { id: 'log_name', label: 'Log', sortable: true, sortKey: 'log_name', className: 'min-w-[140px]' },
            { id: 'changed_fields', label: 'Changed Fields', className: 'min-w-[200px]' },
            { id: 'actions', label: 'Actions', align: 'center' as const, className: 'w-16' },
        ],
        [],
    );

    const tableBodyContent = useMemo(() => {
        if (isLoading) {
            return Array.from({ length: 6 }).map((_, rowIndex) => (
                <TableRow key={`activity-log-skeleton-${rowIndex}`} aria-hidden="true">
                    {tableColumns.map((column) => (
                        <TableCell
                            key={`${column.id}-${rowIndex}`}
                            className={cn(
                                column.align === 'center' && 'text-center',
                                column.align === 'right' && 'text-right',
                                column.className,
                            )}
                        >
                            <Skeleton className="mx-auto h-4 w-24 max-w-full" />
                        </TableCell>
                    ))}
                </TableRow>
            ));
        }

        if (tableData.length === 0) {
            return (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="h-24 text-center text-sm text-muted-foreground">
                        No activity found for the selected filters.
                    </TableCell>
                </TableRow>
            );
        }

        return tableData.map((log, index) => {
            const position = rowOffset + index + 1;
            const { badgeClass, label } = resolveActionMeta(log);

            return (
                <TableRow key={log.id} className="hover:bg-muted/40">
                    <TableCell className="text-center font-medium text-muted-foreground">
                        {position}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col text-sm">
                            <span>{dateFormatter.format(new Date(log.created_at))}</span>
                            {log.batch_uuid ? (
                                <span className="text-xs text-muted-foreground">Batch {log.batch_uuid}</span>
                            ) : null}
                        </div>
                    </TableCell>
                    <TableCell>
                        <Badge className={cn('font-medium capitalize', badgeClass)}>{label}</Badge>
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-col text-sm">
                            <span className="font-medium text-foreground">{log.description}</span>
                            {log.log_name ? (
                                <span className="text-xs text-muted-foreground">Log: {log.log_name}</span>
                            ) : null}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">
                            {log.causer_name ?? 'System'}
                            {log.causer && log.causer.email ? (
                                <span className="block text-xs text-muted-foreground">{log.causer.email}</span>
                            ) : null}
                        </div>
                    </TableCell>
                    <TableCell>
                        <div className="text-sm">
                            {log.subject_label ?? '—'}
                            {log.subject_type_label ? (
                                <span className="block text-xs text-muted-foreground">{log.subject_type_label}</span>
                            ) : null}
                        </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                        {log.log_name ?? '—'}
                    </TableCell>
                    <TableCell>
                        <div className="flex flex-wrap gap-1">
                            {(log.changed_fields ?? []).map((field) => (
                                <Badge key={field} variant="outline" className="text-xs">
                                    {field}
                                </Badge>
                            ))}
                        </div>
                    </TableCell>
                    <TableCell className="text-center">
                        <Button asChild size="icon" variant="ghost">
                            <Link href={`/activity-logs/${log.id}`} aria-label="View activity log">
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">View activity log</span>
                            </Link>
                        </Button>
                    </TableCell>
                </TableRow>
            );
        });
    }, [isLoading, rowOffset, tableColumns, tableData]);

    const mobileItems = useMemo(
        () => tableData.map((log, index) => ({ log, position: rowOffset + index + 1 })),
        [rowOffset, tableData],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={0} rowCount={4} />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.log.id}
            renderTitle={(item) => {
                const { badgeClass, label } = resolveActionMeta(item.log);

                return (
                    <div className="flex items-center gap-2">
                        <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                        <Badge className={cn('font-medium capitalize', badgeClass)}>{label}</Badge>
                        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                );
            }}
            renderSubtitle={(item) => item.log.subject_label ?? 'Activity'}
            renderContent={(item) => {
                const changedFields = item.log.changed_fields ?? [];

                return (
                    <div className="space-y-3 text-sm">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{dateFormatter.format(new Date(item.log.created_at))}</span>
                            {item.log.batch_uuid ? <span>Batch {item.log.batch_uuid}</span> : null}
                        </div>
                        <p className="text-sm text-foreground">{item.log.description}</p>
                        <div className="space-y-2 text-xs">
                            <div className="flex items-start justify-between gap-3">
                                <span className="font-medium text-slate-600 dark:text-slate-300">User</span>
                                <span className="text-right text-slate-900 dark:text-slate-100">
                                    {item.log.causer_name ?? 'System'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Subject</span>
                                <span className="text-right text-slate-900 dark:text-slate-100">
                                    {item.log.subject_label ?? '—'}
                                </span>
                            </div>
                            <div className="flex items-start justify-between gap-3">
                                <span className="font-medium text-slate-600 dark:text-slate-300">Log</span>
                                <span className="text-right text-slate-900 dark:text-slate-100">
                                    {item.log.log_name ?? '—'}
                                </span>
                            </div>
                        </div>
                        {changedFields.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {changedFields.map((field) => (
                                    <Badge key={field} variant="outline" className="text-xs">
                                        {field}
                                    </Badge>
                                ))}
                            </div>
                        ) : null}
                    </div>
                );
            }}
            renderFooter={(item) => (
                <Button asChild size="sm" variant="outline" className="w-full">
                    <Link href={`/activity-logs/${item.log.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                    </Link>
                </Button>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No activity found for the selected filters.
                </div>
            )}
        />
    );

    const exportActions = canExport ? (
        <div className="flex flex-wrap items-center gap-2">
            <Button asChild variant="outline" size="sm">
                <a href={buildExportUrl('/activity-logs/export/excel')} className="inline-flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    Excel
                </a>
            </Button>
            <Button asChild variant="outline" size="sm">
                <a href={buildExportUrl('/activity-logs/export/csv')} className="inline-flex items-center gap-2">
                    <Download className="h-4 w-4" />
                    CSV
                </a>
            </Button>
        </div>
    ) : null;

    const filterDialog = (
        <Dialog open={isFiltersOpen} onOpenChange={handleFilterOpenChange}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 ? (
                        <Badge variant="secondary" className="h-5 min-w-[2rem] justify-center px-2 text-xs font-semibold">
                            {activeFilterCount}
                        </Badge>
                    ) : null}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader className="text-left">
                    <DialogTitle>Refine activity logs</DialogTitle>
                    <DialogDescription>Adjust filters to narrow down the audit trail.</DialogDescription>
                </DialogHeader>
                <div className="space-y-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">User</span>
                            <Select
                                value={filterDraft.causerId}
                                onValueChange={(value) => handleDraftChange({ causerId: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="User" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All users</SelectItem>
                                    {filterOptions.users.map((user) => (
                                        <SelectItem key={user.id} value={String(user.id)}>
                                            {user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">Action</span>
                            <Select
                                value={filterDraft.action}
                                onValueChange={(value) => handleDraftChange({ action: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Action" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All actions</SelectItem>
                                    {filterOptions.actions.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">Log</span>
                            <Select
                                value={filterDraft.logName}
                                onValueChange={(value) => handleDraftChange({ logName: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Log" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All logs</SelectItem>
                                    {filterOptions.log_names.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <span className="text-sm font-medium text-foreground">Subject</span>
                            <Select
                                value={filterDraft.subjectType}
                                onValueChange={(value) => handleDraftChange({ subjectType: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Subject" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All subjects</SelectItem>
                                    {filterOptions.subject_types.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <ReportDateRangePicker
                        from={filterDraft.from}
                        to={filterDraft.to}
                        onChange={(field, value) => {
                            handleDraftChange({ [field]: value } as Partial<ActivityLogFilterDraft>);
                        }}
                        description="Filter by the activity timestamp range"
                    />
                </div>
                <DialogFooter className="flex flex-row justify-between gap-3 sm:justify-end">
                    <Button type="button" variant="outline" onClick={handleResetFilters}>
                        Reset
                    </Button>
                    <Button type="button" onClick={handleApplyFilters}>
                        Apply filters
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    const tableHeaderExtras = (
        <ListingFilterBar
            className="items-stretch justify-end gap-2 sm:items-center"
            search={{
                value: searchTerm,
                placeholder: 'Search description, user, or subject',
                onChange: (next) => {
                    setSearchTerm(next);
                    runNavigate({ search: next, page: 1 });
                },
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                options: perPageSelectOptions,
                onChange: (value) => {
                    setPerPage(value);
                    runNavigate({ per_page: value, page: 1 });
                },
            }}
            trailing={(
                <div className="flex flex-wrap items-center gap-2">
                    {filterDialog}
                    {exportActions}
                </div>
            )}
        />
    );

    return (
        <ListPageLayout
            title="Activity Logs"
            headTitle="Activity Logs"
            description="Audit every important change across the platform."
            breadcrumbs={breadcrumbs}
            stats={<ListingStatsHeader stats={statsDefinitions} orientation="row" />}
            tableTitle="Activity History"
            tableDescription="Filter, sort, and export detailed activity records."
            tableHeaderExtras={tableHeaderExtras}
            tableContainerClassName="min-h-[420px]"
            pagination={
                !isLoading ? (
                    <ListingPaginationFooter
                        from={logs.meta?.from ?? undefined}
                        to={logs.meta?.to ?? undefined}
                        total={logs.meta?.total ?? undefined}
                        links={logs.links ?? []}
                    />
                ) : null
            }
        >
            <div className="hidden md:block">
                <ListingTableShell
                    columns={tableColumns}
                    sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSortToggle }}
                >
                    {tableBodyContent}
                </ListingTableShell>
            </div>
            <div className="md:hidden">
                {mobileContent}
            </div>
        </ListPageLayout>
    );
}

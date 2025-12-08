import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ReportDateRangePicker } from '@/components/reports/report-date-range-picker';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import { Activity, Clock, Download, FileSpreadsheet, History, Users } from 'lucide-react';
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

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Activity Logs', href: '/activity-logs' },
];

const ACTION_COLORS: Record<string, string> = {
    created: 'bg-emerald-100 text-emerald-800',
    updated: 'bg-blue-100 text-blue-800',
    deleted: 'bg-rose-100 text-rose-800',
};

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

export default function ActivityLogsIndex({ logs, metrics, filters, filterOptions, sortOptions, perPageOptions }: ActivityLogsIndexProps) {
    const { hasPermission } = usePermissions();
    const canExport = hasPermission('activity-logs.export');

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
    }, [filters, perPageOptions]);

    const perPageSelectOptions = useMemo(
        () => perPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
        [perPageOptions],
    );

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
            value: metrics.total.toLocaleString(),
            icon: <History className="h-4 w-4 text-slate-500" />,
        },
        {
            id: 'last-24-hours',
            label: 'Last 24 Hours',
            value: metrics.last_24_hours.toLocaleString(),
            icon: <Clock className="h-4 w-4 text-blue-500" />,
        },
        {
            id: 'last-7-days',
            label: 'Last 7 Days',
            value: metrics.last_7_days.toLocaleString(),
            icon: <Activity className="h-4 w-4 text-emerald-500" />,
        },
        {
            id: 'unique-users',
            label: 'Active Users',
            value: metrics.unique_users.toLocaleString(),
            icon: <Users className="h-4 w-4 text-purple-500" />,
        },
    ], [metrics]);

    const tableRows = useMemo(() => logs.data ?? [], [logs.data]);

    const exportActions = canExport ? (
        <div className="flex items-center gap-2">
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

    return (
        <ListPageLayout
            title="Activity Logs"
            headTitle="Activity Logs"
            description="Audit every important change across the platform."
            breadcrumbs={breadcrumbs}
            tableTitle="Activity History"
            tableDescription="Filter, sort, and export detailed activity records."
            stats={<ListingStatsHeader stats={statsDefinitions} orientation="row" />}
            tableHeaderExtras={exportActions}
            tableContainerClassName="min-h-[420px]"
        >
            <div className="p-4">
                <ListingFilterBar
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
                        options: perPageSelectOptions,
                        onChange: (value) => {
                            setPerPage(value);
                            runNavigate({ per_page: value, page: 1 });
                        },
                    }}
                >
                    <Select
                        value={selectedUser}
                        onValueChange={(value) => {
                            setSelectedUser(value);
                            runNavigate({ causer_id: value !== 'all' ? value : undefined, page: 1 });
                        }}
                    >
                        <SelectTrigger className="w-[170px]">
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

                    <Select
                        value={selectedAction}
                        onValueChange={(value) => {
                            setSelectedAction(value);
                            runNavigate({ action: value !== 'all' ? value : undefined, page: 1 });
                        }}
                    >
                        <SelectTrigger className="w-[150px]">
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

                    <Select
                        value={selectedLogName}
                        onValueChange={(value) => {
                            setSelectedLogName(value);
                            runNavigate({ log_name: value !== 'all' ? value : undefined, page: 1 });
                        }}
                    >
                        <SelectTrigger className="w-[170px]">
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

                    <Select
                        value={selectedSubjectType}
                        onValueChange={(value) => {
                            setSelectedSubjectType(value);
                            runNavigate({ subject_type: value !== 'all' ? value : undefined, page: 1 });
                        }}
                    >
                        <SelectTrigger className="w-[190px]">
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

                    <div className="hidden xl:block">
                        <ReportDateRangePicker
                            from={from}
                            to={to}
                            onChange={(field, value) => {
                                if (field === 'from') {
                                    setFrom(value);
                                    runNavigate({ from: value, page: 1 });
                                } else {
                                    setTo(value);
                                    runNavigate({ to: value, page: 1 });
                                }
                            }}
                            description="Filter by the activity timestamp range"
                        />
                    </div>
                </ListingFilterBar>

                <div className="mt-4 xl:hidden">
                    <ReportDateRangePicker
                        from={from}
                        to={to}
                        onChange={(field, value) => {
                            if (field === 'from') {
                                setFrom(value);
                                runNavigate({ from: value, page: 1 });
                            } else {
                                setTo(value);
                                runNavigate({ to: value, page: 1 });
                            }
                        }}
                        description="Filter by the activity timestamp range"
                    />
                </div>
            </div>

            <ListingTableShell
                columns={[
                    { id: 'created_at', label: 'Timestamp', sortable: true, sortKey: 'created_at', className: 'min-w-[160px]' },
                    { id: 'action', label: 'Action', sortable: true, sortKey: 'event', className: 'min-w-[120px]' },
                    { id: 'description', label: 'Description', className: 'min-w-[220px]' },
                    { id: 'user', label: 'User', sortable: true, sortKey: 'causer_name', className: 'min-w-[160px]' },
                    { id: 'subject', label: 'Subject', sortable: true, sortKey: 'subject_type', className: 'min-w-[180px]' },
                    { id: 'log_name', label: 'Log', sortable: true, sortKey: 'log_name', className: 'min-w-[140px]' },
                    { id: 'changed_fields', label: 'Changed Fields', className: 'min-w-[180px]' },
                    { id: 'details', label: 'Details', align: 'center', className: 'min-w-[80px]' },
                ]}
                sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSortToggle }}
            >
                {tableRows.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={8} className="h-24 text-center text-sm text-muted-foreground">
                            No activity found for the selected filters.
                        </TableCell>
                    </TableRow>
                ) : (
                    tableRows.map((log) => {
                        const action = (log.event ?? log.action ?? '').toLowerCase();
                        const badgeClass = ACTION_COLORS[action] ?? 'bg-slate-200 text-slate-700';

                        return (
                            <TableRow key={log.id} className="hover:bg-muted/40">
                                <TableCell>
                                    <div className="flex flex-col text-sm">
                                        <span>{dateFormatter.format(new Date(log.created_at))}</span>
                                        <span className="text-xs text-muted-foreground">{log.batch_uuid ?? ''}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <Badge className={cn('font-medium capitalize', badgeClass)}>
                                        {formatActionLabel(action)}
                                    </Badge>
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
                                    <Button asChild variant="ghost" size="sm">
                                        <Link href={`/activity-logs/${log.id}`}>View</Link>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        );
                    })
                )}
            </ListingTableShell>

            <ListingPaginationFooter
                from={logs.meta?.from ?? undefined}
                to={logs.meta?.to ?? undefined}
                total={logs.meta?.total ?? undefined}
                links={logs.links ?? []}
            />
        </ListPageLayout>
    );
}

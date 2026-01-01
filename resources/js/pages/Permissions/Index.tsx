import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { usePermissions as usePermissionChecker } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import { ArrowUpDown, FileDown, Layers, Search, Shield } from 'lucide-react';
import { index as usersIndexRoute } from '@/routes/users';

type ColumnKey = 'name' | 'module' | 'action' | 'guard' | 'created_at';

type FilterChipKey = 'module' | 'perPage';

interface PermissionRecord {
    id: number;
    name: string;
    guard_name: string;
    created_at?: string | null;
}

interface PermissionsIndexProps {
    permissions: {
        data: PermissionRecord[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number | null;
        to: number | null;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    filters?: {
        search?: string | null;
        module?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    moduleOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
    stats?: {
        totalPermissions?: number;
        moduleCount?: number;
        guardCount?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User management',
        href: usersIndexRoute().url,
    },
    {
        title: 'Permissions',
        href: '#',
    },
];

const SKELETON_FLAG_KEY = 'permissions.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Permission', sortKey: 'name' },
    { id: 'module', label: 'Module' },
    { id: 'action', label: 'Action' },
    { id: 'guard', label: 'Guard', sortKey: 'guard_name' },
    { id: 'created_at', label: 'Created', sortKey: 'created_at' },
];

const formatCount = (value?: number | string | null): string => {
    if (value === null || value === undefined || value === '') {
        return '0';
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
        return '0';
    }

    return numeric.toLocaleString();
};

const formatDateValue = (value?: string | null): string => {
    if (!value) {
        return '—';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '—';
    }

    return parsed.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    });
};

const resolveModuleAndAction = (permissionName: string): { module: string; action: string } => {
    if (!permissionName) {
        return { module: 'general', action: 'general' };
    }

    const [moduleSegment = 'general', actionSegment = 'general'] = permissionName.split('.');
    return {
        module: moduleSegment,
        action: actionSegment,
    };
};

const getModuleBadgeClass = (module: string): string => {
    switch (module.toLowerCase()) {
        case 'trucks':
            return 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/30 dark:text-sky-200';
        case 'drivers':
            return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200';
        case 'maintenance':
            return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200';
        case 'fuel':
            return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200';
        case 'financial':
            return 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-900/40 dark:bg-purple-900/30 dark:text-purple-200';
        case 'users':
            return 'border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/30 dark:text-indigo-200';
        case 'roles':
            return 'border-fuchsia-200 bg-fuchsia-100 text-fuchsia-700 dark:border-fuchsia-900/40 dark:bg-fuchsia-900/30 dark:text-fuchsia-200';
        case 'permissions':
            return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
        default:
            return 'border-slate-200 bg-transparent text-slate-700 dark:border-slate-700 dark:text-slate-200';
    }
};

const getActionBadgeClass = (action: string): string => {
    switch (action.toLowerCase()) {
        case 'create':
            return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200';
        case 'read':
        case 'show':
            return 'border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-900/40 dark:bg-sky-900/30 dark:text-sky-200';
        case 'update':
        case 'edit':
            return 'border-amber-200 bg-amber-100 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200';
        case 'delete':
        case 'destroy':
            return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200';
        case 'export':
            return 'border-purple-200 bg-purple-100 text-purple-700 dark:border-purple-900/40 dark:bg-purple-900/30 dark:text-purple-200';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
    }
};

export default function PermissionsIndex({ permissions, filters, moduleOptions, perPageOptions, stats }: PermissionsIndexProps) {
    const { hasPermission } = usePermissionChecker();
    const canExportPermissions = hasPermission('permissions.export');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedModule, setSelectedModule] = React.useState(() => {
        const moduleValue = filters?.module ?? null;
        return moduleValue && moduleValue !== '' ? moduleValue : 'all';
    });
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );

    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page ?? permissions?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, permissions?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    const permissionData = permissions?.data ?? [];
    const isDataReady = Array.isArray(permissionData);

    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/permissions',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const totalPermissions = stats?.totalPermissions ?? permissions?.total ?? permissionData.length ?? 0;
    const moduleCount = stats?.moduleCount ?? (() => {
        const modules = permissionData.reduce<Set<string>>((set, permission) => {
            const { module } = resolveModuleAndAction(permission.name);
            set.add(module.toLowerCase());
            return set;
        }, new Set());
        return modules.size;
    })();
    const guardCount = stats?.guardCount ?? permissionData.reduce<Set<string>>((set, permission) => {
        if (permission.guard_name) {
            set.add(permission.guard_name.toLowerCase());
        }
        return set;
    }, new Set()).size;

    const rowOffset = Math.max((permissions?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            module?: string;
            sort?: string;
            direction?: 'asc' | 'desc';
            page?: number;
            per_page?: number;
        } = {}) => {
            const hasOverride = (key: keyof typeof overrides) => Object.prototype.hasOwnProperty.call(overrides, key);

            const nextSearch = hasOverride('search')
                ? overrides.search
                : searchTerm.trim()
                    ? searchTerm.trim()
                    : undefined;

            const nextModule = hasOverride('module')
                ? overrides.module
                : selectedModule !== 'all'
                    ? selectedModule
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch,
                module: nextModule,
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

            router.get('/permissions', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedModule, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleModuleChange = (value: string) => {
        setSelectedModule(value);
        handleNavigate({ module: value !== 'all' ? value : undefined, page: 1 });
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

    const activeModuleLabel = React.useMemo(() => {
        if (selectedModule === 'all') {
            return null;
        }

        return moduleOptions?.find((option) => option.value === selectedModule)?.label ?? selectedModule;
    }, [moduleOptions, selectedModule]);

    const activeFilterChips = React.useMemo(
        () =>
            [
                activeModuleLabel ? { key: 'module' as FilterChipKey, label: `Module: ${activeModuleLabel}` } : null,
                perPage !== String(resolvedPerPage)
                    ? { key: 'perPage' as FilterChipKey, label: `Rows: ${perPage}` }
                    : null,
            ].filter(Boolean) as Array<{ key: FilterChipKey; label: string }>,
        [activeModuleLabel, perPage, resolvedPerPage],
    );

    const clearFilter = React.useCallback(
        (key: FilterChipKey) => {
            switch (key) {
                case 'module':
                    setSelectedModule('all');
                    handleNavigate({ module: undefined, page: 1 });
                    break;
                case 'perPage':
                    setPerPage(String(resolvedPerPage));
                    handleNavigate({ per_page: resolvedPerPage, page: 1 });
                    break;
                default:
                    break;
            }
        },
        [handleNavigate, resolvedPerPage],
    );

    const statsDefinitions = [
        {
            id: 'total-permissions',
            label: 'Total Permissions',
            icon: <Shield className="h-3.5 w-3.5 text-indigo-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : formatCount(totalPermissions),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Across the platform'
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'module-count',
            label: 'Modules',
            icon: <Layers className="h-3.5 w-3.5 text-amber-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-12" aria-hidden="true" /> : formatCount(moduleCount),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Permission groups'
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
        {
            id: 'guard-count',
            label: 'Guard Types',
            icon: <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-10" aria-hidden="true" /> : formatCount(guardCount),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Distinct guard names'
            ),
            valueClassName: isLoading ? undefined : 'text-slate-600',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

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
        ],
        [],
    );

    const renderColumnValue = React.useCallback((permission: PermissionRecord, column: ColumnKey): React.ReactNode => {
        const { module, action } = resolveModuleAndAction(permission.name);

        switch (column) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{permission.name}</span>
                        <span className="text-xs text-muted-foreground">ID #{permission.id}</span>
                    </div>
                );
            case 'module':
                return (
                    <Badge className={`w-fit ${getModuleBadgeClass(module)}`}>
                        {module}
                    </Badge>
                );
            case 'action':
                return (
                    <Badge className={`w-fit ${getActionBadgeClass(action)}`}>
                        {action}
                    </Badge>
                );
            case 'guard':
                return <span className="text-sm text-muted-foreground">{permission.guard_name}</span>;
            case 'created_at':
                return <span className="text-sm text-muted-foreground">{formatDateValue(permission.created_at)}</span>;
            default:
                return '—';
        }
    }, []);

    const tableRows = permissionData.length > 0
        ? permissionData.map((permission, index) => (
                  <TableRow key={permission.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      {COLUMN_DEFINITIONS.map((column) => (
                          <TableCell
                              key={column.id}
                              className={
                                  column.align === 'center'
                                      ? 'text-center'
                                      : column.align === 'right'
                                          ? 'text-right'
                                          : undefined
                              }
                          >
                              {renderColumnValue(permission, column.id)}
                          </TableCell>
                      ))}
                  </TableRow>
              ))
        : (
            <TableRow>
                <TableCell colSpan={tableColumns.length} className="py-12">
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                            <Shield className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">No permissions found</h3>
                        <p className="mb-6 max-w-md text-sm text-muted-foreground">
                            {searchTerm
                                ? `No permissions match "${searchTerm}". Try adjusting your filters or search terms.`
                                : 'Permissions are managed automatically. Adjust filters or roles to view assigned access.'}
                        </p>
                    </div>
                </TableCell>
            </TableRow>
        );

    const mobileItems = React.useMemo(
        () =>
            permissionData.map((permission, index) => ({
                record: permission,
                position: rowOffset + index + 1,
            })),
        [permissionData, rowOffset],
    );

    const mobileContent = (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => `Guard: ${item.record.guard_name}`}
            renderContent={(item) => {
                const { module, action } = resolveModuleAndAction(item.record.name);

                return (
                    <div className="space-y-3 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Module</span>
                            <span className="text-right text-slate-900 dark:text-slate-100">{module}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Action</span>
                            <span className="text-right text-slate-900 dark:text-slate-100">{action}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Created</span>
                            <span className="text-right text-slate-900 dark:text-slate-100">{formatDateValue(item.record.created_at)}</span>
                        </div>
                    </div>
                );
            }}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No permissions found.
                </div>
            )}
        />
    );

    const filterChips =
        (activeFilterChips.length || searchTerm) && !isLoading ? (
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {activeFilterChips.map((chip) => (
                    <button
                        key={chip.key}
                        type="button"
                        onClick={() => clearFilter(chip.key)}
                        className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted/80"
                    >
                        {chip.label}
                    </button>
                ))}
                {searchTerm && (
                    <button
                        type="button"
                        onClick={() => {
                            setSearchTerm('');
                            handleNavigate({ search: undefined, page: 1 });
                        }}
                        className="text-xs text-primary underline"
                    >
                        Clear search
                    </button>
                )}
            </div>
        ) : undefined;

    const tableHeaderExtras = (
        <ListingFilterBar
            search={{
                value: searchTerm,
                placeholder: 'Search permissions...',
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: 'Rows',
                onChange: handlePerPageChange,
                options: availablePerPageOptions.map((option) => ({
                    value: String(option),
                    label: `${option} / page`,
                })),
            }}
            trailing={filterChips}
        >
            <Select value={selectedModule} onValueChange={handleModuleChange}>
                <SelectTrigger className="w-full min-w-[170px] sm:w-auto">
                    <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All modules</SelectItem>
                    {(moduleOptions ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    const headerActions = (
        <>
            {canExportPermissions && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                        }
                        if (selectedModule !== 'all') {
                            params.set('module', selectedModule);
                        }
                        if (sortColumn) {
                            params.set('sort', sortColumn);
                        }
                        if (sortDirection) {
                            params.set('direction', sortDirection);
                        }

                        const query = params.toString();
                        window.location.href = query ? `/permissions/export/csv?${query}` : '/permissions/export/csv';
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
        </>
    );

    return (
        <ListPageLayout
            headTitle="Permissions"
            title="Permission Management"
            description={`Manage ${formatCount(totalPermissions)} permission${totalPermissions === 1 ? '' : 's'} across the platform`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Permission Directory"
            tableDescription={`${formatCount(totalPermissions)} total permission${totalPermissions === 1 ? '' : 's'} in system`}
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                !isLoading && permissions?.links ? (
                    <ListingPaginationFooter
                        className="mt-4"
                        links={permissions.links}
                        from={permissions.from ?? undefined}
                        to={permissions.to ?? undefined}
                        total={permissions.total ?? undefined}
                    />
                ) : null
            }
        >
            <div className="hidden md:block">
                <div className="relative">
                    <ListingTableShell
                        columns={tableColumns}
                        sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
                    >
                        {tableRows}
                    </ListingTableShell>

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading permissions" className="h-12 w-12" />
                            <span className="text-sm text-muted-foreground">Loading permissions...</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative space-y-3 md:hidden">
                {mobileContent}

                {isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                        <img src="/images/loading-spinner.svg" alt="Loading permissions" className="h-10 w-10" />
                        <span className="text-sm text-muted-foreground">Loading permissions...</span>
                    </div>
                )}
            </div>
        </ListPageLayout>
    );
}

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
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
    Shield,
    CheckCircle,
    ListChecks,
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    ChevronRight,
} from 'lucide-react';

type ColumnKey = 'name' | 'permissions' | 'created_at';

type FilterChipKey = 'permissionGroup' | 'perPage';

interface PermissionSummary {
    name: string;
}

interface RoleRecord {
    id: number;
    name: string;
    guard_name?: string;
    permissions?: PermissionSummary[];
    created_at?: string | null;
}

interface RolesIndexProps {
    roles: {
        data: RoleRecord[];
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
        permission_group?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    permissionGroupOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
    stats?: {
        totalRoles?: number;
        adminRoles?: number;
        averagePermissions?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Roles',
        href: '/roles',
    },
];

const SKELETON_FLAG_KEY = 'roles.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Role', sortKey: 'name' },
    { id: 'permissions', label: 'Permissions' },
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

const getRoleBadgeClass = (roleName: string): string => {
    switch (roleName.toLowerCase()) {
        case 'admin':
            return 'border-rose-200 bg-rose-100 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/30 dark:text-rose-200';
        case 'manager':
            return 'border-indigo-200 bg-indigo-100 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/30 dark:text-indigo-200';
        case 'user':
            return 'border-emerald-200 bg-emerald-100 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200';
        default:
            return 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
    }
};

export default function RolesIndex({ roles, filters, permissionGroupOptions, perPageOptions, stats }: RolesIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewRole = hasPermission('roles.show');
    const canCreateRole = hasPermission('roles.create');
    const canEditRole = hasPermission('roles.edit');
    const canDeleteRole = hasPermission('roles.destroy');
    const canExportRoles = hasPermission('roles.export');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedPermissionGroup, setSelectedPermissionGroup] = React.useState(() => {
        const group = filters?.permission_group ?? null;
        return group && group !== '' ? group : 'all';
    });
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]),
        [perPageOptions],
    );

    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page ?? roles?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, roles?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedRole, setSelectedRole] = React.useState<RoleRecord | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const roleData = roles?.data ?? [];
    const isDataReady = Array.isArray(roleData);

    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const totalRoles = stats?.totalRoles ?? roles?.total ?? roleData.length ?? 0;
    const adminRoles = stats?.adminRoles ?? roleData.filter((role) => role.name.toLowerCase().includes('admin')).length;
    const averagePermissions = stats?.averagePermissions ?? (() => {
        if (!roleData.length) {
            return 0;
        }

        const total = roleData.reduce((sum, role) => sum + (role.permissions?.length ?? 0), 0);
        return Number((total / roleData.length).toFixed(1));
    })();
    const distinctGuards = roleData.reduce<Set<string>>((guards, role) => {
        if (role.guard_name) {
            guards.add(role.guard_name);
        }
        return guards;
    }, new Set()).size;

    const rowOffset = Math.max((roles?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            permission_group?: string;
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

            const nextPermissionGroup = hasOverride('permission_group')
                ? overrides.permission_group
                : selectedPermissionGroup !== 'all'
                    ? selectedPermissionGroup
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch,
                permission_group: nextPermissionGroup,
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

            router.get('/roles', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedPermissionGroup, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handlePermissionGroupChange = (value: string) => {
        setSelectedPermissionGroup(value);
        handleNavigate({ permission_group: value !== 'all' ? value : undefined, page: 1 });
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

    const handleDeleteClick = (role: RoleRecord) => {
        setSelectedRole(role);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedRole) {
            return;
        }

        setIsDeleting(true);
        const name = selectedRole.name;

        router.delete(`/roles/${selectedRole.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast({
                    title: 'Role deleted',
                    description: `${name} has been removed from the system.`,
                });
                setDeleteDialogOpen(false);
                setSelectedRole(null);
            },
            onError: () => {
                toast({
                    title: 'Unable to delete role',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                });
            },
            onFinish: () => {
                setIsDeleting(false);
            },
        });
    };

    const selectedPermissionGroupLabel = React.useMemo(() => {
        if (selectedPermissionGroup === 'all') {
            return null;
        }

        return permissionGroupOptions?.find((option) => option.value === selectedPermissionGroup)?.label ?? selectedPermissionGroup;
    }, [permissionGroupOptions, selectedPermissionGroup]);

    const activeFilterChips = React.useMemo(
        () =>
            [
                selectedPermissionGroupLabel
                    ? { key: 'permissionGroup' as FilterChipKey, label: `Group: ${selectedPermissionGroupLabel}` }
                    : null,
                perPage !== String(resolvedPerPage)
                    ? { key: 'perPage' as FilterChipKey, label: `Rows: ${perPage}` }
                    : null,
            ].filter(Boolean) as Array<{ key: FilterChipKey; label: string }>,
        [perPage, resolvedPerPage, selectedPermissionGroupLabel],
    );

    const clearFilter = React.useCallback(
        (key: FilterChipKey) => {
            switch (key) {
                case 'permissionGroup':
                    setSelectedPermissionGroup('all');
                    handleNavigate({ permission_group: undefined, page: 1 });
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
            id: 'total-roles',
            label: 'Total Roles',
            icon: <Shield className="h-3.5 w-3.5 text-indigo-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-16" aria-hidden="true" /> : formatCount(totalRoles),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Defined access groups'
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
        },
        {
            id: 'admin-roles',
            label: 'Admin Variants',
            icon: <Shield className="h-3.5 w-3.5 text-rose-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-14" aria-hidden="true" /> : formatCount(adminRoles),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'High privilege profiles'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'average-permissions',
            label: 'Avg Permissions',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-12" aria-hidden="true" /> : String(averagePermissions),
            description: isLoading ? (
                <Skeleton className="h-3 w-32" aria-hidden="true" />
            ) : (
                'Per role on average'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'guards-tracked',
            label: 'Guard Types',
            icon: <ListChecks className="h-3.5 w-3.5 text-sky-500" />,
            value: isLoading ? <Skeleton className="h-3.5 w-10" aria-hidden="true" /> : formatCount(distinctGuards),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'Unique guard names'
            ),
            valueClassName: isLoading ? undefined : 'text-sky-600',
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
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const renderColumnValue = React.useCallback((role: RoleRecord, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <Badge className={`w-fit items-center gap-1 ${getRoleBadgeClass(role.name)}`}>
                            <Shield className="h-3 w-3" />
                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                        </Badge>
                        {role.guard_name && (
                            <span className="text-xs text-muted-foreground">Guard: {role.guard_name}</span>
                        )}
                    </div>
                );
            case 'permissions':
                if (!role.permissions?.length) {
                    return <span className="text-sm text-muted-foreground">No permissions</span>;
                }

                const preview = role.permissions.slice(0, 3);
                const remaining = Math.max(role.permissions.length - preview.length, 0);

                return (
                    <div className="flex flex-wrap gap-1">
                        {preview.map((permission) => (
                            <Badge
                                key={`${role.id}-${permission.name}`}
                                className="border-slate-200 bg-slate-100 text-xs text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200"
                            >
                                {permission.name}
                            </Badge>
                        ))}
                        {remaining > 0 && (
                            <Badge className="border-slate-200 bg-transparent text-xs text-muted-foreground dark:border-slate-700">
                                +{remaining} more
                            </Badge>
                        )}
                    </div>
                );
            case 'created_at':
                return <span className="text-sm text-muted-foreground">{formatDateValue(role.created_at)}</span>;
            default:
                return '—';
        }
    }, []);

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`roles-skeleton-${rowIndex}`} aria-hidden="true">
                  {tableColumns.map((column) => (
                      <TableCell
                          key={`${column.id}-${rowIndex}`}
                          className={
                              column.align === 'center'
                                  ? 'text-center'
                                  : column.align === 'right'
                                      ? 'text-right'
                                      : undefined
                          }
                      >
                          <Skeleton className="mx-auto h-4 w-24 max-w-full" />
                      </TableCell>
                  ))}
              </TableRow>
          ))
        : roleData.length > 0
            ? roleData.map((role, index) => (
                  <TableRow key={role.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(role, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewRole && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/roles/${role.id}`,
                                  },
                                  canEditRole && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/roles/${role.id}/edit`,
                                  },
                                  canDeleteRole && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedRole?.id === role.id,
                                      onSelect: () => handleDeleteClick(role),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-12">
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                                <Shield className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">No roles found</h3>
                            <p className="mb-6 max-w-md text-sm text-muted-foreground">
                                {searchTerm
                                    ? `No roles match "${searchTerm}". Try adjusting your filters or search terms.`
                                    : 'Start by creating your first role to manage access levels effectively.'}
                            </p>
                            {canCreateRole && (
                                <Button asChild size="sm" className="shadow-sm">
                                    <Link href="/roles/create">
                                        <Plus className="mr-2 h-4 w-4" />
                                        {searchTerm ? 'Clear Filters & Add Role' : 'Add First Role'}
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () =>
            roleData.map((role, index) => ({
                record: role,
                position: rowOffset + index + 1,
            })),
        [roleData, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={3} rowCount={4} />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.record.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base font-semibold text-foreground">{item.record.name}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
            )}
            renderSubtitle={(item) => (item.record.guard_name ? `Guard: ${item.record.guard_name}` : undefined)}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Permissions</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.permissions?.length ?? 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Created</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">{formatDateValue(item.record.created_at)}</span>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewRole && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/roles/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditRole && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/roles/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteRole && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedRole?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No roles found.
                    {canCreateRole && (
                        <Link href="/roles/create" className="ml-1 text-primary underline">
                            Create one
                        </Link>
                    )}
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
                placeholder: 'Search by role name...',
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
            <Select value={selectedPermissionGroup} onValueChange={handlePermissionGroupChange}>
                <SelectTrigger className="w-full min-w-[170px] sm:w-auto">
                    <SelectValue placeholder="Permission group" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All groups</SelectItem>
                    {(permissionGroupOptions ?? []).map((option) => (
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
            {canExportRoles && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                        }
                        if (selectedPermissionGroup !== 'all') {
                            params.set('permission_group', selectedPermissionGroup);
                        }
                        if (sortColumn) {
                            params.set('sort', sortColumn);
                        }
                        if (sortDirection) {
                            params.set('direction', sortDirection);
                        }

                        const query = params.toString();
                        window.location.href = query ? `/roles/export/csv?${query}` : '/roles/export/csv';
                    }}
                >
                    Export CSV
                </Button>
            )}
            {canCreateRole && (
                <Button asChild>
                    <Link href="/roles/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Role
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Roles"
                title="Role Management"
                description={`Manage ${formatCount(totalRoles)} role${totalRoles === 1 ? '' : 's'} across the platform`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="Role Directory"
                tableDescription={`${formatCount(totalRoles)} total role${totalRoles === 1 ? '' : 's'} in system`}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && roles?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={roles.links}
                            from={roles.from ?? undefined}
                            to={roles.to ?? undefined}
                            total={roles.total ?? undefined}
                        />
                    ) : null
                }
            >
                <div className="hidden md:block">
                    <ListingTableShell
                        columns={tableColumns}
                        sort={{ column: sortColumn, direction: sortDirection, onToggle: handleSort }}
                    >
                        {tableRows}
                    </ListingTableShell>
                </div>

                <div className="space-y-3 md:hidden">{mobileContent}</div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedRole(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete Role"
                description="Are you sure you want to delete this role? This action cannot be undone."
                itemName={selectedRole?.name ?? undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

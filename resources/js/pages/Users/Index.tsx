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
import { index as usersIndexRoute } from '@/routes/users';
import {
    Users as UsersIcon,
    CheckCircle,
    XCircle,
    Shield,
    Eye,
    Edit,
    Trash2,
    Plus,
    Search,
    ChevronRight,
} from 'lucide-react';

type ColumnKey = 'name' | 'email' | 'roles' | 'verified' | 'created_at';

type FilterChipKey = 'role' | 'status' | 'perPage';

type VerificationStatus = 'verified' | 'pending';

interface RoleOption {
    label: string;
    value: string;
    guard?: string;
}

interface StatusOption {
    label: string;
    value: string;
}

interface UserRole {
    id: number;
    name: string;
}

interface UserData {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string | null;
    created_at?: string | null;
    roles?: UserRole[];
}

interface UsersIndexProps {
    users: {
        data: UserData[];
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
        role?: string | null;
        status?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    roleOptions?: RoleOption[];
    statusOptions?: StatusOption[];
    perPageOptions?: number[];
    stats?: {
        totalUsers?: number;
        verifiedUsers?: number;
        pendingUsers?: number;
        adminUsers?: number;
        managerUsers?: number;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'User management',
        href: usersIndexRoute().url,
    },
    {
        title: 'Users',
        href: '#',
    },
];

const SKELETON_FLAG_KEY = 'users.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{
    id: ColumnKey;
    label: string;
    sortKey?: string;
    align?: 'center' | 'right';
}> = [
    { id: 'name', label: 'Name', sortKey: 'name' },
    { id: 'email', label: 'Email', sortKey: 'email' },
    { id: 'roles', label: 'Roles' },
    { id: 'verified', label: 'Verified', sortKey: 'email_verified_at', align: 'center' },
    { id: 'created_at', label: 'Created', sortKey: 'created_at' },
];

const DEFAULT_STATUS_OPTIONS: StatusOption[] = [
    { label: 'All statuses', value: 'all' },
    { label: 'Verified', value: 'verified' },
    { label: 'Pending', value: 'pending' },
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

const resolveVerificationStatus = (user: UserData): VerificationStatus =>
    user.email_verified_at ? 'verified' : 'pending';

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

const getVerificationBadge = (status: VerificationStatus): React.ReactNode => {
    if (status === 'verified') {
        return (
            <Badge className="flex w-fit items-center gap-1 border-emerald-200 bg-emerald-100 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-200">
                <CheckCircle className="h-3 w-3" />
                Verified
            </Badge>
        );
    }

    return (
        <Badge className="flex w-fit items-center gap-1 border-amber-200 bg-amber-100 text-xs text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-200">
            <XCircle className="h-3 w-3" />
            Pending
        </Badge>
    );
};

export default function UsersIndex({ users, filters, roleOptions, statusOptions, perPageOptions, stats }: UsersIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewUser = hasPermission('users.show');
    const canCreateUser = hasPermission('users.create');
    const canEditUser = hasPermission('users.edit');
    const canDeleteUser = hasPermission('users.destroy');
    const canExportUsers = hasPermission('users.export');

    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedRole, setSelectedRole] = React.useState(() => {
        const role = filters?.role ?? null;
        return role && role !== '' ? role : 'all';
    });
    const [selectedStatus, setSelectedStatus] = React.useState(() => {
        const status = filters?.status ?? null;
        return status && status !== '' ? status : 'all';
    });
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const availablePerPageOptions = React.useMemo(
        () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
        [perPageOptions],
    );

    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page ?? users?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, users?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(users?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
        onlySamePath: true,
        targetPath: '/users',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const userData = users?.data ?? [];
    const totalUsers = stats?.totalUsers ?? users?.total ?? userData.length ?? 0;
    const verifiedUsers = stats?.verifiedUsers ?? userData.filter((user) => resolveVerificationStatus(user) === 'verified').length;
    const pendingUsers = stats?.pendingUsers ?? userData.filter((user) => resolveVerificationStatus(user) === 'pending').length;
    const adminUsers = stats?.adminUsers ?? userData.filter((user) => user.roles?.some((role) => role.name.toLowerCase() === 'admin')).length;
    const managerUsers = stats?.managerUsers ?? userData.filter((user) => user.roles?.some((role) => role.name.toLowerCase() === 'manager')).length;
    const rowOffset = Math.max((users?.from ?? 1) - 1, 0);

    const handleNavigate = React.useCallback(
        (overrides: {
            search?: string;
            role?: string;
            status?: string;
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

            const nextRole = hasOverride('role')
                ? overrides.role
                : selectedRole !== 'all'
                    ? selectedRole
                    : undefined;

            const nextStatus = hasOverride('status')
                ? overrides.status
                : selectedStatus !== 'all'
                    ? selectedStatus
                    : undefined;

            const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
            const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
            const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
            const nextPage = hasOverride('page') ? overrides.page : undefined;

            const params: Record<string, string | number | undefined> = {
                search: nextSearch,
                role: nextRole,
                status: nextStatus,
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

            router.get('/users', params, { preserveState: true, replace: false });
        },
        [perPage, searchTerm, selectedRole, selectedStatus, sortColumn, sortDirection],
    );

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleRoleChange = (value: string) => {
        setSelectedRole(value);
        handleNavigate({ role: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
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

    const handleDeleteClick = (user: UserData) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedUser) {
            return;
        }

        setIsDeleting(true);
        const name = selectedUser.name;

        router.delete(`/users/${selectedUser.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedUser(null);
                setIsDeleting(false);
                toast({
                    title: '✅ User Deleted',
                    description: `${name} has been removed successfully.`,
                });
            },
            onError: () => {
                setIsDeleting(false);
                toast({
                    title: '❌ Delete Failed',
                    description: 'Please try again or contact support if the issue persists.',
                    variant: 'destructive',
                });
            },
        });
    };

    const selectedRoleLabel = React.useMemo(() => {
        if (selectedRole === 'all') {
            return null;
        }

        return roleOptions?.find((option) => option.value === selectedRole)?.label ?? selectedRole;
    }, [roleOptions, selectedRole]);

    const selectedStatusLabel = React.useMemo(() => {
        if (selectedStatus === 'all') {
            return null;
        }

        return (statusOptions ?? DEFAULT_STATUS_OPTIONS).find((option) => option.value === selectedStatus)?.label ?? selectedStatus;
    }, [selectedStatus, statusOptions]);

    const activeFilterChips = React.useMemo(
        () =>
            [
                selectedRoleLabel ? { key: 'role' as FilterChipKey, label: `Role: ${selectedRoleLabel}` } : null,
                selectedStatusLabel ? { key: 'status' as FilterChipKey, label: `Status: ${selectedStatusLabel}` } : null,
                perPage !== String(resolvedPerPage)
                    ? { key: 'perPage' as FilterChipKey, label: `Rows: ${perPage}` }
                    : null,
            ].filter(Boolean) as Array<{ key: FilterChipKey; label: string }>,
        [perPage, resolvedPerPage, selectedRoleLabel, selectedStatusLabel],
    );

    const clearFilter = React.useCallback(
        (key: FilterChipKey) => {
            switch (key) {
                case 'role':
                    setSelectedRole('all');
                    handleNavigate({ role: undefined, page: 1 });
                    break;
                case 'status':
                    setSelectedStatus('all');
                    handleNavigate({ status: undefined, page: 1 });
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
            id: 'total-users',
            label: 'Total Users',
            icon: <UsersIcon className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                formatCount(totalUsers)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                'All accounts'
            ),
            valueClassName: isLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'verified-users',
            label: 'Verified Users',
            icon: <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(verifiedUsers)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Email confirmed'
            ),
            valueClassName: isLoading ? undefined : 'text-emerald-600',
        },
        {
            id: 'pending-users',
            label: 'Pending Verification',
            icon: <XCircle className="h-3.5 w-3.5 text-amber-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(pendingUsers)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Awaiting confirmation'
            ),
            valueClassName: isLoading ? undefined : 'text-amber-600',
        },
        {
            id: 'admin-users',
            label: 'Admins',
            icon: <Shield className="h-3.5 w-3.5 text-rose-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(adminUsers)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Full access roles'
            ),
            valueClassName: isLoading ? undefined : 'text-rose-600',
        },
        {
            id: 'manager-users',
            label: 'Managers',
            icon: <Shield className="h-3.5 w-3.5 text-indigo-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                formatCount(managerUsers)
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Management roles'
            ),
            valueClassName: isLoading ? undefined : 'text-indigo-600',
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

    const renderColumnValue = React.useCallback((user: UserData, column: ColumnKey): React.ReactNode => {
        switch (column) {
            case 'name':
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">ID #{user.id}</span>
                    </div>
                );
            case 'email':
                return <span className="text-muted-foreground">{user.email}</span>;
            case 'roles':
                return user.roles && user.roles.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                        {user.roles.map((role) => (
                            <Badge key={role.id} className={`flex w-fit items-center gap-1 ${getRoleBadgeClass(role.name)}`}>
                                <Shield className="h-3 w-3" />
                                {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                            </Badge>
                        ))}
                    </div>
                ) : (
                    <span className="text-sm text-muted-foreground">No roles</span>
                );
            case 'verified':
                return getVerificationBadge(resolveVerificationStatus(user));
            case 'created_at':
                return <span className="text-sm text-muted-foreground">{formatDateValue(user.created_at)}</span>;
            default:
                return '—';
        }
    }, []);

    const tableRows = userData.length > 0
        ? userData.map((user, index) => (
                  <TableRow key={user.id} className="hover:bg-muted/50">
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
                              {renderColumnValue(user, column.id)}
                          </TableCell>
                      ))}
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewUser && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/users/${user.id}`,
                                  },
                                  canEditUser && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/users/${user.id}/edit`,
                                  },
                                  canDeleteUser && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      disabled: isDeleting && selectedUser?.id === user.id,
                                      onSelect: () => handleDeleteClick(user),
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
                            <UsersIcon className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="mb-2 text-lg font-semibold">No users found</h3>
                        <p className="mb-6 max-w-md text-sm text-muted-foreground">
                            {searchTerm
                                ? `No users match "${searchTerm}". Try adjusting your filters or search terms.`
                                : 'Get started by adding your first user to the system. Manage access and permissions effectively.'}
                        </p>
                        {canCreateUser && (
                            <Button asChild size="sm" className="shadow-sm">
                                <Link href="/users/create">
                                    <Plus className="mr-2 h-4 w-4" />
                                    {searchTerm ? 'Clear Filters & Add User' : 'Add First User'}
                                </Link>
                            </Button>
                        )}
                    </div>
                </TableCell>
            </TableRow>
        );

    const mobileItems = React.useMemo(
        () =>
            userData.map((user, index) => ({
                record: user,
                position: rowOffset + index + 1,
            })),
        [userData, rowOffset],
    );

    const mobileContent = (
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
            renderSubtitle={(item) => item.record.email}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Roles</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {item.record.roles && item.record.roles.length > 0 ? (
                                item.record.roles.map((role) => role.name).join(', ')
                            ) : (
                                'No roles'
                            )}
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Verified</span>
                        <span className="text-right text-slate-900 dark:text-slate-100">
                            {getVerificationBadge(resolveVerificationStatus(item.record))}
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
                    {canViewUser && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/users/${item.record.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {canEditUser && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/users/${item.record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {canDeleteUser && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.record)}
                            disabled={isDeleting && selectedUser?.id === item.record.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No users found.
                    {canCreateUser && (
                        <Link href="/users/create" className="ml-1 text-primary underline">
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
                        <XCircle className="h-3 w-3" />
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
                placeholder: 'Search by name or email...',
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
            <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
                    <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All roles</SelectItem>
                    {(roleOptions ?? []).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>

            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    {(statusOptions ?? DEFAULT_STATUS_OPTIONS).map((option) => (
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
            {canExportUsers && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                        }
                        if (selectedRole !== 'all') {
                            params.set('role', selectedRole);
                        }
                        if (selectedStatus !== 'all') {
                            params.set('status', selectedStatus);
                        }
                        if (sortColumn) {
                            params.set('sort', sortColumn);
                        }
                        if (sortDirection) {
                            params.set('direction', sortDirection);
                        }

                        const query = params.toString();
                        window.location.href = query ? `/users/export/csv?${query}` : '/users/export/csv';
                    }}
                >
                    Export CSV
                </Button>
            )}
            {canCreateUser && (
                <Button asChild>
                    <Link href="/users/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Link>
                </Button>
            )}
        </>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Users"
                title="User Management"
                description={`Manage ${formatCount(totalUsers)} system user${totalUsers === 1 ? '' : 's'}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="User Directory"
                tableDescription={`${formatCount(totalUsers)} total user${totalUsers === 1 ? '' : 's'} in system`}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    !isLoading && users?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={users.links}
                            from={users.from ?? undefined}
                            to={users.to ?? undefined}
                            total={users.total ?? undefined}
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
                                <img src="/images/loading-spinner.svg" alt="Loading users" className="h-12 w-12" />
                                <span className="text-sm text-muted-foreground">Loading users...</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}

                    {isLoading && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                            <img src="/images/loading-spinner.svg" alt="Loading users" className="h-10 w-10" />
                            <span className="text-sm text-muted-foreground">Loading users...</span>
                        </div>
                    )}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedUser(null);
                        setIsDeleting(false);
                    }
                }}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                itemName={selectedUser?.name ?? undefined}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

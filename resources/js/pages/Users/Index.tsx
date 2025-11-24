import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { InertiaPagination } from '@/components/ui/pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowUpDown, CheckCircle, Edit, Eye, FileDown, Plus, Search, Shield, Trash2, Users, XCircle } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

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
        totalUsers: number;
        verifiedUsers: number;
        pendingUsers: number;
        adminUsers: number;
        managerUsers: number;
    };
}

export default function UsersIndex({ users, filters, roleOptions, statusOptions, perPageOptions, stats }: UsersIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedRole, setSelectedRole] = useState(() => {
        const role = filters?.role ?? null;
        return role && role !== '' ? role : 'all';
    });
    const [selectedStatus, setSelectedStatus] = useState(() => {
        const status = filters?.status ?? null;
        return status && status !== '' ? status : 'all';
    });
    const [sortBy, setSortBy] = useState(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const availablePerPageOptions = useMemo(() => (
        perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]
    ), [perPageOptions]);

    const resolvedPerPage = useMemo(() => {
        const candidate = filters?.per_page ?? users?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, users?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage));

    useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const handleNavigate = useCallback((overrides: Partial<{
        search?: string;
        role?: string;
        status?: string;
        sort?: string;
        direction?: 'asc' | 'desc';
        page?: number;
        per_page?: number;
    }> = {}) => {
        const numericPerPage = Number(perPage);

        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined
                ? overrides.search
                : (searchTerm.trim() ? searchTerm.trim() : undefined),
            role: overrides.role !== undefined
                ? overrides.role
                : (selectedRole !== 'all' ? selectedRole : undefined),
            status: overrides.status !== undefined
                ? overrides.status
                : (selectedStatus !== 'all' ? selectedStatus : undefined),
            sort: overrides.sort ?? sortBy,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: overrides.per_page !== undefined
                ? overrides.per_page
                : (Number.isFinite(numericPerPage) ? numericPerPage : undefined),
        };

        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || ! Number.isFinite(value) || value <= 0))
            ) {
                delete params[key];
            }
        });

        router.get('/users', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedRole, selectedStatus, sortBy, sortDirection, perPage]);

    const handleSearch = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value;
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleSort = (column: string) => {
        let newDirection: 'asc' | 'desc' = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }

        setSortBy(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
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

    const handleDeleteClick = (user: UserData) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (! selectedUser) {
            return;
        }

        setIsDeleting(true);
        router.delete(`/users/${selectedUser.id}`, {
            preserveState: true,
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedUser(null);
                setIsDeleting(false);
            },
            onError: () => {
                setIsDeleting(false);
            },
        });
    };

    const SortIcon = ({ column }: { column: string }) => {
        if (sortBy !== column) {
            return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
        }

        return (
            <ArrowUpDown
                className={`ml-2 h-4 w-4 transition-transform ${
                    sortDirection === 'desc' ? 'rotate-180' : ''
                }`}
            />
        );
    };

    const userCount = stats?.totalUsers ?? users?.total ?? 0;
    const verifiedCount = stats?.verifiedUsers ?? users?.data?.filter((user) => user.email_verified_at).length ?? 0;
    const pendingCount = stats?.pendingUsers ?? users?.data?.filter((user) => ! user.email_verified_at).length ?? 0;
    const adminCount = stats?.adminUsers ?? users?.data?.filter((user) => user.roles?.some((role) => role.name === 'admin')).length ?? 0;
    const managerCount = stats?.managerUsers ?? users?.data?.filter((user) => user.roles?.some((role) => role.name === 'manager')).length ?? 0;

    const currentPage = users?.current_page || 1;
    const totalPages = users?.last_page || 1;

    const getRoleBadgeColor = (roleName: string) => {
        switch (roleName.toLowerCase()) {
            case 'admin':
                return 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
            case 'manager':
                return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200';
            case 'user':
                return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200';
        }
    };

    const statsCards = [
        {
            title: 'Total Users',
            value: userCount,
            description: 'All accounts',
            icon: <Users className="h-5 w-5" />,
            accentClassName: 'text-blue-600',
            helperClassName: 'bg-blue-100 text-blue-600',
        },
        {
            title: 'Verified',
            value: verifiedCount,
            description: 'Email confirmed',
            icon: <CheckCircle className="h-5 w-5" />,
            accentClassName: 'text-emerald-600',
            helperClassName: 'bg-emerald-100 text-emerald-600',
        },
        {
            title: 'Pending',
            value: pendingCount,
            description: 'Awaiting verification',
            icon: <XCircle className="h-5 w-5" />,
            accentClassName: 'text-amber-600',
            helperClassName: 'bg-amber-100 text-amber-600',
        },
        {
            title: 'Admins',
            value: adminCount,
            description: 'Full access roles',
            icon: <Shield className="h-5 w-5" />,
            accentClassName: 'text-rose-600',
            helperClassName: 'bg-rose-100 text-rose-600',
        },
        {
            title: 'Managers',
            value: managerCount,
            description: 'Management roles',
            icon: <Shield className="h-5 w-5" />,
            accentClassName: 'text-purple-600',
            helperClassName: 'bg-purple-100 text-purple-600',
        },
    ];

    const statsSection = (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
            {statsCards.map((card) => (
                <Card key={card.title} className="border border-slate-200/70 shadow-sm transition hover:shadow-md dark:border-slate-800/70">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{card.title}</p>
                            <p className={`mt-2 text-2xl font-semibold ${card.accentClassName}`}>{card.value}</p>
                            <p className="text-xs text-muted-foreground">{card.description}</p>
                        </div>
                        <div className={`flex h-10 w-10 items-center justify-center rounded-full ${card.helperClassName}`}>
                            {card.icon}
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const headerActions = (
        <>
            {hasPermission('users.export') && (
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
                        if (sortBy) {
                            params.set('sort', sortBy);
                        }
                        if (sortDirection) {
                            params.set('direction', sortDirection);
                        }

                        const query = params.toString();
                        window.location.href = query ? `/users/export/csv?${query}` : '/users/export/csv';
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('users.create') && (
                <Button asChild>
                    <Link href="/users/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add User
                    </Link>
                </Button>
            )}
        </>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                />
            </div>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
                <SelectTrigger className="w-[180px]">
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
                <SelectTrigger className="w-[170px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    {(statusOptions ?? [
                        { label: 'All statuses', value: 'all' },
                        { label: 'Verified', value: 'verified' },
                        { label: 'Pending', value: 'pending' },
                    ]).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <span className="hidden sm:inline">Rows</span>
                <Select value={perPage} onValueChange={handlePerPageChange}>
                    <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder="Per page" />
                    </SelectTrigger>
                    <SelectContent>
                        {availablePerPageOptions.map((option) => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    return (
        <>
            <ListPageLayout
                headTitle="Users"
                title="User Management"
                description={`Manage ${userCount} system user${userCount === 1 ? '' : 's'}`}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle="User Directory"
                tableDescription={`${userCount} total user${userCount === 1 ? '' : 's'} in system`}
                tableHeaderExtras={tableHeaderExtras}
                pagination={
                    <InertiaPagination
                        from={users?.from}
                        to={users?.to}
                        total={userCount}
                        links={users?.links}
                        currentPage={currentPage}
                        lastPage={totalPages}
                        className="mt-0 border-t bg-muted/30 p-4"
                    />
                }
            >
                <Table>
                    <TableHeader>
                        <TableRow className="sticky top-0 z-50 bg-background border-b">
                            <TableHead className="w-12 bg-background text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                No.
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort('name')}
                                className="cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                            >
                                <div className="flex items-center">
                                    Name <SortIcon column="name" />
                                </div>
                            </TableHead>
                            <TableHead
                                onClick={() => handleSort('email')}
                                className="cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                            >
                                <div className="flex items-center">
                                    Email <SortIcon column="email" />
                                </div>
                            </TableHead>
                            <TableHead className="bg-background">Roles</TableHead>
                            <TableHead className="bg-background">Verified</TableHead>
                            <TableHead
                                onClick={() => handleSort('created_at')}
                                className="cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
                            >
                                <div className="flex items-center">
                                    Created <SortIcon column="created_at" />
                                </div>
                            </TableHead>
                            <TableHead className="bg-background text-center">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users?.data && users.data.length > 0 ? (
                            users.data.map((user, index) => {
                                const rowNumber = (users.from ?? 1) + index;

                                return (
                                    <TableRow key={user.id} className="hover:bg-muted/50">
                                        <TableCell className="w-12 text-center text-sm font-semibold text-muted-foreground">
                                            {rowNumber}
                                        </TableCell>
                                        <TableCell className="font-medium">{user.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge
                                                            key={role.id}
                                                            className={`flex w-fit items-center gap-1 ${getRoleBadgeColor(role.name)}`}
                                                        >
                                                            <Shield className="h-3 w-3" />
                                                            {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">No roles</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                className={`flex w-fit items-center gap-1 ${
                                                    user.email_verified_at
                                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200'
                                                        : 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-200'
                                                }`}
                                            >
                                                {user.email_verified_at ? (
                                                    <>
                                                        <CheckCircle className="h-3 w-3" />
                                                        Verified
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="h-3 w-3" />
                                                        Pending
                                                    </>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button asChild size="sm" variant="ghost">
                                                    <Link href={`/users/${user.id}`}>
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                </Button>
                                                {hasPermission('users.edit') && (
                                                    <Button asChild size="sm" variant="ghost">
                                                        <Link href={`/users/${user.id}/edit`}>
                                                            <Edit className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                )}
                                                {hasPermission('users.destroy') && (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        onClick={() => handleDeleteClick(user)}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="py-16">
                                    <div className="flex flex-col items-center justify-center text-center">
                                        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                                            <Users className="h-10 w-10 text-muted-foreground" />
                                        </div>
                                        <h3 className="mb-2 text-xl font-semibold">No users found</h3>
                                        <p className="mb-6 max-w-md text-muted-foreground">
                                            {searchTerm
                                                ? `No users match "${searchTerm}". Try adjusting your filters or search terms.`
                                                : 'Get started by adding your first user to the system. Manage access and permissions effectively.'}
                                        </p>
                                        {hasPermission('users.create') && (
                                            <Button asChild size="lg" className="shadow-lg">
                                                <Link href="/users/create">
                                                    <Plus className="mr-2 h-4 w-4" />
                                                    {searchTerm ? 'Clear Filters & Add User' : 'Add First User'}
                                                </Link>
                                            </Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                itemName={selectedUser?.name ?? ''}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

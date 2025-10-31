import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { Head, Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Trash2, Search, ArrowUpDown, ChevronLeft, ChevronRight, FileDown, Users, Shield, Mail, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Users',
        href: '/users',
    },
];

interface UserData {
    id: number;
    name: string;
    email: string;
    email_verified_at?: string;
    created_at?: string;
    roles?: Array<{
        id: number;
        name: string;
    }>;
}

interface UsersIndexProps {
    users: {
        data: UserData[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
}

export default function UsersIndex({ users }: UsersIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState('');
    const [sortBy, setSortBy] = React.useState('name');
    const [sortDirection, setSortDirection] = React.useState('asc');
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedUser, setSelectedUser] = React.useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchTerm(value);

        router.get('/users',
            { search: value, sort: sortBy, direction: sortDirection },
            { preserveState: true, replace: false }
        );
    };

    const handleSort = (column: string) => {
        let newDirection = 'asc';
        if (sortBy === column && sortDirection === 'asc') {
            newDirection = 'desc';
        }

        setSortBy(column);
        setSortDirection(newDirection);

        router.get('/users',
            { search: searchTerm, sort: column, direction: newDirection },
            { preserveState: true, replace: false }
        );
    };

    const handleDeleteClick = (user: UserData) => {
        setSelectedUser(user);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedUser) return;

        setIsDeleting(true);
        router.delete(`/users/${selectedUser.id}`, {
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

    const userCount = users?.total || 0;
    const perPage = users?.per_page || 15;
    const currentPage = users?.current_page || 1;
    const totalPages = users?.last_page || 1;

    // Calculate stats for dashboard cards
    const verifiedCount = users?.data?.filter(user => user.email_verified_at).length || 0;
    const adminCount = users?.data?.filter(user => user.roles?.some(role => role.name === 'admin')).length || 0;
    const managerCount = users?.data?.filter(user => user.roles?.some(role => role.name === 'manager')).length || 0;
    const regularUserCount = users?.data?.filter(user => user.roles?.some(role => role.name === 'user')).length || 0;

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

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="flex h-full flex-1 flex-col gap-6 overflow-hidden rounded-xl p-4">
                {/* Header Section */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">User Management</h1>
                        <p className="text-muted-foreground mt-2">
                            Manage {userCount} system user{userCount !== 1 ? 's' : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {hasPermission('users.export') && (
                            <Button variant="outline" onClick={() => {
                                const params = new URLSearchParams({
                                    search: searchTerm,
                                    sort: sortBy,
                                    direction: sortDirection,
                                });
                                window.location.href = `/users/export/csv?${params.toString()}`;
                            }}>
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
                    </div>
                </div>

                {/* Enhanced Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="border-l-4 border-l-blue-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Total Users</p>
                                    <p className="text-2xl font-bold text-blue-600">{userCount}</p>
                                    <p className="text-xs text-muted-foreground">All accounts</p>
                                </div>
                                <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Users className="h-5 w-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Verified</p>
                                    <p className="text-2xl font-bold text-green-600">{verifiedCount}</p>
                                    <p className="text-xs text-muted-foreground">Email confirmed</p>
                                </div>
                                <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                                    <CheckCircle className="h-5 w-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Admins</p>
                                    <p className="text-2xl font-bold text-red-600">{adminCount}</p>
                                    <p className="text-xs text-muted-foreground">Full access</p>
                                </div>
                                <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-red-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 hover:shadow-md transition-all duration-200">
                        <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">Managers</p>
                                    <p className="text-2xl font-bold text-purple-600">{managerCount}</p>
                                    <p className="text-xs text-muted-foreground">Limited access</p>
                                </div>
                                <div className="h-10 w-10 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Shield className="h-5 w-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Table Section */}
                <Card className="flex flex-1 flex-col overflow-hidden">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>User Directory</CardTitle>
                                <CardDescription>
                                    {userCount} total user{userCount !== 1 ? 's' : ''} in system
                                </CardDescription>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="relative w-80">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search by name or email..."
                                        value={searchTerm}
                                        onChange={handleSearch}
                                        className="pl-10 focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-1 p-0 flex flex-col overflow-hidden">
                        <div className="rounded-lg border overflow-auto max-h-[55vh] relative flex-1">
                            <Table>
                                <TableHeader>
                                    <TableRow className="sticky top-0 z-50 bg-background border-b">
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
                                            onClick={() => handleSort('name')}
                                        >
                                            <div className="flex items-center">
                                                Name <SortIcon column="name" />
                                            </div>
                                        </TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
                                            onClick={() => handleSort('email')}
                                        >
                                            <div className="flex items-center">
                                                Email <SortIcon column="email" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="bg-background">Roles</TableHead>
                                        <TableHead className="bg-background">Verified</TableHead>
                                        <TableHead
                                            className="cursor-pointer select-none hover:bg-muted/70 transition-colors bg-background"
                                            onClick={() => handleSort('created_at')}
                                        >
                                            <div className="flex items-center">
                                                Created <SortIcon column="created_at" />
                                            </div>
                                        </TableHead>
                                        <TableHead className="text-center bg-background">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users?.data && users.data.length > 0 ? (
                                        users.data.map((user) => (
                                            <TableRow key={user.id} className="hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    {user.name}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {user.email}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles && user.roles.length > 0 ? (
                                                            user.roles.map((role) => (
                                                                <Badge
                                                                    key={role.id}
                                                                    className={`flex items-center gap-1 w-fit ${getRoleBadgeColor(role.name)}`}
                                                                >
                                                                    <Shield className="h-3 w-3" />
                                                                    {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                                                                </Badge>
                                                            ))
                                                        ) : (
                                                            <span className="text-muted-foreground text-sm">No roles</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        className={`flex items-center gap-1 w-fit ${
                                                            user.email_verified_at
                                                                ? 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200'
                                                                : 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200'
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
                                                <TableCell className="text-muted-foreground text-sm">
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
                                                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-16">
                                                <div className="flex flex-col items-center justify-center text-center">
                                                    <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
                                                        <Users className="h-10 w-10 text-muted-foreground" />
                                                    </div>
                                                    <h3 className="text-xl font-semibold mb-2">No users found</h3>
                                                    <p className="text-muted-foreground mb-6 max-w-md">
                                                        {searchTerm
                                                            ? `No users match "${searchTerm}". Try adjusting your search terms.`
                                                            : "Get started by adding your first user to the system. Manage access and permissions effectively."
                                                        }
                                                    </p>
                                                    {hasPermission('users.create') && (
                                                        <Button asChild size="lg" className="shadow-lg">
                                                            <Link href="/users/create">
                                                                <Plus className="mr-2 h-4 w-4" />
                                                                {searchTerm ? 'Clear Search & Add User' : 'Add First User'}
                                                            </Link>
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <InertiaPagination
                          from={users?.from}
                          to={users?.to}
                          total={userCount}
                          links={users?.links}
                          currentPage={currentPage}
                          lastPage={totalPages}
                          className="mt-0 p-4 border-t bg-muted/30 flex-shrink-0"
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Delete Confirmation Dialog */}
            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
                title="Delete User"
                description="Are you sure you want to delete this user? This action cannot be undone."
                itemName={selectedUser?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </AppLayout>
    );
}

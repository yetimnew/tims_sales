import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowUpDown, Eye, FileDown, Layers, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InertiaPagination } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePermissions } from '@/hooks/use-permissions';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Permissions',
        href: '/permissions',
    },
];

interface Permission {
    id: number;
    name: string;
    guard_name: string;
    created_at: string;
}

interface PermissionsIndexProps {
    permissions: {
        data: Permission[];
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
        guard?: string | null;
        module?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    moduleOptions?: Array<{ label: string; value: string }>;
    perPageOptions?: number[];
}

export default function PermissionsIndex({ permissions, filters, moduleOptions, perPageOptions }: PermissionsIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = useState(filters?.search ?? '');
    const [selectedModule, setSelectedModule] = useState(() => {
        const module = filters?.module ?? null;
        return module && module !== '' ? module : 'all';
    });
    const [sortBy, setSortBy] = useState(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(filters?.direction ?? 'asc');

    const availablePerPageOptions = useMemo(() => (
        perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]
    ), [perPageOptions]);

    const resolvedPerPage = useMemo(() => {
        const candidate = filters?.per_page ?? permissions?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, permissions?.per_page, availablePerPageOptions]);

    const [perPage, setPerPage] = useState<string>(() => String(resolvedPerPage));

    useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const handleNavigate = useCallback((overrides: Partial<{
        search?: string;
        module?: string;
        sort?: string;
        direction?: 'asc' | 'desc';
        page?: number;
        per_page?: number;
    }> = {}) => {
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined
                ? overrides.search
                : (searchTerm.trim() ? searchTerm.trim() : undefined),
            module: overrides.module !== undefined
                ? overrides.module
                : (selectedModule !== 'all' ? selectedModule : undefined),
            sort: overrides.sort ?? sortBy,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: overrides.per_page !== undefined
                ? overrides.per_page
                : Number(perPage),
        };

        Object.keys(params).forEach((key) => {
            const value = params[key];
            if (
                value === undefined ||
                value === null ||
                value === '' ||
                (key === 'per_page' && (typeof value !== 'number' || !Number.isFinite(value) || value <= 0))
            ) {
                delete params[key];
            }
        });

        router.get('/permissions', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedModule, sortBy, sortDirection, perPage]);

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

    const handleModuleChange = (value: string) => {
        setSelectedModule(value);
        handleNavigate({ module: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
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

    const permissionCount = permissions?.total || 0;
    const currentPage = permissions?.current_page || 1;
    const totalPages = permissions?.last_page || 1;

    const moduleCount = (moduleOptions ?? []).length > 0
        ? moduleOptions!.length
        : new Set((permissions?.data ?? []).map(permission => {
            const [moduleName] = permission.name.split('.');
            return moduleName ?? permission.name;
        })).size;

    const statsCards = [
        {
            title: 'Total Permissions',
            value: permissionCount,
            description: 'Across the platform',
            accentClassName: 'text-indigo-600',
            helperClassName: 'bg-indigo-100 text-indigo-600',
            icon: <Shield className="h-5 w-5" />,
        },
        {
            title: 'Modules',
            value: moduleCount,
            description: 'Permission groups',
            accentClassName: 'text-amber-600',
            helperClassName: 'bg-amber-100 text-amber-600',
            icon: <Layers className="h-5 w-5" />,
        },
    ];

    const statsSection = (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {statsCards.map(card => (
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
            {hasPermission('permissions.export') && (
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
                        if (sortBy) {
                            params.set('sort', sortBy);
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

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search permissions..."
                    value={searchTerm}
                    onChange={handleSearch}
                    className="pl-10"
                />
            </div>
            <Select value={selectedModule} onValueChange={handleModuleChange}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All modules</SelectItem>
                    {(moduleOptions ?? []).map(option => (
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
                        {availablePerPageOptions.map(option => (
                            <SelectItem key={option} value={String(option)}>
                                {option} / page
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );

    const getModuleBadgeColor = (module: string) => {
        switch (module.toLowerCase()) {
            case 'trucks':
                return 'bg-blue-500 text-white';
            case 'drivers':
                return 'bg-green-500 text-white';
            case 'maintenance':
                return 'bg-orange-500 text-white';
            case 'fuel':
                return 'bg-yellow-500 text-white';
            case 'financial':
                return 'bg-purple-500 text-white';
            case 'users':
                return 'bg-red-500 text-white';
            case 'roles':
                return 'bg-indigo-500 text-white';
            case 'permissions':
                return 'bg-pink-500 text-white';
            default:
                return 'bg-gray-500 text-white';
        }
    };

    const getActionBadgeColor = (action: string) => {
        switch (action.toLowerCase()) {
            case 'create':
                return 'bg-green-100 text-green-800';
            case 'read':
            case 'show':
                return 'bg-blue-100 text-blue-800';
            case 'update':
            case 'edit':
                return 'bg-yellow-100 text-yellow-800';
            case 'delete':
            case 'destroy':
                return 'bg-red-100 text-red-800';
            case 'export':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <ListPageLayout
            headTitle="Permissions"
            title="Permission Management"
            description="Manage system permissions and access control"
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Permission Directory"
            tableDescription={`${permissionCount} total permission${permissionCount === 1 ? '' : 's'} in system`}
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <InertiaPagination
                    from={permissions?.from ?? undefined}
                    to={permissions?.to ?? undefined}
                    total={permissionCount}
                    links={permissions?.links}
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
                            <div className="flex items center">
                                Permission <SortIcon column="name" />
                            </div>
                        </TableHead>
                        <TableHead className="bg-background">Module</TableHead>
                        <TableHead className="bg-background">Action</TableHead>
                        <TableHead className="bg-background text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {permissions?.data && permissions.data.length > 0 ? (
                        permissions.data.map((permission, index) => {
                            const rowNumber = (permissions.from ?? 1) + index;
                            const [module, rawAction = 'general'] = permission.name.split('.');
                            const action = rawAction.toLowerCase();

                            return (
                                <TableRow key={permission.id}>
                                    <TableCell className="w-12 text-center text-sm font-semibold text-muted-foreground">
                                        {rowNumber}
                                    </TableCell>
                                    <TableCell className="font-medium">{permission.name}</TableCell>
                                    <TableCell>
                                        <Badge className={getModuleBadgeColor(module)}>
                                            {module}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={getActionBadgeColor(action)}>
                                            {action}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="flex justify-end space-x-2">
                                        {hasPermission('permissions.show') && (
                                            <Link href={`/permissions/${permission.id}`}>
                                                <Button variant="ghost" size="icon">
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        )}
                                    </TableCell>
                                </TableRow>
                            );
                        })
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="py-16">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-muted/50">
                                        <Shield className="h-10 w-10 text-muted-foreground" />
                                    </div>
                                    <h3 className="mb-2 text-xl font-semibold">No permissions found</h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm
                                            ? `No permissions match "${searchTerm}". Try adjusting your search terms.`
                                            : 'Permissions are managed automatically. Use roles to assign permissions to users.'
                                        }
                                    </p>
                                </div>
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ListPageLayout>
    );
}

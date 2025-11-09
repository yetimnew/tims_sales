import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import ListPageLayout from '@/components/layouts/list-page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Plus, Eye, Edit, Search, ArrowUpDown, Trash2, FileDown, Users, UserCheck, UserX, User, MapPin as MapPinIcon, Phone } from 'lucide-react';
import { InertiaPagination } from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as React from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Drivers',
        href: '/drivers',
    },
];

interface DriverData {
    id: number;
    driverid: string;
    name: string;
    sex: string;
    zone?: string;
    mobile?: string;
    hireddate?: string;
    status: string;
}

interface DriversIndexProps {
    drivers: {
        data: DriverData[];
        current_page: number;
        last_page: number;
        total: number;
        from: number;
        to: number;
        links: Array<{
            url: string | null;
            label: string;
            active: boolean;
        }>;
    };
    metrics: {
        total: number;
        active: number;
        inactive: number;
        male: number;
        female: number;
    };
    filters: {
        search?: string | null;
        status?: string | null;
        sex?: string | null;
        sort?: string | null;
        direction?: 'asc' | 'desc' | null;
        per_page?: number | null;
    };
    statusOptions: Array<{ label: string; value: string }>;
    genderOptions: Array<{ label: string; value: string }>;
    perPageOptions: number[];
}

const columns: Array<{ key: keyof DriverData | 'status'; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'driverid', label: 'Driver ID' },
    { key: 'sex', label: 'Gender' },
    { key: 'zone', label: 'Location' },
    { key: 'mobile', label: 'Phone' },
    { key: 'hireddate', label: 'Hired Date' },
    { key: 'status', label: 'Status' },
];

export default function DriversIndex({ drivers, metrics, filters, statusOptions, genderOptions, perPageOptions }: DriversIndexProps) {
    const { hasPermission } = usePermissions();
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(filters?.status ?? 'all');
    const [selectedGender, setSelectedGender] = React.useState(filters?.sex ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [10, 15, 25, 50]), [perPageOptions]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 10;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const driverData = drivers?.data ?? [];
    const totalDrivers = metrics?.total ?? drivers?.total ?? 0;
    const currentPage = drivers?.current_page ?? 1;
    const lastPage = drivers?.last_page ?? 1;

    const handleNavigate = React.useCallback((overrides: Partial<{ search?: string; status?: string; sex?: string; sort?: string; direction?: 'asc' | 'desc'; page?: number; per_page?: number }>) => {
        const perPageValue = overrides.per_page !== undefined ? overrides.per_page : Number(perPage);
        const params: Record<string, string | number | undefined> = {
            search: overrides.search !== undefined ? overrides.search : (searchTerm.trim() ? searchTerm.trim() : undefined),
            status: overrides.status !== undefined ? overrides.status : (selectedStatus !== 'all' ? selectedStatus : undefined),
            sex: overrides.sex !== undefined ? overrides.sex : (selectedGender !== 'all' ? selectedGender : undefined),
            sort: overrides.sort ?? sortColumn,
            direction: overrides.direction ?? sortDirection,
            page: overrides.page,
            per_page: perPageValue,
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

        router.get('/drivers', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, selectedGender, sortColumn, sortDirection, perPage]);

    const getStatusBadge = (status: string) => {
        const baseClasses = 'flex items-center gap-1 w-fit border px-2 py-1 text-xs font-medium rounded-full';

        if (status === 'active') {
            return <span className={`${baseClasses} border-green-200 bg-green-100 text-green-700`}>Active</span>;
        }

        if (status === 'inactive') {
            return <span className={`${baseClasses} border-red-200 bg-red-100 text-red-700`}>Inactive</span>;
        }

        return <span className={`${baseClasses} border-muted bg-muted/60 text-muted-foreground capitalize`}>{status}</span>;
    };

    const getSexBadge = (sex: string) => {
        const label = sex?.charAt(0).toUpperCase() + sex?.slice(1);
        return (
            <Badge variant="outline" className="gap-1">
                {sex === 'male' ? '👨' : sex === 'female' ? '👩' : '👤'}
                {label || 'N/A'}
            </Badge>
        );
    };

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        setSelectedStatus(value);
        handleNavigate({ status: value !== 'all' ? value : undefined, page: 1 });
    };

    const handleGenderChange = (value: string) => {
        setSelectedGender(value);
        handleNavigate({ sex: value !== 'all' ? value : undefined, page: 1 });
    };

    const handlePerPageChange = (value: string) => {
        setPerPage(value);
        const numericValue = Number(value);
        handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
    };

    const handleSort = (column: string) => {
        const newDirection = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
    };

    const renderHeaderCell = (column: string, label: string) => (
        <TableHead
            key={column}
            className="sticky top-0 z-20 cursor-pointer select-none bg-background transition-colors hover:bg-muted/70"
            onClick={() => handleSort(column)}
        >
            <div className="flex items-center gap-2">
                {label}
                <ArrowUpDown
                    size={14}
                    className={sortColumn === column ? 'text-primary' : 'text-muted-foreground opacity-50'}
                />
            </div>
        </TableHead>
    );

    const headerActions = (
        <>
            {hasPermission('drivers.export') && (
                <Button
                    variant="outline"
                    onClick={() => {
                        const params = new URLSearchParams();
                        if (searchTerm.trim()) {
                            params.set('search', searchTerm.trim());
                        }
                        if (selectedStatus !== 'all') {
                            params.set('status', selectedStatus);
                        }
                        if (selectedGender !== 'all') {
                            params.set('sex', selectedGender);
                        }
                        params.set('sort', sortColumn || 'name');
                        params.set('direction', sortDirection);

                        const queryString = params.toString();
                        window.location.href = queryString
                            ? `/drivers/export/csv?${queryString}`
                            : '/drivers/export/csv';
                    }}
                >
                    <FileDown className="mr-2 h-4 w-4" />
                    Export CSV
                </Button>
            )}
            {hasPermission('drivers.create') && (
                <Button asChild>
                    <Link href="/drivers/create">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Driver
                    </Link>
                </Button>
            )}
        </>
    );

    const statsCards = [
        {
            title: 'Total Drivers',
            value: metrics?.total ?? 0,
            description: 'Workforce size',
            icon: <Users className="h-3.5 w-3.5 text-muted-foreground" />,
            valueClassName: 'text-foreground',
        },
        {
            title: 'Active',
            value: metrics?.active ?? 0,
            description: 'Currently active',
            icon: <UserCheck className="h-3.5 w-3.5 text-green-600" />,
            valueClassName: 'text-green-600',
        },
        {
            title: 'Inactive',
            value: metrics?.inactive ?? 0,
            description: 'Off duty',
            icon: <UserX className="h-3.5 w-3.5 text-red-600" />,
            valueClassName: 'text-red-600',
        },
        {
            title: 'Male',
            value: metrics?.male ?? 0,
            description: '👨 Male drivers',
            icon: <User className="h-3.5 w-3.5 text-blue-600" />,
            valueClassName: 'text-blue-600',
        },
        {
            title: 'Female',
            value: metrics?.female ?? 0,
            description: '👩 Female drivers',
            icon: <User className="h-3.5 w-3.5 text-pink-600" />,
            valueClassName: 'text-pink-600',
        },
    ];

    const statsSection = (
        <div className="hidden gap-2 md:grid md:grid-cols-2 xl:grid-cols-5">
            {statsCards.map((card) => (
                <Card key={card.title} className="gap-2 border border-slate-200 py-2 shadow-sm sm:py-3">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1.5 sm:p-2">
                        <CardTitle className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {card.title}
                        </CardTitle>
                        {card.icon}
                    </CardHeader>
                    <CardContent className="px-2 pb-2 pt-0 sm:px-3 sm:pb-2">
                        <div className={`text-sm font-semibold sm:text-base ${card.valueClassName}`}>{card.value}</div>
                        <p className="text-[11px] text-muted-foreground">{card.description}</p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    const tableHeaderExtras = (
        <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-[260px] max-w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search drivers..."
                    value={searchTerm}
                    onChange={(event) => handleSearchChange(event.target.value)}
                    className="pl-10"
                />
            </div>
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    {statusOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={selectedGender} onValueChange={handleGenderChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All genders</SelectItem>
                    {genderOptions.map((option) => (
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

    // TODO: Evaluate row virtualization or infinite scrolling if driver volumes impact render performance.
    const tableContent = (
        <Table>
            <TableHeader className="[&_tr]:sticky [&_tr]:top-0 [&_tr]:z-20 [&_tr]:bg-background [&_tr]:shadow-sm">
                <TableRow className="border-b bg-background">
                    {columns.map(({ key, label }) => renderHeaderCell(key, label))}
                    <TableHead className="sticky top-0 z-20 bg-background text-center">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {driverData.length > 0 ? (
                    driverData.map((driver) => (
                        <TableRow key={driver.id} className="hover:bg-muted/50">
                            <TableCell className="font-medium">
                                {driver.name}
                            </TableCell>
                            <TableCell className="font-mono text-muted-foreground">
                                {driver.driverid}
                            </TableCell>
                            <TableCell>
                                {getSexBadge(driver.sex)}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <MapPinIcon className="h-3 w-3" />
                                    {driver.zone || '-'}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {driver.mobile ? (
                                    <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {driver.mobile}
                                    </div>
                                ) : (
                                    '-'
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                                {driver.hireddate
                                    ? new Date(driver.hireddate).toLocaleDateString()
                                    : '-'
                                }
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(driver.status)}
                            </TableCell>
                            <TableCell className="text-center">
                                <div className="flex justify-center gap-2">
                                    <Button asChild size="sm" variant="ghost">
                                        <Link href={`/drivers/${driver.id}`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                    {hasPermission('drivers.edit') && (
                                        <Button asChild size="sm" variant="ghost">
                                            <Link href={`/drivers/${driver.id}/edit`}>
                                                <Edit className="h-4 w-4" />
                                            </Link>
                                        </Button>
                                    )}
                                    {hasPermission('drivers.destroy') && (
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this driver?')) {
                                                    router.delete(`/drivers/${driver.id}`);
                                                }
                                            }}
                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
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
                        <TableCell colSpan={8} className="py-8 text-center text-muted-foreground">
                            No drivers found.
                            {hasPermission('drivers.create') && (
                                <Link href="/drivers/create" className="ml-1 text-primary underline">
                                    Create one
                                </Link>
                            )}
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <ListPageLayout
            headTitle="Drivers"
            title="Drivers"
            description={`Manage your workforce of ${totalDrivers} driver${totalDrivers !== 1 ? 's' : ''}`}
            breadcrumbs={breadcrumbs}
            actions={headerActions}
            stats={statsSection}
            tableTitle="Driver Directory"
            tableDescription="Complete list of all drivers in your workforce"
            tableHeaderExtras={tableHeaderExtras}
            pagination={
                <InertiaPagination
                    className="mt-4"
                    links={drivers.links}
                    from={drivers.from}
                    to={drivers.to}
                    total={drivers.total}
                    currentPage={currentPage}
                    lastPage={lastPage}
                />
            }
        >
            {tableContent}
        </ListPageLayout>
    );
}

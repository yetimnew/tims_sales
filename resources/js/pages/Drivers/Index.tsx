import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { ListingLoadingPlaceholder } from '@/components/listing/loading-placeholder';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import { Plus, Eye, Edit, Search, Trash2, Users, UserCheck, UserX, User, MapPin as MapPinIcon, Phone } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
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

interface DriversIndexProps {
    drivers: {
        data: DriverData[];
        meta: PaginationMeta;
        links: PaginationLink[];
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

const SKELETON_FLAG_KEY = 'drivers.index.shouldShowSkeleton';

const COLUMN_DEFINITIONS: Array<{ key: keyof DriverData | 'status'; label: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'driverid', label: 'Driver ID' },
    { key: 'sex', label: 'Gender' },
    { key: 'zone', label: 'Location' },
    { key: 'mobile', label: 'Phone' },
    { key: 'hireddate', label: 'Hired Date' },
    { key: 'status', label: 'Status' },
];

type NavigateOverrides = {
    search?: string;
    status?: string;
    sex?: string;
    sort?: string;
    direction?: 'asc' | 'desc';
    page?: number;
    per_page?: number;
};

export default function DriversIndex({ drivers, metrics, filters, statusOptions, genderOptions, perPageOptions }: DriversIndexProps) {
    const { hasPermission } = usePermissions();
    const canViewDriverDetails = hasPermission('drivers.show');
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
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedDriver, setSelectedDriver] = React.useState<DriverData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);

    const isDataReady = Array.isArray(drivers?.data);
    const { isLoading } = useListingLoading({
        storageKey: SKELETON_FLAG_KEY,
        isDataReady,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const driverData = React.useMemo<DriverData[]>(
        () => (Array.isArray(drivers?.data) ? drivers.data : []),
        [drivers],
    );
    const totalDrivers = metrics?.total ?? drivers?.meta?.total ?? driverData.length ?? 0;
    const currentPage = drivers?.meta?.current_page ?? 1;
    const perPageCountRaw = drivers?.meta?.per_page ?? Number(perPage);
    const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0
        ? Number(perPageCountRaw)
        : driverData.length || 1;
    const rowOffset = (currentPage - 1) * perPageCount;

    const handleNavigate = React.useCallback((overrides: NavigateOverrides = {}) => {
        const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

        const nextSearch = hasOverride('search')
            ? overrides.search
            : (searchTerm.trim() ? searchTerm.trim() : undefined);
        const nextStatus = hasOverride('status')
            ? overrides.status
            : (selectedStatus !== 'all' ? selectedStatus : undefined);
        const nextSex = hasOverride('sex')
            ? overrides.sex
            : (selectedGender !== 'all' ? selectedGender : undefined);
        const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
        const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
        const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
        const nextPage = hasOverride('page') ? overrides.page : undefined;

        const params: Record<string, string | number | undefined> = {
            search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
            status: nextStatus && nextStatus !== 'all' ? nextStatus : undefined,
            sex: nextSex && nextSex !== 'all' ? nextSex : undefined,
            sort: nextSort,
            direction: nextDirection,
            page: nextPage,
            per_page: typeof nextPerPage === 'number' && Number.isFinite(nextPerPage) && nextPerPage > 0 ? nextPerPage : undefined,
        };

        Object.keys(params).forEach((key) => {
            if (params[key] === undefined) {
                delete params[key];
            }
        });

        if (typeof window !== 'undefined') {
            window.sessionStorage.setItem(SKELETON_FLAG_KEY, 'true');
        }

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

    const handleSort = React.useCallback((column: string) => {
        const newDirection: 'asc' | 'desc' = sortColumn === column && sortDirection === 'asc' ? 'desc' : 'asc';
        setSortColumn(column);
        setSortDirection(newDirection);
        handleNavigate({ sort: column, direction: newDirection });
    }, [handleNavigate, sortColumn, sortDirection]);

    const handleDeleteClick = (driver: DriverData) => {
        setSelectedDriver(driver);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (!selectedDriver) {
            return;
        }

        setIsDeleting(true);

        router.delete(`/drivers/${selectedDriver.id}`, {
            onSuccess: () => {
                setDeleteDialogOpen(false);
                setSelectedDriver(null);
                setIsDeleting(false);
            },
            onError: (errors) => {
                setIsDeleting(false);
                if (errors && typeof errors === 'object') {
                    const errorMessages = Object.values(errors).flat().join('\n');
                    if (errorMessages) {
                        toast({
                            title: '❌ Delete Failed',
                            description: errorMessages,
                            variant: 'destructive',
                        });
                    }
                }
            },
        });
    };

    const headerActions = (
        <>
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

    const activeDrivers = metrics?.active ?? 0;
    const inactiveDrivers = metrics?.inactive ?? 0;
    const maleDrivers = metrics?.male ?? 0;
    const femaleDrivers = metrics?.female ?? 0;

    const statsDefinitions = [
        {
            id: 'total-drivers',
            label: 'Total Drivers',
            icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                totalDrivers.toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Workforce size'
            ),
            valueClassName: isLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-drivers',
            label: 'Active',
            icon: <UserCheck className="h-3.5 w-3.5 text-green-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                activeDrivers.toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-20" aria-hidden="true" />
            ) : (
                'Currently active'
            ),
            valueClassName: isLoading ? undefined : 'text-green-600',
        },
        {
            id: 'inactive-drivers',
            label: 'Inactive',
            icon: <UserX className="h-3.5 w-3.5 text-red-600" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                inactiveDrivers.toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                'Off duty'
            ),
            valueClassName: isLoading ? undefined : 'text-red-600',
        },
        {
            id: 'male-drivers',
            label: 'Male',
            icon: <User className="h-3.5 w-3.5 text-blue-500" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                maleDrivers.toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                '👨 Male drivers'
            ),
            valueClassName: isLoading ? undefined : 'text-blue-500',
        },
        {
            id: 'female-drivers',
            label: 'Female',
            icon: <User className="h-3.5 w-3.5 text-pink-500" />,
            className: 'min-w-0',
            value: isLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                femaleDrivers.toLocaleString()
            ),
            description: isLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                '👩 Female drivers'
            ),
            valueClassName: isLoading ? undefined : 'text-pink-500',
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
            ...COLUMN_DEFINITIONS.map(({ key, label }) => ({
                id: String(key),
                label,
                sortable: true,
                sortKey: String(key),
            })),
            { id: 'actions', label: 'Actions', align: 'center' as const },
        ],
        [],
    );

    const tableRows = isLoading
        ? Array.from({ length: 6 }).map((_, rowIndex) => (
              <TableRow key={`driver-skeleton-${rowIndex}`} aria-hidden="true">
                  {tableColumns.map((column) => (
                      <TableCell
                          key={`${column.id}-${rowIndex}`}
                          className={column.align === 'center' ? 'text-center' : undefined}
                      >
                          <Skeleton className="mx-auto h-4 w-24 max-w-full" />
                      </TableCell>
                  ))}
              </TableRow>
          ))
        : driverData.length > 0
            ? driverData.map((driver, index) => (
                  <TableRow key={driver.id} className="hover:bg-muted/50">
                      <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                      <TableCell className="font-medium">{driver.name}</TableCell>
                      <TableCell className="font-mono text-muted-foreground">{driver.driverid}</TableCell>
                      <TableCell>{getSexBadge(driver.sex)}</TableCell>
                      <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                              <MapPinIcon className="h-3 w-3" />
                              {driver.zone || '—'}
                          </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                          {driver.mobile ? (
                              <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  {driver.mobile}
                              </div>
                          ) : (
                              '—'
                          )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                          {driver.hireddate ? new Date(driver.hireddate).toLocaleDateString() : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(driver.status)}</TableCell>
                      <TableCell className="text-center">
                          <ListingRowActionsMenu
                              actions={[
                                  canViewDriverDetails && {
                                      label: 'View',
                                      icon: <Eye className="h-4 w-4" />,
                                      href: `/drivers/${driver.id}`,
                                  },
                                  hasPermission('drivers.edit') && {
                                      label: 'Edit',
                                      icon: <Edit className="h-4 w-4" />,
                                      href: `/drivers/${driver.id}/edit`,
                                  },
                                  hasPermission('drivers.destroy') && {
                                      label: 'Delete',
                                      icon: <Trash2 className="h-4 w-4" />,
                                      danger: true,
                                      onSelect: () => handleDeleteClick(driver),
                                  },
                              ]}
                          />
                      </TableCell>
                  </TableRow>
              ))
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        No drivers found.
                        {hasPermission('drivers.create') && (
                            <Link href="/drivers/create" className="ml-1 text-primary underline">
                                Create one
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () => driverData.map((driver, index) => ({ driver, position: rowOffset + index + 1 })),
        [driverData, rowOffset],
    );

    const mobileContent = isLoading ? (
        <ListingLoadingPlaceholder showStats={false} filterItemCount={3} rowCount={4} />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.driver.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
                    <span className="text-base">{item.driver.name}</span>
                </div>
            )}
            renderSubtitle={(item) => item.driver.driverid || 'Driver ID pending'}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">Status</span>
                        {getStatusBadge(item.driver.status)}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Gender</span>
                            {getSexBadge(item.driver.sex)}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Location</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.zone || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Phone</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.mobile || '—'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">Hired</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.hireddate
                                    ? new Date(item.driver.hireddate).toLocaleDateString()
                                    : '—'}
                            </span>
                        </div>
                    </div>
                </div>
            )}
            renderFooter={(item) => (
                <div className="flex w-full flex-wrap items-center justify-end gap-2">
                    {canViewDriverDetails && (
                        <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
                            <Link href={`/drivers/${item.driver.id}`}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                            </Link>
                        </Button>
                    )}
                    {hasPermission('drivers.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/drivers/${item.driver.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                            </Link>
                        </Button>
                    )}
                    {hasPermission('drivers.destroy') && (
                        <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1 sm:flex-none"
                            onClick={() => handleDeleteClick(item.driver)}
                            disabled={isDeleting && selectedDriver?.id === item.driver.id}
                        >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    No drivers found.
                    {hasPermission('drivers.create') && (
                        <Link href="/drivers/create" className="ml-1 text-primary underline">
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
                placeholder: 'Search drivers...',
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
            <Select value={selectedStatus} onValueChange={handleStatusChange}>
                <SelectTrigger className="w-full min-w-[150px] sm:w-auto">
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
                <SelectTrigger className="w-full min-w-[140px] sm:w-auto">
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
        </ListingFilterBar>
    );

    return (
        <>
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
                    !isLoading && drivers?.links ? (
                        <ListingPaginationFooter
                            className="mt-4"
                            links={drivers.links}
                            from={drivers.meta?.from ?? undefined}
                            to={drivers.meta?.to ?? undefined}
                            total={drivers.meta?.total ?? undefined}
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
                        setSelectedDriver(null);
                    }
                }}
                title="Delete Driver"
                description="Are you sure you want to delete this driver? This action cannot be undone."
                itemName={selectedDriver?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
            />
        </>
    );
}

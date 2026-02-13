import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
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
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';
import * as React from 'react';
import { useTranslation } from 'react-i18next';

const getBreadcrumbs = (translate: (key: string) => string): BreadcrumbItem[] => [
    {
        title: translate('drivers.breadcrumb'),
        href: '/drivers',
    },
];

interface DriverData {
    id: number;
    driverid: string;
    name: string;
    localized_name?: string;
    name_translations?: Record<string, string>;
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

const normalizeLocale = (locale?: string): string => {
    if (!locale) {
        return '';
    }

    return locale.toLowerCase().replace('_', '-');
};

const buildLocaleCandidates = (locale: string | undefined): string[] => {
    const normalized = normalizeLocale(locale);
    const primary = normalized.split('-')[0] ?? '';
    const fallback = 'en';

    return Array.from(
        new Set(
            [normalized, primary, fallback].filter((value): value is string => value !== '' && value !== null && value !== undefined),
        ),
    );
};

const normalizeTranslationKeys = (translations: Record<string, string>): Record<string, string> => {
    return Object.fromEntries(
        Object.entries(translations).map(([key, value]) => [
            normalizeLocale(key),
            value,
        ]),
    );
};

const resolveDriverDisplayName = (driver: DriverData, candidates: string[]): string => {
    const translations = normalizeTranslationKeys(driver.name_translations ?? {});

    for (const candidate of candidates) {
        if (translations[candidate]) {
            return translations[candidate];
        }
    }

    if (driver.localized_name) {
        return driver.localized_name;
    }

    return driver.name;
};

const TABLE_LOADING_STORAGE_KEY = 'drivers.index.table-loading';

const getColumnDefinitions = (translate: (key: string) => string): Array<{ key: keyof DriverData | 'status'; label: string }> => [
    { key: 'name', label: translate('drivers.columns.name') },
    { key: 'driverid', label: translate('drivers.columns.driverId') },
    { key: 'sex', label: translate('drivers.columns.gender') },
    { key: 'zone', label: translate('drivers.columns.location') },
    { key: 'mobile', label: translate('drivers.columns.phone') },
    { key: 'hireddate', label: translate('drivers.columns.hiredDate') },
    { key: 'status', label: translate('drivers.columns.status') },
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
    const { t, i18n } = useTranslation();
    const breadcrumbs = React.useMemo(() => getBreadcrumbs(t), [t]);
    const columnDefinitions = React.useMemo(() => getColumnDefinitions(t), [t]);
    const canViewDriverDetails = hasPermission('drivers.show');
    const [searchTerm, setSearchTerm] = React.useState(filters?.search ?? '');
    const [selectedStatus, setSelectedStatus] = React.useState(() => (filters?.status ?? 'all'));
    const [selectedGender, setSelectedGender] = React.useState(filters?.sex ?? 'all');
    const [sortColumn, setSortColumn] = React.useState<string>(filters?.sort ?? 'name');
    const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(filters?.direction ?? 'asc');
    const availablePerPageOptions = React.useMemo(() => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]), [perPageOptions]);

    const statusSegments = React.useMemo(() => {
        const segments: Array<{ value: string; label: string }> = [];
        const seen = new Set<string>();

        const pushSegment = (value: string, label: string) => {
            if (seen.has(value)) {
                return;
            }

            segments.push({ value, label });
            seen.add(value);
        };

        pushSegment('active', statusOptions.find((option) => option.value === 'active')?.label ?? t('drivers.status.active'));
        pushSegment('inactive', statusOptions.find((option) => option.value === 'inactive')?.label ?? t('drivers.status.inactive'));

        statusOptions.forEach((option) => {
            pushSegment(option.value, option.label);
        });

        pushSegment('all', t('drivers.filters.all'));

        return segments;
    }, [statusOptions, t]);
    const resolvedPerPage = React.useMemo(() => {
        const candidate = filters?.per_page;
        if (typeof candidate === 'number' && availablePerPageOptions.includes(candidate)) {
            return candidate;
        }

        return availablePerPageOptions[0] ?? 15;
    }, [filters?.per_page, availablePerPageOptions]);
    const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [selectedDriver, setSelectedDriver] = React.useState<DriverData | null>(null);
    const [isDeleting, setIsDeleting] = React.useState(false);
    const [deleteError, setDeleteError] = React.useState<string | null>(null);

    const isDataReady = Array.isArray(drivers?.data);
    const { isLoading: isTableLoading } = useListingLoading({
        storageKey: TABLE_LOADING_STORAGE_KEY,
        isDataReady,
        minimumDuration: 200,
        onlySamePath: true,
        targetPath: '/drivers',
        initialIsLoading: true,
    });

    React.useEffect(() => {
        setPerPage(String(resolvedPerPage));
    }, [resolvedPerPage]);

    const localeCandidates = React.useMemo(
        () => buildLocaleCandidates(i18n.resolvedLanguage ?? i18n.language),
        [i18n.language, i18n.resolvedLanguage],
    );

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
        const nextStatus = hasOverride('status') ? overrides.status : selectedStatus;
        const nextSex = hasOverride('sex')
            ? overrides.sex
            : (selectedGender !== 'all' ? selectedGender : undefined);
        const nextSort = hasOverride('sort') ? overrides.sort ?? sortColumn : sortColumn;
        const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
        const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
        const nextPage = hasOverride('page') ? overrides.page : undefined;

        const params: Record<string, string | number | undefined> = {
            search: nextSearch && nextSearch !== '' ? nextSearch : undefined,
            status: nextStatus ?? undefined,
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

        router.get('/drivers', params, { preserveState: true, replace: false });
    }, [searchTerm, selectedStatus, selectedGender, sortColumn, sortDirection, perPage]);

    const getStatusBadge = (status: string) => {
        const baseClasses = 'flex items-center gap-1 w-fit border px-2 py-1 text-xs font-medium rounded-full';

        if (status === 'active') {
            return <span className={`${baseClasses} border-green-200 bg-green-100 text-green-700`}>{t('drivers.status.active')}</span>;
        }

        if (status === 'inactive') {
            return <span className={`${baseClasses} border-red-200 bg-red-100 text-red-700`}>{t('drivers.status.inactive')}</span>;
        }

        return (
            <span className={`${baseClasses} border-muted bg-muted/60 text-muted-foreground capitalize`}>
                {status || t('drivers.status.unknown')}
            </span>
        );
    };

    const getSexBadge = (sex: string) => {
        const label = sex === 'male'
            ? t('drivers.gender.male')
            : sex === 'female'
                ? t('drivers.gender.female')
                : t('drivers.gender.unknown');
        return (
            <Badge variant="outline" className="gap-1">
                {sex === 'male' ? '👨' : sex === 'female' ? '👩' : '👤'}
                {label}
            </Badge>
        );
    };

    const getGenderOptionLabel = React.useCallback((value: string, fallback: string) => {
        if (value === 'male') {
            return t('drivers.gender.male');
        }

        if (value === 'female') {
            return t('drivers.gender.female');
        }

        return fallback;
    }, [t]);

    const handleSearchChange = (value: string) => {
        setSearchTerm(value);
        handleNavigate({ search: value.trim() ? value.trim() : undefined, page: 1 });
    };

    const handleStatusChange = (value: string) => {
        if (!value) {
            return;
        }

        setSelectedStatus(value);
        handleNavigate({ status: value, page: 1 });
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
        setDeleteError(null);
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
                setDeleteError(null);
            },
            onError: (errors) => {
                setIsDeleting(false);

                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .flatMap((value) => (Array.isArray(value) ? value : [value]))
                        .filter((value) => Boolean(value))
                        .join('\n');

                    const fallback = t('drivers.delete.errorKnown');
                    setDeleteError(messages || fallback);

                    toast({
                        title: t('drivers.delete.failedTitle'),
                        description: messages || fallback,
                        variant: 'destructive',
                    });
                } else {
                    const fallback = t('drivers.delete.errorUnknown');
                    setDeleteError(fallback);

                    toast({
                        title: t('drivers.delete.failedTitle'),
                        description: fallback,
                        variant: 'destructive',
                    });
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
                        {t('drivers.actions.add')}
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
            label: t('drivers.stats.total.label'),
            icon: <Users className="h-3.5 w-3.5 text-blue-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-20" aria-hidden="true" />
            ) : (
                totalDrivers.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-28" aria-hidden="true" />
            ) : (
                t('drivers.stats.total.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
            id: 'active-drivers',
            label: t('drivers.stats.active.label'),
            icon: <UserCheck className="h-3.5 w-3.5 text-green-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                activeDrivers.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('drivers.stats.active.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-green-600',
        },
        {
            id: 'inactive-drivers',
            label: t('drivers.stats.inactive.label'),
            icon: <UserX className="h-3.5 w-3.5 text-red-600" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                inactiveDrivers.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('drivers.stats.inactive.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-red-600',
        },
        {
            id: 'male-drivers',
            label: t('drivers.stats.male.label'),
            icon: <User className="h-3.5 w-3.5 text-blue-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                maleDrivers.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('drivers.stats.male.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-blue-500',
        },
        {
            id: 'female-drivers',
            label: t('drivers.stats.female.label'),
            icon: <User className="h-3.5 w-3.5 text-pink-500" />,
            className: 'min-w-[220px] flex-shrink-0',
            value: isTableLoading ? (
                <Skeleton className="h-3.5 w-16" aria-hidden="true" />
            ) : (
                femaleDrivers.toLocaleString()
            ),
            description: isTableLoading ? (
                <Skeleton className="h-3 w-24" aria-hidden="true" />
            ) : (
                t('drivers.stats.female.description')
            ),
            valueClassName: isTableLoading ? undefined : 'text-pink-500',
        },
    ];

    const statsSection = <ListingStatsHeader stats={statsDefinitions} orientation="row" />;

    const perPageSelectOptions = React.useMemo(
        () =>
            availablePerPageOptions.map((option) => ({
                value: String(option),
                label: t('drivers.filters.perPageOption', { value: option }),
            })),
        [availablePerPageOptions, t],
    );

    const tableColumns = React.useMemo(
        () => [
            { id: 'index', label: '#', align: 'center' as const },
            ...columnDefinitions.map(({ key, label }) => ({
                id: String(key),
                label,
                sortable: true,
                sortKey: String(key),
            })),
            { id: 'actions', label: t('drivers.table.actions'), align: 'center' as const },
        ],
        [columnDefinitions, t],
    );

    const tableRows = isTableLoading
        ? Array.from({ length: 8 }).map((_, index) => (
              <TableRow key={`skeleton-${index}`} aria-hidden="true">
                  <TableCell className="text-center">
                      <Skeleton className="h-4 w-6 mx-auto" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-28" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                      <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell className="text-center">
                      <Skeleton className="h-8 w-8 mx-auto rounded" />
                  </TableCell>
              </TableRow>
          ))
        : driverData.length > 0
            ? driverData.map((driver, index) => {
                  const displayName = resolveDriverDisplayName(driver, localeCandidates);

                  return (
                      <TableRow key={driver.id} className="hover:bg-muted/50">
                          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
                          <TableCell className="font-medium">{displayName}</TableCell>
                          <TableCell className="font-mono text-muted-foreground">{driver.driverid}</TableCell>
                          <TableCell>{getSexBadge(driver.sex)}</TableCell>
                          <TableCell className="text-muted-foreground">
                              <div className="flex items-center gap-1">
                                  <MapPinIcon className="h-3 w-3" />
                                  {driver.zone || t('drivers.fallbacks.notAvailable')}
                              </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                              {driver.mobile ? (
                                  <div className="flex items-center gap-1">
                                      <Phone className="h-3 w-3" />
                                      {driver.mobile}
                                  </div>
                              ) : (
                                  t('drivers.fallbacks.notAvailable')
                              )}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                              {driver.hireddate ? new Date(driver.hireddate).toLocaleDateString() : t('drivers.fallbacks.notAvailable')}
                          </TableCell>
                          <TableCell>{getStatusBadge(driver.status)}</TableCell>
                          <TableCell className="text-center">
                              <ListingRowActionsMenu
                                  actions={[
                                      canViewDriverDetails && {
                                          label: t('drivers.actions.view'),
                                          icon: <Eye className="h-4 w-4" />,
                                          href: `/drivers/${driver.id}`,
                                      },
                                      hasPermission('drivers.edit') && {
                                          label: t('drivers.actions.edit'),
                                          icon: <Edit className="h-4 w-4" />,
                                          href: `/drivers/${driver.id}/edit`,
                                      },
                                      hasPermission('drivers.destroy') && {
                                          label: t('drivers.actions.delete'),
                                          icon: <Trash2 className="h-4 w-4" />,
                                          danger: true,
                                          onSelect: () => handleDeleteClick(driver),
                                      },
                                  ]}
                              />
                          </TableCell>
                      </TableRow>
                  );
              })
            : (
                <TableRow>
                    <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
                        {t('drivers.empty.title')}
                        {hasPermission('drivers.create') && (
                            <Link href="/drivers/create" className="ml-1 text-primary underline">
                                {t('drivers.empty.createAction')}
                            </Link>
                        )}
                    </TableCell>
                </TableRow>
            );

    const mobileItems = React.useMemo(
        () => driverData.map((driver, index) => ({ driver, position: rowOffset + index + 1 })),
        [driverData, rowOffset],
    );

    const mobileContent = isTableLoading ? (
        <ListingMobileItemList
            items={Array.from({ length: 5 }).map((_, i) => ({ driver: { id: i }, position: i + 1 }))}
            getKey={(item) => `skeleton-${item.position}`}
            renderTitle={() => (
                <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-8" />
                    <Skeleton className="h-4 w-40" />
                </div>
            )}
            renderSubtitle={() => <Skeleton className="h-3 w-32" />}
            renderContent={() => (
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-6 w-20 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-6 w-16 rounded-full" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-3 w-16" />
                            <Skeleton className="h-3 w-24" />
                        </div>
                    </div>
                </div>
            )}
            renderFooter={() => (
                <div className="flex w-full gap-2">
                    <Skeleton className="h-8 flex-1" />
                    <Skeleton className="h-8 w-20" />
                </div>
            )}
        />
    ) : (
        <ListingMobileItemList
            items={mobileItems}
            getKey={(item) => item.driver.id}
            renderTitle={(item) => (
                <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        {t('drivers.mobile.position', { value: item.position })}
                    </span>
                    <span className="text-base">
                        {resolveDriverDisplayName(item.driver, localeCandidates)}
                    </span>
                </div>
            )}
            renderSubtitle={(item) => item.driver.driverid || t('drivers.mobile.driverIdPending')}
            renderContent={(item) => (
                <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between text-sm">
                        <span className="font-medium text-slate-600 dark:text-slate-300">{t('drivers.mobile.status')}</span>
                        {getStatusBadge(item.driver.status)}
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('drivers.mobile.gender')}</span>
                            {getSexBadge(item.driver.sex)}
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('drivers.mobile.location')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.zone || t('drivers.fallbacks.notAvailable')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('drivers.mobile.phone')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.mobile || t('drivers.fallbacks.notAvailable')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-600 dark:text-slate-300">{t('drivers.mobile.hired')}</span>
                            <span className="text-right font-semibold text-slate-900 dark:text-slate-100">
                                {item.driver.hireddate
                                    ? new Date(item.driver.hireddate).toLocaleDateString()
                                    : t('drivers.fallbacks.notAvailable')}
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
                                {t('drivers.actions.view')}
                            </Link>
                        </Button>
                    )}
                    {hasPermission('drivers.edit') && (
                        <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
                            <Link href={`/drivers/${item.driver.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" />
                                {t('drivers.actions.edit')}
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
                            {t('drivers.actions.delete')}
                        </Button>
                    )}
                </div>
            )}
            emptyState={(
                <div className="py-8 text-center text-muted-foreground">
                    {t('drivers.empty.title')}
                    {hasPermission('drivers.create') && (
                        <Link href="/drivers/create" className="ml-1 text-primary underline">
                            {t('drivers.empty.createAction')}
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
                placeholder: t('drivers.filters.searchPlaceholder'),
                onChange: handleSearchChange,
                icon: <Search className="h-4 w-4" />,
            }}
            perPage={{
                value: perPage,
                label: t('drivers.filters.rowsLabel'),
                onChange: handlePerPageChange,
                options: perPageSelectOptions,
            }}
        >
            <ToggleGroup
                type="single"
                value={selectedStatus}
                onValueChange={handleStatusChange}
                variant="outline"
                size="sm"
                className="flex flex-wrap gap-px rounded-md"
            >
                {statusSegments.map((segment) => (
                    <ToggleGroupItem
                        key={segment.value}
                        value={segment.value}
                        className="px-3 py-1 text-sm font-medium capitalize data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                        {segment.label}
                    </ToggleGroupItem>
                ))}
            </ToggleGroup>
            <Select value={selectedGender} onValueChange={handleGenderChange}>
                <SelectTrigger className="w-full min-w-[140px] sm:w-auto">
                    <SelectValue placeholder={t('drivers.filters.gender')} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">{t('drivers.filters.allGenders')}</SelectItem>
                    {genderOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {getGenderOptionLabel(option.value, option.label)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </ListingFilterBar>
    );

    return (
        <>
            <ListPageLayout
                headTitle={t('drivers.title')}
                title={t('drivers.title')}
                description={t('drivers.description', { count: totalDrivers, plural: totalDrivers !== 1 ? 's' : '' })}
                breadcrumbs={breadcrumbs}
                actions={headerActions}
                stats={statsSection}
                tableTitle={t('drivers.table.title')}
                tableDescription={t('drivers.table.description')}
                tableHeaderExtras={tableHeaderExtras}
                  pagination={
                      drivers?.links ? (
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

                <div className="relative space-y-3 md:hidden">
                    {mobileContent}
                </div>
            </ListPageLayout>

            <DeleteConfirmationDialog
                open={deleteDialogOpen}
                onOpenChange={(open) => {
                    setDeleteDialogOpen(open);
                    if (!open) {
                        setSelectedDriver(null);
                        setDeleteError(null);
                    }
                }}
                title={t('drivers.delete.title')}
                description={t('drivers.delete.description')}
                itemName={selectedDriver?.name}
                onConfirm={handleDeleteConfirm}
                isLoading={isDeleting}
                errorMessage={deleteError}
            />
        </>
    );
}

import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import ListPageLayout from '@/components/layouts/list-page-layout';
import { ListingStatsHeader } from '@/components/listing/stats-header';
import { ListingFilterBar } from '@/components/listing/filter-bar';
import { ListingTableShell } from '@/components/listing/data-table-shell';
import { ListingRowActionsMenu } from '@/components/listing/row-actions-menu';
import { ListingPaginationFooter } from '@/components/listing/pagination-footer';
import { ListingMobileItemList } from '@/components/listing/mobile-item-list';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useListingLoading } from '@/hooks/use-listing-loading';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Tag,
  Link as LinkIcon,
  Ban,
  ListTree,
  BarChart3,
  CalendarClock,
} from 'lucide-react';

const TABLE_LOADING_STORAGE_KEY = 'status-types.index.table-loading';

interface StatusTypeItem {
  id: number;
  name: string;
  description: string | null;
  statuses_count: number;
  statuses: Array<{
    id: number;
    name: string;
  }>;
  created_at?: string | null;
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

interface StatusTypeMetrics {
  total: number;
  in_use: number;
  unused: number;
  recent: number;
  recent_days: number;
  statuses_total: number;
  average_per_type: number;
}

interface StatusTypesFilters {
  search?: string | null;
  usage?: string | null;
  sort?: string | null;
  direction?: 'asc' | 'desc' | null;
  per_page?: number | null;
}

interface StatusTypesIndexProps {
  statusTypes: {
    data: StatusTypeItem[];
    meta: PaginationMeta;
    links: PaginationLink[];
  };
  metrics?: StatusTypeMetrics | null;
  filters: StatusTypesFilters;
  usageOptions: Array<{ label: string; value: string }>;
  perPageOptions: number[];
}

type NavigateOverrides = {
  search?: string;
  usage?: string | null;
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
};

export default function StatusTypesIndex({
  statusTypes,
  metrics,
  filters,
  usageOptions,
  perPageOptions,
}: StatusTypesIndexProps) {
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('statusTypes.fallbacks.notAvailable');
  const isDataReady = Array.isArray(statusTypes?.data);
  const { isLoading: isTableLoading } = useListingLoading({
    storageKey: TABLE_LOADING_STORAGE_KEY,
    isDataReady,
    minimumDuration: 200,
    onlySamePath: true,
    targetPath: '/statustypes',
    initialIsLoading: true,
  });

  const initialSearch = typeof filters?.search === 'string' ? filters.search : '';
  const initialUsage = typeof filters?.usage === 'string' ? filters.usage : null;
  const initialSort = typeof filters?.sort === 'string' ? filters.sort : 'name';
  const initialDirection = filters?.direction === 'desc' ? 'desc' : 'asc';

  const [searchTerm, setSearchTerm] = React.useState(initialSearch);
  const [selectedUsage, setSelectedUsage] = React.useState(initialUsage ?? 'all');
  const [sortBy, setSortBy] = React.useState(initialSort);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialDirection);

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedStatusType, setSelectedStatusType] = React.useState<StatusTypeItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const breadcrumbs = React.useMemo<BreadcrumbItem[]>(
    () => [
      {
        title: t('statusTypes.title'),
        href: '/statustypes',
      },
    ],
    [t],
  );

  const dateFormatter = React.useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    [locale],
  );

  const formatDate = React.useCallback(
    (value?: string | null): string => {
      if (!value) {
        return notAvailableLabel;
      }

      return dateFormatter.format(new Date(value));
    },
    [dateFormatter, notAvailableLabel],
  );

  const availablePerPageOptions = React.useMemo(
    () => (perPageOptions?.length ? perPageOptions : [15, 25, 50, 100]),
    [perPageOptions],
  );

  const resolvedPerPage = React.useMemo(() => {
    const candidate = typeof filters?.per_page === 'number' ? filters.per_page : undefined;
    if (candidate && availablePerPageOptions.includes(candidate)) {
      return candidate;
    }

    return availablePerPageOptions[0] ?? 15;
  }, [availablePerPageOptions, filters?.per_page]);

  const [perPage, setPerPage] = React.useState<string>(() => String(resolvedPerPage));

  React.useEffect(() => {
    setPerPage(String(resolvedPerPage));
  }, [resolvedPerPage]);

  const totalCount = metrics?.total ?? statusTypes?.meta?.total ?? statusTypes?.data?.length ?? 0;
  const inUseCount = metrics?.in_use ?? 0;
  const unusedCount = metrics?.unused ?? Math.max(totalCount - inUseCount, 0);
  const statusesTotal = metrics?.statuses_total ?? 0;
  const averagePerType = metrics?.average_per_type ?? (totalCount > 0 ? Number((statusesTotal / totalCount).toFixed(2)) : 0);
  const recentCount = metrics?.recent ?? 0;
  const recentDays = metrics?.recent_days ?? 30;

  const statsDefinitions = metrics
    ? [
        {
          id: 'total-status-types',
          label: t('statusTypes.stats.total.label'),
          icon: <Tag className="h-3.5 w-3.5 text-blue-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : totalCount.toLocaleString(),
          description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : t('statusTypes.stats.total.description'),
          valueClassName: isTableLoading ? undefined : 'text-blue-600',
        },
        {
          id: 'in-use-status-types',
          label: t('statusTypes.stats.inUse.label'),
          icon: <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-12" aria-hidden="true" /> : inUseCount.toLocaleString(),
          description: isTableLoading ? (
            <Skeleton className="h-3 w-32" aria-hidden="true" />
          ) : (
            t('statusTypes.stats.inUse.description', { count: statusesTotal.toLocaleString() })
          ),
          valueClassName: isTableLoading ? undefined : 'text-emerald-600',
        },
        {
          id: 'unused-status-types',
          label: t('statusTypes.stats.unused.label'),
          icon: <Ban className="h-3.5 w-3.5 text-amber-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-12" aria-hidden="true" /> : unusedCount.toLocaleString(),
          description: isTableLoading ? <Skeleton className="h-3 w-28" aria-hidden="true" /> : t('statusTypes.stats.unused.description'),
          valueClassName: isTableLoading ? undefined : 'text-amber-600',
        },
        {
          id: 'average-statuses',
          label: t('statusTypes.stats.average.label'),
          icon: <BarChart3 className="h-3.5 w-3.5 text-purple-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : averagePerType.toFixed(2),
          description: isTableLoading ? <Skeleton className="h-3 w-24" aria-hidden="true" /> : t('statusTypes.stats.average.description'),
          valueClassName: isTableLoading ? undefined : 'text-purple-600',
        },
        {
          id: 'recent-status-types',
          label: t('statusTypes.stats.recent.label', { days: recentDays }),
          icon: <CalendarClock className="h-3.5 w-3.5 text-slate-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-12" aria-hidden="true" /> : recentCount.toLocaleString(),
          description: isTableLoading ? <Skeleton className="h-3 w-32" aria-hidden="true" /> : t('statusTypes.stats.recent.description'),
          valueClassName: isTableLoading ? undefined : 'text-slate-600',
        },
        {
          id: 'total-statuses',
          label: t('statusTypes.stats.statuses.label'),
          icon: <ListTree className="h-3.5 w-3.5 text-indigo-600" />,
          value: isTableLoading ? <Skeleton className="h-4 w-16" aria-hidden="true" /> : statusesTotal.toLocaleString(),
          description: isTableLoading ? <Skeleton className="h-3 w-28" aria-hidden="true" /> : t('statusTypes.stats.statuses.description'),
          valueClassName: isTableLoading ? undefined : 'text-indigo-600',
        },
      ]
    : null;

  const currentPage = statusTypes?.meta?.current_page ?? 1;
  const perPageCountRaw = statusTypes?.meta?.per_page ?? Number(perPage);
  const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0 ? Number(perPageCountRaw) : statusTypes?.data?.length || 1;
  const rowOffset = (currentPage - 1) * perPageCount;

  const handleNavigate = React.useCallback(
    (overrides: NavigateOverrides = {}) => {
      const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

      const nextSearch = hasOverride('search')
        ? overrides.search
        : searchTerm.trim() !== ''
          ? searchTerm.trim()
          : undefined;

      const nextUsage = hasOverride('usage')
        ? overrides.usage ?? undefined
        : selectedUsage !== 'all'
          ? selectedUsage
          : undefined;

      const nextSort = hasOverride('sort') ? overrides.sort ?? sortBy : sortBy;
      const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
      const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
      const nextPage = hasOverride('page') ? overrides.page : undefined;

      const params: Record<string, string | number | undefined> = {
        search: nextSearch,
        usage: nextUsage,
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

      router.get('/statustypes', params, { preserveState: true, replace: false });
    },
    [perPage, searchTerm, selectedUsage, sortBy, sortDirection],
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleNavigate({ search: value.trim() !== '' ? value.trim() : undefined, page: 1 });
  };

  const handleUsageChange = (value: string) => {
    setSelectedUsage(value);
    handleNavigate({ usage: value !== 'all' ? value : undefined, page: 1 });
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(value);
    const numericValue = Number(value);
    handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
  };

  const sortableColumns = React.useMemo(() => ['name', 'statuses_count', 'created_at'], []);

  const handleSort = (column: string) => {
    if (!sortableColumns.includes(column)) {
      return;
    }

    const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
    handleNavigate({ sort: column, direction: newDirection });
  };

  const handleDeleteClick = (statusType: StatusTypeItem) => {
    setSelectedStatusType(statusType);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!selectedStatusType) {
      return;
    }

    setIsDeleting(true);

    router.delete(`/statustypes/${selectedStatusType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedStatusType(null);
        setDeleteError(null);
        setIsDeleting(false);
        toast({
          title: t('statusTypes.delete.successTitle'),
          description: t('statusTypes.delete.successDescription'),
        });
      },
      onError: (errors) => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const messages = Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .join('\n');

          const fallback = t('statusTypes.delete.failedDescription');
          setDeleteError(messages || fallback);
          toast({ title: t('statusTypes.delete.failedTitle'), description: messages || fallback, variant: 'destructive' });
        } else {
          const fallback = t('statusTypes.delete.failedUnknownDescription');
          setDeleteError(fallback);
          toast({ title: t('statusTypes.delete.failedTitle'), description: fallback, variant: 'destructive' });
        }
      },
    });
  };

  const tableColumns = React.useMemo(
    () => [
      { id: 'index', label: t('statusTypes.columns.index'), align: 'center' as const },
      { id: 'name', label: t('statusTypes.columns.name'), sortable: true },
      { id: 'description', label: t('statusTypes.columns.description') },
      { id: 'statuses_count', label: t('statusTypes.columns.statuses'), sortable: true, align: 'center' as const },
      { id: 'created_at', label: t('statusTypes.columns.created'), sortable: true },
      { id: 'actions', label: t('statusTypes.columns.actions'), align: 'center' as const },
    ],
    [t],
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
            <Skeleton className="h-4 w-48" />
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="h-4 w-12 mx-auto" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-24" />
          </TableCell>
          <TableCell className="text-center">
            <Skeleton className="h-8 w-8 mx-auto rounded" />
          </TableCell>
        </TableRow>
      ))
    : statusTypes?.data?.length
        ? statusTypes.data.map((statusType, index) => {
            const statuses = Array.isArray(statusType.statuses) ? statusType.statuses : [];

            return (
            <TableRow key={statusType.id} className="hover:bg-muted/50">
          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
          <TableCell className="font-medium">{statusType.name}</TableCell>
          <TableCell className="max-w-[320px] text-sm text-muted-foreground">
            {statusType.description || notAvailableLabel}
          </TableCell>
          <TableCell className="align-top">
            <div className="flex flex-col items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {statusType.statuses_count.toLocaleString()}
              </span>
              {statuses.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-1">
                  {statuses.map((status) => (
                    <Badge key={status.id} variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
                      {status.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">{t('statusTypes.fallbacks.noStatuses')}</span>
              )}
            </div>
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{formatDate(statusType.created_at)}</TableCell>
          <TableCell className="text-center">
            <ListingRowActionsMenu
              actions={[
                hasPermission('status-types.show') && {
                  label: t('statusTypes.actions.view'),
                  icon: <Eye className="h-4 w-4" />,
                  href: `/statustypes/${statusType.id}`,
                },
                hasPermission('status-types.edit') && {
                  label: t('statusTypes.actions.edit'),
                  icon: <Edit className="h-4 w-4" />,
                  href: `/statustypes/${statusType.id}/edit`,
                },
                hasPermission('status-types.destroy') && {
                  label: t('statusTypes.actions.delete'),
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onSelect: () => handleDeleteClick(statusType),
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
            {t('statusTypes.empty.title')}
            {hasPermission('status-types.create') && (
              <Link href="/statustypes/create" className="ml-1 text-primary underline">
                {t('statusTypes.empty.action')}
              </Link>
            )}
          </TableCell>
        </TableRow>
      );

  const mobileItems = React.useMemo(
    () =>
      statusTypes?.data?.map((statusType, index) => ({
        statusType: {
          ...statusType,
          statuses: Array.isArray(statusType.statuses) ? statusType.statuses : [],
        },
        position: rowOffset + index + 1,
      })) ?? [],
    [rowOffset, statusTypes?.data],
  );

  const mobileContent = isTableLoading ? (
    <ListingMobileItemList
      items={Array.from({ length: 5 }).map((_, i) => ({ id: `skeleton-${i}` }))}
      getKey={(item) => item.id}
      renderTitle={() => (
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-8" />
          <Skeleton className="h-4 w-32" />
        </div>
      )}
      renderSubtitle={() => <Skeleton className="h-3 w-24" />}
      renderContent={() => (
        <div className="space-y-3">
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <Skeleton className="h-3 w-full" />
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
      getKey={(item) => item.statusType.id}
      renderTitle={(item) => (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
          <span className="text-base">{item.statusType.name}</span>
        </div>
      )}
      renderSubtitle={(item) => formatDate(item.statusType.created_at)}
      renderContent={(item) => (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-600 dark:text-slate-300">{t('statusTypes.labels.statuses')}</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {item.statusType.statuses_count.toLocaleString()}
              </span>
            </div>
            {item.statusType.statuses.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {item.statusType.statuses.map((status) => (
                  <Badge key={status.id} variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
                    {status.name}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-xs text-muted-foreground">{t('statusTypes.fallbacks.noStatuses')}</span>
            )}
          </div>
          <p>{item.statusType.description || t('statusTypes.fallbacks.noDescription')}</p>
        </div>
      )}
      renderFooter={(item) => (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {hasPermission('status-types.show') && (
            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
              <Link href={`/statustypes/${item.statusType.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                {t('statusTypes.actions.view')}
              </Link>
            </Button>
          )}
          {hasPermission('status-types.edit') && (
            <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
              <Link href={`/statustypes/${item.statusType.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t('statusTypes.actions.edit')}
              </Link>
            </Button>
          )}
          {hasPermission('status-types.destroy') && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => handleDeleteClick(item.statusType)}
              disabled={isDeleting && selectedStatusType?.id === item.statusType.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t('statusTypes.actions.delete')}
            </Button>
          )}
        </div>
      )}
      emptyState={(
        <div className="py-8 text-center text-muted-foreground">
          {t('statusTypes.empty.title')}
          {hasPermission('status-types.create') && (
            <Link href="/statustypes/create" className="ml-1 text-primary underline">
              {t('statusTypes.empty.action')}
            </Link>
          )}
        </div>
      )}
    />
  );

  const perPageSelectOptions = React.useMemo(
    () => availablePerPageOptions.map((option) => ({ value: String(option), label: t('statusTypes.filters.perPageOption', { value: option }) })),
    [availablePerPageOptions, t],
  );

  const tableHeaderExtras = (
    <ListingFilterBar
      search={{
        value: searchTerm,
        placeholder: t('statusTypes.filters.searchPlaceholder'),
        onChange: handleSearchChange,
        icon: <Search className="h-4 w-4" />,
      }}
      perPage={{
        value: perPage,
        label: t('statusTypes.filters.rowsLabel'),
        onChange: handlePerPageChange,
        options: perPageSelectOptions,
      }}
    >
      <Select value={selectedUsage} onValueChange={handleUsageChange}>
        <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
          <SelectValue placeholder={t('statusTypes.filters.usagePlaceholder')} />
        </SelectTrigger>
        <SelectContent>
          {(usageOptions?.length ? usageOptions : [{ label: t('statusTypes.filters.allUsage'), value: 'all' }]).map((option) => (
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
      {hasPermission('status-types.export') && (
        <Button variant="outline" onClick={() => router.get(route('status-types.export'))}>
          {t('statusTypes.actions.export')}
        </Button>
      )}
      {hasPermission('status-types.create') && (
        <Button asChild>
          <Link href="/statustypes/create">
            <Plus className="mr-2 h-4 w-4" />
            {t('statusTypes.actions.add')}
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <>
      <ListPageLayout
        headTitle={t('statusTypes.title')}
        title={t('statusTypes.title')}
        description={t('statusTypes.description', { count: totalCount.toLocaleString() })}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        stats={statsDefinitions ? <ListingStatsHeader stats={statsDefinitions} orientation="row" /> : null}
        tableTitle={t('statusTypes.table.title')}
        tableDescription={t('statusTypes.table.description')}
        tableHeaderExtras={tableHeaderExtras}
        pagination={
          statusTypes?.links?.length ? (
            <ListingPaginationFooter
              className="mt-4"
              links={statusTypes.links}
              from={statusTypes.meta?.from ?? undefined}
              to={statusTypes.meta?.to ?? undefined}
              total={statusTypes.meta?.total ?? undefined}
            />
          ) : null
        }
      >
        <div className="hidden md:block">
          <ListingTableShell columns={tableColumns} sort={{ column: sortBy, direction: sortDirection, onToggle: handleSort }}>
            {tableRows}
          </ListingTableShell>
        </div>

        <div className="space-y-3 md:hidden">
          {mobileContent}
        </div>
      </ListPageLayout>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSelectedStatusType(null);
            setDeleteError(null);
            setIsDeleting(false);
          }
        }}
        title={t('statusTypes.delete.title')}
        description={t('statusTypes.delete.description')}
        itemName={selectedStatusType?.name}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        errorMessage={deleteError}
        confirmLabel={t('statusTypes.delete.confirmLabel')}
      />
    </>
  );
}

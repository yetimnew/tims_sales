import * as React from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
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

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Status Types',
    href: '/statustypes',
  },
];

const TABLE_LOADING_STORAGE_KEY = 'status-types.index.table-loading';

interface StatusTypeItem {
  id: number;
  name: string;
  description: string | null;
  statuses_count: number;
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

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  return dateFormatter.format(new Date(value));
};

export default function StatusTypesIndex({
  statusTypes,
  metrics,
  filters,
  usageOptions,
  perPageOptions,
}: StatusTypesIndexProps) {
  const { hasPermission } = usePermissions();
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
          label: 'Total Types',
          icon: <Tag className="h-3.5 w-3.5 text-blue-600" />,
          value: totalCount.toLocaleString(),
          description: 'All lifecycle categories',
          valueClassName: 'text-blue-600',
        },
        {
          id: 'in-use-status-types',
          label: 'In Use',
          icon: <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />,
          value: inUseCount.toLocaleString(),
          description: `${statusesTotal.toLocaleString()} statuses linked`,
          valueClassName: 'text-emerald-600',
        },
        {
          id: 'unused-status-types',
          label: 'Unused',
          icon: <Ban className="h-3.5 w-3.5 text-amber-600" />,
          value: unusedCount.toLocaleString(),
          description: 'Ready for assignment',
          valueClassName: 'text-amber-600',
        },
        {
          id: 'average-statuses',
          label: 'Avg. Statuses',
          icon: <BarChart3 className="h-3.5 w-3.5 text-purple-600" />,
          value: averagePerType.toFixed(2),
          description: 'Per status type',
          valueClassName: 'text-purple-600',
        },
        {
          id: 'recent-status-types',
          label: `Created (${recentDays}d)`,
          icon: <CalendarClock className="h-3.5 w-3.5 text-slate-600" />,
          value: recentCount.toLocaleString(),
          description: 'Recently added types',
          valueClassName: 'text-slate-600',
        },
        {
          id: 'total-statuses',
          label: 'Statuses',
          icon: <ListTree className="h-3.5 w-3.5 text-indigo-600" />,
          value: statusesTotal.toLocaleString(),
          description: 'Across all types',
          valueClassName: 'text-indigo-600',
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
          title: 'Status type deleted',
          description: 'The status type has been removed.',
        });
      },
      onError: (errors) => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const messages = Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .join('\n');

          const fallback = 'Failed to delete status type. Please review the requirements and try again.';
          setDeleteError(messages || fallback);
          toast({ title: 'Delete failed', description: messages || fallback, variant: 'destructive' });
        } else {
          const fallback = 'An unexpected error occurred while deleting the status type. Please try again.';
          setDeleteError(fallback);
          toast({ title: 'Delete failed', description: fallback, variant: 'destructive' });
        }
      },
    });
  };

  const tableColumns = React.useMemo(
    () => [
      { id: 'index', label: '#', align: 'center' as const },
      { id: 'name', label: 'Name', sortable: true },
      { id: 'description', label: 'Description' },
      { id: 'statuses_count', label: 'Statuses', sortable: true, align: 'center' as const },
      { id: 'created_at', label: 'Created', sortable: true },
      { id: 'actions', label: 'Actions', align: 'center' as const },
    ],
    [],
  );

  const tableRows = statusTypes?.data?.length
    ? statusTypes.data.map((statusType, index) => (
        <TableRow key={statusType.id} className="hover:bg-muted/50">
          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
          <TableCell className="font-medium">{statusType.name}</TableCell>
          <TableCell className="max-w-[320px] text-sm text-muted-foreground">
            {statusType.description || '—'}
          </TableCell>
          <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-200">
            {statusType.statuses_count.toLocaleString()}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{formatDate(statusType.created_at)}</TableCell>
          <TableCell className="text-center">
            <ListingRowActionsMenu
              actions={[
                hasPermission('status-types.show') && {
                  label: 'View',
                  icon: <Eye className="h-4 w-4" />,
                  href: `/statustypes/${statusType.id}`,
                },
                hasPermission('status-types.edit') && {
                  label: 'Edit',
                  icon: <Edit className="h-4 w-4" />,
                  href: `/statustypes/${statusType.id}/edit`,
                },
                hasPermission('status-types.destroy') && {
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onSelect: () => handleDeleteClick(statusType),
                },
              ]}
            />
          </TableCell>
        </TableRow>
      ))
    : (
        <TableRow>
          <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
            No status types found.
            {hasPermission('status-types.create') && (
              <Link href="/statustypes/create" className="ml-1 text-primary underline">
                Create one
              </Link>
            )}
          </TableCell>
        </TableRow>
      );

  const mobileItems = React.useMemo(
    () =>
      statusTypes?.data?.map((statusType, index) => ({
        statusType,
        position: rowOffset + index + 1,
      })) ?? [],
    [rowOffset, statusTypes?.data],
  );

  const mobileContent = (
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
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Statuses</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {item.statusType.statuses_count.toLocaleString()}
            </span>
          </div>
          <p>{item.statusType.description || 'No description provided.'}</p>
        </div>
      )}
      renderFooter={(item) => (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {hasPermission('status-types.show') && (
            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
              <Link href={`/statustypes/${item.statusType.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
          )}
          {hasPermission('status-types.edit') && (
            <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
              <Link href={`/statustypes/${item.statusType.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
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
              Delete
            </Button>
          )}
        </div>
      )}
      emptyState={(
        <div className="py-8 text-center text-muted-foreground">
          No status types found.
          {hasPermission('status-types.create') && (
            <Link href="/statustypes/create" className="ml-1 text-primary underline">
              Create one
            </Link>
          )}
        </div>
      )}
    />
  );

  const perPageSelectOptions = React.useMemo(
    () => availablePerPageOptions.map((option) => ({ value: String(option), label: `${option} / page` })),
    [availablePerPageOptions],
  );

  const tableHeaderExtras = (
    <ListingFilterBar
      search={{
        value: searchTerm,
        placeholder: 'Search status types...',
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
      <Select value={selectedUsage} onValueChange={handleUsageChange}>
        <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
          <SelectValue placeholder="Usage" />
        </SelectTrigger>
        <SelectContent>
          {(usageOptions?.length ? usageOptions : [{ label: 'All usage states', value: 'all' }]).map((option) => (
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
          Export CSV
        </Button>
      )}
      {hasPermission('status-types.create') && (
        <Button asChild>
          <Link href="/statustypes/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Status Type
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <>
      <ListPageLayout
        headTitle="Status Types"
        title="Status Types"
        description={`Manage ${totalCount.toLocaleString()} lifecycle status categories.`}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        stats={statsDefinitions ? <ListingStatsHeader stats={statsDefinitions} orientation="row" /> : null}
        tableTitle="Status Type Catalog"
        tableDescription="Track and govern the lifecycle categories used across the platform"
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
          <div className="relative">
            <ListingTableShell columns={tableColumns} sort={{ column: sortBy, direction: sortDirection, onToggle: handleSort }}>
              {tableRows}
            </ListingTableShell>

            {isTableLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
                <img src="/images/loading-spinner.svg" alt="Loading status types" className="h-12 w-12" />
                <span className="text-sm text-muted-foreground">Loading status types...</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative space-y-3 md:hidden">
          {mobileContent}

          {isTableLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <img src="/images/loading-spinner.svg" alt="Loading status types" className="h-10 w-10" />
              <span className="text-sm text-muted-foreground">Loading status types...</span>
            </div>
          )}
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
        title="Delete Status Type"
        description="Are you sure you want to delete this status type? This action cannot be undone."
        itemName={selectedStatusType?.name}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        errorMessage={deleteError}
        confirmLabel="Delete Status Type"
      />
    </>
  );
}

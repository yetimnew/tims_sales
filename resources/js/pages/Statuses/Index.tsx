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
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  Tag,
  Link as LinkIcon,
  Layers,
  FileText,
  FileWarning,
  CalendarClock,
} from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Statuses',
    href: '/statuses',
  },
];

const TABLE_LOADING_STORAGE_KEY = 'statuses.index.table-loading';

interface StatusTypeOption {
  id: number;
  name: string;
}

interface StatusItem {
  id: number;
  statustype_id: number;
  status_type: {
    id: number | null;
    name: string | null;
  } | null;
  name: string;
  description: string | null;
  daily_truck_statuses_count: number;
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

interface StatusMetrics {
  total: number;
  in_use: number;
  unique_types: number;
  recent: number;
  recent_days: number;
  with_description: number;
  without_description: number;
  average_per_type: number;
}

interface StatusFilters {
  search?: string | null;
  statustype_id?: number | null;
  sort?: string | null;
  direction?: 'asc' | 'desc' | null;
  per_page?: number | null;
}

interface StatusIndexProps {
  statuses: {
    data: StatusItem[];
    meta: PaginationMeta;
    links: PaginationLink[];
  };
  metrics?: StatusMetrics | null;
  filters: StatusFilters;
  statusTypeOptions: StatusTypeOption[];
  perPageOptions: number[];
}

type NavigateOverrides = {
  search?: string;
  statustype_id?: number | null;
  sort?: string;
  direction?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
};

const formatter = new Intl.DateTimeFormat(undefined, {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const formatDate = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  return formatter.format(new Date(value));
};

export default function StatusesIndex({
  statuses,
  metrics,
  filters,
  statusTypeOptions,
  perPageOptions,
}: StatusIndexProps) {
  const { hasPermission } = usePermissions();
  const isDataReady = Array.isArray(statuses?.data);
  const { isLoading: isTableLoading } = useListingLoading({
    storageKey: TABLE_LOADING_STORAGE_KEY,
    isDataReady,
    minimumDuration: 200,
    onlySamePath: true,
    targetPath: '/statuses',
    initialIsLoading: true,
  });

  const initialSearch = typeof filters?.search === 'string' ? filters.search : '';
  const initialStatusType = typeof filters?.statustype_id === 'number' ? String(filters.statustype_id) : 'all';
  const initialSort = typeof filters?.sort === 'string' ? filters.sort : 'name';
  const initialDirection = filters?.direction === 'desc' ? 'desc' : 'asc';

  const [searchTerm, setSearchTerm] = React.useState(initialSearch);
  const [selectedStatusType, setSelectedStatusType] = React.useState(initialStatusType);
  const [sortBy, setSortBy] = React.useState(initialSort);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>(initialDirection);
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

  const totalCount = metrics?.total ?? statuses?.meta?.total ?? statuses?.data?.length ?? 0;
  const inUseCount = metrics?.in_use ?? 0;
  const withDescription = metrics?.with_description ?? 0;
  const withoutDescription = metrics?.without_description ?? Math.max(totalCount - withDescription, 0);
  const uniqueTypes = metrics?.unique_types ?? 0;
  const averagePerType = metrics?.average_per_type ?? (uniqueTypes > 0 ? Number((totalCount / uniqueTypes).toFixed(2)) : 0);
  const recentCount = metrics?.recent ?? 0;
  const recentDays = metrics?.recent_days ?? 30;

  const statsDefinitions = [
    {
      id: 'total-statuses',
      label: 'Total Statuses',
      icon: <Tag className="h-3.5 w-3.5 text-blue-600" />,
      value: totalCount.toLocaleString(),
      description: 'Overall catalog size',
      valueClassName: 'text-blue-600',
    },
    {
      id: 'in-use-statuses',
      label: 'In Use',
      icon: <LinkIcon className="h-3.5 w-3.5 text-emerald-600" />,
      value: inUseCount.toLocaleString(),
      description: 'Active in truck logs',
      valueClassName: 'text-emerald-600',
    },
    {
      id: 'status-types-covered',
      label: 'Status Types',
      icon: <Layers className="h-3.5 w-3.5 text-indigo-600" />,
      value: uniqueTypes.toLocaleString(),
      description: `${averagePerType.toFixed(2)} avg per type`,
      valueClassName: 'text-indigo-600',
    },
    {
      id: 'recent-statuses',
      label: `New (${recentDays}d)`,
      icon: <CalendarClock className="h-3.5 w-3.5 text-slate-600" />,
      value: recentCount.toLocaleString(),
      description: 'Recently added records',
      valueClassName: 'text-slate-600',
    },
    {
      id: 'with-description',
      label: 'Documented',
      icon: <FileText className="h-3.5 w-3.5 text-purple-600" />,
      value: withDescription.toLocaleString(),
      description: 'Statuses with descriptions',
      valueClassName: 'text-purple-600',
    },
    {
      id: 'without-description',
      label: 'Needs Details',
      icon: <FileWarning className="h-3.5 w-3.5 text-amber-600" />,
      value: withoutDescription.toLocaleString(),
      description: 'Missing documentation',
      valueClassName: 'text-amber-600',
    },
  ];

  const currentPage = statuses?.meta?.current_page ?? 1;
  const perPageCountRaw = statuses?.meta?.per_page ?? Number(perPage);
  const perPageCount = Number.isFinite(perPageCountRaw) && perPageCountRaw > 0 ? Number(perPageCountRaw) : statuses?.data?.length || 1;
  const rowOffset = (currentPage - 1) * perPageCount;

  const handleNavigate = React.useCallback(
    (overrides: NavigateOverrides = {}) => {
      const hasOverride = (key: keyof NavigateOverrides) => Object.prototype.hasOwnProperty.call(overrides, key);

      const nextSearch = hasOverride('search')
        ? overrides.search
        : searchTerm.trim() !== ''
          ? searchTerm.trim()
          : undefined;

      const statusTypeValue = hasOverride('statustype_id')
        ? overrides.statustype_id
        : selectedStatusType !== 'all'
          ? Number(selectedStatusType)
          : undefined;

      const nextSort = hasOverride('sort') ? overrides.sort ?? sortBy : sortBy;
      const nextDirection = hasOverride('direction') ? overrides.direction ?? sortDirection : sortDirection;
      const nextPerPage = hasOverride('per_page') ? overrides.per_page : Number(perPage);
      const nextPage = hasOverride('page') ? overrides.page : undefined;

      const params: Record<string, string | number | undefined> = {
        search: nextSearch,
        statustype_id: statusTypeValue,
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

      router.get('/statuses', params, { preserveState: true, replace: false });
    },
    [perPage, searchTerm, selectedStatusType, sortBy, sortDirection],
  );

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    handleNavigate({ search: value.trim() !== '' ? value.trim() : undefined, page: 1 });
  };

  const handleStatusTypeChange = (value: string) => {
    setSelectedStatusType(value);
    handleNavigate({ statustype_id: value !== 'all' ? Number(value) : undefined, page: 1 });
  };

  const handlePerPageChange = (value: string) => {
    setPerPage(value);
    const numericValue = Number(value);
    handleNavigate({ per_page: Number.isNaN(numericValue) ? undefined : numericValue, page: 1 });
  };

  const sortableColumns = React.useMemo(() => ['name', 'status_type', 'daily_truck_statuses_count', 'created_at'], []);

  const handleSort = (column: string) => {
    if (!sortableColumns.includes(column)) {
      return;
    }

    const newDirection: 'asc' | 'desc' = sortBy === column && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortBy(column);
    setSortDirection(newDirection);
    handleNavigate({ sort: column, direction: newDirection });
  };

  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [selectedStatus, setSelectedStatus] = React.useState<StatusItem | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const handleDeleteClick = (status: StatusItem) => {
    setSelectedStatus(status);
    setDeleteDialogOpen(true);
    setDeleteError(null);
  };

  const handleDeleteConfirm = () => {
    if (!selectedStatus) {
      return;
    }

    setIsDeleting(true);

    router.delete(`/statuses/${selectedStatus.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setSelectedStatus(null);
        setDeleteError(null);
        setIsDeleting(false);
        toast({
          title: 'Status deleted',
          description: 'The status has been removed.',
        });
      },
      onError: (errors) => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const messages = Object.values(errors)
            .flatMap((value) => (Array.isArray(value) ? value : [value]))
            .filter(Boolean)
            .join('\n');

          const fallback = 'Failed to delete status. Please review the requirements and try again.';
          setDeleteError(messages || fallback);
          toast({ title: 'Delete failed', description: messages || fallback, variant: 'destructive' });
        } else {
          const fallback = 'An unexpected error occurred while deleting the status. Please try again.';
          setDeleteError(fallback);
          toast({ title: 'Delete failed', description: fallback, variant: 'destructive' });
        }
      },
    });
  };

  const tableColumns = React.useMemo(
    () => [
      { id: 'index', label: '#', align: 'center' as const },
      { id: 'name', label: 'Status', sortable: true },
      { id: 'status_type', label: 'Status Type', sortable: true },
      { id: 'description', label: 'Description' },
      { id: 'daily_truck_statuses_count', label: 'Usage', sortable: true, align: 'center' as const },
      { id: 'created_at', label: 'Created', sortable: true },
      { id: 'actions', label: 'Actions', align: 'center' as const },
    ],
    [],
  );

  const tableRows = statuses?.data?.length
    ? statuses.data.map((status, index) => (
        <TableRow key={status.id} className="hover:bg-muted/50">
          <TableCell className="text-center font-medium">{rowOffset + index + 1}</TableCell>
          <TableCell className="font-medium">{status.name}</TableCell>
          <TableCell className="text-sm text-muted-foreground">
            {status.status_type?.name ? (
              <Badge variant="outline" className="rounded-full px-3 py-0.5 text-xs font-semibold">
                {status.status_type.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </TableCell>
          <TableCell className="max-w-[320px] text-sm text-muted-foreground">
            {status.description || '—'}
          </TableCell>
          <TableCell className="text-center font-semibold text-slate-700 dark:text-slate-200">
            {status.daily_truck_statuses_count.toLocaleString()}
          </TableCell>
          <TableCell className="text-sm text-muted-foreground">{formatDate(status.created_at)}</TableCell>
          <TableCell className="text-center">
            <ListingRowActionsMenu
              actions={[
                hasPermission('statuses.show') && {
                  label: 'View',
                  icon: <Eye className="h-4 w-4" />,
                  href: `/statuses/${status.id}`,
                },
                hasPermission('statuses.edit') && {
                  label: 'Edit',
                  icon: <Edit className="h-4 w-4" />,
                  href: `/statuses/${status.id}/edit`,
                },
                hasPermission('statuses.destroy') && {
                  label: 'Delete',
                  icon: <Trash2 className="h-4 w-4" />,
                  danger: true,
                  onSelect: () => handleDeleteClick(status),
                },
              ]}
            />
          </TableCell>
        </TableRow>
      ))
    : (
        <TableRow>
          <TableCell colSpan={tableColumns.length} className="py-8 text-center text-muted-foreground">
            No statuses found.
            {hasPermission('statuses.create') && (
              <Link href="/statuses/create" className="ml-1 text-primary underline">
                Create one
              </Link>
            )}
          </TableCell>
        </TableRow>
      );

  const mobileItems = React.useMemo(
    () =>
      statuses?.data?.map((status, index) => ({
        status,
        position: rowOffset + index + 1,
      })) ?? [],
    [rowOffset, statuses?.data],
  );

  const mobileContent = (
    <ListingMobileItemList
      items={mobileItems}
      getKey={(item) => item.status.id}
      renderTitle={(item) => (
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">#{item.position}</span>
          <span className="text-base">{item.status.name}</span>
        </div>
      )}
      renderSubtitle={(item) => formatDate(item.status.created_at)}
      renderContent={(item) => (
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Status Type</span>
            {item.status.status_type?.name ? (
              <Badge variant="outline" className="rounded-full px-2 py-0.5 text-[11px] font-medium">
                {item.status.status_type.name}
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">Unassigned</span>
            )}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-600 dark:text-slate-300">Usage</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {item.status.daily_truck_statuses_count.toLocaleString()}
            </span>
          </div>
          <p>{item.status.description || 'No description provided.'}</p>
        </div>
      )}
      renderFooter={(item) => (
        <div className="flex w-full flex-wrap items-center justify-end gap-2">
          {hasPermission('statuses.show') && (
            <Button asChild size="sm" variant="outline" className="flex-1 sm:flex-auto">
              <Link href={`/statuses/${item.status.id}`}>
                <Eye className="mr-2 h-4 w-4" />
                View
              </Link>
            </Button>
          )}
          {hasPermission('statuses.edit') && (
            <Button asChild size="sm" variant="secondary" className="flex-1 sm:flex-none">
              <Link href={`/statuses/${item.status.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
          )}
          {hasPermission('statuses.destroy') && (
            <Button
              size="sm"
              variant="destructive"
              className="flex-1 sm:flex-none"
              onClick={() => handleDeleteClick(item.status)}
              disabled={isDeleting && selectedStatus?.id === item.status.id}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      )}
      emptyState={(
        <div className="py-8 text-center text-muted-foreground">
          No statuses found.
          {hasPermission('statuses.create') && (
            <Link href="/statuses/create" className="ml-1 text-primary underline">
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
        placeholder: 'Search statuses...',
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
      <Select value={selectedStatusType} onValueChange={handleStatusTypeChange}>
        <SelectTrigger className="w-full min-w-[160px] sm:w-auto">
          <SelectValue placeholder="Status type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All status types</SelectItem>
          {statusTypeOptions.map((option) => (
            <SelectItem key={option.id} value={String(option.id)}>
              {option.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </ListingFilterBar>
  );

  const headerActions = (
    <>
      {hasPermission('statuses.create') && (
        <Button asChild>
          <Link href="/statuses/create">
            <Plus className="mr-2 h-4 w-4" />
            Add Status
          </Link>
        </Button>
      )}
    </>
  );

  return (
    <>
      <ListPageLayout
        headTitle="Statuses"
        title="Statuses"
        description={`Manage ${totalCount.toLocaleString()} status records used throughout operations.`}
        breadcrumbs={breadcrumbs}
        actions={headerActions}
        stats={<ListingStatsHeader stats={statsDefinitions} orientation="row" />}
        tableTitle="Status Catalog"
        tableDescription="Review the operational status codes applied across trucks and workflows"
        tableHeaderExtras={tableHeaderExtras}
        pagination={
          statuses?.links?.length ? (
            <ListingPaginationFooter
              className="mt-4"
              links={statuses.links}
              from={statuses.meta?.from ?? undefined}
              to={statuses.meta?.to ?? undefined}
              total={statuses.meta?.total ?? undefined}
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
                <img src="/images/loading-spinner.svg" alt="Loading statuses" className="h-12 w-12" />
                <span className="text-sm text-muted-foreground">Loading statuses...</span>
              </div>
            )}
          </div>
        </div>

        <div className="relative space-y-3 md:hidden">
          {mobileContent}

          {isTableLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
              <img src="/images/loading-spinner.svg" alt="Loading statuses" className="h-10 w-10" />
              <span className="text-sm text-muted-foreground">Loading statuses...</span>
            </div>
          )}
        </div>
      </ListPageLayout>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setSelectedStatus(null);
            setDeleteError(null);
            setIsDeleting(false);
          }
        }}
        title="Delete Status"
        description="Are you sure you want to delete this status? This action cannot be undone."
        itemName={selectedStatus?.name}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
        errorMessage={deleteError}
        confirmLabel="Delete Status"
      />
    </>
  );
}

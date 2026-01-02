import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { useToast } from '@/hooks/use-toast';
import { Activity, ArrowLeft, Building2, Calendar, ClipboardList, Coins, Edit, FileText, Gauge, MapPin, Navigation, Package, Percent, Trash2, TrendingUp } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis } from 'recharts';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface SimpleReference {
  id: number;
  name: string;
}

interface PerformanceResource {
  id: number;
  trip_number: string;
  dispatch_date: string | null;
  distance_km: number | null;
  cargo_volume_mt: number | null;
  tonkm: number | null;
  cost: number | null;
  cost_per_km: number | null;
  cost_per_tonkm: number | null;
  remarks: string | null;
  status: string | null;
  created_at: string | null;
  updated_at: string | null;
  outsource?: SimpleReference | null;
  operation?: {
    id: number;
    label: string;
    customer?: SimpleReference | null;
  } | null;
  from_place?: SimpleReference | null;
  to_place?: SimpleReference | null;
  author?: SimpleReference | null;
}

interface VendorMetrics {
  vendorTripCount: number;
  vendorCompletedTrips: number;
  vendorActiveTrips: number;
  vendorCancelledTrips: number;
  vendorTotalDistance: number;
  vendorTotalCargo: number;
  vendorTotalTonKm: number;
  vendorTotalCost: number;
  vendorAverageTonKm: number | null;
  vendorAverageCost: number | null;
}

interface RecentTrip {
  id: number;
  trip_number: string;
  dispatch_date: string | null;
  distance_km: number | null;
  cargo_volume_mt: number | null;
  tonkm: number | null;
  cost: number | null;
  status: string | null;
  highlight: boolean;
}

interface StatusSlice {
  label: string;
  value: number;
}

interface VendorInsights {
  share: {
    distance: number | null;
    cargo: number | null;
    tonkm: number | null;
    cost: number | null;
  };
  statusBreakdown: StatusSlice[];
  averages: {
    costPerKm: number | null;
    costPerTonKm: number | null;
    avgTonKmPerTrip: number | null;
    avgCostPerTrip: number | null;
  };
  totals: {
    trips: number;
    distance: number;
    cargo: number;
    tonkm: number;
    cost: number;
  };
  tripCounts: {
    completed: number;
    active: number;
    cancelled: number;
  };
}

interface OutsourcePerformancesShowProps {
  performance: PerformanceResource;
  metrics: VendorMetrics;
  recentTrips: RecentTrip[];
  insights?: VendorInsights | null;
}

const formatNumber = (value: number | null | undefined, suffix = '', fractionDigits = 2): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  })}${suffix}`;
};

const formatCurrency = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 2,
  }).format(Number(value));
};

const formatPercent = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(1)}%`;
};

const formatDate = (value: string | null | undefined): string => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatShortDate = (value: string | null | undefined): string => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

const formatStatus = (status: string | null | undefined): string => {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const statusToneClasses = (status: string | null | undefined): string => {
  switch (status) {
    case 'completed':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'in_transit':
    case 'active':
      return 'border-blue-200 bg-blue-50 text-blue-700';
    case 'cancelled':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    default:
      return 'border-slate-200 bg-slate-100 text-slate-700';
  }
};

const chartPalette = ['#6366f1', '#22c55e', '#f97316'];

export default function OutsourcePerformancesShow({ performance, metrics, recentTrips, insights }: OutsourcePerformancesShowProps) {
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Outsource Performances', href: '/outsource-performances' },
    { title: `Trip ${performance.trip_number}`, href: `/outsource-performances/${performance.id}` },
  ];

  const statusLabel = formatStatus(performance.status);
  const statusClasses = statusToneClasses(performance.status);
  const routeLabel = [performance.from_place?.name, performance.to_place?.name].filter(Boolean).join(' → ') || 'Route not specified';

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Distance', value: formatNumber(performance.distance_km, ' km'), helper: 'Kilometres travelled' },
    { label: 'Cargo Volume', value: formatNumber(performance.cargo_volume_mt, ' MT'), helper: 'Freight moved' },
    { label: 'Ton-Kilometres', value: formatNumber(performance.tonkm, ' ton-km'), helper: 'Productive output' },
    { label: 'Trip Cost', value: formatCurrency(performance.cost), helper: 'Total spend' },
  ];

  const timelineData = useMemo(() => {
    if (!recentTrips || recentTrips.length === 0) return [] as Array<{ name: string; cost: number }>;
    return recentTrips
      .slice()
      .reverse()
      .map(trip => ({
        name: formatShortDate(trip.dispatch_date) || trip.trip_number,
        cost: trip.cost ?? 0,
      }));
  }, [recentTrips]);

  const statusData = insights?.statusBreakdown ?? [];
  const hasStatusData = statusData.some(slice => slice.value > 0);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/outsource-performances/${performance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Trip Deleted',
          description: `Trip ${performance.trip_number} has been removed successfully.`,
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const fallback = 'An unexpected error occurred while deleting the trip.';
        if (errors && typeof errors === 'object') {
          const message = Object.values(errors).flat().join('\n');
          toast({
            title: '❌ Delete Failed',
            description: message || fallback,
            variant: 'destructive',
          });
        } else {
          toast({
            title: '❌ Delete Failed',
            description: fallback,
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={`Trip ${performance.trip_number}`}
      subtitle={`${performance.outsource?.name ?? 'Vendor not linked'} • ${performance.operation?.label ?? 'Operation not linked'}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Outsource Trip ${performance.trip_number}`}
      icon={<Activity className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outsource-performances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge className={`flex items-center gap-1 px-3 py-1 uppercase ${statusClasses}`}>{statusLabel}</Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(performance.dispatch_date)}
          </Badge>
          <div className="flex gap-2">
            {hasPermission('outsource-performances.edit') && (
              <Button variant="outline" asChild>
                <Link href={`/outsource-performances/${performance.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {hasPermission('outsource-performances.destroy') && (
              <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSectionCard title="Trip Snapshot" description="Key operational figures" icon={<Activity className="h-5 w-5" />} className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Distance</p>
                <p className="text-lg font-semibold">{formatNumber(performance.distance_km, ' km')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Package className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Cargo</p>
                <p className="text-lg font-semibold">{formatNumber(performance.cargo_volume_mt, ' MT')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Ton-km</p>
                <p className="text-lg font-semibold">{formatNumber(performance.tonkm, ' ton-km')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <Coins className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Cost</p>
                <p className="text-lg font-semibold">{formatCurrency(performance.cost)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Gauge className="h-4 w-4" />
                Cost per km
              </div>
              <p className="mt-2 text-lg font-semibold">{formatNumber(performance.cost_per_km, ' Birr/km')}</p>
              <p className="text-xs text-muted-foreground">Spend per kilometre travelled</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Percent className="h-4 w-4" />
                Cost per ton-km
              </div>
              <p className="mt-2 text-lg font-semibold">{formatNumber(performance.cost_per_tonkm, ' Birr/ton-km')}</p>
              <p className="text-xs text-muted-foreground">Efficiency of spend across tonnage</p>
            </div>
          </div>

          {insights?.share && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Distance share</p>
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.distance)}</p>
                <p className="text-xs text-muted-foreground">Contribution to vendor portfolio</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Cargo share</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.cargo)}</p>
                <p className="text-xs text-muted-foreground">Portion of cargo moved</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Ton-km share</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.tonkm)}</p>
                <p className="text-xs text-muted-foreground">Share of productivity</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Cost share</p>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.cost)}</p>
                <p className="text-xs text-muted-foreground">Percentage of vendor spend</p>
              </div>
            </div>
          )}
        </DetailSectionCard>

        <DetailSectionCard title="Vendor Metrics" description="Performance across vendor history" icon={<Activity className="h-5 w-5" />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Vendor trips</span>
              <span className="font-semibold">{formatNumber(metrics.vendorTripCount, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Completed</span>
              <span className="font-semibold">{formatNumber(metrics.vendorCompletedTrips, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active</span>
              <span className="font-semibold">{formatNumber(metrics.vendorActiveTrips, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cancelled</span>
              <span className="font-semibold">{formatNumber(metrics.vendorCancelledTrips, '', 0)}</span>
            </div>
          </div>

          {hasStatusData && (
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={4}>
                    {statusData.map((_, index) => (
                      <Cell key={index} fill={chartPalette[index % chartPalette.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value, name) => [`${Number(value)}`, formatStatus(typeof name === 'string' ? name : String(name))]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </DetailSectionCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSectionCard title="Route & Context" description="Logistical details" icon={<MapPin className="h-5 w-5" />} className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Route
              </div>
              <p className="mt-2 text-sm font-semibold">{routeLabel}</p>
              <p className="text-xs text-muted-foreground">{formatNumber(performance.distance_km, ' km')} recorded</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Dispatch date
              </div>
              <p className="mt-2 text-sm font-semibold">{formatDate(performance.dispatch_date)}</p>
              <p className="text-xs text-muted-foreground">Execution window</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <FileText className="h-4 w-4" />
                Operation
              </div>
              {performance.operation ? (
                <Link href={`/operations/${performance.operation.id}`} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
                  {performance.operation.label}
                </Link>
              ) : (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">Not linked</p>
              )}
              {performance.operation?.customer && (
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Building2 className="h-3.5 w-3.5" />
                  {performance.operation.customer.name}
                </p>
              )}
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <ClipboardList className="h-4 w-4" />
                Vendor
              </div>
              {performance.outsource ? (
                <Link href={`/outsources/${performance.outsource.id}`} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
                  {performance.outsource.name}
                </Link>
              ) : (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">Not linked</p>
              )}
              <p className="text-xs text-muted-foreground">Captured by {performance.author?.name ?? 'System'}</p>
            </div>
          </div>

          {performance.remarks && (
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Trip Notes</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{performance.remarks}</p>
            </div>
          )}
        </DetailSectionCard>

        <DetailSectionCard title="Recent Vendor Trends" description="Cost trajectory" icon={<Activity className="h-5 w-5" />}>
          <div className="h-44 w-full">
            {timelineData.length > 0 ? (
              <ResponsiveContainer>
                <AreaChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis dataKey="name" stroke="currentColor" className="text-xs text-muted-foreground" />
                  <RechartsTooltip formatter={value => formatCurrency(Number(value))} />
                  <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">No trend data available yet.</div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Trip</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentTrips && recentTrips.length > 0 ? (
                  recentTrips.slice(0, 5).map(trip => (
                    <TableRow key={trip.id} className={trip.highlight ? 'bg-indigo-50/60 dark:bg-indigo-900/20' : undefined}>
                      <TableCell className="font-medium">{trip.trip_number}</TableCell>
                      <TableCell className="hidden text-xs sm:table-cell">{formatDate(trip.dispatch_date)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold">{formatCurrency(trip.cost)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="py-6 text-center text-sm text-muted-foreground">
                      No recent trips recorded.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DetailSectionCard>
      </div>

      <DeleteConfirmationDialog title="Delete outsource performance" description="This action will permanently remove the outsource performance record." open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

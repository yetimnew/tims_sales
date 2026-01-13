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
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('outsourcePerformances.fallbacks.notAvailable');

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('outsourcePerformances.title'), href: '/outsource-performances' },
    { title: t('outsourcePerformances.show.breadcrumbTrip', { trip: performance.trip_number }), href: `/outsource-performances/${performance.id}` },
  ];

  const formatNumber = (value: number | null | undefined, suffix = '', fractionDigits = 2): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return notAvailableLabel;
    return `${Number(value).toLocaleString(locale, {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    })}${suffix}`;
  };

  const formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return notAvailableLabel;
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'ETB',
      maximumFractionDigits: 2,
    }).format(Number(value));
  };

  const formatPercent = (value: number | null | undefined): string => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return notAvailableLabel;
    return `${Number(value).toFixed(1)}%`;
  };

  const formatDate = (value: string | null | undefined): string => {
    if (!value) return notAvailableLabel;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return notAvailableLabel;
    return date.toLocaleDateString(locale, {
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
    return date.toLocaleDateString(locale, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const formatStatus = (status: string | null | undefined): string => {
    if (!status) return t('outsourcePerformances.status.unknown');
    return status
      .replace(/_/g, ' ')
      .toLowerCase()
      .split(' ')
      .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
      .join(' ');
  };

  const statusLabel = formatStatus(performance.status);
  const statusClasses = statusToneClasses(performance.status);
  const routeLabel = [performance.from_place?.name, performance.to_place?.name].filter(Boolean).join(' → ') || t('outsourcePerformances.show.routeFallback');

  const kpiSummary: DetailSummaryItem[] = [
    { label: t('outsourcePerformances.show.kpi.distance.label'), value: formatNumber(performance.distance_km, ' km'), helper: t('outsourcePerformances.show.kpi.distance.helper') },
    { label: t('outsourcePerformances.show.kpi.cargo.label'), value: formatNumber(performance.cargo_volume_mt, ' MT'), helper: t('outsourcePerformances.show.kpi.cargo.helper') },
    { label: t('outsourcePerformances.show.kpi.tonkm.label'), value: formatNumber(performance.tonkm, ' ton-km'), helper: t('outsourcePerformances.show.kpi.tonkm.helper') },
    { label: t('outsourcePerformances.show.kpi.cost.label'), value: formatCurrency(performance.cost), helper: t('outsourcePerformances.show.kpi.cost.helper') },
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
          title: t('outsourcePerformances.delete.successTitle'),
          description: t('outsourcePerformances.delete.successDescription', { trip: performance.trip_number }),
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const fallback = t('outsourcePerformances.delete.failedDescription');
        if (errors && typeof errors === 'object') {
          const message = Object.values(errors).flat().join('\n');
          toast({
            title: t('outsourcePerformances.delete.failedTitle'),
            description: message || fallback,
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('outsourcePerformances.delete.failedTitle'),
            description: fallback,
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={t('outsourcePerformances.show.title', { trip: performance.trip_number })}
      subtitle={`${performance.outsource?.name ?? t('outsourcePerformances.show.vendorFallback')} • ${performance.operation?.label ?? t('outsourcePerformances.show.operationFallback')}`}
      breadcrumbs={breadcrumbs}
      headTitle={t('outsourcePerformances.show.headTitle', { trip: performance.trip_number })}
      icon={<Activity className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outsource-performances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('outsourcePerformances.show.actions.back')}
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
                  {t('outsourcePerformances.actions.edit')}
                </Link>
              </Button>
            )}
            {hasPermission('outsource-performances.destroy') && (
              <Button variant="outline" className="border-rose-200 text-rose-600 hover:bg-rose-50" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {t('outsourcePerformances.actions.delete')}
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 xl:grid-cols-3">
        <DetailSectionCard title={t('outsourcePerformances.show.sections.snapshot.title')} description={t('outsourcePerformances.show.sections.snapshot.description')} icon={<Activity className="h-5 w-5" />} className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.distance')}</p>
                <p className="text-lg font-semibold">{formatNumber(performance.distance_km, ' km')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-emerald-100 p-2 dark:bg-emerald-900/30">
                <Package className="h-4 w-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.cargo')}</p>
                <p className="text-lg font-semibold">{formatNumber(performance.cargo_volume_mt, ' MT')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-indigo-100 p-2 dark:bg-indigo-900/30">
                <TrendingUp className="h-4 w-4 text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.tonkm')}</p>
                <p className="text-lg font-semibold">{formatNumber(performance.tonkm, ' ton-km')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border p-3">
              <div className="rounded-full bg-amber-100 p-2 dark:bg-amber-900/30">
                <Coins className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.cost')}</p>
                <p className="text-lg font-semibold">{formatCurrency(performance.cost)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Gauge className="h-4 w-4" />
                {t('outsourcePerformances.show.fields.costPerKm')}
              </div>
              <p className="mt-2 text-lg font-semibold">{formatNumber(performance.cost_per_km, ' Birr/km')}</p>
              <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.costPerKmHelper')}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Percent className="h-4 w-4" />
                {t('outsourcePerformances.show.fields.costPerTonkm')}
              </div>
              <p className="mt-2 text-lg font-semibold">{formatNumber(performance.cost_per_tonkm, ' Birr/ton-km')}</p>
              <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.costPerTonkmHelper')}</p>
            </div>
          </div>

          {insights?.share && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.distanceShare')}</p>
                  <Navigation className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.distance)}</p>
                <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.distanceShareHelper')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.cargoShare')}</p>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.cargo)}</p>
                <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.cargoShareHelper')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.tonkmShare')}</p>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.tonkm)}</p>
                <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.tonkmShareHelper')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.costShare')}</p>
                  <Coins className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="mt-2 text-lg font-semibold">{formatPercent(insights.share.cost)}</p>
                <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.costShareHelper')}</p>
              </div>
            </div>
          )}
        </DetailSectionCard>

        <DetailSectionCard title={t('outsourcePerformances.show.sections.vendor.title')} description={t('outsourcePerformances.show.sections.vendor.description')} icon={<Activity className="h-5 w-5" />}>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('outsourcePerformances.show.vendorMetrics.trips')}</span>
              <span className="font-semibold">{formatNumber(metrics.vendorTripCount, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('outsourcePerformances.status.completed')}</span>
              <span className="font-semibold">{formatNumber(metrics.vendorCompletedTrips, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('outsourcePerformances.status.active')}</span>
              <span className="font-semibold">{formatNumber(metrics.vendorActiveTrips, '', 0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('outsourcePerformances.status.cancelled')}</span>
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
        <DetailSectionCard title={t('outsourcePerformances.show.sections.route.title')} description={t('outsourcePerformances.show.sections.route.description')} icon={<MapPin className="h-5 w-5" />} className="xl:col-span-2">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {t('outsourcePerformances.show.fields.route')}
              </div>
              <p className="mt-2 text-sm font-semibold">{routeLabel}</p>
              <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.routeRecorded', { value: formatNumber(performance.distance_km, ' km') })}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {t('outsourcePerformances.show.fields.dispatchDate')}
              </div>
              <p className="mt-2 text-sm font-semibold">{formatDate(performance.dispatch_date)}</p>
              <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.executionWindow')}</p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-muted-foreground">
                <FileText className="h-4 w-4" />
                {t('outsourcePerformances.show.fields.operation')}
              </div>
              {performance.operation ? (
                <Link href={`/operations/${performance.operation.id}`} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
                  {performance.operation.label}
                </Link>
              ) : (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{t('outsourcePerformances.show.operationFallback')}</p>
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
                {t('outsourcePerformances.show.fields.vendor')}
              </div>
              {performance.outsource ? (
                <Link href={`/outsources/${performance.outsource.id}`} className="mt-2 text-sm font-semibold text-indigo-600 hover:underline">
                  {performance.outsource.name}
                </Link>
              ) : (
                <p className="mt-2 text-sm font-semibold text-muted-foreground">{t('outsourcePerformances.show.vendorFallback')}</p>
              )}
              <p className="text-xs text-muted-foreground">{t('outsourcePerformances.show.fields.capturedBy', { name: performance.author?.name ?? t('outsourcePerformances.show.system') })}</p>
            </div>
          </div>

          {performance.remarks && (
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('outsourcePerformances.show.fields.notes')}</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{performance.remarks}</p>
            </div>
          )}
        </DetailSectionCard>

        <DetailSectionCard title={t('outsourcePerformances.show.sections.trends.title')} description={t('outsourcePerformances.show.sections.trends.description')} icon={<Activity className="h-5 w-5" />}>
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
              <div className="flex h-full items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                {t('outsourcePerformances.show.trends.empty')}
              </div>
            )}
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('outsourcePerformances.show.trends.trip')}</TableHead>
                  <TableHead className="hidden sm:table-cell">{t('outsourcePerformances.show.trends.date')}</TableHead>
                  <TableHead className="text-right">{t('outsourcePerformances.show.trends.cost')}</TableHead>
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
                      {t('outsourcePerformances.show.trends.emptyTable')}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DetailSectionCard>
      </div>

      <DeleteConfirmationDialog
        title={t('outsourcePerformances.delete.title')}
        description={t('outsourcePerformances.delete.description')}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

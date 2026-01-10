import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-permissions';
import { ArrowLeft, ArrowUpRight, Ban, BarChart3, CheckCircle, Edit, History, Sparkles, Target, Truck as TruckIcon, Trash2, Wrench, User, TrendingUp, DollarSign, Package, ExternalLink, MapPin, Route, Gauge } from 'lucide-react';
import { CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, LineChart } from 'recharts';
import { useTranslation } from 'react-i18next';

type VehicleType = { id: number; name: string };
type ActivityLog = { id: number; description: string; causer?: { name?: string }; created_at: string; properties?: Record<string, unknown> };
type DriverAssignment = {
  id: number;
  driver_id: number | null;
  driverid: string | null;
  date_recived?: string | null;
  date_detach?: string | null;
  is_attached: boolean;
  status: string | null;
  driver?: { id: number; name: string; driverid: string } | null;
};

type PerformanceRecord = {
  id: number;
  driver_truck_id: number | null;
  DateDispach?: string | null;
  DistanceWCargo?: number | null;
  DistanceWOCargo?: number | null;
  fuelInLitter?: number | null;
  tonkm?: number | null;
  cargo_volume_mt?: number | null;
  origin?: { id: number; name: string } | null;
  destination?: { id: number; name: string } | null;
};

type MaintenanceRecord = {
  id: number;
  scheduled_date?: string | null;
  completed_date?: string | null;
  odometer_reading?: number | null;
  cost?: number | null;
  description?: string | null;
  status?: string | null;
  is_overdue?: boolean;
};

type GradeCategoryKey = 'utilization' | 'efficiency' | 'reliability' | 'financial' | 'compliance';
type GradeCategoryDetails = { score: number; metrics: Record<string, number | null> };
type GradeWeights = { utilization_weight: number; efficiency_weight: number; reliability_weight: number; financial_weight: number; compliance_weight: number };

interface GradeReport {
  status?: 'graded' | 'insufficient_data';
  message?: string;
  overall: { score: number; letter: string } | null;
  weights: GradeWeights;
  categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>> | null;
}

interface TruckDetails {
  id: number;
  plate: string;
  vehicletype_id: number;
  chasisNumber?: string | null;
  engineNumber?: string | null;
  status: string;
  created_at?: string | null;
  updated_at?: string | null;
  vehicleType?: VehicleType | null;
  driverTrucks?: DriverAssignment[];
  maintenanceRecords?: MaintenanceRecord[];
  performances?: PerformanceRecord[];
}

interface TruckPerformanceSummary {
  total_records: number;
  completed_trips: number;
  total_distance_km: number;
  avg_fuel_efficiency_km_per_liter: number | null;
  total_ton_km: number;
  avg_payload_tons_per_trip: number | null;
  fuel_cost_birr?: number | null;
  total_loaded_distance_km?: number | null;
  total_empty_distance_km?: number | null;
  open_trips?: number | null;
  total_fuel_liters?: number | null;
  main_trip_records?: number | null;
  trip_completion_rate?: number | null;
  avg_ton_km_per_trip?: number | null;
  total_cargo_volume_mt?: number | null;
  avg_cargo_volume_mt_per_trip?: number | null;
  avg_trip_distance_km?: number | null;
  avg_trip_duration_days?: number | null;
}

interface TrucksShowProps {
  truck: TruckDetails;
  activityLogs?: ActivityLog[];
  counts?: { drivers: number; performances: number; driverAssignments: number; maintenance: number };
  performanceSummary?: TruckPerformanceSummary;
  maintenanceSummary?: { total_records: number; completed: number; scheduled: number; overdue: number; total_cost: number };
  gradeReport?: GradeReport;
}

const numberFormatter = new Intl.NumberFormat('en-ET');
const currencyFormatter = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 });

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  if (options) return new Intl.NumberFormat('en-ET', options).format(value);
  return numberFormatter.format(value);
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
  const formatted = formatNumber(value, { minimumFractionDigits: maximumFractionDigits, maximumFractionDigits });
  return formatted === 'N/A' ? formatted : `${formatted} KM`;
};

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return currencyFormatter.format(value);
};

const formatFuelEfficiency = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/L`;
};

const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusBadgeColor = (status?: string | null): string => {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'maintenance':
      return 'bg-amber-100 text-amber-700';
    case 'inactive':
      return 'bg-slate-200 text-slate-700';
    default:
      return 'bg-slate-200 text-slate-700';
  }
};

export default function TrucksShow({ truck, activityLogs = [], performanceSummary, maintenanceSummary, gradeReport }: TrucksShowProps) {
  const { hasPermission } = usePermissions();
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = useMemo(
    () => [
      { title: t('trucks.breadcrumb'), href: '/trucks' },
      { title: truck.plate, href: `/trucks/${truck.id}` },
    ],
    [t, truck.id, truck.plate],
  );

  const canEditTruck = hasPermission('trucks.edit');
  const canDeleteTruck = hasPermission('trucks.destroy');
  const canDeactivateTruck = hasPermission('trucks.deactivate');

  const statusLabel = truck.status
    ? t(`trucks.status.${truck.status}`, {
        defaultValue: truck.status.charAt(0).toUpperCase() + truck.status.slice(1),
      })
    : t('trucks.status.unknown');

  // Calculate financial metrics from performance data
  const totalFuelCost = performanceSummary?.fuel_cost_birr ?? 0;
  const totalMaintenanceCost = maintenanceSummary?.total_cost ?? 0;
  const totalOperationalCost = totalFuelCost + totalMaintenanceCost;
  const avgCostPerKm = performanceSummary?.total_distance_km && performanceSummary.total_distance_km > 0
    ? totalOperationalCost / performanceSummary.total_distance_km
    : 0;
  const avgCostPerTrip = performanceSummary?.completed_trips && performanceSummary.completed_trips > 0
    ? totalOperationalCost / performanceSummary.completed_trips
    : 0;

  const totalLoadedDistance = performanceSummary?.total_loaded_distance_km ?? 0;
  const totalEmptyDistance = performanceSummary?.total_empty_distance_km ?? 0;
  const openTrips = performanceSummary?.open_trips ?? 0;
  const totalFuelLiters = performanceSummary?.total_fuel_liters ?? 0;
  const mainTripRecords = performanceSummary?.main_trip_records ?? 0;
  const tripCompletionRate = performanceSummary?.trip_completion_rate ?? null;
  const avgTonKmPerTrip = performanceSummary?.avg_ton_km_per_trip ?? null;
  const totalCargoVolumeMt = performanceSummary?.total_cargo_volume_mt ?? null;
  const avgCargoVolumePerTrip = performanceSummary?.avg_cargo_volume_mt_per_trip ?? null;
  const avgTripDistance = performanceSummary?.avg_trip_distance_km ?? null;
  const avgTripDurationDays = performanceSummary?.avg_trip_duration_days ?? null;

  // Utilization metrics
  const loadFactor = performanceSummary?.total_distance_km && performanceSummary.total_distance_km > 0
    ? (totalLoadedDistance / performanceSummary.total_distance_km) * 100
    : 0;
  const emptyFactor = 100 - loadFactor;

  // Prepare chart data
  const distanceChartData = performanceSummary ? [
    { name: t('trucks.show.charts.loaded'), value: totalLoadedDistance, fill: '#22c55e' },
    { name: t('trucks.show.charts.empty'), value: totalEmptyDistance, fill: '#ef4444' },
  ].filter(item => (item.value ?? 0) > 0) : [];

  const tripStatusData = performanceSummary ? [
    { name: t('trucks.show.charts.completed'), value: performanceSummary.completed_trips, fill: '#22c55e' },
    { name: t('trucks.show.charts.open'), value: openTrips, fill: '#3b82f6' },
  ].filter(item => (item.value ?? 0) > 0) : [];

  const costBreakdownData = [
    { name: t('trucks.show.charts.fuelCost'), value: totalFuelCost, fill: '#f97316' },
    { name: t('trucks.show.charts.maintenance'), value: totalMaintenanceCost, fill: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const recentPerformances = truck.performances?.slice(0, 10).map((perf, index) => ({
    name: t('trucks.show.performance.tripLabel', { index: index + 1 }),
    distance: (perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0),
    tonnage: perf.cargo_volume_mt ?? 0,
    fuel: perf.fuelInLitter ?? 0,
  })) ?? [];

  const overviewSummaryCards = [
    {
      key: 'trips',
      label: t('trucks.show.summary.completedTrips'),
      value: formatNumber(performanceSummary?.completed_trips ?? 0, { maximumFractionDigits: 0 }),
      helper: t('trucks.show.summary.openTrips', { count: openTrips }),
    },
    {
      key: 'distance',
      label: t('trucks.show.summary.totalDistance'),
      value: formatKilometers(performanceSummary?.total_distance_km ?? 0, 0),
      helper: t('trucks.show.summary.loadFactor', { value: loadFactor.toFixed(1) }),
    },
    {
      key: 'efficiency',
      label: t('trucks.show.summary.fuelEfficiency'),
      value: formatFuelEfficiency(performanceSummary?.avg_fuel_efficiency_km_per_liter ?? null),
      helper: t('trucks.show.summary.totalFuel', { value: formatNumber(totalFuelLiters, { maximumFractionDigits: 0 }) }),
    },
    {
      key: 'cost',
      label: t('trucks.show.summary.totalCost'),
      value: formatCurrency(totalOperationalCost),
      helper: t('trucks.show.summary.costPerKm', { value: formatCurrency(avgCostPerKm) }),
    },
  ];

  const showDeactivateButton = canDeactivateTruck && truck.status === 'active';

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/trucks/${truck.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({ title: t('trucks.show.delete.successTitle'), description: t('trucks.show.delete.successDescription') });
      },
      onError: () => {
        setIsDeleting(false);
        toast({ title: t('trucks.show.delete.failedTitle'), description: t('trucks.show.delete.failedDescription'), variant: 'destructive' });
      },
    });
  };

  const handleDeactivateConfirm = () => {
    setIsDeactivating(true);
    router.post(`/trucks/${truck.id}/deactivate`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setDeactivateDialogOpen(false);
        setIsDeactivating(false);
        toast({ title: t('trucks.show.deactivate.successTitle'), description: t('trucks.show.deactivate.successDescription') });
      },
      onError: () => {
        setIsDeactivating(false);
        toast({ title: t('trucks.show.deactivate.failedTitle'), description: t('trucks.show.deactivate.failedDescription'), variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={truck.plate}
      subtitle={t('trucks.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('trucks.show.headTitle', { plate: truck.plate })}
      icon={<TruckIcon className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/trucks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('trucks.actions.back')}
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {canEditTruck && (
            <Button variant="outline" asChild>
              <Link href={`/trucks/${truck.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                {t('trucks.actions.edit')}
              </Link>
            </Button>
          )}
          {showDeactivateButton && (
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(true)} className="border-amber-200 text-amber-600 hover:bg-amber-50">
              <Ban className="h-4 w-4 mr-2" />
              {t('trucks.show.actions.deactivate')}
            </Button>
          )}
          {canDeleteTruck && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('trucks.actions.delete')}
            </Button>
          )}
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview"><CheckCircle className="h-4 w-4 mr-2" /> {t('trucks.show.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-4 w-4 mr-2" /> {t('trucks.show.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-2" /> {t('trucks.show.tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-2" /> {t('trucks.show.tabs.maintenance')}</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" /> {t('trucks.show.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={overviewSummaryCards} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard
                icon={<TruckIcon className="h-5 w-5" />}
                title={t('trucks.show.sections.basic.title')}
                description={t('trucks.show.sections.basic.description')}
              >
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.labels.status')}</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getStatusBadgeColor(truck.status)}`}>{statusLabel}</Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.fields.vehicleType')}</p>
                      <p className="mt-2 font-semibold">{truck.vehicleType?.name || t('trucks.fallbacks.notAvailable')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.fields.plate')}</p>
                      <p className="mt-2 font-mono text-lg font-bold">{truck.plate}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.fields.chassis')}</p>
                      <p className="mt-2 text-sm">{truck.chasisNumber || t('trucks.fallbacks.notAvailable')}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.fields.engine')}</p>
                      <p className="mt-2 text-sm">{truck.engineNumber || t('trucks.fallbacks.notAvailable')}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.fields.created')}</p>
                      <p className="mt-2 text-sm">{formatDate(truck.created_at)}</p>
                    </div>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<ExternalLink className="h-5 w-5" />} title={t('trucks.show.sections.quickLinks')}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/performances?truck=${truck.id}`}>
                      <Package className="h-4 w-4 mr-2" />
                      {t('trucks.show.actions.viewAllPerformances')}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/driver-trucks?truck_id=${truck.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      {t('trucks.show.actions.viewAllAssignments')}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<Gauge className="h-5 w-5" />} title={t('trucks.show.sections.utilization')}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.utilization.loadFactor')}</p>
                    <p className="mt-2 text-2xl font-bold text-green-700">{loadFactor.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatKilometers(performanceSummary?.total_loaded_distance_km ?? 0, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.utilization.emptyRunning')}</p>
                    <p className="mt-2 text-2xl font-bold text-red-700">{emptyFactor.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatKilometers(performanceSummary?.total_empty_distance_km ?? 0, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.utilization.avgPayload')}</p>
                    <p className="mt-2 text-2xl font-bold text-blue-700">{formatNumber(performanceSummary?.avg_payload_tons_per_trip ?? 0, { maximumFractionDigits: 1 })} T</p>
                    <p className="mt-1 text-xs text-muted-foreground">{t('trucks.show.utilization.perTrip')}</p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<User className="h-5 w-5" />}
                title={t('trucks.show.sections.assignments.title')}
                description={t('trucks.show.sections.assignments.description')}
                actions={
                  truck.driverTrucks && truck.driverTrucks.length > 0 ? (
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link href={`/driver-trucks?truck_id=${truck.id}`} className="flex items-center gap-1">
                        {t('trucks.show.actions.viewAll')}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null
                }
              >
                {truck.driverTrucks && truck.driverTrucks.length > 0 ? (
                  <div className="space-y-4">
                    {truck.driverTrucks.slice(0, 5).map(assignment => {
                      const driverName = assignment.driver?.name ?? t('trucks.show.fallbacks.unknownDriver');
                      return (
                        <div key={assignment.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{driverName}</p>
                              <p className="text-xs text-muted-foreground">{t('trucks.show.assignments.assignmentLabel', { id: assignment.id })}</p>
                            </div>
                            <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>
                              {assignment.is_attached ? t('trucks.show.assignments.attached') : t('trucks.show.assignments.detached')}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <div><span className="font-medium">{t('trucks.show.assignments.assigned')}:</span> {formatDate(assignment.date_recived)}</div>
                            <div><span className="font-medium">{t('trucks.show.assignments.detachedAt')}:</span> {formatDate(assignment.date_detach)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <User className="mx-auto mb-3 h-10 w-10 opacity-60" />
                    <p>{t('trucks.show.assignments.empty')}</p>
                  </div>
                )}
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport && gradeReport.overall && (
                <DetailSectionCard
                  icon={<Sparkles className="h-5 w-5 text-amber-600" />}
                  title={t('trucks.show.grade.title')}
                  description={t('trucks.show.grade.description')}
                >
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">{t('trucks.show.grade.overallScore')}</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-amber-800">{gradeReport.overall.score.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">{gradeReport.overall.score.toFixed(1)} / 100</span>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl font-semibold text-amber-700">{gradeReport.overall.letter}</div>
                  </div>
                </DetailSectionCard>
              )}

              {performanceSummary && (
                <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title={t('trucks.show.performance.summaryTitle')}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('trucks.show.performance.totalDistance')}</span>
                      <span className="font-semibold">{formatKilometers(performanceSummary.total_distance_km, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('trucks.show.performance.completedTrips')}</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.completed_trips, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('trucks.show.performance.fuelEfficiency')}</span>
                      <span className="font-semibold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency_km_per_liter)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('trucks.show.performance.tonKm')}</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.total_ton_km)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">{t('trucks.show.performance.totalCost')}</span>
                      <span className="font-semibold">{formatCurrency(totalOperationalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('trucks.show.performance.costPerKm')}</span>
                      <span className="font-semibold">{formatCurrency(avgCostPerKm)}</span>
                    </div>
                  </div>
                </DetailSectionCard>
              )}

              {distanceChartData.length > 0 && (
                <DetailSectionCard icon={<Route className="h-5 w-5" />} title={t('trucks.show.charts.distanceSplit')}>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={distanceChartData}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          label
                        >
                          {distanceChartData.map((entry, index) => (
                            <Cell key={index} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatKilometers(value as number, 0)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </DetailSectionCard>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceSummary && (
            <div className="grid gap-4 md:grid-cols-5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.performance.cards.totalRecords')}</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{performanceSummary.total_records}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('trucks.show.performance.cards.mainTrips', { count: mainTripRecords })}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.performance.cards.completed')}</p>
                <p className="mt-2 text-3xl font-bold text-green-700">{performanceSummary.completed_trips}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('trucks.show.performance.cards.completionRate', {
                    value: tripCompletionRate ? (tripCompletionRate * 100).toFixed(1) : '0',
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.performance.cards.openTrips')}</p>
                <p className="mt-2 text-3xl font-bold text-orange-700">{formatNumber(openTrips, { maximumFractionDigits: 0 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('trucks.show.performance.cards.inProgress')}</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.performance.cards.tonKm')}</p>
                <p className="mt-2 text-3xl font-bold text-purple-700">{formatNumber(performanceSummary.total_ton_km, { maximumFractionDigits: 0 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('trucks.show.performance.cards.avgTonKm', { value: formatNumber(avgTonKmPerTrip, { maximumFractionDigits: 1 }) })}
                </p>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.performance.cards.cargoVolume')}</p>
                <p className="mt-2 text-3xl font-bold text-teal-700">{formatNumber(totalCargoVolumeMt, { maximumFractionDigits: 0 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('trucks.show.performance.cards.avgCargoVolume', { value: formatNumber(avgCargoVolumePerTrip, { maximumFractionDigits: 1 }) })}
                </p>
              </div>
            </div>
          )}

          <DetailSectionCard
            icon={<BarChart3 className="h-5 w-5" />}
            title={t('trucks.show.performance.recordsTitle')}
            description={t('trucks.show.performance.recordsDescription')}
            actions={
              truck.performances && truck.performances.length > 0 ? (
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href={`/performances?truck=${truck.id}`} className="flex items-center gap-1">
                    {t('trucks.show.actions.viewAll')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null
            }
          >
            {truck.performances && truck.performances.length > 0 ? (
              <div className="space-y-3">
                {truck.performances.slice(0, 10).map(perf => (
                  <div key={perf.id} className="rounded-lg border p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link href={`/performances/${perf.id}`} className="font-semibold text-blue-600 hover:underline">
                          {t('trucks.show.performance.recordLabel', { id: perf.id })}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(perf.DateDispach)}</p>
                        {perf.origin && perf.destination && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {t('trucks.show.performance.routeLabel', {
                              origin: perf.origin.name,
                              destination: perf.destination.name,
                            })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('trucks.show.performance.distance')}:</span>
                        <span className="ml-1 font-semibold">{formatKilometers((perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0), 0)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('trucks.show.performance.cargo')}:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.cargo_volume_mt ?? null)} MT</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('trucks.show.performance.tonKm')}:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.tonkm ?? null)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('trucks.show.performance.fuel')}:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.fuelInLitter ?? null)} L</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('trucks.show.performance.empty')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.fuelCost')}</p>
              <p className="mt-2 text-2xl font-bold text-orange-700">{formatCurrency(totalFuelCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('trucks.show.analytics.totalFuel', { value: formatNumber(totalFuelLiters, { maximumFractionDigits: 0 }) })}
              </p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.maintenanceCost')}</p>
              <p className="mt-2 text-2xl font-bold text-purple-700">{formatCurrency(totalMaintenanceCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('trucks.show.analytics.records', { count: maintenanceSummary?.total_records ?? 0 })}
              </p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.totalOperationalCost')}</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(totalOperationalCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {t('trucks.show.analytics.costPerKm', { value: formatCurrency(avgCostPerKm) })}
              </p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {tripStatusData.length > 0 && (
              <DetailSectionCard title={t('trucks.show.analytics.tripStatusDistribution')} icon={<Target className="h-5 w-5" />}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={tripStatusData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        label
                      >
                        {tripStatusData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DetailSectionCard>
            )}

            {costBreakdownData.length > 0 && (
              <DetailSectionCard title={t('trucks.show.analytics.costBreakdown')} icon={<DollarSign className="h-5 w-5" />}>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={costBreakdownData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        label
                      >
                        {costBreakdownData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value as number)} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </DetailSectionCard>
            )}
          </div>

          {recentPerformances.length > 0 && (
            <DetailSectionCard title={t('trucks.show.analytics.recentTrends')} icon={<TrendingUp className="h-5 w-5" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentPerformances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#3b82f6" name={t('trucks.show.analytics.distance')} />
                    <Line yAxisId="right" type="monotone" dataKey="tonnage" stroke="#22c55e" name={t('trucks.show.analytics.tonnage')} />
                    <Line yAxisId="right" type="monotone" dataKey="fuel" stroke="#f97316" name={t('trucks.show.analytics.fuel')} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DetailSectionCard>
          )}

          <DetailSectionCard title={t('trucks.show.analytics.efficiency')} icon={<Gauge className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.avgDistance')}</p>
                <p className="mt-2 font-semibold">{formatKilometers(avgTripDistance ?? 0, 1)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.fuelEfficiency')}</p>
                <p className="mt-2 font-semibold">{formatFuelEfficiency(performanceSummary?.avg_fuel_efficiency_km_per_liter ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.costPerTrip')}</p>
                <p className="mt-2 font-semibold">{formatCurrency(avgCostPerTrip)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('trucks.show.analytics.avgTripDuration')}</p>
                <p className="mt-2 font-semibold">
                  {avgTripDurationDays
                    ? t('trucks.show.analytics.tripDurationValue', { value: avgTripDurationDays.toFixed(1) })
                    : t('trucks.fallbacks.notAvailable')}
                </p>
              </div>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <DetailSectionCard
            icon={<Wrench className="h-5 w-5" />}
            title={t('trucks.show.maintenance.title')}
            description={t('trucks.show.maintenance.description')}
          >
            {maintenanceSummary ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('trucks.show.maintenance.total')}</p>
                  <p className="text-lg font-semibold">{maintenanceSummary.total_records}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('trucks.show.maintenance.completed')}</p>
                  <p className="text-lg font-semibold text-green-600">{maintenanceSummary.completed}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('trucks.show.maintenance.scheduled')}</p>
                  <p className="text-lg font-semibold text-blue-600">{maintenanceSummary.scheduled}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('trucks.show.maintenance.overdue')}</p>
                  <p className="text-lg font-semibold text-red-600">{maintenanceSummary.overdue}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Wrench className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('trucks.show.maintenance.empty')}</p>
              </div>
            )}

            {truck.maintenanceRecords && truck.maintenanceRecords.length > 0 && (
              <div className="space-y-3">
                {truck.maintenanceRecords.slice(0, 10).map(rec => (
                  <div key={rec.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{rec.status ?? t('trucks.status.unknown')}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(rec.scheduled_date)}</span>
                    </div>
                    {rec.description && <p className="mt-2 text-xs">{rec.description}</p>}
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <div><span className="font-medium">{t('trucks.show.maintenance.cost')}:</span> {formatCurrency(rec.cost ?? null)}</div>
                      <div><span className="font-medium">{t('trucks.show.maintenance.odometer')}:</span> {formatKilometers(rec.odometer_reading ?? null, 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard
            icon={<History className="h-5 w-5" />}
            title={t('trucks.show.history.title')}
            description={t('trucks.show.history.description')}
          >
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('trucks.show.history.empty')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      {canDeleteTruck && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t('trucks.delete.title')}
          description={t('trucks.delete.description')}
          itemName={truck.plate}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      )}
      {canDeactivateTruck && (
        <DeleteConfirmationDialog
          open={deactivateDialogOpen}
          onOpenChange={setDeactivateDialogOpen}
          title={t('trucks.show.deactivate.title')}
          description={t('trucks.show.deactivate.description')}
          itemName={truck.plate}
          onConfirm={handleDeactivateConfirm}
          confirmLabel={t('trucks.show.deactivate.confirm')}
          isLoading={isDeactivating}
        />
      )}
    </DetailPageLayout>
  );
}

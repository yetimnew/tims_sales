import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Ban, BarChart3, History, ShieldCheck, CheckCircle, Calendar, User, ArrowLeft, Edit, Trash2, Truck, ArrowUpRight, Award, TrendingUp, DollarSign, Package, ExternalLink, MapPin, Fuel, Route, Gauge } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { useState, useMemo } from 'react';
import { Area, AreaChart, Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, LineChart } from 'recharts';
import { useTranslation } from 'react-i18next';

interface ActivityLog {
  id: number;
  description: string;
  causer?: { name?: string };
  created_at: string;
  properties?: Record<string, unknown>;
}

type DriverAssignment = {
  id: number;
  driver_id?: number | null;
  driverid?: string | null;
  truck_id?: number | null;
  plate?: string | null;
  date_recived?: string | null;
  date_detach?: string | null;
  is_attached: boolean;
  status?: string | null;
  truck?: { id: number; plate: string } | null;
};

type DriverPerformance = {
  id: number;
  driver_truck_id?: number | null;
  DateDispach?: string | null;
  DistanceWCargo?: number | null;
  DistanceWOCargo?: number | null;
  fuelInLitter?: number | null;
  fuelInBirr?: number | null;
  comment?: string | null;
  load_phase?: string | null;
  satus?: string | null;
  tonkm?: number | null;
  cargo_volume_mt?: number | null;
  cargo_weight_kg?: number | null;
  cargo_weight_tons?: number | null;
  is_returned?: boolean;
  returned_date?: string | null;
  total_distance_km?: number | null;
  trip_duration_days?: number | null;
  driver_truck?: { id: number; plate?: string | null; status?: string | null; is_attached?: boolean; date_recived?: string | null; date_detach?: string | null } | null;
  origin?: { id: number; name: string } | null;
  destination?: { id: number; name: string } | null;
  operation?: { id: number; number?: string | null; status?: string | null } | null;
};

type DriverSafety = {
  id: number;
  incident_date?: string | null;
  incident_type?: string | null;
  description?: string | null;
  severity?: string | null;
  damage_cost?: number | null;
  location?: string | null;
  resolution?: string | null;
  reported_by?: number | null;
};

interface Driver {
  id: number;
  user_id?: number | null;
  driverid: string;
  name: string;
  sex?: string | null;
  birthdate?: string | null;
  zone?: string | null;
  woreda?: string | null;
  kebele?: string | null;
  housenumber?: string | null;
  mobile?: string | null;
  hireddate?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  user?: {
    id: number;
    name: string;
    email: string;
  } | null;
  performances?: DriverPerformance[];
  driverTrucks?: DriverAssignment[];
  safetyRecords?: DriverSafety[];
}

interface DriversShowProps {
  driver: Driver;
  activityLogs?: ActivityLog[];
  performanceSummary?: {
    total_records: number;
    total_distance_km: number;
    total_trips: number;
    total_cargo_tonnage: number;
    avg_fuel_efficiency: number | null;
    avg_customer_rating: number | null;
    safety_incidents: number;
    total_fuel_liters?: number;
    total_fuel_cost?: number;
  };
  safetySummary?: {
    total_records: number;
    accidents: number;
    violations: number;
    warnings: number;
    critical: number;
    major: number;
    minor: number;
    total_damage_cost: number;
  };
  counts?: {
    trucks: number;
    assignments: number;
    performances: number;
    performance_records: number;
    safety_records: number;
    fuel_records: number;
  };
  gradeReport?: GradeReport;
}

type GradeCategoryKey = 'performance' | 'efficiency' | 'safety' | 'compliance' | 'engagement';

type GradeCategoryDetails = {
  score: number;
  metrics: Record<string, number | null>;
};

type GradeWeights = {
  performance_weight: number;
  efficiency_weight: number;
  safety_weight: number;
  compliance_weight: number;
  engagement_weight: number;
};

interface GradeReport {
  overall: { score: number; letter: string };
  weights: GradeWeights;
  categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
  metrics?: { driver?: Record<string, number | null>; peer_averages?: Record<string, number | null> };
}

const numberFormatter = new Intl.NumberFormat('en-ET');
const currencyFormatter = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 });

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  if (options) return new Intl.NumberFormat('en-ET', options).format(value);
  return numberFormatter.format(value);
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0, fallbackLabel = 'N/A'): string => {
  const formatted = formatNumber(value, { minimumFractionDigits: maximumFractionDigits, maximumFractionDigits }, fallbackLabel);
  return formatted === fallbackLabel ? formatted : `${formatted} KM`;
};

const formatTons = (value?: number | null, maximumFractionDigits = 1, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(
    value,
    { minimumFractionDigits: value > 0 && value < 1 ? maximumFractionDigits : 0, maximumFractionDigits },
    fallbackLabel,
  )} t`;
};

const formatFuelEfficiency = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, fallbackLabel)} KM/L`;
};

const formatCurrency = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return currencyFormatter.format(value);
};

const formatRating = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 }, fallbackLabel)} / 5`;
};

const formatDateDisplay = (value?: string | null, fallbackLabel = 'N/A'): string => {
  if (!value) return fallbackLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallbackLabel;
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const getStatusBadgeColor = (status?: string | null): string => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700';
    case 'inactive':
      return 'bg-slate-200 text-slate-700';
    case 'suspended':
      return 'bg-amber-100 text-amber-700';
    default:
      return 'bg-slate-200 text-slate-700';
  }
};

const getSexBadgeColor = (sex?: string | null): string => {
  switch (sex?.toLowerCase()) {
    case 'male':
      return 'bg-blue-100 text-blue-700';
    case 'female':
      return 'bg-pink-100 text-pink-700';
    default:
      return 'bg-slate-200 text-slate-700';
  }
};

export default function DriversShow({ driver, activityLogs = [], performanceSummary, safetySummary, gradeReport }: DriversShowProps) {
  const { t } = useTranslation();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const driverName = driver.name || t('drivers.show.fallbacks.unknownDriver');
  const notAvailableLabel = t('drivers.fallbacks.notAvailable');

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('drivers.breadcrumb'), href: '/drivers' },
    { title: driverName, href: `/drivers/${driver.id}` },
  ];

  const canEditDriver = hasPermission('drivers.edit');
  const canDeleteDriver = hasPermission('drivers.destroy');
  const canDeactivateDriver = hasPermission('drivers.deactivate');
  const canActivateDriver = hasPermission('drivers.activate');
  const canViewDriverTruckAssignments = hasPermission('driver-trucks.view');

  const statusLabel = driver.status
    ? driver.status === 'active'
      ? t('drivers.status.active')
      : driver.status === 'inactive'
        ? t('drivers.status.inactive')
        : driver.status === 'suspended'
          ? t('drivers.status.suspended')
          : driver.status
    : t('drivers.status.unknown');
  const sexLabel = driver.sex
    ? driver.sex === 'male'
      ? t('drivers.gender.male')
      : driver.sex === 'female'
        ? t('drivers.gender.female')
        : t('drivers.gender.unknown')
    : t('drivers.gender.unknown');

  const totalDistanceLabel = performanceSummary ? formatKilometers(performanceSummary.total_distance_km, 0, notAvailableLabel) : notAvailableLabel;
  const totalTripsLabel = performanceSummary ? formatNumber(performanceSummary.total_trips, { maximumFractionDigits: 0 }, notAvailableLabel) : notAvailableLabel;
  const fuelEfficiencyLabel = performanceSummary ? formatFuelEfficiency(performanceSummary.avg_fuel_efficiency, notAvailableLabel) : notAvailableLabel;
  const safetyIncidentCountLabel = safetySummary ? formatNumber(safetySummary.total_records, { maximumFractionDigits: 0 }, notAvailableLabel) : notAvailableLabel;
  const totalDamageCostLabel = safetySummary ? formatCurrency(safetySummary.total_damage_cost ?? null, notAvailableLabel) : null;

  // Calculate cost metrics
  const totalFuelCost = performanceSummary?.total_fuel_cost ?? 0;
  const avgCostPerKm = performanceSummary?.total_distance_km && performanceSummary.total_distance_km > 0
    ? totalFuelCost / performanceSummary.total_distance_km
    : 0;
  const avgCostPerTrip = performanceSummary?.total_trips && performanceSummary.total_trips > 0
    ? totalFuelCost / performanceSummary.total_trips
    : 0;

  // Prepare chart data
  const safetyChartData = safetySummary ? [
    { name: t('drivers.show.safety.accidents'), value: safetySummary.accidents, fill: '#ef4444' },
    { name: t('drivers.show.safety.violations'), value: safetySummary.violations, fill: '#f97316' },
    { name: t('drivers.show.safety.warnings'), value: safetySummary.warnings, fill: '#eab308' },
  ].filter(item => item.value > 0) : [];

  const severityChartData = safetySummary ? [
    { name: t('drivers.show.safety.critical'), value: safetySummary.critical, fill: '#dc2626' },
    { name: t('drivers.show.safety.major'), value: safetySummary.major, fill: '#f97316' },
    { name: t('drivers.show.safety.minor'), value: safetySummary.minor, fill: '#facc15' },
  ].filter(item => item.value > 0) : [];

  const recentPerformances = driver.performances?.slice(0, 10).map((perf, index) => ({
    name: t('drivers.show.performance.tripLabel', { index: index + 1 }),
    distance: (perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0),
    tonnage: perf.cargo_volume_mt ?? 0,
    fuel: perf.fuelInLitter ?? 0,
  })) ?? [];

  const overviewSummaryCards = [
    {
      key: 'trips',
      label: t('drivers.show.summary.completedTrips'),
      value: totalTripsLabel,
      helper: performanceSummary
        ? t('drivers.show.summary.distanceHelper', { value: totalDistanceLabel })
        : t('drivers.show.summary.noPerformanceData'),
    },
    {
      key: 'efficiency',
      label: t('drivers.show.summary.fuelEfficiency'),
      value: fuelEfficiencyLabel,
      helper: performanceSummary
        ? t('drivers.show.summary.fuelHelper', {
          value: formatNumber(performanceSummary.total_fuel_liters, { maximumFractionDigits: 0 }, notAvailableLabel),
        })
        : t('drivers.show.summary.noFuelData'),
    },
    {
      key: 'cargo',
      label: t('drivers.show.summary.totalCargo'),
      value: performanceSummary ? formatTons(performanceSummary.total_cargo_tonnage, 1, notAvailableLabel) : notAvailableLabel,
      helper: performanceSummary
        ? t('drivers.show.summary.cargoHelper', {
          value: formatTons(performanceSummary.total_cargo_tonnage / Math.max(performanceSummary.total_trips, 1), 1, notAvailableLabel),
        })
        : t('drivers.show.summary.noCargoData'),
    },
    {
      key: 'safety',
      label: t('drivers.show.summary.safetyScore'),
      value: safetyIncidentCountLabel,
      helper: totalDamageCostLabel
        ? t('drivers.show.summary.damageHelper', { value: totalDamageCostLabel })
        : t('drivers.show.summary.noIncidents'),
    },
  ];

  const showDeactivateButton = canDeactivateDriver && driver.status === 'active';
  const showActivateButton = canActivateDriver && driver.status !== 'active';

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/drivers/${driver.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({ title: t('drivers.show.delete.successTitle'), description: t('drivers.show.delete.successDescription') });
      },
      onError: () => {
        setIsDeleting(false);
        toast({ title: t('drivers.show.delete.failedTitle'), description: t('drivers.show.delete.failedDescription'), variant: 'destructive' });
      },
    });
  };

  const handleDeactivateConfirm = () => {
    setIsDeactivating(true);
    router.post(`/drivers/${driver.id}/deactivate`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setDeactivateDialogOpen(false);
        setIsDeactivating(false);
        toast({ title: t('drivers.show.deactivate.successTitle'), description: t('drivers.show.deactivate.successDescription') });
      },
      onError: () => {
        setIsDeactivating(false);
        toast({ title: t('drivers.show.deactivate.failedTitle'), description: t('drivers.show.deactivate.failedDescription'), variant: 'destructive' });
      },
    });
  };

  const handleActivateConfirm = () => {
    setIsActivating(true);
    router.post(`/drivers/${driver.id}/activate`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setActivateDialogOpen(false);
        setIsActivating(false);
        toast({ title: t('drivers.show.activate.successTitle'), description: t('drivers.show.activate.successDescription') });
      },
      onError: () => {
        setIsActivating(false);
        toast({ title: t('drivers.show.activate.failedTitle'), description: t('drivers.show.activate.failedDescription'), variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={driverName}
      subtitle={t('drivers.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('drivers.show.headTitle', { name: driverName })}
      icon={<User className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/drivers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('drivers.show.actions.back')}
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {canEditDriver && (
            <Button variant="outline" asChild>
              <Link href={`/drivers/${driver.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                {t('drivers.actions.edit')}
              </Link>
            </Button>
          )}
          {showDeactivateButton && (
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(true)} className="border-amber-200 text-amber-600 hover:bg-amber-50">
              <Ban className="h-4 w-4 mr-2" />
              {t('drivers.show.actions.deactivate')}
            </Button>
          )}
          {showActivateButton && (
            <Button variant="outline" onClick={() => setActivateDialogOpen(true)} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('drivers.show.actions.activate')}
            </Button>
          )}
          {canDeleteDriver && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('drivers.actions.delete')}
            </Button>
          )}
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview"><CheckCircle className="h-4 w-4 mr-2" /> {t('drivers.show.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-4 w-4 mr-2" /> {t('drivers.show.tabs.performance')}</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-2" /> {t('drivers.show.tabs.analytics')}</TabsTrigger>
          <TabsTrigger value="safety"><ShieldCheck className="h-4 w-4 mr-2" /> {t('drivers.show.tabs.safety')}</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" /> {t('drivers.show.tabs.history')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={overviewSummaryCards} />
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard
                icon={<User className="h-5 w-5" />}
                title={t('drivers.show.sections.basic.title')}
                description={t('drivers.show.sections.basic.description')}
              >
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.status')}</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>{statusLabel}</Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.gender')}</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getSexBadgeColor(driver.sex)}`}>{sexLabel}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.driverId')}</p>
                      <p className="mt-2 font-mono text-sm">{driver.driverid}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.mobile')}</p>
                      <p className="mt-2 text-sm">{driver.mobile || notAvailableLabel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.zone')}</p>
                      <p className="mt-2 text-sm">{driver.zone || notAvailableLabel}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.woreda')}</p>
                      <p className="mt-2 text-sm">{driver.woreda || notAvailableLabel}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.kebele')}</p>
                      <p className="mt-2 text-sm">{driver.kebele || notAvailableLabel}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.labels.housenumber')}</p>
                      <p className="mt-2 text-sm">{driver.housenumber || notAvailableLabel}</p>
                    </div>
                  </div>
                  {driver.user && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        <p className="text-xs font-semibold uppercase text-blue-700 dark:text-blue-300">Linked User Account</p>
                      </div>
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium">{driver.user.name}</p>
                        <p className="text-xs text-blue-600 dark:text-blue-400">{driver.user.email}</p>
                        <p className="text-xs text-muted-foreground">This driver can access the mobile app using this user account.</p>
                      </div>
                    </div>
                  )}
                  {!driver.user && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-700 dark:bg-slate-800/20">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">User Account</p>
                      <p className="mt-2 text-sm text-muted-foreground">No user account linked. Link a user in the edit form to enable mobile app access.</p>
                    </div>
                  )}
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<Truck className="h-5 w-5" />}
                title={t('drivers.show.sections.assignments.title')}
                description={t('drivers.show.sections.assignments.description')}
                actions={
                  canViewDriverTruckAssignments && driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link href={`/driver-trucks?driver_id=${driver.id}`} className="flex items-center gap-1">
                        {t('drivers.show.actions.viewAll')}
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null
                }
              >
                {driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                  <div className="space-y-4">
                    {driver.driverTrucks.slice(0, 5).map(assignment => {
                      const plate = assignment.truck?.plate ?? assignment.plate ?? notAvailableLabel;
                      return (
                        <div key={assignment.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{plate}</p>
                              <p className="text-xs text-muted-foreground">{t('drivers.show.assignments.assignmentLabel', { id: assignment.id })}</p>
                            </div>
                            <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>
                              {assignment.is_attached ? t('drivers.show.assignments.attached') : t('drivers.show.assignments.detached')}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <div><span className="font-medium">{t('drivers.show.assignments.assigned')}:</span> {formatDateDisplay(assignment.date_recived, notAvailableLabel)}</div>
                            <div><span className="font-medium">{t('drivers.show.assignments.detachedAt')}:</span> {formatDateDisplay(assignment.date_detach, notAvailableLabel)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Truck className="mx-auto mb-3 h-10 w-10 opacity-60" />
                    <p>{t('drivers.show.assignments.empty')}</p>
                  </div>
                )}
              </DetailSectionCard>

              <DetailSectionCard
                icon={<Calendar className="h-5 w-5" />}
                title={t('drivers.show.sections.employment.title')}
                description={t('drivers.show.sections.employment.description')}
              >
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('drivers.show.fields.birthdate')}</span>
                    <span className="font-semibold">{formatDateDisplay(driver.birthdate, notAvailableLabel)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('drivers.show.fields.hireddate')}</span>
                    <span className="font-semibold">{formatDateDisplay(driver.hireddate, notAvailableLabel)}</span>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<ExternalLink className="h-5 w-5" />} title={t('drivers.show.sections.quickLinks')}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/performances?driver=${driver.id}`}>
                      <Package className="h-4 w-4 mr-2" />
                      {t('drivers.show.actions.viewAllPerformances')}
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                  {canViewDriverTruckAssignments && (
                    <Button variant="outline" asChild className="w-full">
                      <Link href={`/driver-trucks?driver_id=${driver.id}`}>
                        <Truck className="h-4 w-4 mr-2" />
                        {t('drivers.show.actions.viewAllAssignments')}
                        <ExternalLink className="h-3 w-3 ml-auto" />
                      </Link>
                    </Button>
                  )}
                </div>
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport && gradeReport.overall && (
                <DetailSectionCard
                  icon={<Award className="h-5 w-5 text-amber-600" />}
                  title={t('drivers.show.grade.title')}
                  description={t('drivers.show.grade.description')}
                >
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">{t('drivers.show.grade.overallScore')}</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-amber-800">
                          {gradeReport.overall?.score?.toFixed(1) ?? 'N/A'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {t('drivers.show.grade.scoreOutOf', { 
                            score: gradeReport.overall?.score?.toFixed(1) ?? 'N/A' 
                          })}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl font-semibold text-amber-700">
                      {gradeReport.overall?.letter ?? 'N/A'}
                    </div>
                  </div>
                </DetailSectionCard>
              )}

              {performanceSummary && (
                <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title={t('drivers.show.performance.summaryTitle')}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('drivers.show.performance.distance')}</span>
                      <span className="font-semibold">{formatKilometers(performanceSummary.total_distance_km, 0, notAvailableLabel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('drivers.show.performance.trips')}</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.total_trips, undefined, notAvailableLabel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('drivers.show.performance.cargo')}</span>
                      <span className="font-semibold">{formatTons(performanceSummary.total_cargo_tonnage, 1, notAvailableLabel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('drivers.show.performance.fuelEfficiency')}</span>
                      <span className="font-semibold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency, notAvailableLabel)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">{t('drivers.show.performance.fuelCost')}</span>
                      <span className="font-semibold">{formatCurrency(totalFuelCost, notAvailableLabel)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('drivers.show.performance.costPerKm')}</span>
                      <span className="font-semibold">{formatCurrency(avgCostPerKm, notAvailableLabel)}</span>
                    </div>
                    {performanceSummary.avg_customer_rating && (
                      <div className="flex justify-between border-t pt-2">
                        <span className="text-muted-foreground">{t('drivers.show.performance.avgRating')}</span>
                        <span className="font-semibold">{formatRating(performanceSummary.avg_customer_rating, notAvailableLabel)}</span>
                      </div>
                    )}
                  </div>
                </DetailSectionCard>
              )}

              {safetyChartData.length > 0 && (
                <DetailSectionCard icon={<ShieldCheck className="h-5 w-5" />} title={t('drivers.show.safety.overviewTitle')}>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={safetyChartData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={4}
                          label
                        >
                          {safetyChartData.map((entry, index) => (
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {performanceSummary && (
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.performance.cards.totalDistance')}</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{formatKilometers(performanceSummary.total_distance_km, 0, notAvailableLabel)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('drivers.show.performance.cards.tripCount', { count: performanceSummary.total_trips })}
                </p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.performance.cards.totalCargo')}</p>
                <p className="mt-2 text-3xl font-bold text-green-700">{formatTons(performanceSummary.total_cargo_tonnage, 0, notAvailableLabel)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('drivers.show.performance.cards.cargoAvg', {
                    value: formatTons(performanceSummary.total_cargo_tonnage / Math.max(performanceSummary.total_trips, 1), 1, notAvailableLabel),
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.performance.cards.fuelEfficiency')}</p>
                <p className="mt-2 text-3xl font-bold text-orange-700">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency, notAvailableLabel)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('drivers.show.performance.cards.fuelTotal', {
                    value: formatNumber(performanceSummary.total_fuel_liters, { maximumFractionDigits: 0 }, notAvailableLabel),
                  })}
                </p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.performance.cards.fuelCost')}</p>
                <p className="mt-2 text-3xl font-bold text-purple-700">{formatCurrency(totalFuelCost, notAvailableLabel)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('drivers.show.performance.cards.costPerKm', { value: formatCurrency(avgCostPerKm, notAvailableLabel) })}
                </p>
              </div>
            </div>
          )}

          <DetailSectionCard
            icon={<BarChart3 className="h-5 w-5" />}
            title={t('drivers.show.performance.recordsTitle')}
            description={t('drivers.show.performance.recordsDescription')}
            actions={
              driver.performances && driver.performances.length > 0 ? (
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href={`/performances?driver=${driver.id}`} className="flex items-center gap-1">
                    {t('drivers.show.actions.viewAll')}
                    <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null
            }
          >
            {driver.performances && driver.performances.length > 0 ? (
              <div className="space-y-3">
                {driver.performances.slice(0, 10).map(perf => (
                  <div key={perf.id} className="rounded-lg border p-4 hover:border-blue-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <Link href={`/performances/${perf.id}`} className="font-semibold text-blue-600 hover:underline">
                          {t('drivers.show.performance.recordLabel', { id: perf.id })}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDateDisplay(perf.DateDispach, notAvailableLabel)}</p>
                        {perf.origin && perf.destination && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {perf.origin.name} → {perf.destination.name}
                          </p>
                        )}
                      </div>
                      {perf.operation && (
                        <Link href={`/operations/${perf.operation.id}`} className="text-sm text-blue-600 hover:underline">
                          {t('drivers.show.performance.viewOperation')}
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('drivers.show.performance.distance')}:</span>
                        <span className="ml-1 font-semibold">{formatKilometers((perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0), 0, notAvailableLabel)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('drivers.show.performance.cargo')}:</span>
                        <span className="ml-1 font-semibold">{formatTons(perf.cargo_volume_mt ?? null, 1, notAvailableLabel)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('drivers.show.performance.tonKm')}:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.tonkm ?? null, undefined, notAvailableLabel)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">{t('drivers.show.performance.fuel')}:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.fuelInLitter ?? null, undefined, notAvailableLabel)} L</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('drivers.show.performance.empty')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {performanceSummary && (
            <div className="grid gap-6 lg:grid-cols-2">
              {recentPerformances.length > 0 && (
                <DetailSectionCard title={t('drivers.show.analytics.recentTrends')} icon={<TrendingUp className="h-5 w-5" />}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={recentPerformances}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip />
                        <Legend />
                        <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#3b82f6" name={t('drivers.show.analytics.distance')} />
                        <Line yAxisId="right" type="monotone" dataKey="tonnage" stroke="#22c55e" name={t('drivers.show.analytics.tonnage')} />
                        <Line yAxisId="right" type="monotone" dataKey="fuel" stroke="#f97316" name={t('drivers.show.analytics.fuel')} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </DetailSectionCard>
              )}

              {safetyChartData.length > 0 && (
                <DetailSectionCard title={t('drivers.show.analytics.safetyByType')} icon={<ShieldCheck className="h-5 w-5" />}>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie 
                          data={safetyChartData} 
                          dataKey="value" 
                          nameKey="name" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={4}
                          label
                        >
                          {safetyChartData.map((entry, index) => (
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
            </div>
          )}

          {severityChartData.length > 0 && (
            <DetailSectionCard title={t('drivers.show.analytics.severity')} icon={<AlertCircle className="h-5 w-5" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={severityChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name={t('drivers.show.analytics.incidents')}>
                      {severityChartData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
            </DetailSectionCard>
          )}

          <DetailSectionCard title={t('drivers.show.analytics.efficiency')} icon={<Gauge className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.avgDistance')}</p>
                <p className="mt-2 font-semibold">
                  {formatKilometers(
                    performanceSummary ? performanceSummary.total_distance_km / Math.max(performanceSummary.total_trips, 1) : 0,
                    1,
                    notAvailableLabel,
                  )}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.fuelEfficiency')}</p>
                <p className="mt-2 font-semibold">{formatFuelEfficiency(performanceSummary?.avg_fuel_efficiency, notAvailableLabel)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.costPerTrip')}</p>
                <p className="mt-2 font-semibold">{formatCurrency(avgCostPerTrip, notAvailableLabel)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.avgPayload')}</p>
                <p className="mt-2 font-semibold">
                  {formatTons(
                    performanceSummary ? performanceSummary.total_cargo_tonnage / Math.max(performanceSummary.total_trips, 1) : 0,
                    1,
                    notAvailableLabel,
                  )}
                </p>
              </div>
            </div>
          </DetailSectionCard>

          {safetySummary && (
            <DetailSectionCard title={t('drivers.show.analytics.safetyPerformance')} icon={<ShieldCheck className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-4">
                <div className={`rounded-lg border p-3 ${safetySummary.total_records === 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.totalIncidents')}</p>
                  <p className={`mt-2 text-2xl font-bold ${safetySummary.total_records === 0 ? 'text-green-700' : 'text-red-700'}`}>{safetySummary.total_records}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.safety.accidents')}</p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">{safetySummary.accidents}</p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.safety.violations')}</p>
                  <p className="mt-2 text-2xl font-bold text-yellow-700">{safetySummary.violations}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('drivers.show.analytics.totalDamage')}</p>
                  <p className="mt-2 text-lg font-bold text-blue-700">{formatCurrency(safetySummary.total_damage_cost, notAvailableLabel)}</p>
                </div>
              </div>
            </DetailSectionCard>
          )}
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <DetailSectionCard
            icon={<ShieldCheck className="h-5 w-5" />}
            title={t('drivers.show.safety.overviewTitle')}
            description={t('drivers.show.safety.overviewDescription')}
          >
            {safetySummary ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('drivers.show.safety.total')}</p>
                  <p className="text-lg font-semibold">{safetySummary.total_records}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('drivers.show.safety.accidents')}</p>
                  <p className="text-lg font-semibold">{safetySummary.accidents}</p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('drivers.show.safety.violations')}</p>
                  <p className="text-lg font-semibold">{safetySummary.violations}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">{t('drivers.show.safety.warnings')}</p>
                  <p className="text-lg font-semibold">{safetySummary.warnings}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('drivers.show.safety.empty')}</p>
              </div>
            )}

            {driver.safetyRecords && driver.safetyRecords.length > 0 && (
              <div className="space-y-3">
                {driver.safetyRecords.slice(0, 10).map(rec => (
                  <div key={rec.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{rec.incident_type ?? t('drivers.show.safety.incident')}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateDisplay(rec.incident_date, notAvailableLabel)}</span>
                    </div>
                    {rec.description && <p className="mt-2 text-xs">{rec.description}</p>}
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <div><span className="font-medium">{t('drivers.show.safety.location')}:</span> {rec.location || notAvailableLabel}</div>
                      <div><span className="font-medium">{t('drivers.show.safety.damage')}:</span> {formatCurrency(rec.damage_cost ?? null, notAvailableLabel)}</div>
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
            title={t('drivers.show.history.title')}
            description={t('drivers.show.history.description')}
          >
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('drivers.show.history.empty')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      {canDeleteDriver && (
        <DeleteConfirmationDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title={t('drivers.show.delete.title')}
          description={t('drivers.show.delete.description')}
          itemName={driverName}
          onConfirm={handleDeleteConfirm}
          isLoading={isDeleting}
        />
      )}
      {canDeactivateDriver && (
        <DeleteConfirmationDialog
          open={deactivateDialogOpen}
          onOpenChange={setDeactivateDialogOpen}
          title={t('drivers.show.deactivate.title')}
          description={t('drivers.show.deactivate.description')}
          itemName={driverName}
          onConfirm={handleDeactivateConfirm}
          confirmLabel={t('drivers.show.deactivate.confirm')}
          isLoading={isDeactivating}
        />
      )}
      {canActivateDriver && (
        <DeleteConfirmationDialog
          open={activateDialogOpen}
          onOpenChange={setActivateDialogOpen}
          title={t('drivers.show.activate.title')}
          description={t('drivers.show.activate.description')}
          itemName={driverName}
          onConfirm={handleActivateConfirm}
          confirmLabel={t('drivers.show.activate.confirm')}
          isLoading={isActivating}
          isDangerous={false}
        />
      )}
    </DetailPageLayout>
  );
}

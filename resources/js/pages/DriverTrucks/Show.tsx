import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { toast } from '@/hooks/use-toast';
import { type BreadcrumbItem } from '@/types';
import { Activity, AlertCircle, ArrowLeft, ArrowUpRight, Award, BarChart3, CheckCircle, Clock, Edit, History, Truck, User, UserX, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DriverTruck {
  id: number;
  driver_id: number;
  truck_id: number;
  plate: string;
  driverid: string;
  date_recived: string;
  date_detach?: string;
  reason?: string;
  is_attached: boolean;
  status?: string | number | null;
  driver: {
    id: number;
    name: string;
    driverid: string;
  };
  truck: {
    id: number;
    plate: string;
  };
  created_at: string;
  updated_at: string;
}

interface Performance {
  id: number;
  trip?: string | null;
  DateDispach?: string | null;
  CargoVolumMT?: number | null;
  operation?: {
    customer?: {
      name?: string | null;
    } | null;
  } | null;
  origin?: {
    name?: string | null;
  } | null;
  destination?: {
    name?: string | null;
  } | null;
}

interface ActivityLog {
  id: number;
  description: string;
  created_at: string;
  causer?: {
    name: string;
  };
}

interface Props {
  driverTruck: DriverTruck;
  performances: Performance[];
  dateDifference?: string;
  activityLogs: ActivityLog[];
  gradeReport?: GradeReport;
}

type GradeCategoryKey = 'performance' | 'efficiency' | 'consistency';

type GradeCategoryDetails = {
  score: number;
  metrics: Record<string, number | null>;
};

type GradeWeights = {
  performance_weight: number;
  efficiency_weight: number;
  consistency_weight: number;
};

interface GradeReport {
  overall: {
    score: number;
    letter: string;
  };
  weights: GradeWeights;
  categories: Partial<Record<GradeCategoryKey, GradeCategoryDetails>>;
  metrics?: {
    assignment?: Record<string, number | null>;
    peer_averages?: Record<string, number | null>;
  };
}

type GradeCategoryConfigEntry = {
  label: string;
  description: string;
  metrics: Array<{
    key: string;
    label: string;
    formatter: (value: number | null | undefined) => string;
  }>;
};

type GradeCategoryView = {
  key: GradeCategoryKey;
  label: string;
  description: string;
  score: number;
  weight: number | null;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

const gradeCategoryOrder: GradeCategoryKey[] = ['performance', 'efficiency', 'consistency'];

const numberFormatter = new Intl.NumberFormat('en-ET');

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  if (options) return new Intl.NumberFormat('en-ET', options).format(value);
  return numberFormatter.format(value);
};

const formatPercentFromRatio = (value?: number | null, maximumFractionDigits = 0, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${(value * 100).toFixed(maximumFractionDigits)}%`;
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(value, {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }, fallbackLabel)} KM`;
};

const formatCurrencyPerKm = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }, fallbackLabel)} / KM`;
};

const formatDays = (value?: number | null, fallbackLabel = 'N/A', pluralLabel?: (countLabel: string) => string, singleLabel = '1 day'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  const rounded = Number(value.toFixed(1));
  if (rounded === 1) return singleLabel;
  const formatted = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
  return pluralLabel ? pluralLabel(formatted) : `${formatted} days`;
};

const formatScore = (value?: number | null, maximumFractionDigits = 1, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return Number(value).toFixed(maximumFractionDigits);
};

const formatWeight = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${Number(value).toFixed(0)}%`;
};

const formatVolume = (value?: number | null, fallbackLabel = 'N/A'): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return fallbackLabel;
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, fallbackLabel)} MT`;
};

export default function Show({ driverTruck, performances, dateDifference, activityLogs, gradeReport }: Props) {
  const { t } = useTranslation();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const notAvailableLabel = t('driverTrucks.fallbacks.notAvailable');

  const overallGrade = gradeReport?.overall ?? null;
  const gradeWeights = gradeReport?.weights ?? null;

  const buildTripLabel = (performance: Performance): string => {
    if (performance.trip && performance.trip.trim().length > 0) return performance.trip.trim();
    return t('driverTrucks.show.performance.tripLabel', { id: performance.id });
  };

  const buildRouteLabel = (performance: Performance): string => {
    const origin = performance.origin?.name?.trim();
    const destination = performance.destination?.name?.trim();
    if (!origin && !destination) return notAvailableLabel;
    return t('driverTrucks.show.performance.routeLabel', {
      origin: origin ?? t('driverTrucks.show.performance.unknownOrigin'),
      destination: destination ?? t('driverTrucks.show.performance.unknownDestination'),
    });
  };

  const gradeCategoryConfig: Record<GradeCategoryKey, GradeCategoryConfigEntry> = {
    performance: {
      label: t('driverTrucks.show.grade.performance.label'),
      description: t('driverTrucks.show.grade.performance.description'),
      metrics: [
        { key: 'total_trips', label: t('driverTrucks.show.grade.performance.trips'), formatter: value => formatNumber(value, { maximumFractionDigits: 0 }, notAvailableLabel) },
        { key: 'total_distance_km', label: t('driverTrucks.show.grade.performance.distance'), formatter: value => formatKilometers(value, 0, notAvailableLabel) },
        { key: 'avg_trip_distance_km', label: t('driverTrucks.show.grade.performance.avgDistance'), formatter: value => formatKilometers(value, 1, notAvailableLabel) },
        { key: 'ton_km_per_trip', label: t('driverTrucks.show.grade.performance.tonKmPerTrip'), formatter: value => formatNumber(value, { maximumFractionDigits: 1 }, notAvailableLabel) },
      ],
    },
    efficiency: {
      label: t('driverTrucks.show.grade.efficiency.label'),
      description: t('driverTrucks.show.grade.efficiency.description'),
      metrics: [
        { key: 'km_per_liter', label: t('driverTrucks.show.grade.efficiency.kmPerLiter'), formatter: value => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }, notAvailableLabel) },
        { key: 'fuel_cost_per_km', label: t('driverTrucks.show.grade.efficiency.fuelCostPerKm'), formatter: value => formatCurrencyPerKm(value, notAvailableLabel) },
        { key: 'avg_trip_distance_km', label: t('driverTrucks.show.grade.efficiency.avgDistance'), formatter: value => formatKilometers(value, 1, notAvailableLabel) },
      ],
    },
    consistency: {
      label: t('driverTrucks.show.grade.consistency.label'),
      description: t('driverTrucks.show.grade.consistency.description'),
      metrics: [
        { key: 'trip_completion_rate', label: t('driverTrucks.show.grade.consistency.completionRate'), formatter: value => formatPercentFromRatio(value, 0, notAvailableLabel) },
        { key: 'avg_trip_duration_days', label: t('driverTrucks.show.grade.consistency.avgTripDuration'), formatter: value => formatDays(value, notAvailableLabel, (countLabel) => t('driverTrucks.show.duration.plural', { count: countLabel }), t('driverTrucks.show.duration.single')) },
      ],
    },
  };

  const gradeCategories: GradeCategoryView[] = useMemo(() => {
    if (!gradeReport?.categories) return [];
    return (Object.entries(gradeCategoryConfig) as Array<[GradeCategoryKey, GradeCategoryConfigEntry]>)
      .map(([key, config]) => {
        const category = gradeReport.categories?.[key];
        if (!category) return null;
        const weightKey = `${key}_weight` as keyof GradeWeights;
        return {
          key,
          label: config.label,
          description: config.description,
          score: category.score,
          weight: gradeWeights ? gradeWeights[weightKey] : null,
          metrics: config.metrics.map(metric => ({
            label: metric.label,
            value: metric.formatter(category.metrics?.[metric.key] ?? null),
          })),
        } satisfies GradeCategoryView;
      })
      .filter((category): category is GradeCategoryView => Boolean(category));
  }, [gradeReport, gradeWeights, gradeCategoryConfig]);

  if (!driverTruck || !driverTruck.driver || !driverTruck.truck) {
    return <div className="flex h-64 items-center justify-center"><p>{t('driverTrucks.show.loading')}</p></div>;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('driverTrucks.breadcrumb'), href: '/driver-trucks' },
    { title: t('driverTrucks.show.breadcrumbItem', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate }), href: `/driver-trucks/${driverTruck.id}` },
  ];

  const formatDate = (value?: string) => {
    if (!value) return notAvailableLabel;
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return notAvailableLabel;
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const assignmentStatus = driverTruck.is_attached ? t('driverTrucks.status.attached') : t('driverTrucks.status.detached');
  const assignmentStatusBadgeClass = driverTruck.is_attached ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  const overviewSummaryItems = [
    {
      key: 'assignment-id',
      label: t('driverTrucks.show.summary.assignmentId'),
      value: `#${driverTruck.id}`,
      helper: t('driverTrucks.show.summary.driverId', { value: driverTruck.driver.driverid }),
    },
    {
      key: 'performances',
      label: t('driverTrucks.show.summary.performances'),
      value: formatNumber(performances.length, { maximumFractionDigits: 0 }, notAvailableLabel),
      helper: t('driverTrucks.show.summary.linkedRecords'),
    },
    {
      key: 'duration',
      label: t('driverTrucks.show.summary.duration'),
      value: dateDifference ?? notAvailableLabel,
      helper: t('driverTrucks.show.summary.assignedOn', { value: formatDate(driverTruck.date_recived) }),
    },
    {
      key: 'status',
      label: t('driverTrucks.columns.status'),
      value: (
        <Badge className={`flex w-fit items-center gap-1 ${assignmentStatusBadgeClass}`}>
          {driverTruck.is_attached ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {assignmentStatus}
        </Badge>
      ),
      valueClassName: 'text-base font-semibold',
      helper: driverTruck.status
        ? t('driverTrucks.show.summary.statusNote', { value: String(driverTruck.status) })
        : t('driverTrucks.show.summary.noStatusNotes'),
    },
  ];

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/driver-trucks/${driverTruck.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: t('driverTrucks.show.delete.successTitle'),
          description: t('driverTrucks.show.delete.successDescription'),
        });
      },
      onError: errors => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flatMap(value => (Array.isArray(value) ? value : [value]))
            .filter((message): message is string => Boolean(message && message.length));
          toast({
            title: t('driverTrucks.show.delete.failedTitle'),
            description: errorMessages.length > 0 ? errorMessages.join('\n') : t('driverTrucks.show.delete.failedDescription'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('driverTrucks.show.delete.failedTitle'),
            description: t('driverTrucks.show.delete.failedDescriptionUnknown'),
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={t('driverTrucks.show.title', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate })}
      subtitle={t('driverTrucks.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('driverTrucks.show.headTitle', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate })}
      icon={<Truck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/driver-trucks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('driverTrucks.show.actions.back')}
        </Button>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/driver-trucks/${driverTruck.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('driverTrucks.actions.edit')}
            </Link>
          </Button>
          {driverTruck.is_attached && (
            <Button variant="outline" asChild className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <Link href={`/driver-trucks/${driverTruck.id}/detach`}>
                <UserX className="h-4 w-4 mr-2" />
                {t('driverTrucks.show.actions.detach')}
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
            <AlertCircle className="h-4 w-4 mr-2" />
            {t('driverTrucks.actions.delete')}
          </Button>
        </div>
      }
    >
      <DetailSummaryGrid items={overviewSummaryItems} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <CheckCircle className="h-4 w-4 mr-2" />
            {t('driverTrucks.show.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="performances">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('driverTrucks.show.tabs.performances', { count: performances.length })}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            {t('driverTrucks.show.tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard
                icon={<CheckCircle className="h-5 w-5" />}
                title={t('driverTrucks.show.sections.summary.title')}
                description={t('driverTrucks.show.sections.summary.description')}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.columns.driver')}</p>
                    <p className="mt-2 text-base font-semibold">{driverTruck.driver.name}</p>
                    <p className="text-xs text-muted-foreground">{t('driverTrucks.show.fields.driverId', { value: driverTruck.driver.driverid })}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.columns.truck')}</p>
                    <p className="mt-2 text-base font-semibold">{driverTruck.truck.plate}</p>
                    <p className="text-xs text-muted-foreground">{t('driverTrucks.show.fields.assignmentPlate', { value: driverTruck.plate })}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.show.fields.assignedOn')}</p>
                    <p className="mt-2 text-sm">{formatDate(driverTruck.date_recived)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.show.fields.detachedOn')}</p>
                    <p className="mt-2 text-sm">{formatDate(driverTruck.date_detach)}</p>
                  </div>
                  {dateDifference && (
                    <div className="rounded-lg border p-3 md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.show.fields.duration')}</p>
                      <p className="mt-2 text-sm font-semibold text-indigo-600">{dateDifference}</p>
                    </div>
                  )}
                  {driverTruck.reason && (
                    <div className="rounded-lg border p-3 md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('driverTrucks.show.fields.detachmentReason')}</p>
                      <p className="mt-2 text-sm">{driverTruck.reason}</p>
                    </div>
                  )}
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<Clock className="h-5 w-5" />}
                title={t('driverTrucks.show.sections.metadata.title')}
                description={t('driverTrucks.show.sections.metadata.description')}
              >
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.createdAt')}</span>
                    <span className="font-semibold">{formatDateTime(driverTruck.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.updatedAt')}</span>
                    <span className="font-semibold">{formatDateTime(driverTruck.updated_at)}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport ? (
                <DetailSectionCard
                  icon={<Award className="h-5 w-5 text-amber-600" />}
                  title={t('driverTrucks.show.grade.title')}
                  description={t('driverTrucks.show.grade.description')}
                >
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">{t('driverTrucks.show.grade.overallScore')}</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-amber-800">{overallGrade ? formatScore(overallGrade.score, 1, notAvailableLabel) : notAvailableLabel}</span>
                        <span className="text-sm text-muted-foreground">
                          {overallGrade ? t('driverTrucks.show.grade.scoreOutOf', { score: formatScore(overallGrade.score, 1, notAvailableLabel) }) : t('driverTrucks.show.grade.waiting')}
                        </span>
                      </div>
                    </div>
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-2xl font-semibold text-amber-700">{overallGrade?.letter ?? '—'}</div>
                  </div>

                  {gradeWeights && (
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {gradeCategoryOrder.map(key => {
                        const weightKey = `${key}_weight` as keyof GradeWeights;
                        const weightValue = gradeWeights[weightKey];
                        const config = gradeCategoryConfig[key];
                        return (
                          <div key={`weight-${key}`} className="rounded-md border border-amber-200 bg-white/70 p-2 text-center">
                            <p className="text-xs font-semibold text-amber-700">{config.label}</p>
                            <p className="mt-1 font-medium">{formatWeight(weightValue, notAvailableLabel)}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {gradeCategories.length > 0 ? (
                    <div className="space-y-3">
                      {gradeCategories.map(category => (
                        <div key={`grade-${category.key}`} className="rounded-lg border p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold">{category.label}</p>
                              <p className="text-xs text-muted-foreground">{category.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-amber-700">{formatScore(category.score, 1, notAvailableLabel)}</p>
                              {category.weight !== null && <p className="text-xs text-muted-foreground">{t('driverTrucks.show.grade.weight', { value: formatWeight(category.weight, notAvailableLabel) })}</p>}
                            </div>
                          </div>
                          <div className="mt-3 grid gap-2">
                            {category.metrics.map(metric => (
                              <div key={`${category.key}-${metric.label}`} className="flex items-center justify-between rounded-md bg-slate-100 px-2 py-1 text-xs">
                                <span className="text-muted-foreground">{metric.label}</span>
                                <span className="font-medium">{metric.value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">{t('driverTrucks.show.grade.empty')}</p>
                  )}
                </DetailSectionCard>
              ) : (
                <DetailSectionCard
                  icon={<Award className="h-5 w-5 text-amber-600" />}
                  title={t('driverTrucks.show.grade.title')}
                  description={t('driverTrucks.show.grade.fallbackDescription')}
                >
                  <p className="text-sm text-muted-foreground">{t('driverTrucks.show.grade.fallbackEmpty')}</p>
                </DetailSectionCard>
              )}

              <DetailSectionCard icon={<Activity className="h-5 w-5" />} title={t('driverTrucks.show.sections.currentStatus')}>
                <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${driverTruck.is_attached ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {assignmentStatus}
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-muted-foreground">{t('driverTrucks.show.sections.operationalNotes')}</p>
                  <p className="mt-1">{driverTruck.status ? String(driverTruck.status) : t('driverTrucks.show.sections.noOperationalNotes')}</p>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<User className="h-5 w-5" />} title={t('driverTrucks.show.sections.driverSnapshot')}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.name')}</span>
                    <span className="font-semibold">{driverTruck.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.identifier')}</span>
                    <span className="font-mono text-xs">{driverTruck.driver.driverid}</span>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<Truck className="h-5 w-5" />} title={t('driverTrucks.show.sections.truckSnapshot')}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.plate')}</span>
                    <span className="font-semibold">{driverTruck.truck.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('driverTrucks.show.fields.assignmentPlateLabel')}</span>
                    <span className="font-mono text-xs">{driverTruck.plate}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performances" className="space-y-6">
          <DetailSectionCard
            icon={<BarChart3 className="h-5 w-5" />}
            title={t('driverTrucks.show.performance.title')}
            description={t('driverTrucks.show.performance.description')}
          >
            {performances.length > 0 ? (
              <div className="max-h-[520px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                    <TableRow>
                      <TableHead>{t('driverTrucks.show.performance.table.trip')}</TableHead>
                      <TableHead>{t('driverTrucks.show.performance.table.date')}</TableHead>
                      <TableHead>{t('driverTrucks.show.performance.table.customer')}</TableHead>
                      <TableHead>{t('driverTrucks.show.performance.table.route')}</TableHead>
                      <TableHead className="text-right">{t('driverTrucks.show.performance.table.volume')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {performances.map(performance => (
                      <TableRow key={performance.id}>
                        <TableCell className="font-medium">
                          <Link href={`/performances/${performance.id}`} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                            {buildTripLabel(performance)}
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        </TableCell>
                        <TableCell>{formatDate(performance.DateDispach ?? undefined)}</TableCell>
                        <TableCell>{performance.operation?.customer?.name?.trim() || notAvailableLabel}</TableCell>
                        <TableCell>{buildRouteLabel(performance)}</TableCell>
                        <TableCell className="text-right font-medium">{formatVolume(performance.CargoVolumMT, notAvailableLabel)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('driverTrucks.show.performance.empty.title')}</p>
                <p className="mt-2 text-sm">{t('driverTrucks.show.performance.empty.description')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <DetailSectionCard
            icon={<History className="h-5 w-5" />}
            title={t('driverTrucks.show.activity.title')}
            description={t('driverTrucks.show.activity.description')}
          >
            {activityLogs.length > 0 ? (
              <div className="space-y-3">
                {activityLogs.map(log => (
                  <div key={log.id} className="flex items-start gap-3 rounded-lg border p-4 transition hover:border-blue-200 hover:bg-blue-50/70">
                    <div className="rounded-lg bg-blue-100 p-2">
                      <Activity className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{log.description}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{formatDateTime(log.created_at)}</span>
                        {log.causer?.name && (
                          <>
                            <span>•</span>
                            <span>{t('driverTrucks.show.activity.by', { name: log.causer.name })}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <Activity className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>{t('driverTrucks.show.activity.empty.title')}</p>
                <p className="mt-2 text-sm">{t('driverTrucks.show.activity.empty.description')}</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('driverTrucks.delete.title')}
        description={t('driverTrucks.delete.description')}
        itemName={t('driverTrucks.delete.itemName', { driver: driverTruck.driver.name, plate: driverTruck.truck.plate })}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

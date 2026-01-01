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

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  if (options) return new Intl.NumberFormat('en-ET', options).format(value);
  return numberFormatter.format(value);
};

const formatPercentFromRatio = (value?: number | null, maximumFractionDigits = 0): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${(value * 100).toFixed(maximumFractionDigits)}%`;
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  })} KM`;
};

const formatCurrencyPerKm = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} / KM`;
};

const formatDays = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  const rounded = Number(value.toFixed(1));
  if (rounded === 1) return '1 day';
  const formatted = rounded % 1 === 0 ? `${rounded}` : rounded.toFixed(1);
  return `${formatted} days`;
};

const formatScore = (value?: number | null, maximumFractionDigits = 1): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return Number(value).toFixed(maximumFractionDigits);
};

const formatWeight = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${Number(value).toFixed(0)}%`;
};

const buildTripLabel = (performance: Performance): string => {
  if (performance.trip && performance.trip.trim().length > 0) return performance.trip.trim();
  return `Trip #${performance.id}`;
};

const formatVolume = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MT`;
};

const buildRouteLabel = (performance: Performance): string => {
  const origin = performance.origin?.name?.trim();
  const destination = performance.destination?.name?.trim();
  if (!origin && !destination) return 'N/A';
  return `${origin ?? 'Unknown origin'} → ${destination ?? 'Unknown destination'}`;
};

const gradeCategoryConfig: Record<GradeCategoryKey, GradeCategoryConfigEntry> = {
  performance: {
    label: 'Performance',
    description: 'Trips completed, distance covered, and ton-kilometres delivered.',
    metrics: [
      { key: 'total_trips', label: 'Trips', formatter: value => formatNumber(value, { maximumFractionDigits: 0 }) },
      { key: 'total_distance_km', label: 'Distance', formatter: value => formatKilometers(value, 0) },
      { key: 'avg_trip_distance_km', label: 'Avg Trip Distance', formatter: value => formatKilometers(value, 1) },
      { key: 'ton_km_per_trip', label: 'Ton-KM / Trip', formatter: value => formatNumber(value, { maximumFractionDigits: 1 }) },
    ],
  },
  efficiency: {
    label: 'Efficiency',
    description: 'Fuel usage and cost efficiency across trips.',
    metrics: [
      { key: 'km_per_liter', label: 'KM per Liter', formatter: value => formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) },
      { key: 'fuel_cost_per_km', label: 'Fuel Cost / KM', formatter: formatCurrencyPerKm },
      { key: 'avg_trip_distance_km', label: 'Avg Trip Distance', formatter: value => formatKilometers(value, 1) },
    ],
  },
  consistency: {
    label: 'Consistency',
    description: 'Trip completion and turnaround performance.',
    metrics: [
      { key: 'trip_completion_rate', label: 'Completion Rate', formatter: value => formatPercentFromRatio(value, 0) },
      { key: 'avg_trip_duration_days', label: 'Avg Trip Duration', formatter: formatDays },
    ],
  },
};

export default function Show({ driverTruck, performances, dateDifference, activityLogs, gradeReport }: Props) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const overallGrade = gradeReport?.overall ?? null;
  const gradeWeights = gradeReport?.weights ?? null;

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
  }, [gradeReport, gradeWeights]);

  if (!driverTruck || !driverTruck.driver || !driverTruck.truck) {
    return <div className="flex h-64 items-center justify-center"><p>Loading...</p></div>;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Driver-Truck Assignments', href: '/driver-trucks' },
    { title: `${driverTruck.driver.name} – ${driverTruck.truck.plate}`, href: `/driver-trucks/${driverTruck.id}` },
  ];

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const assignmentStatus = driverTruck.is_attached ? 'Attached' : 'Detached';
  const assignmentStatusBadgeClass = driverTruck.is_attached ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700';
  const overviewSummaryItems = [
    {
      key: 'assignment-id',
      label: 'Assignment ID',
      value: `#${driverTruck.id}`,
      helper: `Driver ID ${driverTruck.driver.driverid}`,
    },
    {
      key: 'performances',
      label: 'Performances',
      value: formatNumber(performances.length, { maximumFractionDigits: 0 }),
      helper: 'Linked performance records',
    },
    {
      key: 'duration',
      label: 'Duration',
      value: dateDifference ?? 'N/A',
      helper: `Assigned ${formatDate(driverTruck.date_recived)}`,
    },
    {
      key: 'status',
      label: 'Status',
      value: (
        <Badge className={`flex w-fit items-center gap-1 ${assignmentStatusBadgeClass}`}>
          {driverTruck.is_attached ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {assignmentStatus}
        </Badge>
      ),
      valueClassName: 'text-base font-semibold',
      helper: driverTruck.status ? `Note: ${String(driverTruck.status)}` : 'No status notes recorded',
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
          title: '✅ Assignment Deleted',
          description: 'The driver-truck assignment has been removed successfully.',
        });
      },
      onError: errors => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flatMap(value => (Array.isArray(value) ? value : [value]))
            .filter((message): message is string => Boolean(message && message.length));
          toast({
            title: '❌ Delete Failed',
            description: errorMessages.length > 0 ? errorMessages.join('\n') : 'Unable to delete this assignment. Please resolve any blocking records first.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '❌ Delete Failed',
            description: 'An unexpected error occurred while deleting the assignment. Please try again.',
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={`${driverTruck.driver.name} · ${driverTruck.truck.plate}`}
      subtitle="Detailed overview of the driver-truck assignment lifecycle"
      breadcrumbs={breadcrumbs}
      headTitle={`Assignment: ${driverTruck.driver.name} - ${driverTruck.truck.plate}`}
      icon={<Truck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/driver-trucks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/driver-trucks/${driverTruck.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          {driverTruck.is_attached && (
            <Button variant="outline" asChild className="border-amber-200 text-amber-700 hover:bg-amber-50">
              <Link href={`/driver-trucks/${driverTruck.id}/detach`}>
                <UserX className="h-4 w-4 mr-2" />
                Detach
              </Link>
            </Button>
          )}
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
            <AlertCircle className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <DetailSummaryGrid items={overviewSummaryItems} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <CheckCircle className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performances">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performances ({performances.length})
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard icon={<CheckCircle className="h-5 w-5" />} title="Assignment Summary" description="Snapshot of timeline and status">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Driver</p>
                    <p className="mt-2 text-base font-semibold">{driverTruck.driver.name}</p>
                    <p className="text-xs text-muted-foreground">ID: {driverTruck.driver.driverid}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Truck</p>
                    <p className="mt-2 text-base font-semibold">{driverTruck.truck.plate}</p>
                    <p className="text-xs text-muted-foreground">Assignment plate: {driverTruck.plate}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Assigned On</p>
                    <p className="mt-2 text-sm">{formatDate(driverTruck.date_recived)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Detached On</p>
                    <p className="mt-2 text-sm">{formatDate(driverTruck.date_detach)}</p>
                  </div>
                  {dateDifference && (
                    <div className="rounded-lg border p-3 md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Duration</p>
                      <p className="mt-2 text-sm font-semibold text-indigo-600">{dateDifference}</p>
                    </div>
                  )}
                  {driverTruck.reason && (
                    <div className="rounded-lg border p-3 md:col-span-2">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Detachment Reason</p>
                      <p className="mt-2 text-sm">{driverTruck.reason}</p>
                    </div>
                  )}
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<Clock className="h-5 w-5" />} title="System Metadata" description="Audit information">
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created At</span>
                    <span className="font-semibold">{formatDateTime(driverTruck.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated</span>
                    <span className="font-semibold">{formatDateTime(driverTruck.updated_at)}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport ? (
                <DetailSectionCard icon={<Award className="h-5 w-5 text-amber-600" />} title="Assignment Grade" description="Performance compared with similar pairings">
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">Overall Score</p>
                      <div className="mt-1 flex items-baseline gap-3">
                        <span className="text-3xl font-bold text-amber-800">{overallGrade ? formatScore(overallGrade.score) : 'N/A'}</span>
                        <span className="text-sm text-muted-foreground">{overallGrade ? `${formatScore(overallGrade.score)} / 100` : 'Waiting'}</span>
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
                            <p className="mt-1 font-medium">{formatWeight(weightValue)}</p>
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
                              <p className="text-sm font-semibold text-amber-700">{formatScore(category.score)}</p>
                              {category.weight !== null && <p className="text-xs text-muted-foreground">Weight {formatWeight(category.weight)}</p>}
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
                    <p className="text-sm text-muted-foreground">Grade insights will appear once enough performance data has been recorded.</p>
                  )}
                </DetailSectionCard>
              ) : (
                <DetailSectionCard icon={<Award className="h-5 w-5 text-amber-600" />} title="Assignment Grade" description="Performance analytics">
                  <p className="text-sm text-muted-foreground">Grade analytics will become available after more performance data is captured.</p>
                </DetailSectionCard>
              )}

              <DetailSectionCard icon={<Activity className="h-5 w-5" />} title="Current Status">
                <div className={`rounded-lg border px-3 py-2 text-sm font-medium ${driverTruck.is_attached ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-rose-200 bg-rose-50 text-rose-700'}`}>
                  {assignmentStatus}
                </div>
                <div className="rounded-lg border p-3 text-sm">
                  <p className="font-medium text-muted-foreground">Operational Notes</p>
                  <p className="mt-1">{driverTruck.status ? String(driverTruck.status) : 'No additional status notes recorded.'}</p>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<User className="h-5 w-5" />} title="Driver Snapshot">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name</span>
                    <span className="font-semibold">{driverTruck.driver.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Identifier</span>
                    <span className="font-mono text-xs">{driverTruck.driver.driverid}</span>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<Truck className="h-5 w-5" />} title="Truck Snapshot">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plate</span>
                    <span className="font-semibold">{driverTruck.truck.plate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Assignment Plate</span>
                    <span className="font-mono text-xs">{driverTruck.plate}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performances" className="space-y-6">
          <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title="Performance Records" description="Operational history for this pairing">
            {performances.length > 0 ? (
              <div className="max-h-[520px] overflow-auto rounded-lg border">
                <Table>
                  <TableHeader className="sticky top-0 bg-background/95 backdrop-blur">
                    <TableRow>
                      <TableHead>Trip</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead className="text-right">Volume (MT)</TableHead>
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
                        <TableCell>{performance.operation?.customer?.name?.trim() || 'N/A'}</TableCell>
                        <TableCell>{buildRouteLabel(performance)}</TableCell>
                        <TableCell className="text-right font-medium">{formatVolume(performance.CargoVolumMT)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No performance records found for this assignment.</p>
                <p className="mt-2 text-sm">Performance entries will appear once linked operations are recorded.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <DetailSectionCard icon={<History className="h-5 w-5" />} title="Activity Log" description="Recent events for this assignment">
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
                            <span>by {log.causer.name}</span>
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
                <p>No activity recorded for this assignment yet.</p>
                <p className="mt-2 text-sm">Updates will appear here as changes are made.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Assignment" description="Are you sure you want to delete this driver-truck assignment? This action cannot be undone." itemName={`${driverTruck.driver.name} ↔ ${driverTruck.truck.plate}`} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

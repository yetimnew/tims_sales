import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, Ban, BarChart3, History, ShieldCheck, CheckCircle, Calendar, User, ArrowLeft, Edit, Trash2, Truck, ArrowUpRight, Award } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { usePermissions } from '@/hooks/use-permissions';
import { useState, useMemo } from 'react';

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

const formatNumber = (value?: number | null, options?: Intl.NumberFormatOptions): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  if (options) return new Intl.NumberFormat('en-ET', options).format(value);
  return numberFormatter.format(value);
};

const formatKilometers = (value?: number | null, maximumFractionDigits = 0): string => {
  const formatted = formatNumber(value, { minimumFractionDigits: maximumFractionDigits, maximumFractionDigits });
  return formatted === 'N/A' ? formatted : `${formatted} KM`;
};

const formatTons = (value?: number | null, maximumFractionDigits = 1): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, { minimumFractionDigits: value > 0 && value < 1 ? maximumFractionDigits : 0, maximumFractionDigits })} t`;
};

const formatFuelEfficiency = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} KM/L`;
};

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return currencyFormatter.format(value);
};

const formatRating = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return `${formatNumber(value, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} / 5`;
};

const formatDateDisplay = (value?: string | null): string => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatDateTime = (value?: string): string => {
  if (!value) return 'N/A';
  return new Date(value).toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
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

export default function DriversShow({ driver, activityLogs = [], performanceSummary, safetySummary, counts, gradeReport }: DriversShowProps) {
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [activateDialogOpen, setActivateDialogOpen] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Drivers', href: '/drivers' },
    { title: driver.name, href: `/drivers/${driver.id}` },
  ];

  const canEditDriver = hasPermission('drivers.edit');
  const canDeleteDriver = hasPermission('drivers.destroy');
  const canDeactivateDriver = hasPermission('drivers.deactivate');
  const canActivateDriver = hasPermission('drivers.activate');
  const canViewDriverTruckAssignments = hasPermission('driver-trucks.view');

  const statusLabel = driver.status ? driver.status.charAt(0).toUpperCase() + driver.status.slice(1) : 'Unknown';
  const sexLabel = driver.sex ? driver.sex.charAt(0).toUpperCase() + driver.sex.slice(1) : 'Unknown';

  const totalAssignments = counts?.assignments ?? driver.driverTrucks?.length ?? 0;
  const activeAssignmentsCount = driver.driverTrucks?.filter(assignment => assignment.is_attached).length ?? 0;
  const totalDistanceLabel = performanceSummary ? formatKilometers(performanceSummary.total_distance_km, 0) : 'N/A';
  const totalTripsLabel = performanceSummary ? formatNumber(performanceSummary.total_trips, { maximumFractionDigits: 0 }) : 'N/A';
  const fuelEfficiencyLabel = performanceSummary ? formatFuelEfficiency(performanceSummary.avg_fuel_efficiency) : 'N/A';
  const averageRatingLabel = performanceSummary ? formatRating(performanceSummary.avg_customer_rating) : 'N/A';
  const safetyIncidentCountLabel = safetySummary ? formatNumber(safetySummary.total_records, { maximumFractionDigits: 0 }) : 'N/A';
  const totalDamageCostLabel = safetySummary ? formatCurrency(safetySummary.total_damage_cost ?? null) : null;

  const overviewSummaryCards = [
    {
      key: 'status',
      label: 'Status',
      value: <Badge className={`flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>{statusLabel}</Badge>,
      helper: `Gender: ${sexLabel}`,
    },
    {
      key: 'assignments',
      label: 'Assignments',
      value: formatNumber(totalAssignments, { maximumFractionDigits: 0 }),
      helper: activeAssignmentsCount > 0 ? `${activeAssignmentsCount} active right now` : 'No active assignments',
    },
    {
      key: 'trips',
      label: 'Trips Completed',
      value: totalTripsLabel,
      helper: performanceSummary ? `Distance ${totalDistanceLabel}` : 'No performance data yet',
    },
    {
      key: 'efficiency',
      label: 'Fuel Efficiency',
      value: fuelEfficiencyLabel,
      helper: performanceSummary ? `Avg rating ${averageRatingLabel}` : 'No rating yet',
    },
    {
      key: 'safety',
      label: 'Safety Incidents',
      value: safetyIncidentCountLabel,
      helper: totalDamageCostLabel ? `Damage ${totalDamageCostLabel}` : 'No recorded damage costs',
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
        toast({ title: '✅ Driver Deleted', description: 'The driver has been removed successfully.' });
      },
      onError: () => {
        setIsDeleting(false);
        toast({ title: '❌ Delete Failed', description: 'Unable to delete this driver.', variant: 'destructive' });
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
        toast({ title: '✅ Driver Deactivated', description: 'The driver has been deactivated successfully.' });
      },
      onError: () => {
        setIsDeactivating(false);
        toast({ title: '❌ Deactivation Failed', description: 'Unable to deactivate this driver.', variant: 'destructive' });
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
        toast({ title: '✅ Driver Activated', description: 'The driver has been activated successfully.' });
      },
      onError: () => {
        setIsActivating(false);
        toast({ title: '❌ Activation Failed', description: 'Unable to activate this driver.', variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={driver.name}
      subtitle="Comprehensive driver profile and performance"
      breadcrumbs={breadcrumbs}
      headTitle={`View Driver - ${driver.name}`}
      icon={<User className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/drivers')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {canEditDriver && (
            <Button variant="outline" asChild>
              <Link href={`/drivers/${driver.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {showDeactivateButton && (
            <Button variant="outline" onClick={() => setDeactivateDialogOpen(true)} className="border-amber-200 text-amber-600 hover:bg-amber-50">
              <Ban className="h-4 w-4 mr-2" />
              Deactivate
            </Button>
          )}
          {showActivateButton && (
            <Button variant="outline" onClick={() => setActivateDialogOpen(true)} className="border-emerald-200 text-emerald-600 hover:bg-emerald-50">
              <CheckCircle className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          {canDeleteDriver && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview"><CheckCircle className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-4 w-4 mr-2" /> Performance</TabsTrigger>
          <TabsTrigger value="safety"><ShieldCheck className="h-4 w-4 mr-2" /> Safety</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={overviewSummaryCards} />
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard icon={<User className="h-5 w-5" />} title="Basic Information" description="Personal and professional details">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getStatusBadgeColor(driver.status)}`}>{statusLabel}</Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Gender</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getSexBadgeColor(driver.sex)}`}>{sexLabel}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Driver ID</p>
                      <p className="mt-2 font-mono text-sm">{driver.driverid}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Mobile</p>
                      <p className="mt-2 text-sm">{driver.mobile || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Zone</p>
                      <p className="mt-2 text-sm">{driver.zone || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Woreda</p>
                      <p className="mt-2 text-sm">{driver.woreda || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Kebele</p>
                      <p className="mt-2 text-sm">{driver.kebele || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">House Number</p>
                      <p className="mt-2 text-sm">{driver.housenumber || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<Truck className="h-5 w-5" />}
                title="Truck Assignments"
                description="Recent vehicles paired with this driver"
                actions={
                  canViewDriverTruckAssignments && driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link href={`/driver-trucks?driver_id=${driver.id}`} className="flex items-center gap-1">
                        View all
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null
                }
              >
                {driver.driverTrucks && driver.driverTrucks.length > 0 ? (
                  <div className="space-y-4">
                    {driver.driverTrucks.slice(0, 5).map(assignment => {
                      const plate = assignment.truck?.plate ?? assignment.plate ?? 'N/A';
                      return (
                        <div key={assignment.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{plate}</p>
                              <p className="text-xs text-muted-foreground">Assignment #{assignment.id}</p>
                            </div>
                            <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>{assignment.is_attached ? 'Attached' : 'Detached'}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <div><span className="font-medium">Assigned:</span> {formatDateDisplay(assignment.date_recived)}</div>
                            <div><span className="font-medium">Detached:</span> {formatDateDisplay(assignment.date_detach)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <Truck className="mx-auto mb-3 h-10 w-10 opacity-60" />
                    <p>No truck assignments recorded for this driver yet.</p>
                  </div>
                )}
              </DetailSectionCard>

              <DetailSectionCard icon={<Calendar className="h-5 w-5" />} title="Employment Information" description="Hiring and employment details">
                <div className="grid gap-4 text-sm md:grid-cols-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Birthdate</span>
                    <span className="font-semibold">{formatDateDisplay(driver.birthdate)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hired Date</span>
                    <span className="font-semibold">{formatDateDisplay(driver.hireddate)}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport && (
                <DetailSectionCard icon={<Award className="h-5 w-5 text-amber-600" />} title="Driver Grade" description="Performance rating">
                  <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-amber-700">Overall Score</p>
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
                <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title="Quick Metrics">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Distance</span>
                      <span className="font-semibold">{formatKilometers(performanceSummary.total_distance_km, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Trips</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.total_trips)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cargo</span>
                      <span className="font-semibold">{formatTons(performanceSummary.total_cargo_tonnage, 1)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Efficiency</span>
                      <span className="font-semibold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Avg Rating</span>
                      <span className="font-semibold">{formatRating(performanceSummary.avg_customer_rating)}</span>
                    </div>
                  </div>
                </DetailSectionCard>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title="Performance Records" description="Operational history">
            {driver.performances && driver.performances.length > 0 ? (
              <div className="space-y-3">
                {driver.performances.slice(0, 10).map(perf => (
                  <div key={perf.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">Performance #{perf.id}</p>
                        <p className="text-xs text-muted-foreground">{formatDateDisplay(perf.DateDispach)}</p>
                      </div>
                      {perf.operation && (
                        <Link href={`/operations/${perf.operation.id}`} className="text-blue-600 hover:underline">
                          View Operation
                        </Link>
                      )}
                    </div>
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                      <div><span className="font-medium">Distance WCargo:</span> {formatKilometers(perf.DistanceWCargo ?? null, 1)}</div>
                      <div><span className="font-medium">Ton-KM:</span> {formatNumber(perf.tonkm ?? null, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                      <div><span className="font-medium">Fuel:</span> {formatNumber(perf.fuelInLitter ?? null, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No performance records found for this driver yet.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <DetailSectionCard icon={<ShieldCheck className="h-5 w-5" />} title="Safety Overview" description="Incidents and safety performance">
            {safetySummary ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{safetySummary.total_records}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Accidents</p>
                  <p className="text-lg font-semibold">{safetySummary.accidents}</p>
                </div>
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Violations</p>
                  <p className="text-lg font-semibold">{safetySummary.violations}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Warnings</p>
                  <p className="text-lg font-semibold">{safetySummary.warnings}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <ShieldCheck className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No safety data available for this driver yet.</p>
              </div>
            )}

            {driver.safetyRecords && driver.safetyRecords.length > 0 && (
              <div className="space-y-3">
                {driver.safetyRecords.slice(0, 10).map(rec => (
                  <div key={rec.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{rec.incident_type ?? 'Incident'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateDisplay(rec.incident_date)}</span>
                    </div>
                    {rec.description && <p className="mt-2 text-xs">{rec.description}</p>}
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <div><span className="font-medium">Location:</span> {rec.location || 'N/A'}</div>
                      <div><span className="font-medium">Damage:</span> {formatCurrency(rec.damage_cost ?? null)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard icon={<History className="h-5 w-5" />} title="Activity History" description="Audit trail of driver changes">
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No activity history available for this driver yet.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      {canDeleteDriver && <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Driver" description="Are you sure you want to delete this driver? This action cannot be undone." itemName={driver.name} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />}
      {canDeactivateDriver && <DeleteConfirmationDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen} title="Deactivate Driver" description="This driver will be marked as inactive." itemName={driver.name} onConfirm={handleDeactivateConfirm} confirmLabel="Deactivate" isLoading={isDeactivating} />}
      {canActivateDriver && <DeleteConfirmationDialog open={activateDialogOpen} onOpenChange={setActivateDialogOpen} title="Activate Driver" description="This driver will be marked as active." itemName={driver.name} onConfirm={handleActivateConfirm} confirmLabel="Activate" isLoading={isActivating} isDangerous={false} />}
    </DetailPageLayout>
  );
}

import { useState, useMemo } from 'react';
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
import { Activity, ArrowLeft, ArrowUpRight, Ban, BarChart3, Calendar, CheckCircle, Edit, History, Sparkles, Target, Truck, Trash2, Wrench, Clock, User, XCircle, TrendingUp, DollarSign, Package, ExternalLink, MapPin, Fuel, Route, Gauge } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart as RechartsBarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, Line, LineChart } from 'recharts';

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

interface TrucksShowProps {
  truck: TruckDetails;
  activityLogs?: ActivityLog[];
  counts?: { drivers: number; performances: number; driverAssignments: number; maintenance: number };
  performanceSummary?: {
    total_records: number;
    completed_trips: number;
    total_distance_km: number;
    avg_fuel_efficiency_km_per_liter: number | null;
    total_ton_km: number;
    avg_payload_tons_per_trip: number | null;
  };
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

export default function TrucksShow({ truck, activityLogs = [], counts, performanceSummary, maintenanceSummary, gradeReport }: TrucksShowProps) {
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Trucks', href: '/trucks' },
    { title: truck.plate, href: `/trucks/${truck.id}` },
  ];

  const canEditTruck = hasPermission('trucks.edit');
  const canDeleteTruck = hasPermission('trucks.destroy');
  const canDeactivateTruck = hasPermission('trucks.deactivate');

  const statusLabel = truck.status ? truck.status.charAt(0).toUpperCase() + truck.status.slice(1) : 'Unknown';
  const totalAssignments = counts?.driverAssignments ?? truck.driverTrucks?.length ?? 0;
  const activeAssignmentsCount = truck.driverTrucks?.filter(assignment => assignment.is_attached).length ?? 0;

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

  // Utilization metrics
  const loadFactor = performanceSummary?.total_distance_km && performanceSummary.total_distance_km > 0
    ? (performanceSummary.total_loaded_distance_km / performanceSummary.total_distance_km) * 100
    : 0;
  const emptyFactor = 100 - loadFactor;

  // Prepare chart data
  const distanceChartData = performanceSummary ? [
    { name: 'Loaded', value: performanceSummary.total_loaded_distance_km, fill: '#22c55e' },
    { name: 'Empty', value: performanceSummary.total_empty_distance_km, fill: '#ef4444' },
  ].filter(item => item.value > 0) : [];

  const tripStatusData = performanceSummary ? [
    { name: 'Completed', value: performanceSummary.completed_trips, fill: '#22c55e' },
    { name: 'Open', value: performanceSummary.open_trips, fill: '#3b82f6' },
  ].filter(item => item.value > 0) : [];

  const costBreakdownData = [
    { name: 'Fuel Cost', value: totalFuelCost, fill: '#f97316' },
    { name: 'Maintenance', value: totalMaintenanceCost, fill: '#8b5cf6' },
  ].filter(item => item.value > 0);

  const recentPerformances = truck.performances?.slice(0, 10).map((perf, index) => ({
    name: `Trip ${index + 1}`,
    distance: (perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0),
    tonnage: perf.cargo_volume_mt ?? 0,
    fuel: perf.fuelInLitter ?? 0,
  })) ?? [];

  const overviewSummaryCards = [
    {
      key: 'trips',
      label: 'Completed Trips',
      value: formatNumber(performanceSummary?.completed_trips ?? 0, { maximumFractionDigits: 0 }),
      helper: `${formatNumber(performanceSummary?.open_trips ?? 0, { maximumFractionDigits: 0 })} open trips`,
    },
    {
      key: 'distance',
      label: 'Total Distance',
      value: formatKilometers(performanceSummary?.total_distance_km ?? 0, 0),
      helper: `Load Factor: ${loadFactor.toFixed(1)}%`,
    },
    {
      key: 'efficiency',
      label: 'Fuel Efficiency',
      value: formatFuelEfficiency(performanceSummary?.avg_fuel_efficiency_km_per_liter ?? null),
      helper: `${formatNumber(performanceSummary?.total_fuel_liters ?? 0, { maximumFractionDigits: 0 })} L total`,
    },
    {
      key: 'cost',
      label: 'Total Cost',
      value: formatCurrency(totalOperationalCost),
      helper: `${formatCurrency(avgCostPerKm)} per KM`,
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
        toast({ title: '✅ Truck Deleted', description: 'The truck has been removed successfully.' });
      },
      onError: () => {
        setIsDeleting(false);
        toast({ title: '❌ Delete Failed', description: 'Unable to delete this truck.', variant: 'destructive' });
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
        toast({ title: '✅ Truck Deactivated', description: 'The truck has been deactivated successfully.' });
      },
      onError: () => {
        setIsDeactivating(false);
        toast({ title: '❌ Deactivation Failed', description: 'Unable to deactivate this truck.', variant: 'destructive' });
      },
    });
  };

  return (
    <DetailPageLayout
      title={truck.plate}
      subtitle="Comprehensive truck profile and performance tracking"
      breadcrumbs={breadcrumbs}
      headTitle={`Truck - ${truck.plate}`}
      icon={<Truck className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/trucks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {canEditTruck && (
            <Button variant="outline" asChild>
              <Link href={`/trucks/${truck.id}/edit`}>
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
          {canDeleteTruck && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview"><CheckCircle className="h-4 w-4 mr-2" /> Overview</TabsTrigger>
          <TabsTrigger value="performance"><BarChart3 className="h-4 w-4 mr-2" /> Performance</TabsTrigger>
          <TabsTrigger value="analytics"><TrendingUp className="h-4 w-4 mr-2" /> Analytics</TabsTrigger>
          <TabsTrigger value="maintenance"><Wrench className="h-4 w-4 mr-2" /> Maintenance</TabsTrigger>
          <TabsTrigger value="history"><History className="h-4 w-4 mr-2" /> History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={overviewSummaryCards} />
          
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard icon={<Truck className="h-5 w-5" />} title="Basic Information" description="Truck details and specifications">
                <div className="grid gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                      <Badge className={`mt-2 flex w-fit items-center gap-1 ${getStatusBadgeColor(truck.status)}`}>{statusLabel}</Badge>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Vehicle Type</p>
                      <p className="mt-2 font-semibold">{truck.vehicleType?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Plate Number</p>
                      <p className="mt-2 font-mono text-lg font-bold">{truck.plate}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Chassis Number</p>
                      <p className="mt-2 text-sm">{truck.chasisNumber || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Engine Number</p>
                      <p className="mt-2 text-sm">{truck.engineNumber || 'N/A'}</p>
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                      <p className="mt-2 text-sm">{formatDate(truck.created_at)}</p>
                    </div>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<ExternalLink className="h-5 w-5" />} title="Quick Links">
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/performances?truck=${truck.id}`}>
                      <Package className="h-4 w-4 mr-2" />
                      View All Performances
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/driver-trucks?truck_id=${truck.id}`}>
                      <User className="h-4 w-4 mr-2" />
                      View All Assignments
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                </div>
              </DetailSectionCard>

              <DetailSectionCard icon={<Gauge className="h-5 w-5" />} title="Utilization Metrics">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
                    <p className="mt-2 text-2xl font-bold text-green-700">{loadFactor.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatKilometers(performanceSummary?.total_loaded_distance_km ?? 0, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Empty Running</p>
                    <p className="mt-2 text-2xl font-bold text-red-700">{emptyFactor.toFixed(1)}%</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatKilometers(performanceSummary?.total_empty_distance_km ?? 0, 0)}</p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Payload</p>
                    <p className="mt-2 text-2xl font-bold text-blue-700">{formatNumber(performanceSummary?.avg_payload_tons_per_trip ?? 0, { maximumFractionDigits: 1 })} T</p>
                    <p className="mt-1 text-xs text-muted-foreground">Per trip</p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard
                icon={<User className="h-5 w-5" />}
                title="Driver Assignments"
                description="Recent drivers assigned to this truck"
                actions={
                  truck.driverTrucks && truck.driverTrucks.length > 0 ? (
                    <Button variant="link" size="sm" className="px-0" asChild>
                      <Link href={`/driver-trucks?truck_id=${truck.id}`} className="flex items-center gap-1">
                        View all
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  ) : null
                }
              >
                {truck.driverTrucks && truck.driverTrucks.length > 0 ? (
                  <div className="space-y-4">
                    {truck.driverTrucks.slice(0, 5).map(assignment => {
                      const driverName = assignment.driver?.name ?? 'Unknown Driver';
                      return (
                        <div key={assignment.id} className="rounded-lg border p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{driverName}</p>
                              <p className="text-xs text-muted-foreground">Assignment #{assignment.id}</p>
                            </div>
                            <Badge variant={assignment.is_attached ? 'default' : 'secondary'}>{assignment.is_attached ? 'Attached' : 'Detached'}</Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                            <div><span className="font-medium">Assigned:</span> {formatDate(assignment.date_recived)}</div>
                            <div><span className="font-medium">Detached:</span> {formatDate(assignment.date_detach)}</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground">
                    <User className="mx-auto mb-3 h-10 w-10 opacity-60" />
                    <p>No driver assignments recorded for this truck yet.</p>
                  </div>
                )}
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              {gradeReport && gradeReport.overall && (
                <DetailSectionCard icon={<Sparkles className="h-5 w-5 text-amber-600" />} title="Truck Grade" description="Performance rating">
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
                <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title="Performance Summary">
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Distance</span>
                      <span className="font-semibold">{formatKilometers(performanceSummary.total_distance_km, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Completed Trips</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.completed_trips, { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fuel Efficiency</span>
                      <span className="font-semibold">{formatFuelEfficiency(performanceSummary.avg_fuel_efficiency_km_per_liter)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Ton-Km</span>
                      <span className="font-semibold">{formatNumber(performanceSummary.total_ton_km)}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span className="text-muted-foreground">Total Cost</span>
                      <span className="font-semibold">{formatCurrency(totalOperationalCost)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cost per KM</span>
                      <span className="font-semibold">{formatCurrency(avgCostPerKm)}</span>
                    </div>
                  </div>
                </DetailSectionCard>
              )}

              {distanceChartData.length > 0 && (
                <DetailSectionCard icon={<Route className="h-5 w-5" />} title="Distance Split">
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
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Records</p>
                <p className="mt-2 text-3xl font-bold text-blue-700">{performanceSummary.total_records}</p>
                <p className="mt-1 text-xs text-muted-foreground">{performanceSummary.main_trip_records} main trips</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Completed</p>
                <p className="mt-2 text-3xl font-bold text-green-700">{performanceSummary.completed_trips}</p>
                <p className="mt-1 text-xs text-muted-foreground">{performanceSummary.trip_completion_rate ? (performanceSummary.trip_completion_rate * 100).toFixed(1) : '0'}% rate</p>
              </div>
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Open Trips</p>
                <p className="mt-2 text-3xl font-bold text-orange-700">{performanceSummary.open_trips}</p>
                <p className="mt-1 text-xs text-muted-foreground">In progress</p>
              </div>
              <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Ton-Km</p>
                <p className="mt-2 text-3xl font-bold text-purple-700">{formatNumber(performanceSummary.total_ton_km, { maximumFractionDigits: 0 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNumber(performanceSummary.avg_ton_km_per_trip, { maximumFractionDigits: 1 })} avg</p>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cargo Volume</p>
                <p className="mt-2 text-3xl font-bold text-teal-700">{formatNumber(performanceSummary.total_cargo_volume_mt, { maximumFractionDigits: 0 })}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNumber(performanceSummary.avg_cargo_volume_mt_per_trip, { maximumFractionDigits: 1 })} MT avg</p>
              </div>
            </div>
          )}

          <DetailSectionCard icon={<BarChart3 className="h-5 w-5" />} title="Performance Records" description="Recent operational trips"
            actions={
              truck.performances && truck.performances.length > 0 ? (
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href={`/performances?truck=${truck.id}`} className="flex items-center gap-1">
                    View all
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
                          Performance #{perf.id}
                        </Link>
                        <p className="text-xs text-muted-foreground">{formatDate(perf.DateDispach)}</p>
                        {perf.origin && perf.destination && (
                          <p className="text-xs text-muted-foreground mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {perf.origin.name} → {perf.destination.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid gap-2 text-xs md:grid-cols-4">
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">Distance:</span>
                        <span className="ml-1 font-semibold">{formatKilometers((perf.DistanceWCargo ?? 0) + (perf.DistanceWOCargo ?? 0), 0)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">Cargo:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.cargo_volume_mt ?? null)} MT</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">Ton-KM:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.tonkm ?? null)}</span>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <span className="font-medium text-muted-foreground">Fuel:</span>
                        <span className="ml-1 font-semibold">{formatNumber(perf.fuelInLitter ?? null)} L</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No performance records found for this truck yet.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Cost</p>
              <p className="mt-2 text-2xl font-bold text-orange-700">{formatCurrency(totalFuelCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNumber(performanceSummary?.total_fuel_liters ?? 0, { maximumFractionDigits: 0 })} L total</p>
            </div>
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Maintenance Cost</p>
              <p className="mt-2 text-2xl font-bold text-purple-700">{formatCurrency(totalMaintenanceCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{maintenanceSummary?.total_records ?? 0} records</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Total Operational Cost</p>
              <p className="mt-2 text-2xl font-bold text-blue-700">{formatCurrency(totalOperationalCost)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(avgCostPerKm)} per KM</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {tripStatusData.length > 0 && (
              <DetailSectionCard title="Trip Status Distribution" icon={<Target className="h-5 w-5" />}>
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
              <DetailSectionCard title="Cost Breakdown" icon={<DollarSign className="h-5 w-5" />}>
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
            <DetailSectionCard title="Recent Performance Trends" icon={<TrendingUp className="h-5 w-5" />}>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={recentPerformances}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="distance" stroke="#3b82f6" name="Distance (KM)" />
                    <Line yAxisId="right" type="monotone" dataKey="tonnage" stroke="#22c55e" name="Tonnage (MT)" />
                    <Line yAxisId="right" type="monotone" dataKey="fuel" stroke="#f97316" name="Fuel (L)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </DetailSectionCard>
          )}

          <DetailSectionCard title="Efficiency Metrics" icon={<Gauge className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Distance/Trip</p>
                <p className="mt-2 font-semibold">{formatKilometers(performanceSummary?.avg_trip_distance_km ?? 0, 1)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Efficiency</p>
                <p className="mt-2 font-semibold">{formatFuelEfficiency(performanceSummary?.avg_fuel_efficiency_km_per_liter ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost per Trip</p>
                <p className="mt-2 font-semibold">{formatCurrency(avgCostPerTrip)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Trip Duration</p>
                <p className="mt-2 font-semibold">{performanceSummary?.avg_trip_duration_days ? `${performanceSummary.avg_trip_duration_days.toFixed(1)} days` : 'N/A'}</p>
              </div>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="maintenance" className="space-y-6">
          <DetailSectionCard icon={<Wrench className="h-5 w-5" />} title="Maintenance Overview" description="Service and maintenance history">
            {maintenanceSummary ? (
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-semibold">{maintenanceSummary.total_records}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-semibold text-green-600">{maintenanceSummary.completed}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Scheduled</p>
                  <p className="text-lg font-semibold text-blue-600">{maintenanceSummary.scheduled}</p>
                </div>
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-semibold text-red-600">{maintenanceSummary.overdue}</p>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <Wrench className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No maintenance data available for this truck yet.</p>
              </div>
            )}

            {truck.maintenanceRecords && truck.maintenanceRecords.length > 0 && (
              <div className="space-y-3">
                {truck.maintenanceRecords.slice(0, 10).map(rec => (
                  <div key={rec.id} className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{rec.status ?? 'Unknown'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDate(rec.scheduled_date)}</span>
                    </div>
                    {rec.description && <p className="mt-2 text-xs">{rec.description}</p>}
                    <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-2">
                      <div><span className="font-medium">Cost:</span> {formatCurrency(rec.cost ?? null)}</div>
                      <div><span className="font-medium">Odometer:</span> {formatKilometers(rec.odometer_reading ?? null, 0)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard icon={<History className="h-5 w-5" />} title="Activity History" description="Audit trail of truck changes">
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <div className="py-8 text-center text-muted-foreground">
                <History className="mx-auto mb-4 h-12 w-12 opacity-60" />
                <p>No activity history available for this truck yet.</p>
              </div>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      {canDeleteTruck && <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Truck" description="Are you sure you want to delete this truck? This action cannot be undone." itemName={truck.plate} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />}
      {canDeactivateTruck && <DeleteConfirmationDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen} title="Deactivate Truck" description="This truck will be marked as inactive." itemName={truck.plate} onConfirm={handleDeactivateConfirm} confirmLabel="Deactivate" isLoading={isDeactivating} />}
    </DetailPageLayout>
  );
}

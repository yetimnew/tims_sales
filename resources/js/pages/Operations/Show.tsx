import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2, Activity, CheckCircle, AlertCircle, Calendar, BarChart3, Target, FileText, Building2, Handshake, TrendingUp, History } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { ActivityLogTable } from '@/components/activity-log-table';

interface User {
  id: number;
  name: string;
}
interface ActivityLog {
  id: number;
  description: string;
  event: string;
  created_at: string;
  causer?: User;
}
interface OperationDestination {
  scope?: string | null;
  name?: string | null;
  reference_id?: number | null;
  reference_type?: string | null;
}

interface Operation {
  id: number;
  operationid: string;
  description?: string;
  status: string;
  startdate?: string;
  enddate?: string;
  volume?: number;
  km?: number;
  tariff?: number;
  closed?: boolean;
  created_at: string;
  customer?: { id: number; name: string };
  destination_scope?: string | null;
  destination_name?: string | null;
  destination_reference_id?: number | null;
  destination_reference_type?: string | null;
  destination?: OperationDestination | null;
  user?: { id: number; name: string };
}
interface PerformanceTotals {
  plannedVolume: number | null;
  totalTrips: number;
  completedTrips: number;
  ongoingTrips: number;
  returnRate: number;
  totalTonnage: number;
  remainingTonnage: number;
  completionRate: number | null;
  averageTonPerTrip: number | null;
  totalDistance: number | null;
  totalTonKm?: number | null;
  plannedTonKm?: number | null;
  tonKmCompletionRate?: number | null;
  loadedDistance?: number | null;
  emptyDistance?: number | null;
  loadFactor?: number | null;
  emptyBackhaulShare?: number | null;
}

interface PerformanceFinancials {
  totalCost: number | null;
  averageCostPerTrip: number | null;
  averageCostPerTon: number | null;
  costPerTonKm?: number | null;
}

interface PerformanceEconomics {
  totalTonKm: number | null;
  plannedTonKm: number | null;
  tonKmCompletionRate: number | null;
  averageTonKmPerTrip: number | null;
  actualRevenue: number | null;
  potentialRevenue: number | null;
  revenueGap: number | null;
  grossMarginValue: number | null;
  grossMarginPercent: number | null;
  costPerTonKm: number | null;
  yieldPerTrip: number | null;
  yieldPerTon: number | null;
  loadFactor: number | null;
  emptyBackhaulShare: number | null;
  loadedDistance: number | null;
  emptyDistance: number | null;
}

interface PerformanceInsights {
  totals: PerformanceTotals;
  financial: PerformanceFinancials;
  economics?: PerformanceEconomics | null;
  trends: {
    timeline: Array<{ date: string; trips: number; tonnage: number }>;
    tonnageBreakdown: Array<{ label: string; value: number }>;
  };
}

type ExecutionMode = 'company' | 'vendor' | 'hybrid' | 'pending';

interface TransportExecution {
  companyTrips: number;
  vendorTrips: number;
  companyTonnage: number;
  vendorTonnage: number;
  companyTonKm: number;
  vendorTonKm: number;
  companyCost: number;
  vendorCost: number;
  totalCost: number;
  companyTripShare: number | null;
  vendorTripShare: number | null;
  companyTonnageShare: number | null;
  vendorTonnageShare: number | null;
  companyTonKmShare: number | null;
  vendorTonKmShare: number | null;
  companyCostShare: number | null;
  vendorCostShare: number | null;
  companyAverageTonPerTrip: number | null;
  vendorAverageTonPerTrip: number | null;
  companyAverageTonKmPerTrip: number | null;
  vendorAverageTonKmPerTrip: number | null;
  companyCostPerTonKm: number | null;
  vendorCostPerTonKm: number | null;
  executionMode: ExecutionMode;
}

interface OperationsShowProps {
  operation: Operation;
  activityLogs?: ActivityLog[];
  performanceInsights?: PerformanceInsights | null;
  transportExecution?: TransportExecution | null;
}

export default function OperationsShow({ operation, activityLogs = [], performanceInsights, transportExecution }: OperationsShowProps) {
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Operations', href: '/operations' }, { title: operation.operationid || `Operation ${operation.id}`, href: `/operations/${operation.id}` }], [operation.id, operation.operationid]);

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/operations/${operation.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({ title: '✅ Operation Deleted', description: `${operation.operationid} has been removed successfully.` });
      },
      onError: errors => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
            .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);
          if (errorMessages.length > 0) {
            toast({ title: '❌ Delete Failed', description: errorMessages.join('\n'), variant: 'destructive' });
            return;
          }
        }
        toast({ title: '❌ Delete Failed', description: 'An unexpected error occurred while deleting the operation.', variant: 'destructive' });
      },
    });
  };

  const getStatusBadgeColor = (status: string | undefined | null) => {
    if (!status) return 'bg-slate-100 text-slate-700 border border-slate-200';
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 border border-emerald-200';
      case 'pending':
        return 'bg-amber-100 text-amber-700 border border-amber-200';
      case 'cancelled':
      case 'inactive':
        return 'bg-rose-100 text-rose-700 border border-rose-200';
      default:
        return 'bg-blue-100 text-blue-700 border border-blue-200';
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return 'N/A';
    return new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatNumber = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  };

  const capitalize = (value?: string | null) => {
    if (!value) return 'Unknown';
    return value.charAt(0).toUpperCase() + value.slice(1);
  };

  const formatCurrency = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    return `${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`;
  };

  const formatPercent = (value?: number | null, fractionDigits = 1) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    return `${numericValue.toFixed(fractionDigits)}%`;
  };

  const formatCurrencyPerUnit = (value?: number | null, unit?: string) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    const formatted = numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} Birr${unit ? ` / ${unit}` : ''}`;
  };

  const expectedRevenue =
    operation.volume !== undefined && operation.volume !== null && operation.tariff !== undefined && operation.tariff !== null && Number.isFinite(Number(operation.volume)) && Number.isFinite(Number(operation.tariff)) && Number(operation.volume) >= 0 && Number(operation.tariff) >= 0
      ? Number(operation.volume) * Number(operation.tariff)
      : null;

  const totals = performanceInsights?.totals;
  const financial = performanceInsights?.financial;
  const economics = performanceInsights?.economics ?? null;
  const trends = performanceInsights?.trends;

  const completionRate = totals?.completionRate ?? null;
  const completionLabel = completionRate !== null && completionRate !== undefined ? `${completionRate.toFixed(1)}%` : 'N/A';

  const statusData = trends?.tonnageBreakdown ?? [];
  const hasStatusData = statusData.some(item => item.value > 0);
  const timelineData = trends?.timeline ?? [];
  const hasTimelineData = timelineData.length > 0;
  const piePalette = ['#6366f1', '#22c55e', '#f97316'];

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Status', value: <Badge className={getStatusBadgeColor(operation.status)}>{capitalize(operation.status)}</Badge>, helper: operation.closed ? 'Closed' : 'Open' },
    { label: 'Total Trips', value: formatNumber(totals?.totalTrips ?? 0, 0), helper: `Completed: ${formatNumber(totals?.completedTrips ?? 0, 0)}` },
    { label: 'Total Tonnage', value: `${formatNumber(totals?.totalTonnage ?? null)} MT`, helper: `Planned: ${formatNumber(operation.volume ?? null)} MT` },
    { label: 'Completion Rate', value: completionLabel, helper: `Remaining: ${formatNumber(totals?.remainingTonnage ?? null)} MT` },
  ];

  return (
    <DetailPageLayout
      title={operation.operationid}
      subtitle={operation.description || 'Operation details and performance tracking'}
      breadcrumbs={breadcrumbs}
      headTitle={`Operation - ${operation.operationid}`}
      icon={<Target className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/operations">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {hasPermission('operations.edit') && (
            <Button variant="outline" asChild>
              <Link href={`/operations/${operation.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}
          {hasPermission('operations.destroy') && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <Target className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="performance">
            <BarChart3 className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="economics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Economics
          </TabsTrigger>
          <TabsTrigger value="activity">
            <History className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title="Operation Details" icon={<FileText className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Operation ID</p>
                    <p className="mt-2 font-semibold">{operation.operationid}</p>
                  </div>
                  {operation.customer && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Customer</p>
                      <Link href={`/customers/${operation.customer.id}`} className="mt-2 block font-semibold text-blue-600 hover:underline">
                        {operation.customer.name}
                      </Link>
                    </div>
                  )}
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Start Date</p>
                    <p className="mt-2 font-semibold">{formatDate(operation.startdate)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">End Date</p>
                    <p className="mt-2 font-semibold">{formatDate(operation.enddate)}</p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title="Planned vs Actual" icon={<BarChart3 className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Planned Volume</p>
                    <p className="mt-2 font-semibold">{formatNumber(operation.volume)} MT</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Actual Volume</p>
                    <p className="mt-2 font-semibold">{formatNumber(totals?.totalTonnage ?? null)} MT</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Completion</p>
                    <p className="mt-2 font-semibold">{completionLabel}</p>
                  </div>
                </div>
              </DetailSectionCard>

              {operation.description && (
                <DetailSectionCard title="Description" icon={<FileText className="h-5 w-5" />}>
                  <p className="text-sm">{operation.description}</p>
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-4">
              <DetailSectionCard title="Key Metrics" icon={<Target className="h-5 w-5" />}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tariff</span>
                    <span className="font-semibold">{formatCurrencyPerUnit(operation.tariff, 'MT')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Revenue</span>
                    <span className="font-semibold">{formatCurrency(expectedRevenue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Revenue</span>
                    <span className="font-semibold">{formatCurrency(economics?.actualRevenue ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-semibold">{formatCurrency(financial?.totalCost ?? null)}</span>
                  </div>
                </div>
              </DetailSectionCard>

              {operation.user && (
                <DetailSectionCard title="Created By" icon={<Building2 className="h-5 w-5" />}>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User</span>
                      <span className="font-semibold">{operation.user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-semibold">{formatDate(operation.created_at)}</span>
                    </div>
                  </div>
                </DetailSectionCard>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid gap-6 xl:grid-cols-2">
            <DetailSectionCard title="Trip Statistics" icon={<BarChart3 className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-lg border p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Trips</p>
                  <p className="mt-2 text-2xl font-bold">{formatNumber(totals?.totalTrips ?? 0, 0)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="mt-2 text-2xl font-bold text-green-600">{formatNumber(totals?.completedTrips ?? 0, 0)}</p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-center">
                  <p className="text-xs text-muted-foreground">Ongoing</p>
                  <p className="mt-2 text-2xl font-bold text-blue-600">{formatNumber(totals?.ongoingTrips ?? 0, 0)}</p>
                </div>
              </div>
              {hasStatusData && (
                <div className="h-48">
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="label" innerRadius={45} outerRadius={75} paddingAngle={4}>
                        {statusData.map((_, index) => (
                          <Cell key={index} fill={piePalette[index % piePalette.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </DetailSectionCard>

            {hasTimelineData && (
              <DetailSectionCard title="Tonnage Trend" icon={<TrendingUp className="h-5 w-5" />}>
                <div className="h-48">
                  <ResponsiveContainer>
                    <AreaChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <Tooltip />
                      <Area type="monotone" dataKey="tonnage" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </DetailSectionCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          <DetailSectionCard title="Economic Performance" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Actual Revenue</p>
                <p className="mt-2 font-semibold">{formatCurrency(economics?.actualRevenue ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Cost</p>
                <p className="mt-2 font-semibold">{formatCurrency(financial?.totalCost ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Gross Margin</p>
                <p className="mt-2 font-semibold">{formatCurrency(economics?.grossMarginValue ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Margin %</p>
                <p className="mt-2 font-semibold">{formatPercent(economics?.grossMarginPercent ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost/Ton-Km</p>
                <p className="mt-2 font-semibold">{formatCurrencyPerUnit(economics?.costPerTonKm ?? null, 'ton-km')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
                <p className="mt-2 font-semibold">{formatPercent(economics?.loadFactor ?? null)}</p>
              </div>
            </div>
          </DetailSectionCard>

          {transportExecution && (
            <DetailSectionCard title="Transport Execution Mix" icon={<Handshake className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Company Execution</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trips</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyTrips, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tonnage</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyTonnage)} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="font-semibold">{formatCurrency(transportExecution.companyCost)}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Vendor Execution</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trips</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorTrips, 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tonnage</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorTonnage)} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="font-semibold">{formatCurrency(transportExecution.vendorCost)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </DetailSectionCard>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <DetailSectionCard title="Activity History" icon={<Activity className="h-5 w-5" />}>
            {activityLogs && activityLogs.length > 0 ? <ActivityLogTable logs={activityLogs} /> : <p className="py-8 text-center text-muted-foreground">No activity history available.</p>}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Operation" description="Are you sure you want to delete this operation? This action cannot be undone." itemName={operation.operationid} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

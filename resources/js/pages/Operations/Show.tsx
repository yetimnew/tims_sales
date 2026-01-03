import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { ArrowLeft, Edit, Trash2, BarChart3, Target, FileText, Building2, Handshake, TrendingUp, History, Lock, Unlock, Package, MapPin, ExternalLink } from 'lucide-react';
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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

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

interface CargoType {
  id: number;
  name: string;
  category?: string | null;
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
  remark?: string | null;
  customer?: { id: number; name: string };
  cargo_type?: CargoType | null;
  cargo_service_type?: string | null;
  destination_scope?: string | null;
  destination_name?: string | null;
  destination_reference_id?: number | null;
  destination_reference_type?: string | null;
  destination?: OperationDestination | null;
  destination_reference?: { id: number; name: string } | null;
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
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [reopenDialogOpen, setReopenDialogOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [isReopening, setIsReopening] = useState(false);
  const [closedDate, setClosedDate] = useState(new Date().toISOString().split('T')[0]);
  const [closeComment, setCloseComment] = useState('');
  const [reopenComment, setReopenComment] = useState('');
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

  const handleClose = () => {
    setIsClosing(true);
    router.post(`/operations/${operation.id}/close`, {
      closed_date: closedDate,
      comment: closeComment,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setCloseDialogOpen(false);
        setIsClosing(false);
        setCloseComment('');
        toast({ title: '✅ Operation Closed', description: `${operation.operationid} has been closed successfully.` });
      },
      onError: errors => {
        setIsClosing(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
            .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);
          if (errorMessages.length > 0) {
            toast({ title: '❌ Close Failed', description: errorMessages.join('\n'), variant: 'destructive' });
            return;
          }
        }
        toast({ title: '❌ Close Failed', description: 'An unexpected error occurred while closing the operation.', variant: 'destructive' });
      },
    });
  };

  const handleReopen = () => {
    setIsReopening(true);
    router.post(`/operations/${operation.id}/reopen`, {
      comment: reopenComment,
    }, {
      preserveScroll: true,
      onSuccess: () => {
        setReopenDialogOpen(false);
        setIsReopening(false);
        setReopenComment('');
        toast({ title: '✅ Operation Reopened', description: `${operation.operationid} has been reopened successfully.` });
      },
      onError: errors => {
        setIsReopening(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flatMap(message => (Array.isArray(message) ? message : message ? [message] : []))
            .filter((message): message is string => typeof message === 'string' && message.trim().length > 0);
          if (errorMessages.length > 0) {
            toast({ title: '❌ Reopen Failed', description: errorMessages.join('\n'), variant: 'destructive' });
            return;
          }
        }
        toast({ title: '❌ Reopen Failed', description: 'An unexpected error occurred while reopening the operation.', variant: 'destructive' });
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
          {hasPermission('operations.edit') && !operation.closed && (
            <Button variant="outline" onClick={() => setCloseDialogOpen(true)} className="border-orange-200 text-orange-600 hover:bg-orange-50">
              <Lock className="h-4 w-4 mr-2" />
              Close
            </Button>
          )}
          {hasPermission('operations.edit') && operation.closed && (
            <Button variant="outline" onClick={() => setReopenDialogOpen(true)} className="border-green-200 text-green-600 hover:bg-green-50">
              <Unlock className="h-4 w-4 mr-2" />
              Reopen
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
                  {operation.cargo_type && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Cargo Type</p>
                      <p className="mt-2 font-semibold">{operation.cargo_type.name}</p>
                      {operation.cargo_type.category && (
                        <Badge variant="secondary" className="mt-1 text-xs">{operation.cargo_type.category}</Badge>
                      )}
                    </div>
                  )}
                  {operation.cargo_service_type && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Service Type</p>
                      <p className="mt-2 font-semibold">{capitalize(operation.cargo_service_type)}</p>
                    </div>
                  )}
                  {operation.destination_name && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Destination ({capitalize(operation.destination_scope)})</p>
                      <p className="mt-2 font-semibold">{operation.destination_name}</p>
                    </div>
                  )}
                  {operation.km !== null && operation.km !== undefined && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Distance</p>
                      <p className="mt-2 font-semibold">{formatNumber(operation.km)} KM</p>
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

              {operation.remark && (
                <DetailSectionCard title="Remarks" icon={<FileText className="h-5 w-5" />}>
                  <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                    <p className="whitespace-pre-wrap text-sm">{operation.remark}</p>
                  </div>
                </DetailSectionCard>
              )}

              <DetailSectionCard title="Related Records" icon={<Truck className="h-5 w-5" />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/performances?operation=${operation.id}`}>
                      <Package className="h-4 w-4 mr-2" />
                      View Company Performances
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="w-full">
                    <Link href={`/outsource-performances?operation=${operation.id}`}>
                      <Handshake className="h-4 w-4 mr-2" />
                      View Outsource Performances
                      <ExternalLink className="h-3 w-3 ml-auto" />
                    </Link>
                  </Button>
                </div>
              </DetailSectionCard>
            </div>

            <div className="space-y-4">
              <DetailSectionCard title="Key Metrics" icon={<Target className="h-5 w-5" />}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tariff</span>
                    <span className="font-semibold">{formatCurrencyPerUnit(operation.tariff, 'ton-km')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Planned Ton-Km</span>
                    <span className="font-semibold">{formatNumber(economics?.plannedTonKm ?? totals?.plannedTonKm ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Ton-Km</span>
                    <span className="font-semibold">{formatNumber(economics?.totalTonKm ?? totals?.totalTonKm ?? null)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Potential Revenue</span>
                    <span className="font-semibold">{formatCurrency(economics?.potentialRevenue ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Actual Revenue</span>
                    <span className="font-semibold">{formatCurrency(economics?.actualRevenue ?? null)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Cost</span>
                    <span className="font-semibold">{formatCurrency(financial?.totalCost ?? null)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="text-muted-foreground">Gross Margin</span>
                    <span className={`font-semibold ${(economics?.grossMarginValue ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(economics?.grossMarginValue ?? null)}
                    </span>
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
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Volume Completion</p>
              <p className="mt-2 text-3xl font-bold">{completionLabel}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNumber(totals?.totalTonnage ?? null)} / {formatNumber(operation.volume)} MT</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Ton-Km Completion</p>
              <p className="mt-2 text-3xl font-bold">{formatPercent(totals?.tonKmCompletionRate ?? null)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNumber(totals?.totalTonKm ?? null)} / {formatNumber(totals?.plannedTonKm ?? null)}</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Return Rate</p>
              <p className="mt-2 text-3xl font-bold">{formatPercent(totals?.returnRate ?? null)}</p>
              <p className="mt-1 text-xs text-muted-foreground">{formatNumber(totals?.completedTrips ?? 0, 0)} / {formatNumber(totals?.totalTrips ?? 0, 0)} trips</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
              <p className="mt-2 text-3xl font-bold">{formatPercent(totals?.loadFactor ?? null)}</p>
              <p className="mt-1 text-xs text-muted-foreground">Efficiency metric</p>
            </div>
          </div>

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

          <DetailSectionCard title="Distance Metrics" icon={<MapPin className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Distance</p>
                <p className="mt-2 font-semibold">{formatNumber(totals?.totalDistance ?? null)} KM</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Loaded Distance</p>
                <p className="mt-2 font-semibold">{formatNumber(totals?.loadedDistance ?? null)} KM</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Empty Distance</p>
                <p className="mt-2 font-semibold">{formatNumber(totals?.emptyDistance ?? null)} KM</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Empty Backhaul</p>
                <p className="mt-2 font-semibold">{formatPercent(totals?.emptyBackhaulShare ?? null)}</p>
              </div>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          <DetailSectionCard title="Revenue Analysis" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Potential Revenue</p>
                <p className="mt-2 text-xl font-bold">{formatCurrency(economics?.potentialRevenue ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Based on planned ton-km</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Actual Revenue</p>
                <p className="mt-2 text-xl font-bold text-green-700">{formatCurrency(economics?.actualRevenue ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Based on actual ton-km</p>
              </div>
              <div className={`rounded-lg border p-3 ${(economics?.revenueGap ?? 0) > 0 ? 'border-red-200 bg-red-50' : 'border-gray-200'}`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Revenue Gap</p>
                <p className={`mt-2 text-xl font-bold ${(economics?.revenueGap ?? 0) > 0 ? 'text-red-700' : ''}`}>{formatCurrency(economics?.revenueGap ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Unrealized revenue</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Cost & Profitability" icon={<TrendingUp className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Cost</p>
                <p className="mt-2 font-semibold">{formatCurrency(financial?.totalCost ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Gross Margin</p>
                <p className={`mt-2 font-semibold ${(economics?.grossMarginValue ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(economics?.grossMarginValue ?? null)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Margin %</p>
                <p className={`mt-2 font-semibold ${(economics?.grossMarginPercent ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercent(economics?.grossMarginPercent ?? null)}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost/Ton-Km</p>
                <p className="mt-2 font-semibold">{formatCurrencyPerUnit(economics?.costPerTonKm ?? null, 'ton-km')}</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Yield Metrics" icon={<BarChart3 className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Yield per Trip</p>
                <p className="mt-2 font-semibold">{formatCurrency(economics?.yieldPerTrip ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Yield per Ton</p>
                <p className="mt-2 font-semibold">{formatCurrency(economics?.yieldPerTon ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Cost/Trip</p>
                <p className="mt-2 font-semibold">{formatCurrency(financial?.averageCostPerTrip ?? null)}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Cost/Ton</p>
                <p className="mt-2 font-semibold">{formatCurrency(financial?.averageCostPerTon ?? null)}</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Efficiency Metrics" icon={<Target className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
                <p className="mt-2 font-semibold">{formatPercent(economics?.loadFactor ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Loaded vs total distance</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Empty Backhaul</p>
                <p className="mt-2 font-semibold">{formatPercent(economics?.emptyBackhaulShare ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Empty return trips</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Avg Ton/Trip</p>
                <p className="mt-2 font-semibold">{formatNumber(totals?.averageTonPerTrip ?? null)} MT</p>
                <p className="mt-1 text-xs text-muted-foreground">Load per trip</p>
              </div>
            </div>
          </DetailSectionCard>

          {transportExecution && (
            <DetailSectionCard 
              title="Transport Execution Mix" 
              icon={<Handshake className="h-5 w-5" />}
              actions={
                <Badge 
                  className={
                    transportExecution.executionMode === 'company' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                    transportExecution.executionMode === 'vendor' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                    transportExecution.executionMode === 'hybrid' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                    'bg-gray-100 text-gray-700 border-gray-200'
                  }
                >
                  {capitalize(transportExecution.executionMode)} Mode
                </Badge>
              }
            >
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Company Execution</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trips</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyTrips, 0)} ({formatPercent(transportExecution.companyTripShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tonnage</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyTonnage)} MT ({formatPercent(transportExecution.companyTonnageShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ton-Km</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyTonKm)} ({formatPercent(transportExecution.companyTonKmShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="font-semibold">{formatCurrency(transportExecution.companyCost)} ({formatPercent(transportExecution.companyCostShare, 0)})</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Avg Ton/Trip</span>
                      <span className="font-semibold">{formatNumber(transportExecution.companyAverageTonPerTrip)} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost/Ton-Km</span>
                      <span className="font-semibold">{formatCurrencyPerUnit(transportExecution.companyCostPerTonKm, 'ton-km')}</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Vendor Execution</p>
                  <div className="mt-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Trips</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorTrips, 0)} ({formatPercent(transportExecution.vendorTripShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Tonnage</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorTonnage)} MT ({formatPercent(transportExecution.vendorTonnageShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Ton-Km</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorTonKm)} ({formatPercent(transportExecution.vendorTonKmShare, 0)})</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost</span>
                      <span className="font-semibold">{formatCurrency(transportExecution.vendorCost)} ({formatPercent(transportExecution.vendorCostShare, 0)})</span>
                    </div>
                    <div className="flex justify-between border-t pt-2">
                      <span>Avg Ton/Trip</span>
                      <span className="font-semibold">{formatNumber(transportExecution.vendorAverageTonPerTrip)} MT</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cost/Ton-Km</span>
                      <span className="font-semibold">{formatCurrencyPerUnit(transportExecution.vendorCostPerTonKm, 'ton-km')}</span>
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

      <Dialog open={closeDialogOpen} onOpenChange={setCloseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Close Operation</DialogTitle>
            <DialogDescription>
              This will mark the operation as closed and set the end date. You can add a comment explaining the closure.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="closed_date">Close Date</Label>
              <Input
                id="closed_date"
                type="date"
                value={closedDate}
                onChange={(e) => setClosedDate(e.target.value)}
                disabled={isClosing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="close_comment">Comment</Label>
              <Textarea
                id="close_comment"
                placeholder="Add a comment about closing this operation..."
                value={closeComment}
                onChange={(e) => setCloseComment(e.target.value)}
                disabled={isClosing}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloseDialogOpen(false)} disabled={isClosing}>
              Cancel
            </Button>
            <Button onClick={handleClose} disabled={isClosing || !closedDate}>
              {isClosing ? 'Closing...' : 'Close Operation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={reopenDialogOpen} onOpenChange={setReopenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reopen Operation</DialogTitle>
            <DialogDescription>
              This will reopen the operation and clear the end date. You can add a comment explaining the reopening.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reopen_comment">Comment (Optional)</Label>
              <Textarea
                id="reopen_comment"
                placeholder="Add a comment about reopening this operation..."
                value={reopenComment}
                onChange={(e) => setReopenComment(e.target.value)}
                disabled={isReopening}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReopenDialogOpen(false)} disabled={isReopening}>
              Cancel
            </Button>
            <Button onClick={handleReopen} disabled={isReopening}>
              {isReopening ? 'Reopening...' : 'Reopen Operation'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Operation" description="Are you sure you want to delete this operation? This action cannot be undone." itemName={operation.operationid} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

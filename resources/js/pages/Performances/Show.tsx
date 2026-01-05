import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, router } from '@inertiajs/react';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { Activity, DollarSign, Edit2, Trash2, ArrowLeft, CheckCircle, Clock, User, Building2, Route, Package, Calendar, FileText, AlertCircle, BarChart3, Target, PieChart as PieIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis } from 'recharts';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface DriverTruckAssignment {
  id: number;
  driver?: { id: number; name: string; license?: string; phone?: string } | null;
  truck?: { id: number; plate: string; model?: string; capacity?: number } | null;
}

interface Performance {
  id: number;
  FOnumber: string;
  load_phase?: string | null;
  load_completion?: string | null;
  DateDispach: string;
  satus: string;
  operation_id: number;
  driver_truck_id: number;
  orgion_id: number;
  destination_id: number;
  DistanceWCargo: number;
  DistanceWOCargo: number;
  tonkm: number;
  CargoVolumMT: number;
  fuelInLitter: number;
  fuelInBirr: number;
  perdiem: number;
  other: number;
  comment: string;
  is_returned: boolean;
  returned_date: string;
  operation?: { id: number; operationid: string; tariff?: number | null; km?: number | null; volume?: number | null; customer: { id: number; name: string; email?: string; phone?: string } };
  driverTruck?: DriverTruckAssignment | null;
  driver_truck?: DriverTruckAssignment | null;
  origin?: { id: number; name: string };
  destination?: { id: number; name: string };
}

interface ShowProps {
  performance: Performance;
  activityLogs?: any[];
  operationInsights?: OperationInsights | null;
}

interface PerformanceShare {
  tonnageShare: number | null;
  distanceShare: number | null;
  costShare: number | null;
  plannedContribution: number | null;
  tonnage: number;
  distance: number;
  cost: number;
  tonKm: number;
}

interface OperationInsights {
  overview: { plannedVolume: number | null; totalTrips: number; completedTrips: number; ongoingTrips: number; totalTonnage: number; remainingTonnage: number; completionRate: number | null };
  economics?: OperationEconomics | null;
  tripEconomics?: TripEconomics | null;
  performanceShare: PerformanceShare;
  trends: {
    recentTrips: Array<{ id: number; foNumber: string; date: string; tonnage: number; distance: number; cost: number; highlight: boolean }>;
    statusBreakdown: Array<{ label: string; value: number }>;
  };
}

interface OperationEconomics {
  tariff: number | null;
  totalTonKm: number | null;
  plannedTonKm: number | null;
  tonKmCompletionRate: number | null;
  actualRevenue: number | null;
  totalCost: number | null;
  costPerTonKm: number | null;
  grossMarginValue: number | null;
  grossMarginPercent: number | null;
  loadFactor: number | null;
  emptyBackhaulShare: number | null;
  loadedDistance: number | null;
  emptyDistance: number | null;
}

interface TripEconomics {
  tariff: number | null;
  tonKm: number | null;
  actualRevenue: number | null;
  cost: number | null;
  costPerTonKm: number | null;
  grossMarginValue: number | null;
  grossMarginPercent: number | null;
  yieldPerTon: number | null;
  yieldPerKm: number | null;
  loadFactor: number | null;
  emptyBackhaulShare: number | null;
  distanceWithCargo: number | null;
  distanceWithoutCargo: number | null;
}

export default function PerformancesShow({ performance, activityLogs, operationInsights }: ShowProps) {
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/performances/${performance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({ title: '✅ Performance Deleted', description: `${performance.FOnumber} has been removed successfully.` });
      },
      onError: errors => {
        setIsDeleting(false);
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'An unexpected error occurred while deleting the performance.';
        toast({ title: '❌ Delete Failed', description: errorMessage, variant: 'destructive' });
      },
    });
  };

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatNumberDisplay = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    return numericValue.toLocaleString('en-US', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  };

  const formatCurrencyDisplay = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    return `${numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Birr`;
  };

  const formatPercentDisplay = (value?: number | null) => {
    if (value === null || value === undefined) return 'N/A';
    return `${Number(value).toFixed(1)}%`;
  };

  const formatCurrencyPerUnit = (value?: number | null, unit?: string) => {
    if (value === null || value === undefined) return 'N/A';
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return 'N/A';
    const formatted = numericValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} Birr${unit ? ` / ${unit}` : ''}`;
  };

  const dwc = parseFloat(performance.DistanceWCargo as any) || 0;
  const dwo = parseFloat(performance.DistanceWOCargo as any) || 0;
  const cvm = parseFloat(performance.CargoVolumMT as any) || 0;
  const fib = parseFloat(performance.fuelInBirr as any) || 0;
  const per = parseFloat(performance.perdiem as any) || 0;
  const oth = parseFloat(performance.other as any) || 0;
  const fil = parseFloat(performance.fuelInLitter as any) || 0;

  const totalDistance = dwc + dwo;
  const tonKm = dwc * cvm;
  const totalCost = fib + per + oth;
  const fuelEfficiency = fil > 0 ? totalDistance / fil : 0;

  const operationRef = performance.operation;
  const driverAssignment = performance.driverTruck ?? performance.driver_truck ?? null;
  const driver = driverAssignment?.driver ?? null;
  const truck = driverAssignment?.truck ?? null;
  const foNumber = performance.FOnumber || 'N/A';
  const dispatchDateLabel = formatDisplayDate(performance.DateDispach);
  const returnedDateLabel = performance.is_returned ? formatDisplayDate(performance.returned_date) : 'Pending';
  const originName = performance.origin?.name || 'N/A';
  const destinationName = performance.destination?.name || 'N/A';

  const operationEconomics = operationInsights?.economics ?? null;
  const tripEconomics = operationInsights?.tripEconomics ?? null;
  const operationTrends = operationInsights?.trends;
  const performanceShare = operationInsights?.performanceShare ?? null;

  const tariff = tripEconomics?.tariff ?? operationRef?.tariff ?? null;
  const actualRevenueRaw = tripEconomics?.actualRevenue ?? (tariff !== null ? Number((tonKm * tariff).toFixed(2)) : null);
  const costPerTonKmRaw = tripEconomics?.costPerTonKm ?? (tonKm > 0 ? Number((totalCost / tonKm).toFixed(2)) : null);
  const grossMarginValueRaw = tripEconomics?.grossMarginValue ?? (actualRevenueRaw !== null ? Number((actualRevenueRaw - totalCost).toFixed(2)) : null);
  const grossMarginPercentRaw = tripEconomics?.grossMarginPercent ?? (actualRevenueRaw !== null && actualRevenueRaw !== 0 ? Number(((grossMarginValueRaw ?? 0) / actualRevenueRaw * 100).toFixed(2)) : null);

  const statusData = operationTrends?.statusBreakdown ?? [];
  const hasStatusData = statusData.some(item => item.value > 0);
  const timelineData = operationTrends?.recentTrips ?? [];
  const hasTimelineData = timelineData.length > 0;
  const piePalette = ['#6366f1', '#22c55e', '#f97316'];

  const tariffLabel = tariff !== null ? formatCurrencyPerUnit(tariff, 'ton-km') : 'N/A';
  const grossMarginPercentLabel = formatPercentDisplay(grossMarginPercentRaw);
  const actualRevenueLabel = formatCurrencyDisplay(actualRevenueRaw);
  const grossMarginValueLabel = formatCurrencyDisplay(grossMarginValueRaw);
  const costPerTonKmLabel = formatCurrencyPerUnit(costPerTonKmRaw, 'ton-km');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-blue-100 text-blue-800 border-blue-200',
      inactive: 'bg-gray-100 text-gray-800 border-gray-200',
      completed: 'bg-green-100 text-green-800 border-green-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      returned: 'bg-green-100 text-green-800 border-green-200',
    };
    return colors[status?.toLowerCase()] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, ReactNode> = {
      completed: <CheckCircle className="h-3.5 w-3.5" />,
      returned: <CheckCircle className="h-3.5 w-3.5" />,
      in_progress: <Clock className="h-3.5 w-3.5" />,
      active: <Activity className="h-3.5 w-3.5" />,
      pending: <Clock className="h-3.5 w-3.5" />,
      cancelled: <AlertCircle className="h-3.5 w-3.5" />,
    };
    return icons[status?.toLowerCase()] || <Activity className="h-3.5 w-3.5" />;
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Performances', href: '/performances' },
    { title: foNumber, href: `/performances/${performance.id}` },
  ];

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: 'Distance',
      value: `${formatNumberDisplay(totalDistance, 0)} km`,
      helper: `Load Factor: ${formatPercentDisplay(tripEconomics?.loadFactor ?? (totalDistance > 0 ? (dwc / totalDistance) * 100 : null))}`
    },
    {
      label: 'Cargo Volume',
      value: `${formatNumberDisplay(cvm, 2)} MT`,
      helper: `Ton-km: ${formatNumberDisplay(tonKm, 2)}`
    },
    {
      label: 'Total Cost',
      value: formatCurrencyDisplay(totalCost),
      helper: `${formatCurrencyPerUnit(costPerTonKmRaw, 'ton-km')}`
    },
    {
      label: 'Revenue',
      value: actualRevenueLabel,
      helper: `Margin: ${grossMarginPercentLabel} ${(grossMarginValueRaw ?? 0) >= 0 ? '✓' : '✗'}`
    },
  ];

  return (
    <DetailPageLayout
      title={`FO ${foNumber}`}
      subtitle={`${originName} → ${destinationName}`}
      breadcrumbs={breadcrumbs}
      headTitle={`FO ${foNumber}`}
      icon={<BarChart3 className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/performances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge className={`flex items-center gap-1 ${getStatusColor(performance.satus)}`}>
            {getStatusIcon(performance.satus)}
            {performance.satus}
          </Badge>
          <Badge variant="outline">{dispatchDateLabel}</Badge>
          <div className="flex gap-2">
            {hasPermission('performances.edit') && (
              <Button variant="outline" asChild>
                <Link href={`/performances/${performance.id}/edit`}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {hasPermission('performances.destroy') && (
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="economics">
            <DollarSign className="h-4 w-4 mr-2" />
            Economics
          </TabsTrigger>
          <TabsTrigger value="operation">
            <Target className="h-4 w-4 mr-2" />
            Operation
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            Activity
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title="Trip Details" icon={<Route className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Origin</p>
                    <p className="mt-2 font-semibold">{originName}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Destination</p>
                    <p className="mt-2 font-semibold">{destinationName}</p>
                  </div>
                  {performance.load_phase && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Load Phase</p>
                      <p className="mt-2 font-semibold capitalize">{performance.load_phase}</p>
                    </div>
                  )}
                  {performance.load_completion && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Load Completion</p>
                      <p className="mt-2 font-semibold capitalize">{performance.load_completion}</p>
                    </div>
                  )}
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Distance W/Cargo</p>
                    <p className="mt-2 font-semibold">{formatNumberDisplay(dwc, 0)} km</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Distance W/O Cargo</p>
                    <p className="mt-2 font-semibold">{formatNumberDisplay(dwo, 0)} km</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Total Distance</p>
                    <p className="mt-2 text-lg font-bold">{formatNumberDisplay(totalDistance, 0)} km</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
                    <p className="mt-2 text-lg font-bold">{formatPercentDisplay(tripEconomics?.loadFactor ?? (totalDistance > 0 ? (dwc / totalDistance) * 100 : null))}</p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title="Cargo & Fuel" icon={<Package className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Cargo Volume</p>
                    <p className="mt-2 font-semibold">{formatNumberDisplay(cvm, 2)} MT</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel (Liters)</p>
                    <p className="mt-2 font-semibold">{formatNumberDisplay(fil, 2)} L</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Efficiency</p>
                    <p className="mt-2 font-semibold">{formatNumberDisplay(fuelEfficiency, 2)} km/L</p>
                  </div>
                </div>
              </DetailSectionCard>

              {driver && (
                <DetailSectionCard title="Driver & Truck" icon={<User className="h-5 w-5" />}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Driver</p>
                      <Link href={`/drivers/${driver.id}`} className="mt-2 block text-lg font-bold text-blue-600 hover:underline">
                        {driver.name}
                      </Link>
                      {driver.license && (
                        <p className="mt-1 text-xs text-muted-foreground">License: {driver.license}</p>
                      )}
                      {driver.phone && (
                        <p className="mt-1 text-xs text-muted-foreground">Phone: {driver.phone}</p>
                      )}
                    </div>
                    {truck && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">Truck</p>
                        <Link href={`/trucks/${truck.id}`} className="mt-2 block text-lg font-bold text-orange-600 hover:underline">
                          {truck.plate}
                        </Link>
                        {truck.model && (
                          <p className="mt-1 text-xs text-muted-foreground">Model: {truck.model}</p>
                        )}
                        {truck.capacity && (
                          <p className="mt-1 text-xs text-muted-foreground">Capacity: {formatNumberDisplay(truck.capacity, 0)} MT</p>
                        )}
                      </div>
                    )}
                  </div>
                </DetailSectionCard>
              )}

              {performance.comment && (
                <DetailSectionCard title="Comments" icon={<FileText className="h-5 w-5" />}>
                  <p className="text-sm">{performance.comment}</p>
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-4">
              {operationRef && (
                <DetailSectionCard title="Operation" icon={<Building2 className="h-5 w-5" />}>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Operation ID</span>
                      <Link href={`/operations/${operationRef.id}`} className="font-semibold text-blue-600 hover:underline">
                        {operationRef.operationid}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Customer</span>
                      <span className="font-semibold">{operationRef.customer.name}</span>
                    </div>
                    {operationRef.tariff && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tariff</span>
                        <span className="font-semibold">{formatCurrencyPerUnit(operationRef.tariff, 'ton-km')}</span>
                      </div>
                    )}
                  </div>
                </DetailSectionCard>
              )}

              <DetailSectionCard title="Dates" icon={<Calendar className="h-5 w-5" />}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dispatch</span>
                    <span className="font-semibold">{dispatchDateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Returned</span>
                    <span className="font-semibold">{returnedDateLabel}</span>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title="Cost Breakdown" icon={<DollarSign className="h-5 w-5" />}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fuel</span>
                    <span className="font-semibold">{formatCurrencyDisplay(fib)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Per Diem</span>
                    <span className="font-semibold">{formatCurrencyDisplay(per)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Other</span>
                    <span className="font-semibold">{formatCurrencyDisplay(oth)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">Total</span>
                    <span className="font-bold">{formatCurrencyDisplay(totalCost)}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          <DetailSectionCard title="Revenue & Profitability" icon={<DollarSign className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Tariff</p>
                <p className="mt-2 font-semibold">{tariffLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Ton-Km</p>
                <p className="mt-2 font-semibold">{formatNumberDisplay(tonKm, 2)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Revenue</p>
                <p className="mt-2 text-lg font-bold text-green-700">{actualRevenueLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Total Cost</p>
                <p className="mt-2 text-lg font-bold">{formatCurrencyDisplay(totalCost)}</p>
              </div>
              <div className={`rounded-lg border p-3 ${(grossMarginValueRaw ?? 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Gross Margin</p>
                <p className={`mt-2 text-lg font-bold ${(grossMarginValueRaw ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {grossMarginValueLabel}
                </p>
              </div>
              <div className={`rounded-lg border p-3 ${(grossMarginPercentRaw ?? 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">Margin %</p>
                <p className={`mt-2 text-lg font-bold ${(grossMarginPercentRaw ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {grossMarginPercentLabel}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost/Ton-km</p>
                <p className="mt-2 font-semibold">{costPerTonKmLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost/km</p>
                <p className="mt-2 font-semibold">{formatCurrencyPerUnit(totalDistance > 0 ? totalCost / totalDistance : null, 'km')}</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Yield Metrics" icon={<Target className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Yield per Ton</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(tripEconomics?.yieldPerTon ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Revenue / Tonnage</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Yield per Km</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(tripEconomics?.yieldPerKm ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Revenue / Distance</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Cost per Ton</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(cvm > 0 ? totalCost / cvm : null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">Cost / Tonnage</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Cost Share</p>
                <p className="mt-2 font-semibold">{formatPercentDisplay(totalCost > 0 ? (fib / totalCost) * 100 : null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatCurrencyDisplay(fib)} of total</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Efficiency Metrics" icon={<BarChart3 className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Load Factor</p>
                <p className="mt-2 text-xl font-bold">{formatPercentDisplay(tripEconomics?.loadFactor ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(dwc, 0)} / {formatNumberDisplay(totalDistance, 0)} km</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Empty Backhaul</p>
                <p className="mt-2 text-xl font-bold">{formatPercentDisplay(tripEconomics?.emptyBackhaulShare ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(dwo, 0)} km empty</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Efficiency</p>
                <p className="mt-2 text-xl font-bold">{formatNumberDisplay(fuelEfficiency, 2)} km/L</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(fil, 0)} L consumed</p>
              </div>
            </div>
          </DetailSectionCard>

          {performanceShare && (
            <DetailSectionCard title="Contribution to Operation" icon={<PieIcon className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Tonnage Share</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">{formatPercentDisplay(performanceShare.tonnageShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(performanceShare.tonnage, 2)} MT</p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Distance Share</p>
                  <p className="mt-2 text-2xl font-bold text-purple-700">{formatPercentDisplay(performanceShare.distanceShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(performanceShare.distance, 0)} km</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Cost Share</p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">{formatPercentDisplay(performanceShare.costShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrencyDisplay(performanceShare.cost)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Planned Contribution</p>
                  <p className="mt-2 text-2xl font-bold text-green-700">{formatPercentDisplay(performanceShare.plannedContribution)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(performanceShare.tonKm, 2)} ton-km</p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-muted-foreground">
                  This trip contributed <strong>{formatPercentDisplay(performanceShare.tonnageShare)}</strong> of the operation's total tonnage and <strong>{formatPercentDisplay(performanceShare.plannedContribution)}</strong> towards the planned target.
                </p>
              </div>
            </DetailSectionCard>
          )}
        </TabsContent>

        <TabsContent value="operation" className="space-y-6">
          {operationRef && (
            <DetailSectionCard title={`Operation ${operationRef.operationid}`} icon={<Target className="h-5 w-5" />}
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/operations/${operationRef.id}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    View Full Operation
                  </Link>
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Customer</p>
                  <p className="mt-2 font-semibold">{operationRef.customer.name}</p>
                  {operationRef.customer.email && (
                    <p className="mt-1 text-xs text-muted-foreground">{operationRef.customer.email}</p>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Tariff</p>
                  <p className="mt-2 font-semibold">{formatCurrencyPerUnit(operationRef.tariff, 'ton-km')}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Planned Volume</p>
                  <p className="mt-2 font-semibold">{formatNumberDisplay(operationRef.volume, 2)} MT</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Planned Distance</p>
                  <p className="mt-2 font-semibold">{formatNumberDisplay(operationRef.km, 0)} km</p>
                </div>
              </div>
            </DetailSectionCard>
          )}

          {operationInsights && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Volume Completion</p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">{formatPercentDisplay(operationInsights.overview.completionRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(operationInsights.overview.totalTonnage, 2)} / {formatNumberDisplay(operationInsights.overview.plannedVolume, 2)} MT</p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Ton-Km Completion</p>
                  <p className="mt-2 text-3xl font-bold text-purple-700">{formatPercentDisplay(operationEconomics?.tonKmCompletionRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatNumberDisplay(operationEconomics?.totalTonKm, 0)} / {formatNumberDisplay(operationEconomics?.plannedTonKm, 0)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Operation Revenue</p>
                  <p className="mt-2 text-3xl font-bold text-green-700">{formatCurrencyDisplay(operationEconomics?.actualRevenue ?? null)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Total earned</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Operation Margin</p>
                  <p className={`mt-2 text-3xl font-bold ${(operationEconomics?.grossMarginPercent ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatPercentDisplay(operationEconomics?.grossMarginPercent)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrencyDisplay(operationEconomics?.grossMarginValue ?? null)}</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <DetailSectionCard title="Operation Progress" icon={<Target className="h-5 w-5" />}>
                  <div className="space-y-4">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div className="text-center">
                        <p className="text-muted-foreground">Total Trips</p>
                        <p className="text-2xl font-bold">{operationInsights.overview.totalTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Completed</p>
                        <p className="text-2xl font-bold text-green-600">{operationInsights.overview.completedTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">Ongoing</p>
                        <p className="text-2xl font-bold text-blue-600">{operationInsights.overview.ongoingTrips}</p>
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
                  </div>
                </DetailSectionCard>

                {hasTimelineData && (
                  <DetailSectionCard title="Recent Trips Trend" icon={<BarChart3 className="h-5 w-5" />}>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <AreaChart data={timelineData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="foNumber" />
                          <Tooltip />
                          <Area type="monotone" dataKey="cost" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </DetailSectionCard>
                )}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="activity" className="space-y-6">
          <DetailSectionCard title="Activity History" icon={<Activity className="h-5 w-5" />}>
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">No activity history available.</p>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Performance" description="Are you sure you want to delete this performance record? This action cannot be undone." itemName={foNumber} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

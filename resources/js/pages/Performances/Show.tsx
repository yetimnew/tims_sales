import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link, router } from '@inertiajs/react';
import { toast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { type BreadcrumbItem } from '@/types';
import { Activity, DollarSign, Edit2, Trash2, ArrowLeft, CheckCircle, Clock, User, Building2, Route, Package, Calendar, FileText, AlertCircle, BarChart3, Target, PieChart as PieIcon } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
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
  timing?: { averageDurationMinutes: number | null; actualDurationMinutes: number | null; delayMinutes: number | null };
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
  const { t, i18n } = useTranslation();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('performances.show.notAvailable');
  const pendingLabel = t('performances.show.pending');
  const currencyLabel = t('performances.show.currency.birr');
  const unitKm = t('performances.show.units.km');
  const unitMt = t('performances.show.units.mt');
  const unitLiter = t('performances.show.units.liter');
  const unitKmPerLiter = t('performances.show.units.kmPerLiter');
  const unitTonKm = t('performances.show.units.tonKm');
  const unitKmLabel = t('performances.show.units.kmLabel');
  const unitTonKmLabel = t('performances.show.units.tonKmLabel');
  const hourShort = t('performances.show.units.hourShort');
  const minuteShort = t('performances.show.units.minuteShort');

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/performances/${performance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: t('performances.delete.successTitle'),
          description: t('performances.delete.successDescription', { foNumber: performance.FOnumber }),
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const errorMessage =
          errors && typeof errors === 'object' && 'message' in errors
            ? String(errors.message)
            : t('performances.show.deleteUnexpectedError');
        toast({ title: t('performances.delete.failedTitle'), description: errorMessage, variant: 'destructive' });
      },
    });
  };

  const formatDisplayDate = (value?: string | null) => {
    if (!value) return notAvailableLabel;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return notAvailableLabel;
    return date.toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatNumberDisplay = (value?: number | null, fractionDigits = 2) => {
    if (value === null || value === undefined) return notAvailableLabel;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return notAvailableLabel;
    return numericValue.toLocaleString(locale, { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
  };

  const formatCurrencyDisplay = (value?: number | null) => {
    if (value === null || value === undefined) return notAvailableLabel;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return notAvailableLabel;
    return `${numericValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currencyLabel}`;
  };

  const formatPercentDisplay = (value?: number | null) => {
    if (value === null || value === undefined) return notAvailableLabel;
    return `${Number(value).toFixed(1)}%`;
  };

  const formatCurrencyPerUnit = (value?: number | null, unit?: string) => {
    if (value === null || value === undefined) return notAvailableLabel;
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) return notAvailableLabel;
    const formatted = numericValue.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${currencyLabel}${unit ? ` / ${unit}` : ''}`;
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
  const foNumber = performance.FOnumber || notAvailableLabel;
  const dispatchDateLabel = formatDisplayDate(performance.DateDispach);
  const returnedDateLabel = performance.is_returned ? formatDisplayDate(performance.returned_date) : pendingLabel;
  const originName = performance.origin?.name || notAvailableLabel;
  const destinationName = performance.destination?.name || notAvailableLabel;

  const operationEconomics = operationInsights?.economics ?? null;
  const tripEconomics = operationInsights?.tripEconomics ?? null;
  const operationTrends = operationInsights?.trends;
  const performanceShare = operationInsights?.performanceShare ?? null;
  const timingInsights = operationInsights?.timing ?? null;

  const tariff = tripEconomics?.tariff ?? operationRef?.tariff ?? null;
  const actualRevenueRaw = tripEconomics?.actualRevenue ?? (tariff !== null ? Number((tonKm * tariff).toFixed(2)) : null);
  const costPerTonKmRaw = tripEconomics?.costPerTonKm ?? (tonKm > 0 ? Number((totalCost / tonKm).toFixed(2)) : null);
  const grossMarginValueRaw = tripEconomics?.grossMarginValue ?? (actualRevenueRaw !== null ? Number((actualRevenueRaw - totalCost).toFixed(2)) : null);
  const grossMarginPercentRaw = tripEconomics?.grossMarginPercent ?? (actualRevenueRaw !== null && actualRevenueRaw !== 0 ? Number(((grossMarginValueRaw ?? 0) / actualRevenueRaw * 100).toFixed(2)) : null);

  const statusData = operationTrends?.statusBreakdown ?? [];
  const hasStatusData = statusData.some(item => item.value > 0);
  const timelineData = operationTrends?.recentTrips ?? [];
  const timelineChartData = timelineData.map((item, index) => ({
    ...item,
    tripLabel: t('performances.show.trends.tripLabel', { number: index + 1 }),
    dateLabel: item.date ?? notAvailableLabel,
  }));
  const hasTimelineData = timelineData.length > 0;
  const piePalette = ['#6366f1', '#22c55e', '#f97316'];

  const tariffLabel = tariff !== null ? formatCurrencyPerUnit(tariff, unitTonKmLabel) : notAvailableLabel;
  const grossMarginPercentLabel = formatPercentDisplay(grossMarginPercentRaw);
  const actualRevenueLabel = formatCurrencyDisplay(actualRevenueRaw);
  const grossMarginValueLabel = formatCurrencyDisplay(grossMarginValueRaw);
  const costPerTonKmLabel = formatCurrencyPerUnit(costPerTonKmRaw, unitTonKmLabel);
  const averageDurationMinutes = timingInsights?.averageDurationMinutes ?? null;
  const actualDurationMinutes = timingInsights?.actualDurationMinutes ?? null;
  const delayMinutes = timingInsights?.delayMinutes ?? null;

  const formatDuration = (minutes?: number | null) => {
    if (minutes === null || minutes === undefined) return notAvailableLabel;
    if (!Number.isFinite(Number(minutes))) return notAvailableLabel;
    const totalMinutes = Math.max(0, Math.round(minutes));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    if (hours === 0) {
      return `${mins}${minuteShort}`;
    }
    return `${hours}${hourShort} ${mins}${minuteShort}`;
  };

  const resolveDelayLabel = (minutes?: number | null) => {
    if (minutes === null || minutes === undefined) return notAvailableLabel;
    if (minutes === 0) return t('performances.show.timing.onTime');
    if (minutes > 0) return t('performances.show.timing.lateBy', { duration: formatDuration(minutes) });
    return t('performances.show.timing.earlyBy', { duration: formatDuration(Math.abs(minutes)) });
  };

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
    { title: t('performances.breadcrumb'), href: '/performances' },
    { title: foNumber, href: `/performances/${performance.id}` },
  ];

  const loadPhaseLabelMap: Record<string, string> = {
    main: t('performances.form.fields.loadPhase.main'),
    return: t('performances.form.fields.loadPhase.return'),
  };

  const loadCompletionLabelMap: Record<string, string> = {
    full: t('performances.form.fields.loadCompletion.full'),
    partial: t('performances.form.fields.loadCompletion.partial'),
  };

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: t('performances.show.kpi.distanceLabel'),
      value: `${formatNumberDisplay(totalDistance, 0)} ${unitKm}`,
      helper: t('performances.show.kpi.distanceHelper', {
        value: formatPercentDisplay(tripEconomics?.loadFactor ?? (totalDistance > 0 ? (dwc / totalDistance) * 100 : null)),
      }),
    },
    {
      label: t('performances.show.kpi.cargoLabel'),
      value: `${formatNumberDisplay(cvm, 2)} ${unitMt}`,
      helper: t('performances.show.kpi.cargoHelper', { value: formatNumberDisplay(tonKm, 2) }),
    },
    {
      label: t('performances.show.kpi.totalCostLabel'),
      value: formatCurrencyDisplay(totalCost),
      helper: formatCurrencyPerUnit(costPerTonKmRaw, unitTonKmLabel),
    },
    {
      label: t('performances.show.kpi.revenueLabel'),
      value: actualRevenueLabel,
      helper: t('performances.show.kpi.revenueHelper', {
        value: grossMarginPercentLabel,
        indicator:
          (grossMarginValueRaw ?? 0) >= 0 ? t('performances.show.kpi.positive') : t('performances.show.kpi.negative'),
      }),
    },
  ];

  return (
    <DetailPageLayout
      title={t('performances.show.title', { foNumber })}
      subtitle={`${originName} → ${destinationName}`}
      breadcrumbs={breadcrumbs}
      headTitle={t('performances.show.title', { foNumber })}
      icon={<BarChart3 className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/performances">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('performances.show.actions.back')}
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
                  {t('performances.show.actions.edit')}
                </Link>
              </Button>
            )}
            {hasPermission('performances.destroy') && (
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                {t('performances.show.actions.delete')}
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
            {t('performances.show.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="economics">
            <DollarSign className="h-4 w-4 mr-2" />
            {t('performances.show.tabs.economics')}
          </TabsTrigger>
          <TabsTrigger value="operation">
            <Target className="h-4 w-4 mr-2" />
            {t('performances.show.tabs.operation')}
          </TabsTrigger>
          <TabsTrigger value="activity">
            <Activity className="h-4 w-4 mr-2" />
            {t('performances.show.tabs.activity')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title={t('performances.show.sections.tripDetails')} icon={<Route className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.origin')}</p>
                    <p className="mt-2 font-semibold">{originName}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.destination')}</p>
                    <p className="mt-2 font-semibold">{destinationName}</p>
                  </div>
                  {performance.load_phase && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.loadPhase')}</p>
                      <p className="mt-2 font-semibold capitalize">
                        {loadPhaseLabelMap[performance.load_phase] ?? performance.load_phase}
                      </p>
                    </div>
                  )}
                  {performance.load_completion && (
                    <div className="rounded-lg border p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">
                        {t('performances.show.fields.loadCompletion')}
                      </p>
                      <p className="mt-2 font-semibold capitalize">
                        {loadCompletionLabelMap[performance.load_completion] ?? performance.load_completion}
                      </p>
                    </div>
                  )}
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.avgDurationRoute')}
                    </p>
                    <p className="mt-2 font-semibold">{formatDuration(averageDurationMinutes)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.actualDuration')}
                    </p>
                    <p className="mt-2 font-semibold">{formatDuration(actualDurationMinutes)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.delayVsAverage')}
                    </p>
                    <p className="mt-2 font-semibold">{resolveDelayLabel(delayMinutes)}</p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.distanceWithCargo')}
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatNumberDisplay(dwc, 0)} {unitKm}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.distanceWithoutCargo')}
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatNumberDisplay(dwo, 0)} {unitKm}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.totalDistance')}
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {formatNumberDisplay(totalDistance, 0)} {unitKm}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.loadFactor')}
                    </p>
                    <p className="mt-2 text-lg font-bold">
                      {formatPercentDisplay(tripEconomics?.loadFactor ?? (totalDistance > 0 ? (dwc / totalDistance) * 100 : null))}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title={t('performances.show.sections.cargoFuel')} icon={<Package className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.cargoVolume')}
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatNumberDisplay(cvm, 2)} {unitMt}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.fuelLiters')}
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatNumberDisplay(fil, 2)} {unitLiter}
                    </p>
                  </div>
                  <div className="rounded-lg border p-3">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">
                      {t('performances.show.fields.fuelEfficiency')}
                    </p>
                    <p className="mt-2 font-semibold">
                      {formatNumberDisplay(fuelEfficiency, 2)} {unitKmPerLiter}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {driver && (
                <DetailSectionCard title={t('performances.show.sections.driverTruck')} icon={<User className="h-5 w-5" />}>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                      <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.driver')}</p>
                      <Link href={`/drivers/${driver.id}`} className="mt-2 block text-lg font-bold text-blue-600 hover:underline">
                        {driver.name}
                      </Link>
                      {driver.license && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('performances.show.fields.license')}: {driver.license}
                        </p>
                      )}
                      {driver.phone && (
                        <p className="mt-1 text-xs text-muted-foreground">
                          {t('performances.show.fields.phone')}: {driver.phone}
                        </p>
                      )}
                    </div>
                    {truck && (
                      <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                        <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.truck')}</p>
                        <Link href={`/trucks/${truck.id}`} className="mt-2 block text-lg font-bold text-orange-600 hover:underline">
                          {truck.plate}
                        </Link>
                        {truck.model && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('performances.show.fields.model')}: {truck.model}
                          </p>
                        )}
                        {truck.capacity && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t('performances.show.fields.capacity')}: {formatNumberDisplay(truck.capacity, 0)} {unitMt}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </DetailSectionCard>
              )}

              {performance.comment && (
                <DetailSectionCard title={t('performances.show.sections.comments')} icon={<FileText className="h-5 w-5" />}>
                  <p className="text-sm">{performance.comment}</p>
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-4">
              {operationRef && (
                <DetailSectionCard title={t('performances.show.sections.operation')} icon={<Building2 className="h-5 w-5" />}>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('performances.show.fields.operationId')}</span>
                      <Link href={`/operations/${operationRef.id}`} className="font-semibold text-blue-600 hover:underline">
                        {operationRef.operationid}
                      </Link>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('performances.show.fields.customer')}</span>
                      <span className="font-semibold">{operationRef.customer.name}</span>
                    </div>
                    {operationRef.tariff && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('performances.show.fields.tariff')}</span>
                        <span className="font-semibold">{formatCurrencyPerUnit(operationRef.tariff, unitTonKmLabel)}</span>
                      </div>
                    )}
                  </div>
                </DetailSectionCard>
              )}

              <DetailSectionCard title={t('performances.show.sections.dates')} icon={<Calendar className="h-5 w-5" />}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('performances.show.fields.dispatch')}</span>
                    <span className="font-semibold">{dispatchDateLabel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('performances.show.fields.returned')}</span>
                    <span className="font-semibold">{returnedDateLabel}</span>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title={t('performances.show.sections.costBreakdown')} icon={<DollarSign className="h-5 w-5" />}>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('performances.show.fields.fuel')}</span>
                    <span className="font-semibold">{formatCurrencyDisplay(fib)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('performances.show.fields.perDiem')}</span>
                    <span className="font-semibold">{formatCurrencyDisplay(per)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('performances.show.fields.other')}</span>
                    <span className="font-semibold">{formatCurrencyDisplay(oth)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2">
                    <span className="font-semibold">{t('performances.show.fields.total')}</span>
                    <span className="font-bold">{formatCurrencyDisplay(totalCost)}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="economics" className="space-y-6">
          <DetailSectionCard title={t('performances.show.sections.revenueProfitability')} icon={<DollarSign className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.tariff')}</p>
                <p className="mt-2 font-semibold">{tariffLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.tonKm')}</p>
                <p className="mt-2 font-semibold">{formatNumberDisplay(tonKm, 2)}</p>
              </div>
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.revenue')}</p>
                <p className="mt-2 text-lg font-bold text-green-700">{actualRevenueLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.totalCost')}</p>
                <p className="mt-2 text-lg font-bold">{formatCurrencyDisplay(totalCost)}</p>
              </div>
              <div className={`rounded-lg border p-3 ${(grossMarginValueRaw ?? 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.grossMargin')}</p>
                <p className={`mt-2 text-lg font-bold ${(grossMarginValueRaw ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {grossMarginValueLabel}
                </p>
              </div>
              <div className={`rounded-lg border p-3 ${(grossMarginPercentRaw ?? 0) >= 0 ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.marginPercent')}</p>
                <p className={`mt-2 text-lg font-bold ${(grossMarginPercentRaw ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {grossMarginPercentLabel}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.costPerTonKm')}</p>
                <p className="mt-2 font-semibold">{costPerTonKmLabel}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.costPerKm')}</p>
                <p className="mt-2 font-semibold">
                  {formatCurrencyPerUnit(totalDistance > 0 ? totalCost / totalDistance : null, unitKmLabel)}
                </p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title={t('performances.show.sections.yieldMetrics')} icon={<Target className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.yieldPerTon')}</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(tripEconomics?.yieldPerTon ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('performances.show.fields.revenuePerTonnage')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.yieldPerKm')}</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(tripEconomics?.yieldPerKm ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('performances.show.fields.revenuePerDistance')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.costPerTon')}</p>
                <p className="mt-2 font-semibold">{formatCurrencyDisplay(cvm > 0 ? totalCost / cvm : null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">{t('performances.show.fields.costPerTonnage')}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.fuelCostShare')}</p>
                <p className="mt-2 font-semibold">{formatPercentDisplay(totalCost > 0 ? (fib / totalCost) * 100 : null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('performances.show.fields.fuelCostOfTotal', { value: formatCurrencyDisplay(fib) })}
                </p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title={t('performances.show.sections.efficiencyMetrics')} icon={<BarChart3 className="h-5 w-5" />}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.loadFactor')}</p>
                <p className="mt-2 text-xl font-bold">{formatPercentDisplay(tripEconomics?.loadFactor ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('performances.show.fields.loadFactorHelper', {
                    loaded: formatNumberDisplay(dwc, 0),
                    total: formatNumberDisplay(totalDistance, 0),
                    unit: unitKm,
                  })}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.emptyBackhaul')}</p>
                <p className="mt-2 text-xl font-bold">{formatPercentDisplay(tripEconomics?.emptyBackhaulShare ?? null)}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('performances.show.fields.emptyDistanceLabel', { value: formatNumberDisplay(dwo, 0), unit: unitKm })}
                </p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.fuelEfficiency')}</p>
                <p className="mt-2 text-xl font-bold">
                  {formatNumberDisplay(fuelEfficiency, 2)} {unitKmPerLiter}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t('performances.show.fields.fuelConsumedLabel', { value: formatNumberDisplay(fil, 0), unit: unitLiter })}
                </p>
              </div>
            </div>
          </DetailSectionCard>

          {performanceShare && (
            <DetailSectionCard title={t('performances.show.sections.contribution')} icon={<PieIcon className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.tonnageShare')}</p>
                  <p className="mt-2 text-2xl font-bold text-blue-700">{formatPercentDisplay(performanceShare.tonnageShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumberDisplay(performanceShare.tonnage, 2)} {unitMt}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.distanceShare')}</p>
                  <p className="mt-2 text-2xl font-bold text-purple-700">{formatPercentDisplay(performanceShare.distanceShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumberDisplay(performanceShare.distance, 0)} {unitKm}
                  </p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.costShare')}</p>
                  <p className="mt-2 text-2xl font-bold text-orange-700">{formatPercentDisplay(performanceShare.costShare)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrencyDisplay(performanceShare.cost)}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.plannedContribution')}
                  </p>
                  <p className="mt-2 text-2xl font-bold text-green-700">{formatPercentDisplay(performanceShare.plannedContribution)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumberDisplay(performanceShare.tonKm, 2)} {unitTonKm}
                  </p>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                <p className="text-xs text-muted-foreground">
                  {t('performances.show.contribution.summary', {
                    tonnage: formatPercentDisplay(performanceShare.tonnageShare),
                    planned: formatPercentDisplay(performanceShare.plannedContribution),
                  })}
                </p>
              </div>
            </DetailSectionCard>
          )}
        </TabsContent>

        <TabsContent value="operation" className="space-y-6">
          {operationRef && (
            <DetailSectionCard
              title={t('performances.show.operation.title', { id: operationRef.operationid })}
              icon={<Target className="h-5 w-5" />}
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/operations/${operationRef.id}`}>
                    <Building2 className="h-4 w-4 mr-2" />
                    {t('performances.show.operation.viewFull')}
                  </Link>
                </Button>
              }
            >
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.customer')}
                  </p>
                  <p className="mt-2 font-semibold">{operationRef.customer.name}</p>
                  {operationRef.customer.email && (
                    <p className="mt-1 text-xs text-muted-foreground">{operationRef.customer.email}</p>
                  )}
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">{t('performances.show.fields.tariff')}</p>
                  <p className="mt-2 font-semibold">{formatCurrencyPerUnit(operationRef.tariff, unitTonKmLabel)}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.plannedVolume')}
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatNumberDisplay(operationRef.volume, 2)} {unitMt}
                  </p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.plannedDistance')}
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatNumberDisplay(operationRef.km, 0)} {unitKm}
                  </p>
                </div>
              </div>
            </DetailSectionCard>
          )}

          {operationInsights && (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.volumeCompletion')}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-blue-700">{formatPercentDisplay(operationInsights.overview.completionRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('performances.show.fields.volumeCompletionHelper', {
                      total: formatNumberDisplay(operationInsights.overview.totalTonnage, 2),
                      planned: formatNumberDisplay(operationInsights.overview.plannedVolume, 2),
                      unit: unitMt,
                    })}
                  </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.tonKmCompletion')}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-purple-700">{formatPercentDisplay(operationEconomics?.tonKmCompletionRate)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('performances.show.fields.tonKmCompletionHelper', {
                      total: formatNumberDisplay(operationEconomics?.totalTonKm, 0),
                      planned: formatNumberDisplay(operationEconomics?.plannedTonKm, 0),
                    })}
                  </p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.operationRevenue')}
                  </p>
                  <p className="mt-2 text-3xl font-bold text-green-700">{formatCurrencyDisplay(operationEconomics?.actualRevenue ?? null)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{t('performances.show.fields.totalEarned')}</p>
                </div>
                <div className="rounded-lg border border-orange-200 bg-orange-50 p-4 text-center">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">
                    {t('performances.show.fields.operationMargin')}
                  </p>
                  <p className={`mt-2 text-3xl font-bold ${(operationEconomics?.grossMarginPercent ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                    {formatPercentDisplay(operationEconomics?.grossMarginPercent)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrencyDisplay(operationEconomics?.grossMarginValue ?? null)}</p>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <DetailSectionCard title={t('performances.show.sections.operationProgress')} icon={<Target className="h-5 w-5" />}>
                  <div className="space-y-4">
                    <div className="grid gap-3 text-sm md:grid-cols-3">
                      <div className="text-center">
                        <p className="text-muted-foreground">{t('performances.show.fields.totalTrips')}</p>
                        <p className="text-2xl font-bold">{operationInsights.overview.totalTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">{t('performances.show.fields.completedTrips')}</p>
                        <p className="text-2xl font-bold text-green-600">{operationInsights.overview.completedTrips}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-muted-foreground">{t('performances.show.fields.ongoingTrips')}</p>
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
                  <DetailSectionCard title={t('performances.show.sections.recentTrips')} icon={<BarChart3 className="h-5 w-5" />}>
                    <div className="h-48">
                      <ResponsiveContainer>
                        <AreaChart data={timelineChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis
                            dataKey="dateLabel"
                            interval="preserveStartEnd"
                            minTickGap={12}
                            tick={{ fontSize: 11 }}
                            tickMargin={8}
                            angle={-20}
                            textAnchor="end"
                          />
                          <Tooltip
                            labelFormatter={(label, payload) => {
                              const item = payload?.[0]?.payload as { tripLabel?: string; dateLabel?: string } | undefined;
                              return item ? `${item.tripLabel} • ${item.dateLabel}` : String(label);
                            }}
                          />
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
          <DetailSectionCard title={t('performances.show.sections.activityHistory')} icon={<Activity className="h-5 w-5" />}>
            {activityLogs && activityLogs.length > 0 ? (
              <ActivityLogTable logs={activityLogs} />
            ) : (
              <p className="py-8 text-center text-muted-foreground">{t('performances.show.activity.empty')}</p>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('performances.delete.title')}
        description={t('performances.show.deleteDescription')}
        itemName={foNumber}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

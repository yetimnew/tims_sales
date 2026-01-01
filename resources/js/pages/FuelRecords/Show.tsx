import { type ComponentProps, type ReactNode, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Fuel, Truck, User, MapPin, Calendar, DollarSign, FileText, Edit, Trash2, Hash, TrendingUp, BarChart3, History, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';

interface FuelRecord {
  id: number;
  fuel_date: string;
  fuel_quantity_liters: number;
  fuel_price_per_liter: number;
  total_cost: number;
  fuel_station: string;
  fuel_type: string;
  odometer_reading?: number;
  receipt_number?: string;
  notes?: string;
  driverTruck?: {
    id: number;
    truck?: {
      id: number;
      plate: string;
      model: string;
    };
    driver?: {
      id: number;
      name: string;
      license_number: string;
    };
  };
  user?: {
    id: number;
    name: string;
  };
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: number;
  description: string;
  created_at: string;
  causer?: {
    name?: string;
  };
}

interface FuelRecordsShowProps {
  fuelRecord: FuelRecord | null;
  activityLogs?: ActivityLog[];
}

const numberFormatter = new Intl.NumberFormat('en-ET');
const currencyFormatter = new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 2 });
const longDateFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
const dateTimeFormatter = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

const formatDate = (value?: string | null): string => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return longDateFormatter.format(parsed);
};

const formatDateTime = (value?: string | null): string => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return 'N/A';
  return dateTimeFormatter.format(parsed);
};

const formatCurrency = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return currencyFormatter.format(value);
};

const formatNumber = (value?: number | null): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return 'N/A';
  return numberFormatter.format(value);
};

const formatLiters = (value?: number | null): string => {
  const formatted = formatNumber(value);
  return formatted === 'N/A' ? formatted : `${formatted} L`;
};

const formatKilometers = (value?: number | null): string => {
  const formatted = formatNumber(value);
  return formatted === 'N/A' ? formatted : `${formatted} km`;
};

type BadgeVariant = ComponentProps<typeof Badge>['variant'];

interface DetailTileProps {
  icon: LucideIcon;
  label: string;
  value: ReactNode;
  highlight?: boolean;
  badgeVariant?: BadgeVariant;
}

const DetailTile = ({ icon: Icon, label, value, highlight = false, badgeVariant }: DetailTileProps) => {
  const containerClasses = highlight ? 'rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30' : 'rounded-lg border border-slate-200 bg-white/80 p-4 dark:border-slate-700 dark:bg-slate-900/40';
  const iconWrapperClasses = highlight ? 'rounded-lg bg-green-100 p-1.5 dark:bg-green-900/30' : 'rounded-lg bg-slate-100 p-1.5 dark:bg-slate-900/30';
  const valueClasses = highlight ? 'mt-2 text-lg font-semibold text-green-900 dark:text-green-100' : 'mt-2 text-lg font-semibold text-slate-900 dark:text-slate-100';
  const renderedValue =
    badgeVariant && typeof value === 'string' ? (
      <Badge variant={badgeVariant} className="w-fit px-3 py-1 text-sm">
        {value}
      </Badge>
    ) : (
      value
    );
  const iconColorClasses = highlight ? 'text-green-600 dark:text-green-400' : 'text-slate-600 dark:text-slate-400';

  return (
    <div className={containerClasses}>
      <div className="flex items-center gap-3">
        <div className={iconWrapperClasses}>
          <Icon className={`h-4 w-4 ${iconColorClasses}`} />
        </div>
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
      </div>
      <div className={valueClasses}>{renderedValue}</div>
    </div>
  );
};

export default function FuelRecordsShow({ fuelRecord, activityLogs = [] }: FuelRecordsShowProps) {
  const { hasPermission } = usePermissions();

  if (!fuelRecord) {
    return <div>Loading...</div>;
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fuel Records', href: '/fuel-records' },
    { title: fuelRecord.fuel_station, href: `/fuel-records/${fuelRecord.id}` },
  ];

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/fuel-records/${fuelRecord.id}`, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const getFuelTypeBadgeVariant = (fuelType: string) => {
    switch (fuelType.toLowerCase()) {
      case 'diesel':
        return 'default';
      case 'petrol':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const summaryItems = useMemo(
    () => [
      { key: 'fuel-date', label: 'Fuel Date', value: formatDate(fuelRecord.fuel_date), helper: fuelRecord.fuel_station },
      { key: 'quantity', label: 'Quantity', value: formatLiters(fuelRecord.fuel_quantity_liters), helper: `Price ${formatCurrency(fuelRecord.fuel_price_per_liter)} / L` },
      { key: 'total-cost', label: 'Total Cost', value: formatCurrency(fuelRecord.total_cost), helper: fuelRecord.receipt_number ? `Receipt ${fuelRecord.receipt_number}` : 'Receipt not provided' },
      {
        key: 'fuel-type',
        label: 'Fuel Type',
        value: (
          <Badge variant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)} className="flex w-fit items-center gap-1 px-3 py-1 text-sm">
            {fuelRecord.fuel_type}
          </Badge>
        ),
        valueClassName: 'text-base font-medium',
        helper: fuelRecord.driverTruck?.truck?.plate ? `Truck ${fuelRecord.driverTruck.truck.plate}` : 'No truck linked',
      },
    ],
    [fuelRecord],
  );

  return (
    <DetailPageLayout
      title={fuelRecord.fuel_station}
      subtitle={`Fuel record on ${formatDate(fuelRecord.fuel_date)}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Fuel Record - ${fuelRecord.fuel_station}`}
      icon={<Fuel className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/fuel-records')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <>
          <div className="flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-3 py-1 text-sm font-medium text-green-700 dark:border-green-700/60 dark:bg-green-950/30 dark:text-green-300">
            <DollarSign className="h-4 w-4" />
            {formatCurrency(fuelRecord.total_cost)}
          </div>
          <div className="flex gap-2">
            {hasPermission('fuel-records.edit') && (
              <Button variant="outline" asChild>
                <Link href={`/fuel-records/${fuelRecord.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {hasPermission('fuel-records.destroy') && (
              <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={summaryItems} className="xl:grid-cols-4" />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <Fuel className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="h-4 w-4 mr-2" /> Analytics
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <DetailSectionCard title="Fuel Record Details" description="Complete refueling event information" icon={<Fuel className="h-5 w-5" />}>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <DetailTile icon={Calendar} label="Fuel Date" value={formatDate(fuelRecord.fuel_date)} />
                <DetailTile icon={MapPin} label="Fuel Station" value={fuelRecord.fuel_station} />
                <DetailTile icon={Fuel} label="Fuel Type" value={fuelRecord.fuel_type} badgeVariant={getFuelTypeBadgeVariant(fuelRecord.fuel_type)} />
                <DetailTile icon={Fuel} label="Quantity" value={formatLiters(fuelRecord.fuel_quantity_liters)} />
                <DetailTile icon={DollarSign} label="Price / Liter" value={`${formatCurrency(fuelRecord.fuel_price_per_liter)} / L`} />
                <DetailTile icon={DollarSign} label="Total Cost" value={formatCurrency(fuelRecord.total_cost)} highlight />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {fuelRecord.odometer_reading && <DetailTile icon={TrendingUp} label="Odometer Reading" value={formatKilometers(fuelRecord.odometer_reading)} />}
                {fuelRecord.receipt_number && <DetailTile icon={FileText} label="Receipt Number" value={fuelRecord.receipt_number} />}
              </div>

              {fuelRecord.notes && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Notes</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{fuelRecord.notes}</p>
                </div>
              )}
            </DetailSectionCard>

            <div className="space-y-4">
              <DetailSectionCard title="Vehicle & Driver" icon={<Truck className="h-4 w-4" />}>
                <div className="space-y-4">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Truck</p>
                    <p className="mt-2 text-lg font-semibold">{fuelRecord.driverTruck?.truck?.plate ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{fuelRecord.driverTruck?.truck?.model ?? 'Model not specified'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Driver</p>
                    <p className="mt-2 text-lg font-semibold">{fuelRecord.driverTruck?.driver?.name ?? 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">License: {fuelRecord.driverTruck?.driver?.license_number ?? 'N/A'}</p>
                  </div>
                </div>
              </DetailSectionCard>

              <DetailSectionCard title="Record Information" icon={<Hash className="h-4 w-4" />}>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">System ID</span>
                    <span className="font-semibold">#{fuelRecord.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created By</span>
                    <span className="font-semibold">{fuelRecord.user?.name ?? 'Unknown'}</span>
                  </div>
                </div>
              </DetailSectionCard>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <DetailSectionCard title="Fuel Analytics" description="Consumption analysis and insights" icon={<BarChart3 className="h-5 w-5" />}>
            <div className="py-12 text-center">
              <BarChart3 className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-lg font-semibold">Analytics Coming Soon</h3>
              <p className="text-sm text-muted-foreground">Advanced fuel consumption analytics and efficiency calculations will be available here.</p>
            </div>
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Audit trail for this fuel record" icon={<History className="h-5 w-5" />}>
            <ActivityLogTable logs={activityLogs} />
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Fuel Record" description={`Are you sure you want to delete the fuel record from ${fuelRecord.fuel_station}? This action cannot be undone.`} itemName={`${fuelRecord.fuel_station} - ${fuelRecord.total_cost.toLocaleString()} ETB`} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

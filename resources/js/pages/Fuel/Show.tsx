import { Link, router } from '@inertiajs/react';
import { Edit, Trash2, ArrowLeft, Droplet, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useState } from 'react';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface ActivityLog {
  id: number;
  action: 'created' | 'updated' | 'deleted';
  description: string;
  user?: { name: string };
  created_at: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

interface FuelRecord {
  id: number;
  truck_id: number;
  driver_id: number;
  fuel_date: string;
  fuel_type: string;
  fuel_quantity_liters: number;
  fuel_price_per_liter: number;
  total_cost: number;
  fuel_station?: string;
  odometer_reading?: number;
  receipt_number?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
  truck?: { id: number; plate: string };
  driver?: { id: number; name: string };
}

interface FuelShowProps {
  fuel: FuelRecord;
  activityLogs?: ActivityLog[];
}

export default function FuelShow({ fuel, activityLogs = [] }: FuelShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Fuel', href: '/fuel' },
    { title: fuel.truck?.plate || `Record ${fuel.id}`, href: `/fuel/${fuel.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/fuel/${fuel.id}`, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: () => {
        setIsDeleting(false);
      },
    });
  };

  const formatDate = (date?: string) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (value?: number) => {
    if (!value) return 'N/A';
    return `$${Number(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const getFuelTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'diesel':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'petrol':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'gas':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Quantity', value: `${Number(fuel.fuel_quantity_liters).toFixed(2)} L`, helper: 'Liters filled' },
    { label: 'Price/Liter', value: formatCurrency(Number(fuel.fuel_price_per_liter)), helper: 'Unit price' },
    { label: 'Total Cost', value: formatCurrency(Number(fuel.total_cost)), helper: 'Total expense' },
    { label: 'Odometer', value: fuel.odometer_reading ? `${fuel.odometer_reading.toLocaleString()} km` : 'N/A', helper: 'Vehicle reading' },
  ];

  return (
    <DetailPageLayout
      title={`Fuel Record - ${fuel.truck?.plate || 'Record'}`}
      subtitle={`Driver: ${fuel.driver?.name || 'N/A'}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Fuel Record - ${fuel.truck?.plate || 'Record'}`}
      icon={<Droplet className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      iconWrapperClassName="bg-blue-100 dark:bg-blue-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/fuel')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Fuel
        </Button>
      }
      actions={
        <>
          <Badge className={getFuelTypeBadgeColor(fuel.fuel_type)}>{fuel.fuel_type.charAt(0).toUpperCase() + fuel.fuel_type.slice(1)}</Badge>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/fuel/${fuel.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <DetailSectionCard title="Fuel Information" description="Fuel details and pricing" icon={<Droplet className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Type</p>
              <Badge className={`mt-1 ${getFuelTypeBadgeColor(fuel.fuel_type)}`}>{fuel.fuel_type.charAt(0).toUpperCase() + fuel.fuel_type.slice(1)}</Badge>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Date</p>
              <p className="mt-1 text-sm font-semibold">{formatDate(fuel.fuel_date)}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Quantity Liters</p>
              <p className="mt-1 text-sm font-semibold">{Number(fuel.fuel_quantity_liters).toFixed(2)} L</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Price Per Liter</p>
              <p className="mt-1 text-sm font-semibold">{formatCurrency(Number(fuel.fuel_price_per_liter))}</p>
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Station & Receipt Details" description="Transaction information" icon={<Receipt className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Fuel Station</p>
              <p className="mt-1 text-sm">{fuel.fuel_station || 'N/A'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Receipt Number</p>
              <p className="mt-1 font-mono text-sm">{fuel.receipt_number || 'N/A'}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Odometer Reading</p>
              <p className="mt-1 text-sm">{fuel.odometer_reading ? `${fuel.odometer_reading.toLocaleString()} km` : 'N/A'}</p>
            </div>
            {fuel.notes && (
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Notes</p>
                <p className="mt-1 whitespace-pre-wrap text-sm">{fuel.notes}</p>
              </div>
            )}
          </div>
        </DetailSectionCard>
      </div>

      {activityLogs.length > 0 && (
        <DetailSectionCard title="Activity History" description="Auditable timeline" icon={<Droplet className="h-5 w-5" />}>
          <ActivityLogTable logs={activityLogs} />
        </DetailSectionCard>
      )}

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Fuel Record" description="Are you sure you want to delete this fuel record?" onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

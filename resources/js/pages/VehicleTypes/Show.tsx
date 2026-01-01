import { Link, router } from '@inertiajs/react';
import { Settings, Edit, Trash2, Truck, ArrowLeft, Activity, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useMemo, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSummaryGrid } from '@/components/detail/detail-summary-grid';
import { DetailSectionCard } from '@/components/detail/detail-section-card';

interface ActivityLog {
  id: number;
  action: 'created' | 'updated' | 'deleted';
  description: string;
  user?: {
    name: string;
  };
  created_at: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
}

interface VehicleTypeTruck {
  id: number;
  plate: string;
  status?: string | null;
  created_at?: string | null;
}

interface VehicleType {
  id: number;
  name: string;
  description?: string;
  created_at: string;
  updated_at: string;
  trucks?: { data: VehicleTypeTruck[] } | VehicleTypeTruck[];
}

interface VehicleTypesShowProps {
  vehicleType: VehicleType;
  activityLogs?: ActivityLog[];
}

const numberFormatter = new Intl.NumberFormat('en-ET');

function formatDate(date?: string | null): string {
  if (!date) return 'Not available';
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return 'Not available';
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function VehicleTypesShow({ vehicleType, activityLogs = [] }: VehicleTypesShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Vehicle Types', href: '/vehicletypes' },
    { title: vehicleType.name, href: `/vehicletypes/${vehicleType.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const trucksRaw = Array.isArray(vehicleType.trucks) ? vehicleType.trucks : vehicleType.trucks?.data;
  const trucks: VehicleTypeTruck[] = Array.isArray(trucksRaw) ? trucksRaw : [];

  const overviewSummaryItems = useMemo(
    () => [
      {
        key: 'associated-trucks',
        label: 'Associated Trucks',
        value: numberFormatter.format(trucks.length),
        helper: trucks.length === 1 ? 'Truck currently using this type' : 'Trucks currently using this type',
      },
      {
        key: 'created',
        label: 'Created',
        value: formatDate(vehicleType.created_at),
        helper: 'Initial catalogue entry',
      },
      {
        key: 'updated',
        label: 'Last Updated',
        value: formatDate(vehicleType.updated_at),
        helper: 'Most recent modification',
      },
    ],
    [trucks.length, vehicleType.created_at, vehicleType.updated_at],
  );

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/vehicletypes/${vehicleType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Vehicle Type Deleted',
          description: `${vehicleType.name} has been removed from the fleet classifications.`,
        });
      },
      onError: errors => {
        setIsDeleting(false);
        if (errors && typeof errors === 'object') {
          const errorMessages = Object.values(errors)
            .flat()
            .filter((message): message is string => typeof message === 'string')
            .join('\n');

          toast({
            title: '❌ Delete Failed',
            description: errorMessages || 'Unable to delete this vehicle type. Please resolve any blocking records first.',
            variant: 'destructive',
          });
        } else {
          toast({
            title: '❌ Delete Failed',
            description: 'An unexpected error occurred while deleting the vehicle type. Please try again.',
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={vehicleType.name}
      subtitle={vehicleType.description || 'Fleet classification and operational vehicle categorization.'}
      breadcrumbs={breadcrumbs}
      headTitle={vehicleType.name}
      icon={<Truck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" as Child>
          <Link href="/vehicletypes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vehicle Types
          </Link>
        </Button>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      }
    >
      <DetailSummaryGrid items={overviewSummaryItems} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard title="Associated Trucks" description={`${trucks.length} trucks configured with this vehicle type`} icon={<Truck className="h-5 w-5" />}>
            {trucks.length > 0 ? (
              <div className="space-y-2">
                {trucks.map(truck => (
                  <Link key={truck.id} href={`/trucks/${truck.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{truck.plate}</p>
                        {truck.created_at && <p className="text-xs text-muted-foreground">Added {formatDate(truck.created_at)}</p>}
                      </div>
                    </div>
                    {truck.status && (
                      <Badge variant={truck.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {truck.status}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No trucks have been assigned to this vehicle type yet.</p>
            )}
          </DetailSectionCard>

          {activityLogs.length > 0 && (
            <DetailSectionCard title="Activity History" description="Auditable timeline of changes" icon={<Activity className="h-5 w-5" />}>
              <ActivityLogTable logs={activityLogs} />
            </DetailSectionCard>
          )}
        </div>

        <div className="space-y-6">
          <DetailSectionCard title="Quick Info" description="System tracking" icon={<Settings className="h-5 w-5" />} className="lg:col-span-1">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Vehicle Type ID</span>
                <span className="font-semibold">#{vehicleType.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Trucks</span>
                <span className="font-semibold">{trucks.length}</span>
              </div>
            </div>
          </DetailSectionCard>
        </div>
      </div>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Vehicle Type" description={`Are you sure you want to delete ${vehicleType.name}? This action cannot be undone.`} itemName={vehicleType.name} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

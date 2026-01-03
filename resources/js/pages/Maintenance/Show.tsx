import { Link, router } from '@inertiajs/react';
import { Edit, Trash2, ArrowLeft, Wrench, Calendar, ClipboardList, User, AlertTriangle, FileText, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { toast } from '@/hooks/use-toast';
import { useState, type ReactNode } from 'react';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

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

interface Truck {
  id: number;
  plate: string;
}

interface MaintenanceType {
  id: number;
  name: string;
  category: string;
}

interface MaintenanceRecord {
  id: number;
  truck_id: number;
  maintenance_type_id: number;
  scheduled_date: string;
  completed_date?: string;
  odometer_reading?: number;
  cost?: number;
  description?: string;
  work_performed?: string;
  parts_replaced?: string;
  service_provider?: string;
  status: string;
  created_at?: string;
  updated_at?: string;
  truck?: Truck;
  maintenanceType?: MaintenanceType;
  assignedMechanic?: {
    id?: number | null;
    name?: string | null;
    email?: string | null;
  } | null;
}

interface MaintenanceShowProps {
  maintenance: MaintenanceRecord;
  activityLogs?: ActivityLog[];
}

const formatDate = (date?: string | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (value?: number | null) => {
  if (value === null || value === undefined) return 'N/A';
  return `$${Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export default function MaintenanceShow({ maintenance, activityLogs = [] }: MaintenanceShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Maintenance', href: '/maintenance' },
    { title: maintenance.maintenanceType?.name || `Record #${maintenance.id}`, href: `/maintenance/${maintenance.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/maintenance/${maintenance.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Maintenance Record Deleted',
          description: 'The maintenance record has been removed successfully.',
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const messages = Object.values(errors as Record<string, unknown>)
          .flatMap(value => (Array.isArray(value) ? value : [value]))
          .filter(Boolean)
          .join('\n');

        toast({
          title: '❌ Delete Failed',
          description: messages || 'Unable to delete this maintenance record. Please try again.',
          variant: 'destructive',
        });
      },
    });
  };

  const statusMeta: Record<string, { label: string; badgeClass: string; icon: ReactNode | null }> = {
    scheduled: {
      label: 'Scheduled',
      badgeClass: 'border border-blue-200 bg-blue-100 text-blue-800',
      icon: <Calendar className="h-3 w-3" />,
    },
    in_progress: {
      label: 'In Progress',
      badgeClass: 'border border-amber-200 bg-amber-100 text-amber-800',
      icon: <Wrench className="h-3 w-3" />,
    },
    completed: {
      label: 'Completed',
      badgeClass: 'border border-emerald-200 bg-emerald-100 text-emerald-800',
      icon: <ClipboardList className="h-3 w-3" />,
    },
    overdue: {
      label: 'Overdue',
      badgeClass: 'border border-red-200 bg-red-100 text-red-800',
      icon: <AlertTriangle className="h-3 w-3" />,
    },
  };

  const resolvedStatusMeta = statusMeta[maintenance.status as keyof typeof statusMeta] ?? {
    label: maintenance.status,
    badgeClass: 'border border-slate-200 bg-slate-100 text-slate-700',
    icon: null,
  };

  const assignedMechanicName = maintenance.assignedMechanic?.name ?? 'Unassigned';

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Scheduled Date', value: formatDate(maintenance.scheduled_date), helper: 'When due' },
    { label: 'Completed Date', value: formatDate(maintenance.completed_date), helper: 'When finished' },
    { label: 'Odometer Reading', value: maintenance.odometer_reading ? `${maintenance.odometer_reading.toLocaleString()} km` : 'N/A', helper: 'Mileage at service' },
    { label: 'Estimated Cost', value: formatCurrency(maintenance.cost), helper: 'Financial impact' },
  ];

  return (
    <DetailPageLayout
      title={maintenance.maintenanceType?.name || 'Maintenance Record'}
      subtitle={`Linked truck: ${maintenance.truck?.plate ?? 'N/A'}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Maintenance - ${maintenance.truck?.plate || 'Record'}`}
      icon={<Wrench className="h-6 w-6 text-amber-700 dark:text-amber-300" />}
      iconWrapperClassName="bg-amber-100 dark:bg-amber-900/40"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/maintenance')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <>
          <Badge className={`flex items-center gap-2 px-3 py-1 ${resolvedStatusMeta.badgeClass}`}>
            {resolvedStatusMeta.icon}
            {resolvedStatusMeta.label}
          </Badge>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/maintenance/${maintenance.id}/edit`}>
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

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard title="Maintenance Overview" description="Schedule and categorization details" icon={<ClipboardList className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Status</p>
                  <Badge className={`mt-2 flex w-fit items-center gap-2 ${resolvedStatusMeta.badgeClass}`}>
                    {resolvedStatusMeta.icon}
                    {resolvedStatusMeta.label}
                  </Badge>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Category</p>
                  <p className="mt-2 text-sm font-semibold">{maintenance.maintenanceType?.category || 'N/A'}</p>
                </div>
              </div>
              {maintenance.description && (
                <div className="rounded-lg border p-4">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                  <p className="mt-2 text-sm leading-relaxed">{maintenance.description}</p>
                </div>
              )}
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Work Summary" description="Work performed and parts replaced" icon={<Wrench className="h-5 w-5" />}>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Work Performed</p>
                <p className="mt-2 text-sm leading-relaxed">{maintenance.work_performed || 'No work details recorded.'}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Parts Replaced</p>
                <p className="mt-2 text-sm leading-relaxed">{maintenance.parts_replaced || 'No parts information captured.'}</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Service Provider</p>
                  <p className="mt-2 text-sm font-semibold">{maintenance.service_provider || 'Internal Workshop'}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Assigned Mechanic</p>
                  <p className="mt-2 flex items-center gap-2 text-sm font-semibold">
                    <User className="h-4 w-4 text-muted-foreground" />
                    {assignedMechanicName}
                  </p>
                </div>
              </div>
            </div>
          </DetailSectionCard>
        </div>

        <div className="space-y-6">
          <DetailSectionCard title="Quick Reference" description="Key details" icon={<FileText className="h-4 w-4" />}>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Linked Truck</p>
                <Link href={`/trucks/${maintenance.truck_id}`} className="mt-2 inline-flex items-center gap-2 font-mono font-semibold text-blue-600 hover:underline">
                  <Wrench className="h-4 w-4" />
                  {maintenance.truck?.plate || 'N/A'}
                </Link>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Maintenance Type</p>
                <p className="mt-2 text-sm font-semibold">{maintenance.maintenanceType?.name || 'N/A'}</p>
              </div>
              <div className="rounded-lg border p-3">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Created</p>
                <p className="mt-2 text-sm font-semibold">{formatDate(maintenance.created_at)}</p>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Next Actions" description="Recommended steps" icon={<Lightbulb className="h-4 w-4" />}>
            <div className="space-y-2 text-sm">
              <p className="rounded-lg border p-3">- Review upcoming preventative maintenance for this truck.</p>
              <p className="rounded-lg border p-3">- Confirm parts availability for the next service interval.</p>
              <p className="rounded-lg border p-3">- Capture photo or documentation evidence if applicable.</p>
            </div>
          </DetailSectionCard>
        </div>
      </div>

      <DetailSectionCard title="Activity History" description="Audit trail for this maintenance record" icon={<FileText className="h-5 w-5" />}>
        {activityLogs && activityLogs.length > 0 ? <ActivityLogTable logs={activityLogs} /> : <p className="py-8 text-center text-sm text-muted-foreground">No activity recorded for this maintenance item yet.</p>}
      </DetailSectionCard>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Maintenance Record" description="Are you sure you want to delete this maintenance record? This action cannot be undone." itemName={`${maintenance.maintenanceType?.name || 'Record'} for ${maintenance.truck?.plate || 'Truck'}`} onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

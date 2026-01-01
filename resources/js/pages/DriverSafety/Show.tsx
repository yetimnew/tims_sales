import { Link, router } from '@inertiajs/react';
import { ArrowLeft, AlertTriangle, Shield, ShieldAlert, MapPin, CalendarDays, DollarSign, FileText, SquarePen, Trash2, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo, useRef, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface Driver {
  id: number;
  name: string;
}

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
  properties?: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
    [key: string]: unknown;
  } | null;
}

interface SafetyRecord {
  id: number;
  driver_id: number;
  driver?: Driver;
  incident_date: string;
  incident_type: string;
  severity: string;
  description: string;
  damage_cost?: number | string | null;
  location?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
}

interface DriverSafetyShowProps {
  driverSafety: SafetyRecord;
  activityLogs?: ActivityLog[];
}

const formatDate = (value?: string | null) => {
  if (!value) return 'Not recorded';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not recorded';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'ETB 0.00';
  const numeric = typeof value === 'string' ? Number.parseFloat(value) : value;
  if (Number.isNaN(numeric) || !Number.isFinite(numeric)) return 'ETB 0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'ETB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
};

const getSeverityBadgeClass = (severity: string) => {
  const normalized = severity.toLowerCase();
  if (normalized === 'critical') return 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300';
  if (normalized === 'major') return 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300';
  if (normalized === 'minor') return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300';
};

const getIncidentTypeBadgeClass = (incidentType: string) => {
  const normalized = incidentType.toLowerCase();
  if (normalized === 'accident') return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300';
  if (normalized === 'violation') return 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300';
  if (normalized === 'warning') return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300';
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300';
};

export default function DriverSafetyShow({ driverSafety, activityLogs = [] }: DriverSafetyShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Driver Safety', href: '/driver-safety' },
    { title: `Incident #${driverSafety.id}`, href: `/driver-safety/${driverSafety.id}` },
  ];
  const { hasPermission } = usePermissions();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const lastDeleteToast = useRef<string | null>(null);

  const severityLabel = driverSafety.severity ? driverSafety.severity.charAt(0).toUpperCase() + driverSafety.severity.slice(1) : 'Unknown';
  const incidentLabel = driverSafety.incident_type ? driverSafety.incident_type.charAt(0).toUpperCase() + driverSafety.incident_type.slice(1) : 'Unknown';

  const activityLogRows = useMemo(
    () =>
      (activityLogs ?? []).map(log => ({
        id: log.id,
        action: log.event ?? 'updated',
        description: log.description,
        user: {
          name: log.causer?.name ?? 'System',
        },
        created_at: log.created_at,
        old_values: log.properties?.old,
        new_values: log.properties?.attributes,
      })),
    [activityLogs],
  );

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Incident Date', value: formatDate(driverSafety.incident_date), helper: 'When it occurred' },
    { label: 'Severity', value: severityLabel, helper: 'Impact level', valueClassName: driverSafety.severity === 'critical' ? 'text-red-600' : driverSafety.severity === 'major' ? 'text-orange-600' : 'text-amber-600' },
    { label: 'Damage Cost', value: formatCurrency(driverSafety.damage_cost), helper: 'Financial impact' },
    { label: 'Driver', value: driverSafety.driver?.name || 'Unknown', helper: 'Involved party' },
  ];

  const handleDelete = () => {
    lastDeleteToast.current = null;
    setIsDeleting(true);
    router.delete(`/driver-safety/${driverSafety.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Safety Record Deleted',
          description: 'The driver safety record was removed successfully.',
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const description =
          errors && typeof errors === 'object'
            ? Object.values(errors as Record<string, unknown>)
                .flatMap(value => (Array.isArray(value) ? value : [value]))
                .filter((value): value is string => typeof value === 'string')
                .join('\n')
            : 'Unable to delete this safety record. Please review any blockers and try again.';

        if (lastDeleteToast.current !== description) {
          toast({
            title: '❌ Delete Failed',
            description,
            variant: 'destructive',
          });
          lastDeleteToast.current = description;
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={`Safety Incident #${driverSafety.id}`}
      subtitle={`Driver: ${driverSafety.driver?.name || 'Unknown'}`}
      breadcrumbs={breadcrumbs}
      headTitle={`Driver Safety Incident #${driverSafety.id}`}
      icon={<ShieldAlert className="h-6 w-6 text-red-700 dark:text-red-300" />}
      iconWrapperClassName="bg-red-100 dark:bg-red-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/driver-safety')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <>
          <Badge className={`border ${getSeverityBadgeClass(driverSafety.severity)}`}>{severityLabel}</Badge>
          <Badge className={`border ${getIncidentTypeBadgeClass(driverSafety.incident_type)}`}>{incidentLabel}</Badge>
          {(hasPermission('driver-safety.edit') || hasPermission('driver-safety.destroy')) && (
            <div className="flex gap-2">
              {hasPermission('driver-safety.edit') && (
                <Button variant="outline" asChild>
                  <Link href={`/driver-safety/${driverSafety.id}/edit`}>
                    <SquarePen className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('driver-safety.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,1fr]">
        <DetailSectionCard title="Incident Details" description="Description and circumstances" icon={<AlertTriangle className="h-5 w-5" />}>
          <div className="space-y-4">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
              <p className="mt-2 whitespace-pre-wrap text-sm">{driverSafety.description}</p>
            </div>
            {driverSafety.location && (
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Location</p>
                <p className="mt-2 text-sm">{driverSafety.location}</p>
              </div>
            )}
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Incident Date</p>
              <p className="mt-2 text-sm font-semibold">{formatDate(driverSafety.incident_date)}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Damage Cost</p>
              <p className="mt-2 text-sm font-semibold">{formatCurrency(driverSafety.damage_cost)}</p>
            </div>
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Resolution" description="Actions taken and outcome" icon={<Shield className="h-5 w-5" />}>
          {driverSafety.resolution ? (
            <div className="rounded-lg border p-4">
              <p className="whitespace-pre-wrap text-sm">{driverSafety.resolution}</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No resolution details recorded yet.</p>
          )}
        </DetailSectionCard>
      </div>

      {activityLogRows.length > 0 && (
        <DetailSectionCard title="Activity History" description="Auditable timeline" icon={<Activity className="h-5 w-5" />}>
          <ActivityLogTable logs={activityLogRows} />
        </DetailSectionCard>
      )}

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Safety Record" description="Are you sure you want to delete this safety record? This action cannot be undone." itemName={`Incident #${driverSafety.id}`} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

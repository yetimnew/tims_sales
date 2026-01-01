import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { usePermissions } from '@/hooks/use-permissions';
import { toast } from '@/hooks/use-toast';
import { ArrowLeft, BarChart3, Building2, CircleDot, DollarSign, Edit, Mail, MapPin, Phone, Route, Trash2, UserRound, Activity } from 'lucide-react';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

interface OutsourceResource {
  id: number;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  service_type: string | null;
  status: string | null;
  outsource_performances_count: number | null;
  created_at: string | null;
  updated_at: string | null;
}

interface OutsourceMetrics {
  totalTrips: number;
  activeTrips: number;
  totalDistance: number;
  totalCost: number;
}

interface RecentPerformance {
  id: number;
  trip_number: string | null;
  dispatch_date: string | null;
  status: string | null;
  distance_km: number | null;
  cargo_volume_mt: number | null;
  cost: number | null;
  from_place: string | null;
  to_place: string | null;
}

interface OutsourcesShowProps {
  outsource: OutsourceResource;
  metrics: OutsourceMetrics;
  recentPerformances: RecentPerformance[];
}

const formatCurrency = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
};

const formatDistance = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} km`;
};

const formatVolume = (value: number | null | undefined) => {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 1 })} MT`;
};

const formatDate = (value: string | null | undefined) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatStatus = (status: string | null | undefined) => {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .toLowerCase()
    .split(' ')
    .map(chunk => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(' ');
};

const getStatusBadgeClasses = (status: string | null | undefined) => {
  switch (status) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    case 'inactive':
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300';
  }
};

const getTripStatusClasses = (status: string | null | undefined) => {
  switch (status) {
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300';
    case 'active':
    case 'in-progress':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300';
    case 'cancelled':
    case 'cancelled_by_vendor':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300';
    default:
      return 'bg-slate-200 text-slate-700 dark:bg-slate-800/50 dark:text-slate-300';
  }
};

export default function OutsourcesShow({ outsource, metrics, recentPerformances }: OutsourcesShowProps) {
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Outsourcing', href: '/outsources' }, { title: outsource.name || `Vendor ${outsource.id}`, href: `/outsources/${outsource.id}` }], [outsource.id, outsource.name]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { hasPermission } = usePermissions();

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Total Trips', value: metrics.totalTrips, helper: 'Cumulative trips executed' },
    { label: 'Active Trips', value: metrics.activeTrips, helper: 'Currently in progress' },
    { label: 'Distance Covered', value: formatDistance(metrics.totalDistance), helper: 'Kilometers logged' },
    { label: 'Total Spend', value: formatCurrency(metrics.totalCost), helper: 'Aggregate cost allocation' },
  ];

  const canUpdate = hasPermission('outsources.update');
  const canDelete = hasPermission('outsources.destroy');

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/outsources/${outsource.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: '✅ Vendor Deleted',
          description: `${outsource.name} has been removed successfully.`,
        });
      },
      onError: errors => {
        setIsDeleting(false);
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'An unexpected error occurred while deleting the vendor.';
        toast({
          title: '❌ Delete Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      },
    });
  };

  return (
    <DetailPageLayout
      title={outsource.name}
      subtitle="Vendor dossier & performance insight"
      breadcrumbs={breadcrumbs}
      headTitle={`Vendor Overview - ${outsource.name}`}
      icon={<Building2 className="h-6 w-6 text-emerald-700 dark:text-emerald-300" />}
      iconWrapperClassName="bg-emerald-100 dark:bg-emerald-900/30"
      leading={
        <Button variant="ghost" size="sm" asChild>
          <Link href="/outsources">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Vendors
          </Link>
        </Button>
      }
      actions={
        <>
          <Badge className={`${getStatusBadgeClasses(outsource.status)} capitalize`}>{formatStatus(outsource.status)}</Badge>
          {outsource.service_type && (
            <Badge variant="outline" className="border-emerald-400/50 bg-emerald-400/10 text-emerald-700 dark:border-emerald-400/30 dark:text-emerald-300">
              {outsource.service_type}
            </Badge>
          )}
          <Badge variant="outline">{outsource.outsource_performances_count ?? 0} recorded trips</Badge>
          <div className="flex gap-2">
            {canUpdate && (
              <Button variant="outline" asChild>
                <Link href={`/outsources/${outsource.id}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {canDelete && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <DetailSectionCard title="Recent Performance" description="Dispatch history snapshot - the five most recent assignments" icon={<BarChart3 className="h-5 w-5" />}>
          {recentPerformances.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-10 text-center">
              <CircleDot className="mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-base font-medium">No dispatches logged yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Once operations are recorded, they'll appear here for rapid assessment.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs uppercase">
                    <TableHead>Trip #</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    <TableHead className="text-right">Distance</TableHead>
                    <TableHead className="text-right">Cargo</TableHead>
                    <TableHead className="text-right">Cost</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPerformances.map(performance => (
                    <TableRow key={performance.id}>
                      <TableCell className="font-medium">{performance.trip_number ?? '—'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium">
                            {performance.from_place ?? '—'}
                            <span className="mx-1 text-muted-foreground">→</span>
                            {performance.to_place ?? '—'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(performance.dispatch_date)}</TableCell>
                      <TableCell className="text-right">{formatDistance(performance.distance_km)}</TableCell>
                      <TableCell className="text-right">{formatVolume(performance.cargo_volume_mt)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(performance.cost)}</TableCell>
                      <TableCell className="text-right">
                        <Badge className={`${getTripStatusClasses(performance.status)} capitalize`}>{formatStatus(performance.status)}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DetailSectionCard>

        <div className="space-y-6">
          <DetailSectionCard title="Contact Information" description="Coordination details for smooth dispatch communication" icon={<UserRound className="h-4 w-4" />}>
            <div className="space-y-4 text-sm">
              <div className="rounded-lg border p-3">
                <p className="text-xs uppercase text-muted-foreground">Primary Contact</p>
                <p className="mt-2 text-base font-semibold">{outsource.contact_person ?? '—'}</p>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Phone className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Phone</p>
                  <p className="text-sm">{outsource.phone ?? 'No phone on record'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <Mail className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Email</p>
                  <p className="break-all text-sm">{outsource.email ?? 'No email on record'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border p-3">
                <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-xs font-semibold uppercase text-muted-foreground">Dispatch Hub</p>
                  <p className="text-sm">{outsource.address ?? 'No address provided'}</p>
                </div>
              </div>
            </div>
          </DetailSectionCard>

          <DetailSectionCard title="Record Timeline" description="Audit checkpoints" icon={<Activity className="h-4 w-4" />}>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span className="font-semibold">{formatDate(outsource.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-semibold">{formatDate(outsource.updated_at)}</span>
              </div>
            </div>
          </DetailSectionCard>
        </div>
      </div>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete vendor?" description="This will permanently remove the vendor profile. Linked dispatch history will remain for auditing purposes." onConfirm={handleDeleteConfirm} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

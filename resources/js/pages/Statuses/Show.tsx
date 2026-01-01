import { Link, router } from '@inertiajs/react';
import { ArrowLeft, SquarePen, Trash2, Tag, ScrollText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import { useState } from 'react';
import { type BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';

interface StatusType {
  id: number;
  name: string;
}

interface Status {
  id: number;
  name: string;
  status_type_id: number;
  statusType: StatusType;
  description: string;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: number;
  log_name: string;
  description: string;
  subject_type: string;
  subject_id: number;
  causer_type: string;
  causer_id: number;
  properties: Record<string, any>;
  created_at: string;
}

interface StatusesShowProps {
  status: Status;
  activityLogs: ActivityLog[];
}

export default function StatusesShow({ status, activityLogs }: StatusesShowProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Statuses', href: '/statuses' },
    { title: status.name, href: `/statuses/${status.id}` },
  ];

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    router.delete(`/statuses/${deleteConfirmation.id}`, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Status deleted successfully', variant: 'success' });
        setDeleteConfirmation(null);
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete status', variant: 'destructive' });
      },
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusTypeBadgeColor = (typeName: string) => {
    switch (typeName.toLowerCase()) {
      case 'truck':
        return 'bg-blue-500 text-white';
      case 'driver':
        return 'bg-green-500 text-white';
      case 'maintenance':
        return 'bg-orange-500 text-white';
      case 'operation':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  return (
    <DetailPageLayout
      title={status.name}
      subtitle={status.description || 'Status identifier for operational state tracking.'}
      breadcrumbs={breadcrumbs}
      headTitle={`Status: ${status.name}`}
      icon={<Tag className="h-6 w-6" />}
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/statuses">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {hasPermission('statuses.edit') && (
            <Button variant="outline" asChild>
              <Link href={`/statuses/${status.id}/edit`}>
                <SquarePen className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
          )}
          {hasPermission('statuses.destroy') && (
            <Button variant="outline" onClick={() => setDeleteConfirmation({ id: status.id, name: status.name })} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <DetailSectionCard title="Basic Information" description="Core status details and type classification" icon={<Tag className="h-5 w-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Name</p>
              <p className="mt-2 text-base font-semibold">{status.name}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status ID</p>
              <Badge variant="outline" className="mt-2">
                #{status.id}
              </Badge>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status Type</p>
              <Link href={`/status-types/${status.statusType.id}`}>
                <Badge className={`mt-2 ${getStatusTypeBadgeColor(status.statusType.name)}`}>{status.statusType.name}</Badge>
              </Link>
            </div>
            {status.description && (
              <div className="rounded-lg border p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                <p className="mt-2 text-sm">{status.description}</p>
              </div>
            )}
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Record Information" description="System tracking" icon={<ScrollText className="h-5 w-5" />}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-semibold">{formatDate(status.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-semibold">{formatDate(status.updated_at)}</span>
            </div>
          </div>
        </DetailSectionCard>
      </div>

      <DetailSectionCard title="Activity Log" description="Auditable timeline" icon={<ScrollText className="h-5 w-5" />}>
        <ActivityLogTable activityLogs={activityLogs} />
      </DetailSectionCard>

      <DeleteConfirmationDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)} onConfirm={confirmDelete} itemName={deleteConfirmation?.name} title="Delete Status" description="Are you sure you want to delete this status?" />
    </DetailPageLayout>
  );
}

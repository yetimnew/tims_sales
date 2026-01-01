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

interface StatusTypesShowProps {
  statusType: StatusType;
  activityLogs: ActivityLog[];
}

export default function StatusTypesShow({ statusType, activityLogs }: StatusTypesShowProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: number; name: string } | null>(null);
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Status Types', href: '/status-types' },
    { title: statusType.name, href: `/status-types/${statusType.id}` },
  ];

  const confirmDelete = () => {
    if (!deleteConfirmation) return;
    router.delete(`/status-types/${deleteConfirmation.id}`, {
      onSuccess: () => {
        toast({ title: 'Success', description: 'Status type deleted successfully', variant: 'success' });
        setDeleteConfirmation(null);
      },
      onError: () => {
        toast({ title: 'Error', description: 'Failed to delete status type', variant: 'destructive' });
      },
    });
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <DetailPageLayout
      title={statusType.name}
      subtitle={statusType.description || 'Status type classification for operational tracking.'}
      breadcrumbs={breadcrumbs}
      headTitle={`Status Type: ${statusType.name}`}
      icon={<Tag className="h-6 w-6" />}
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/status-types">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Link>
        </Button>
      }
      actions={
        <div className="flex gap-2">
          {hasPermission('status-types.edit') && (
            <Button variant="outline" asChild>
              <Link href={`/status-types/${statusType.id}/edit`}>
                <SquarePen className="h-4 w-4 mr-2" /> Edit
              </Link>
            </Button>
          )}
          {hasPermission('status-types.destroy') && (
            <Button variant="outline" onClick={() => setDeleteConfirmation({ id: statusType.id, name: statusType.name })} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" /> Delete
            </Button>
          )}
        </div>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <DetailSectionCard title="Basic Information" description="Core status type details" icon={<Tag className="h-5 w-5" />}>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Name</p>
              <p className="mt-2 text-base font-semibold">{statusType.name}</p>
            </div>
            <div className="rounded-lg border p-4">
              <p className="text-xs font-semibold uppercase text-muted-foreground">Status Type ID</p>
              <Badge variant="outline" className="mt-2">
                #{statusType.id}
              </Badge>
            </div>
            {statusType.description && (
              <div className="rounded-lg border p-4 md:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted-foreground">Description</p>
                <p className="mt-2 text-sm">{statusType.description}</p>
              </div>
            )}
          </div>
        </DetailSectionCard>

        <DetailSectionCard title="Record Information" description="System tracking" icon={<ScrollText className="h-5 w-5" />}>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="font-semibold">{formatDate(statusType.created_at)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated</span>
              <span className="font-semibold">{formatDate(statusType.updated_at)}</span>
            </div>
          </div>
        </DetailSectionCard>
      </div>

      <DetailSectionCard title="Activity Log" description="Auditable timeline" icon={<ScrollText className="h-5 w-5" />}>
        <ActivityLogTable activityLogs={activityLogs} />
      </DetailSectionCard>

      <DeleteConfirmationDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)} onConfirm={confirmDelete} itemName={deleteConfirmation?.name} title="Delete Status Type" description="Are you sure you want to delete this status type?" />
    </DetailPageLayout>
  );
}

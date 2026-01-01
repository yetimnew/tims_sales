import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Boxes, SlidersHorizontal, ShieldCheck, Package, ClipboardCheck, Activity, SquarePen, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem } from '@/types';
import { usePermissions } from '@/hooks/use-permissions';
import { useMemo, useRef, useState } from 'react';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';

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
  properties?: Record<string, any>;
}

interface CargoType {
  id: number;
  name: string;
  category: string;
  weight_per_cubic_meter?: number;
  handling_requirements?: string;
  safety_requirements?: string;
  requires_special_equipment: boolean;
  created_at: string;
  updated_at: string;
}

interface CargoTypesShowProps {
  cargoType: CargoType;
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

const formatWeight = (value?: number | null) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return 'Not provided';
  return `${value.toLocaleString(undefined, {
    minimumFractionDigits: value % 1 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  })} kg / m³`;
};

const getCategoryBadgeClasses = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('construct')) return 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-200';
  if (normalized.includes('agri')) return 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/30 dark:text-emerald-300';
  if (normalized.includes('industrial')) return 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-300';
  return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300';
};

export default function CargoTypesShow({ cargoType, activityLogs = [] }: CargoTypesShowProps) {
  const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Cargo Types', href: '/cargo-types' },
    { title: cargoType.name, href: `/cargo-types/${cargoType.id}` },
  ];
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const lastDeleteError = useRef<string | null>(null);

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
        old_values: (log.properties?.old as Record<string, unknown>) ?? undefined,
        new_values: (log.properties?.attributes as Record<string, unknown>) ?? undefined,
      })),
    [activityLogs],
  );

  const handleDelete = () => {
    setIsDeleting(true);
    setDeleteError(null);
    lastDeleteError.current = null;

    router.delete(`/cargo-types/${cargoType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        setDeleteError(null);
        lastDeleteError.current = null;
      },
      onError: errors => {
        setIsDeleting(false);
        const description =
          errors && typeof errors === 'object'
            ? Object.values(errors as Record<string, unknown>)
                .flatMap(value => (Array.isArray(value) ? value : [value]))
                .filter((value): value is string => typeof value === 'string')
                .join('\n')
            : 'Unable to delete this cargo type. Please review any blockers and try again.';

        if (lastDeleteError.current !== description) {
          setDeleteError(description);
          lastDeleteError.current = description;
        }
      },
    });
  };

  const handleDialogChange = (open: boolean) => {
    setDeleteDialogOpen(open);
    if (!open) {
      setDeleteError(null);
      lastDeleteError.current = null;
    }
  };

  const weightDisplay = formatWeight(cargoType.weight_per_cubic_meter);

  const kpiSummary: DetailSummaryItem[] = [
    { label: 'Category', value: cargoType.category, helper: 'Cargo classification' },
    { label: 'Weight Density', value: weightDisplay, helper: 'Per cubic meter' },
    {
      label: 'Special Equipment',
      value: cargoType.requires_special_equipment ? 'Required' : 'Standard',
      helper: cargoType.requires_special_equipment ? 'Handling equipment needed' : 'Standard handling',
    },
    { label: 'Last Updated', value: formatDate(cargoType.updated_at), helper: 'Most recent change' },
  ];

  return (
    <DetailPageLayout
      title={cargoType.name}
      subtitle="Comprehensive profile for this cargo classification."
      breadcrumbs={breadcrumbs}
      headTitle={`Cargo Type: ${cargoType.name}`}
      icon={<Package className="h-6 w-6 text-rose-700 dark:text-rose-300" />}
      iconWrapperClassName="bg-rose-100 dark:bg-rose-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/cargo-types')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      }
      actions={
        <>
          <Badge className={`border ${getCategoryBadgeClasses(cargoType.category)}`}>{cargoType.category}</Badge>
          {(hasPermission('cargotypes.edit') || hasPermission('cargotypes.destroy')) && (
            <div className="flex gap-2">
              {hasPermission('cargotypes.edit') && (
                <Button variant="outline" asChild>
                  <Link href={`/cargo-types/${cargoType.id}/edit`}>
                    <SquarePen className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('cargotypes.destroy') && (
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

      <DetailSectionCard title="Operational Guidance" description="Handling insight and safety protocols" icon={<ClipboardCheck className="h-5 w-5" />}>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">Handling Requirements</h3>
            <p className="whitespace-pre-wrap rounded-lg border p-4 text-sm">{cargoType.handling_requirements || 'No special handling instructions documented.'}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">Safety Requirements</h3>
            <p className="whitespace-pre-wrap rounded-lg border p-4 text-sm">{cargoType.safety_requirements || 'No safety guidance has been provided for this cargo type yet.'}</p>
          </div>
        </div>
      </DetailSectionCard>

      {activityLogRows.length > 0 && (
        <DetailSectionCard title="Activity Log" description="Recent actions and updates" icon={<Activity className="h-5 w-5" />}>
          <ActivityLogTable logs={activityLogRows} />
        </DetailSectionCard>
      )}

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={handleDialogChange} title="Delete Cargo Type" description={`Are you sure you want to delete "${cargoType.name}"? This action cannot be undone.`} itemName={cargoType.name} onConfirm={handleDelete} isLoading={isDeleting} errorMessage={deleteError} />
    </DetailPageLayout>
  );
}

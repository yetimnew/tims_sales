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
import { useTranslation } from 'react-i18next';

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

const formatDate = (value: string | null | undefined, fallback: string, locale: string) => {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatWeight = (value: number | null | undefined, fallback: string) => {
  if (typeof value !== 'number' || Number.isNaN(value) || value <= 0) return fallback;
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
  const { t, i18n } = useTranslation();
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('cargoTypes.breadcrumb'), href: '/cargo-types' },
      { title: cargoType.name, href: `/cargo-types/${cargoType.id}` },
    ],
    [cargoType.id, cargoType.name, t],
  );
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
          name: log.causer?.name ?? t('cargoTypes.show.systemUser'),
        },
        created_at: log.created_at,
        old_values: (log.properties?.old as Record<string, unknown>) ?? undefined,
        new_values: (log.properties?.attributes as Record<string, unknown>) ?? undefined,
      })),
    [activityLogs, t],
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
            : t('cargoTypes.delete.failedDescription');

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

  const weightDisplay = formatWeight(cargoType.weight_per_cubic_meter, t('cargoTypes.show.weightNotProvided'));
  const notRecordedLabel = t('cargoTypes.show.notRecorded');

  const kpiSummary = useMemo<DetailSummaryItem[]>(
    () => [
      { label: t('cargoTypes.show.summary.category'), value: cargoType.category, helper: t('cargoTypes.show.summary.categoryHelper') },
      { label: t('cargoTypes.show.summary.weightDensity'), value: weightDisplay, helper: t('cargoTypes.show.summary.weightDensityHelper') },
      {
        label: t('cargoTypes.show.summary.specialEquipment'),
        value: cargoType.requires_special_equipment ? t('cargoTypes.show.summary.required') : t('cargoTypes.show.summary.standard'),
        helper: cargoType.requires_special_equipment ? t('cargoTypes.show.summary.requiredHelper') : t('cargoTypes.show.summary.standardHelper'),
      },
      { label: t('cargoTypes.show.summary.updated'), value: formatDate(cargoType.updated_at, notRecordedLabel, i18n.language), helper: t('cargoTypes.show.summary.updatedHelper') },
    ],
    [cargoType.category, cargoType.requires_special_equipment, cargoType.updated_at, i18n.language, notRecordedLabel, t, weightDisplay],
  );

  return (
    <DetailPageLayout
      title={cargoType.name}
      subtitle={t('cargoTypes.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={t('cargoTypes.show.headTitle', { name: cargoType.name })}
      icon={<Package className="h-6 w-6 text-rose-700 dark:text-rose-300" />}
      iconWrapperClassName="bg-rose-100 dark:bg-rose-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/cargo-types')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('cargoTypes.actions.back')}
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
                    {t('cargoTypes.actions.edit')}
                  </Link>
                </Button>
              )}
              {hasPermission('cargotypes.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('cargoTypes.actions.delete')}
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <DetailSectionCard title={t('cargoTypes.show.sections.guidance.title')} description={t('cargoTypes.show.sections.guidance.description')} icon={<ClipboardCheck className="h-5 w-5" />}>
        <div className="space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('cargoTypes.show.sections.guidance.handlingTitle')}</h3>
            <p className="whitespace-pre-wrap rounded-lg border p-4 text-sm">{cargoType.handling_requirements || t('cargoTypes.show.sections.guidance.handlingEmpty')}</p>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-semibold">{t('cargoTypes.show.sections.guidance.safetyTitle')}</h3>
            <p className="whitespace-pre-wrap rounded-lg border p-4 text-sm">{cargoType.safety_requirements || t('cargoTypes.show.sections.guidance.safetyEmpty')}</p>
          </div>
        </div>
      </DetailSectionCard>

      {activityLogRows.length > 0 && (
        <DetailSectionCard title={t('cargoTypes.show.sections.activity.title')} description={t('cargoTypes.show.sections.activity.description')} icon={<Activity className="h-5 w-5" />}>
          <ActivityLogTable logs={activityLogRows} />
        </DetailSectionCard>
      )}

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={handleDialogChange}
        title={t('cargoTypes.delete.title')}
        description={t('cargoTypes.delete.descriptionWithName', { name: cargoType.name })}
        itemName={cargoType.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        errorMessage={deleteError}
      />
    </DetailPageLayout>
  );
}

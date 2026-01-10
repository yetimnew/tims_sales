import { Link, router } from '@inertiajs/react';
import { Settings, Edit, Trash2, Truck, ArrowLeft, Activity } from 'lucide-react';
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
import { useTranslation } from 'react-i18next';

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

function formatDate(date?: string | null, fallback = 'Not available'): string {
  if (!date) return fallback;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return fallback;
  return parsedDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export default function VehicleTypesShow({ vehicleType, activityLogs = [] }: VehicleTypesShowProps) {
  const { t } = useTranslation();
  const breadcrumbs: BreadcrumbItem[] = [
    { title: t('vehicleTypes.breadcrumb'), href: '/vehicletypes' },
    { title: vehicleType.name, href: `/vehicletypes/${vehicleType.id}` },
  ];
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const trucksRaw = Array.isArray(vehicleType.trucks) ? vehicleType.trucks : vehicleType.trucks?.data;
  const trucks: VehicleTypeTruck[] = Array.isArray(trucksRaw) ? trucksRaw : [];
  const notAvailableLabel = t('vehicleTypes.fallbacks.notAvailable');

  const overviewSummaryItems = useMemo(
    () => [
      {
        key: 'associated-trucks',
        label: t('vehicleTypes.show.summary.associatedTrucks'),
        value: numberFormatter.format(trucks.length),
        helper:
          trucks.length === 1
            ? t('vehicleTypes.show.summary.singleTruck')
            : t('vehicleTypes.show.summary.multipleTrucks'),
      },
      {
        key: 'created',
        label: t('vehicleTypes.show.summary.created'),
        value: formatDate(vehicleType.created_at, notAvailableLabel),
        helper: t('vehicleTypes.show.summary.createdHelper'),
      },
      {
        key: 'updated',
        label: t('vehicleTypes.show.summary.updated'),
        value: formatDate(vehicleType.updated_at, notAvailableLabel),
        helper: t('vehicleTypes.show.summary.updatedHelper'),
      },
    ],
    [notAvailableLabel, t, trucks.length, vehicleType.created_at, vehicleType.updated_at],
  );

  const handleDeleteConfirm = () => {
    setIsDeleting(true);
    router.delete(`/vehicletypes/${vehicleType.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setIsDeleting(false);
        toast({
          title: t('vehicleTypes.delete.successTitle'),
          description: t('vehicleTypes.delete.successDescription', { name: vehicleType.name }),
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
            title: t('vehicleTypes.delete.failedTitle'),
            description: errorMessages || t('vehicleTypes.delete.failedDescription'),
            variant: 'destructive',
          });
        } else {
          toast({
            title: t('vehicleTypes.delete.failedTitle'),
            description: t('vehicleTypes.delete.failedDescriptionUnknown'),
            variant: 'destructive',
          });
        }
      },
    });
  };

  return (
    <DetailPageLayout
      title={vehicleType.name}
      subtitle={vehicleType.description || t('vehicleTypes.show.subtitle')}
      breadcrumbs={breadcrumbs}
      headTitle={vehicleType.name}
      icon={<Truck className="h-6 w-6 text-indigo-700 dark:text-indigo-300" />}
      iconWrapperClassName="bg-indigo-100 dark:bg-indigo-900/30"
      leading={
        <Button variant="outline" size="sm" asChild>
          <Link href="/vehicletypes">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('vehicleTypes.show.actions.back')}
          </Link>
        </Button>
      }
      actions={
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/vehicletypes/${vehicleType.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              {t('vehicleTypes.actions.edit')}
            </Link>
          </Button>
          <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
            <Trash2 className="h-4 w-4 mr-2" />
            {t('vehicleTypes.actions.delete')}
          </Button>
        </div>
      }
    >
      <DetailSummaryGrid items={overviewSummaryItems} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard
            title={t('vehicleTypes.show.sections.associatedTrucks.title')}
            description={t('vehicleTypes.show.sections.associatedTrucks.description', { count: trucks.length })}
            icon={<Truck className="h-5 w-5" />}
          >
            {trucks.length > 0 ? (
              <div className="space-y-2">
                {trucks.map(truck => (
                  <Link key={truck.id} href={`/trucks/${truck.id}`} className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted">
                    <div className="flex items-center gap-3">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="font-semibold">{truck.plate}</p>
                        {truck.created_at && (
                          <p className="text-xs text-muted-foreground">
                            {t('vehicleTypes.show.sections.associatedTrucks.addedOn', { value: formatDate(truck.created_at, notAvailableLabel) })}
                          </p>
                        )}
                      </div>
                    </div>
                    {truck.status && (
                      <Badge variant={truck.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                        {t(`trucks.status.${truck.status}`, { defaultValue: truck.status })}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('vehicleTypes.show.sections.associatedTrucks.empty')}</p>
            )}
          </DetailSectionCard>

          {activityLogs.length > 0 && (
            <DetailSectionCard
              title={t('vehicleTypes.show.sections.activity.title')}
              description={t('vehicleTypes.show.sections.activity.description')}
              icon={<Activity className="h-5 w-5" />}
            >
              <ActivityLogTable logs={activityLogs} />
            </DetailSectionCard>
          )}
        </div>

        <div className="space-y-6">
          <DetailSectionCard
            title={t('vehicleTypes.show.sections.quickInfo.title')}
            description={t('vehicleTypes.show.sections.quickInfo.description')}
            icon={<Settings className="h-5 w-5" />}
            className="lg:col-span-1"
          >
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('vehicleTypes.show.fields.id')}</span>
                <span className="font-semibold">#{vehicleType.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t('vehicleTypes.show.fields.totalTrucks')}</span>
                <span className="font-semibold">{trucks.length}</span>
              </div>
            </div>
          </DetailSectionCard>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('vehicleTypes.delete.title')}
        description={t('vehicleTypes.delete.descriptionWithName', { name: vehicleType.name })}
        itemName={vehicleType.name}
        onConfirm={handleDeleteConfirm}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

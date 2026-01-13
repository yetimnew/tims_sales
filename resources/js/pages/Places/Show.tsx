import { useCallback, useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPin, ThermometerSun, Warehouse, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
import type { BreadcrumbItem } from '@/types';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface Woreda {
  id: number;
  name: string;
  zone: {
    id: number;
    name: string;
    region: {
      id: number;
      name: string;
    };
  };
}

interface Place {
  id: number;
  name: string;
  status: 'active' | 'inactive';
  code?: string | null;
  woreda_id: number;
  woreda: Woreda;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  population?: number | string | null;
  is_logistics_hub?: boolean | null;
  accessibility_score?: number | string | null;
  description?: string | null;
  infrastructure_notes?: string | null;
  road_quality_notes?: string | null;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: number;
  description: string;
  created_at: string;
  event?: 'created' | 'updated' | 'deleted';
  causer?: { id: number; name: string } | null;
  properties?: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  } | null;
}

interface PlacesShowProps {
  place: Place;
  activityLogs: ActivityLog[];
}

const getStatusBadgeStyles = (status: string) => (status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200');

export default function PlacesShow({ place, activityLogs }: PlacesShowProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('places.show.notAvailable');
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('places.title'), href: '/places' },
      { title: place.name || t('places.show.fallbackTitle', { id: place.id }), href: `/places/${place.id}` },
    ],
    [place.id, place.name, t],
  );

  const formatNumber = useCallback(
    (value?: number | string | null, options?: Intl.NumberFormatOptions) => {
      if (value === null || value === undefined || value === '') return notAvailableLabel;
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return notAvailableLabel;
      return numeric.toLocaleString(locale, {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
        ...options,
      });
    },
    [locale, notAvailableLabel],
  );

  const formatCoordinate = useCallback(
    (value?: number | string | null) => {
      if (value === null || value === undefined || value === '') return notAvailableLabel;
      const numeric = Number(value);
      if (Number.isNaN(numeric)) return notAvailableLabel;
      return `${numeric.toFixed(5)}°`;
    },
    [notAvailableLabel],
  );

  const formatDate = useCallback(
    (value?: string | null) => {
      if (!value) return notAvailableLabel;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return notAvailableLabel;
      return date.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },
    [locale, notAvailableLabel],
  );

  const statusLabel = useMemo(() => {
    const normalized = place.status?.toLowerCase();
    if (normalized === 'active') return t('places.status.active');
    if (normalized === 'inactive') return t('places.status.inactive');
    if (place.status) return place.status;
    return t('places.status.unknown');
  }, [place.status, t]);

  const activityLogRows = useMemo(
    () =>
      activityLogs.map(log => ({
        id: log.id,
        action: log.event ?? 'updated',
        description: log.description,
        user: log.causer ? { name: log.causer.name } : undefined,
        created_at: log.created_at,
        old_values: log.properties?.old ?? undefined,
        new_values: log.properties?.attributes ?? undefined,
      })),
    [activityLogs],
  );

  const kpiSummary: DetailSummaryItem[] = [
    {
      label: t('places.show.kpi.population.label'),
      value: formatNumber(place.population),
      helper: t('places.show.kpi.population.helper'),
    },
    {
      label: t('places.show.kpi.accessibility.label'),
      value: formatNumber(place.accessibility_score),
      helper: t('places.show.kpi.accessibility.helper'),
    },
    {
      label: t('places.show.kpi.elevation.label'),
      value: `${formatNumber(place.elevation_m)} m`,
      helper: t('places.show.kpi.elevation.helper'),
    },
    {
      label: t('places.show.kpi.hubStatus.label'),
      value: place.is_logistics_hub ? t('places.show.kpi.hubStatus.yes') : t('places.show.kpi.hubStatus.no'),
      helper: t('places.show.kpi.hubStatus.helper'),
    },
  ];

  const confirmDelete = () => {
    setIsDeleting(true);
    router.delete(`/places/${place.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: t('places.delete.successTitle'),
          description: t('places.delete.successDescription', { name: place.name }),
        });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage =
          errors && typeof errors === 'object' && 'message' in errors
            ? String(errors.message)
            : t('places.delete.failedDescription');
        toast({
          title: t('places.delete.failedTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
        setIsDeleting(false);
      },
    });
  };

  return (
    <DetailPageLayout
      title={place.name}
      subtitle={place.description || t('places.show.subtitle')}
      breadcrumbs={breadcrumbs}
      icon={<MapPin className="h-6 w-6 text-purple-700 dark:text-purple-300" />}
      iconWrapperClassName="bg-purple-100 dark:bg-purple-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/places')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('places.show.actions.back')}
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={getStatusBadgeStyles(place.status)}>{statusLabel}</Badge>
            {place.is_logistics_hub && (
              <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                <Warehouse className="h-3.5 w-3.5 mr-1" />
                {t('places.show.logisticsHub')}
              </Badge>
            )}
            {place.woreda && (
              <Badge variant="outline">
                {place.woreda.zone.region.name} → {place.woreda.zone.name} → {place.woreda.name}
              </Badge>
            )}
          </div>
          {(hasPermission('places.edit') || hasPermission('places.destroy')) && (
            <div className="flex items-center gap-2">
              {hasPermission('places.edit') && (
                <Button variant="outline" asChild>
                  <Link href={`/places/${place.id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t('places.actions.edit')}
                  </Link>
                </Button>
              )}
              {hasPermission('places.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
                  <Trash2 className="h-4 w-4 mr-2" />
                  {t('places.actions.delete')}
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <DetailSummaryGrid items={kpiSummary} />

      <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
        <div className="space-y-6">
          <DetailSectionCard
            title={t('places.show.sections.overview.title')}
            description={t('places.show.sections.overview.description')}
            icon={<MapPin className="h-5 w-5" />}
          >
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('places.show.fields.code')}</p>
                <p className="mt-2 text-sm font-semibold">{place.code || notAvailableLabel}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('places.show.fields.woreda')}</p>
                <p className="mt-2 text-sm font-semibold">{place.woreda?.name || notAvailableLabel}</p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('places.show.fields.coordinates')}</p>
                <p className="mt-2 text-sm font-semibold">
                  {formatCoordinate(place.latitude)} / {formatCoordinate(place.longitude)}
                </p>
              </div>
              <div className="rounded-lg border p-4">
                <p className="text-xs font-semibold uppercase text-muted-foreground">{t('places.show.fields.elevation')}</p>
                <p className="mt-2 text-sm font-semibold">{formatNumber(place.elevation_m)} m</p>
              </div>
            </div>
          </DetailSectionCard>

          {(place.infrastructure_notes || place.road_quality_notes) && (
            <DetailSectionCard
              title={t('places.show.sections.infrastructure.title')}
              description={t('places.show.sections.infrastructure.description')}
              icon={<ThermometerSun className="h-5 w-5" />}
            >
              {place.infrastructure_notes && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide">{t('places.show.fields.infrastructure')}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{place.infrastructure_notes}</p>
                </div>
              )}
              {place.road_quality_notes && (
                <div className="rounded-lg border p-4">
                  <h3 className="text-xs font-semibold uppercase tracking-wide">{t('places.show.fields.roadQuality')}</h3>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{place.road_quality_notes}</p>
                </div>
              )}
            </DetailSectionCard>
          )}

          {activityLogRows.length > 0 && (
            <DetailSectionCard
              title={t('places.show.sections.history.title')}
              description={t('places.show.sections.history.description')}
              icon={<ShieldCheck className="h-5 w-5" />}
            >
              <ActivityLogTable logs={activityLogRows} />
            </DetailSectionCard>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('places.show.sections.recordInfo.title')}</CardTitle>
              <CardDescription>{t('places.show.sections.recordInfo.description')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center justify-between">
                <span>{t('places.show.fields.created')}</span>
                <span>{formatDate(place.created_at)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>{t('places.show.fields.updated')}</span>
                <span>{formatDate(place.updated_at)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('places.delete.title')}
        description={t('places.delete.description')}
        itemName={place.name}
        onConfirm={confirmDelete}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

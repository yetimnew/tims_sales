import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPinned, Building2, Navigation, ThermometerSun, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import type { BreadcrumbItem } from '@/types';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DetailPageLayout } from '@/components/detail/detail-page-layout';
import { DetailSectionCard } from '@/components/detail/detail-section-card';
import { DetailSummaryGrid, type DetailSummaryItem } from '@/components/detail/detail-summary-grid';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from 'react-i18next';

interface ZoneSummary {
  id: number;
  name: string;
  status?: 'active' | 'inactive';
}

interface PlaceSummary {
  id: number;
  name: string;
  status?: 'active' | 'inactive';
  is_logistics_hub?: boolean;
}

interface Woreda {
  id: number;
  name: string;
  code?: string | null;
  status: 'active' | 'inactive';
  description?: string | null;
  administrative_center?: string | null;
  area_km2?: number | string | null;
  population?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  accessibility_score?: number | string | null;
  infrastructure_notes?: string | null;
  road_quality_notes?: string | null;
  created_at: string;
  updated_at: string;
  zone?: ZoneSummary | null;
  places?: PlaceSummary[];
}

interface ActivityLogEntry {
  id: number;
  description: string;
  created_at: string;
  event?: string | null;
  causer?: { id: number; name: string } | null;
  properties?: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  } | null;
}

interface WoredasShowProps {
  woreda: Woreda;
  activityLogs?: ActivityLogEntry[];
}

const statusBadgeClass = (status: string) => (status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-200');

const resolveActivityAction = (event?: string | null): 'created' | 'updated' | 'deleted' => {
  if (event === 'created' || event === 'updated' || event === 'deleted') {
    return event;
  }
  return 'updated';
};

export default function WoredasShow({ woreda, activityLogs = [] }: WoredasShowProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('woredas.show.notAvailable');
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('woredas.title'), href: '/woredas' },
      { title: woreda.name || t('woredas.show.fallbackTitle', { id: woreda.id }), href: `/woredas/${woreda.id}` },
    ],
    [woreda.id, woreda.name, t],
  );

  const formatNumber = useMemo(
    () =>
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

  const formatCoordinate = useMemo(
    () =>
      (value?: number | string | null) => {
        if (value === null || value === undefined || value === '') return notAvailableLabel;
        const numeric = Number(value);
        if (Number.isNaN(numeric)) return notAvailableLabel;
        return `${numeric.toFixed(5)}°`;
      },
    [notAvailableLabel],
  );

  const formatDate = useMemo(
    () =>
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

  const places = woreda.places ?? [];
  const activityLogRows = useMemo(
    () =>
      activityLogs.map(log => ({
        id: log.id,
        action: resolveActivityAction(log.event),
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
      label: t('woredas.show.kpi.population.label'),
      value: formatNumber(woreda.population),
      helper: t('woredas.show.kpi.population.helper'),
    },
    {
      label: t('woredas.show.kpi.area.label'),
      value: `${formatNumber(woreda.area_km2)} ${t('woredas.show.units.km2')}`,
      helper: t('woredas.show.kpi.area.helper'),
    },
    {
      label: t('woredas.show.kpi.accessibility.label'),
      value: formatNumber(woreda.accessibility_score),
      helper: t('woredas.show.kpi.accessibility.helper'),
    },
    {
      label: t('woredas.show.kpi.places.label'),
      value: places.length,
      helper: t('woredas.show.kpi.places.helper'),
    },
  ];

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/woredas/${woreda.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: t('woredas.delete.successTitle'),
          description: t('woredas.delete.successDescription', { name: woreda.name }),
        });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage =
          errors && typeof errors === 'object' && 'message' in errors
            ? String(errors.message)
            : t('woredas.delete.failedDescription');
        toast({
          title: t('woredas.delete.failedTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
        setIsDeleting(false);
      },
    });
  };

  return (
    <DetailPageLayout
      title={woreda.name}
      subtitle={woreda.description || t('woredas.show.subtitle')}
      breadcrumbs={breadcrumbs}
      icon={<MapPinned className="h-6 w-6 text-teal-700 dark:text-teal-300" />}
      iconWrapperClassName="bg-teal-100 dark:bg-teal-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/woredas')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('woredas.show.actions.back')}
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={statusBadgeClass(woreda.status)}>
              {woreda.status === 'active' ? t('woredas.status.active') : t('woredas.status.inactive')}
            </Badge>
            {woreda.zone && (
              <Badge variant="outline">
                {t('woredas.show.zoneLabel', { name: woreda.zone.name })}
              </Badge>
            )}
            {woreda.administrative_center && (
              <Badge variant="outline">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                {t('woredas.show.adminCenterLabel', { name: woreda.administrative_center })}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/woredas/${woreda.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                {t('woredas.actions.edit')}
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              {t('woredas.actions.delete')}
            </Button>
          </div>
        </>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <MapPinned className="h-4 w-4 mr-2" /> {t('woredas.show.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="places">
            <Navigation className="h-4 w-4 mr-2" /> {t('woredas.show.tabs.places')}
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" /> {t('woredas.show.tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={kpiSummary} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard
                title={t('woredas.show.sections.overview.title')}
                description={t('woredas.show.sections.overview.description')}
                icon={<MapPinned className="h-5 w-5" />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.code')}</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.code || notAvailableLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.administrativeCenter')}</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.administrative_center || notAvailableLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.zone')}</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.zone?.name || notAvailableLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.elevation')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatNumber(woreda.elevation_m)} {t('woredas.show.units.m')}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.coordinates')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinate(woreda.latitude)} / {formatCoordinate(woreda.longitude)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('woredas.show.fields.populationDensity')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {woreda.area_km2 && Number(woreda.area_km2) > 0
                        ? `${formatNumber(Number(woreda.population ?? 0) / Number(woreda.area_km2), {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ${t('woredas.show.units.peoplePerKm2')}`
                        : notAvailableLabel}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {(woreda.infrastructure_notes || woreda.road_quality_notes) && (
                <DetailSectionCard
                  title={t('woredas.show.sections.infrastructure.title')}
                  description={t('woredas.show.sections.infrastructure.description')}
                  icon={<ThermometerSun className="h-5 w-5" />}
                >
                  {woreda.infrastructure_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">{t('woredas.show.fields.infrastructure')}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{woreda.infrastructure_notes}</p>
                    </div>
                  )}
                  {woreda.road_quality_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">{t('woredas.show.fields.roadQuality')}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{woreda.road_quality_notes}</p>
                    </div>
                  )}
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('woredas.show.sections.recordInfo.title')}</CardTitle>
                  <CardDescription>{t('woredas.show.sections.recordInfo.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('woredas.show.fields.created')}</span>
                    <span>{formatDate(woreda.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('woredas.show.fields.updated')}</span>
                    <span>{formatDate(woreda.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="places" className="space-y-6">
          <DetailSectionCard
            title={t('woredas.show.sections.places.title', { name: woreda.name })}
            description={t('woredas.show.sections.places.description')}
            icon={<Navigation className="h-5 w-5" />}
          >
            {places.length > 0 ? (
              <div className="space-y-3">
                {places.map(place => (
                  <div key={place.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{place.name}</p>
                      {place.is_logistics_hub && <Badge className="mt-2 text-xs">{t('woredas.show.places.logisticsHub')}</Badge>}
                    </div>
                    {place.status && (
                      <Badge className={`text-xs ${statusBadgeClass(place.status)}`}>
                        {place.status === 'active' ? t('woredas.status.active') : t('woredas.status.inactive')}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('woredas.show.places.empty')}</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard
            title={t('woredas.show.sections.history.title')}
            description={t('woredas.show.sections.history.description')}
            icon={<BarChart3 className="h-5 w-5" />}
          >
            {activityLogRows.length > 0 ? (
              <ActivityLogTable logs={activityLogRows} />
            ) : (
              <p className="text-sm text-muted-foreground">{t('woredas.show.history.empty')}</p>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('woredas.delete.title')}
        description={t('woredas.delete.description')}
        itemName={woreda.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

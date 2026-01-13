import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPin, Building2, Globe, Layers, BarChart3, ThermometerSun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { ActivityLogTable } from '@/components/activity-log-table';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/use-permissions';
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

interface Region {
  id: number;
  name: string;
  code?: string | null;
  status: 'active' | 'inactive';
  description?: string | null;
  capital?: string | null;
  area_km2?: number | string | null;
  population?: number | string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  elevation_m?: number | string | null;
  accessibility_score?: number | string | null;
  last_surveyed_at?: string | null;
  infrastructure_notes?: string | null;
  climate_profile?: string | null;
  created_at: string;
  updated_at: string;
  zones?: ZoneSummary[];
}

interface ActivityLog {
  id: number;
  description: string;
  created_at: string;
  event?: 'created' | 'updated' | 'deleted';
  causer?: {
    id: number;
    name: string;
  } | null;
  properties?: {
    old?: Record<string, unknown>;
    attributes?: Record<string, unknown>;
  } | null;
}

interface RegionShowProps {
  region: Region;
  activityLogs?: ActivityLog[];
}

const getStatusBadgeStyles = (status: string) =>
  status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200';

export default function RegionsShow({ region, activityLogs = [] }: RegionShowProps) {
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const locale = i18n.language || 'en-US';
  const notAvailableLabel = t('regions.show.notAvailable');
  const breadcrumbs = useMemo<BreadcrumbItem[]>(
    () => [
      { title: t('regions.title'), href: '/regions' },
      { title: region.name || t('regions.show.fallbackTitle', { id: region.id }), href: `/regions/${region.id}` },
    ],
    [region.id, region.name, t],
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

  const zones = region.zones ?? [];
  const activeZones = zones.filter(zone => zone.status === 'active').length;
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
      label: t('regions.show.kpi.population.label'),
      value: formatNumber(region.population),
      helper: t('regions.show.kpi.population.helper'),
    },
    {
      label: t('regions.show.kpi.area.label'),
      value: `${formatNumber(region.area_km2)} ${t('regions.show.units.km2')}`,
      helper: t('regions.show.kpi.area.helper'),
    },
    {
      label: t('regions.show.kpi.accessibility.label'),
      value: formatNumber(region.accessibility_score),
      helper: t('regions.show.kpi.accessibility.helper'),
    },
    {
      label: t('regions.show.kpi.activeZones.label'),
      value: activeZones,
      helper: t('regions.show.kpi.activeZones.helper', { count: zones.length }),
    },
  ];

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/regions/${region.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({
          title: t('regions.delete.successTitle'),
          description: t('regions.delete.successDescription', { name: region.name }),
        });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage =
          errors && typeof errors === 'object' && 'message' in errors
            ? String(errors.message)
            : t('regions.delete.failedDescription');
        toast({
          title: t('regions.delete.failedTitle'),
          description: errorMessage,
          variant: 'destructive',
        });
        setIsDeleting(false);
      },
    });
  };

  return (
    <DetailPageLayout
      title={region.name}
      subtitle={region.description || t('regions.show.subtitle')}
      breadcrumbs={breadcrumbs}
      icon={<Globe className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/regions')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('regions.show.actions.back')}
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-sm font-medium ${getStatusBadgeStyles(region.status)}`}>
              {region.status === 'active' ? t('regions.status.active') : t('regions.status.inactive')}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-3.5 w-3.5" />
              {t('regions.show.zoneCount', { count: zones.length })}
            </Badge>
            {region.capital && (
              <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5" />
                {t('regions.show.capitalLabel', { name: region.capital })}
              </Badge>
            )}
          </div>
          {(hasPermission('regions.edit') || hasPermission('regions.destroy')) && (
            <div className="flex items-center gap-2">
              {hasPermission('regions.edit') && (
                <Button variant="outline" asChild className="gap-2 hover:border-blue-300 hover:bg-blue-50">
                  <Link href={`/regions/${region.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    {t('regions.actions.edit')}
                  </Link>
                </Button>
              )}
              {hasPermission('regions.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30">
                  <Trash2 className="h-4 w-4" />
                  {t('regions.actions.delete')}
                </Button>
              )}
            </div>
          )}
        </>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Globe className="h-4 w-4" /> {t('regions.show.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> {t('regions.show.tabs.zones')}
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> {t('regions.show.tabs.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={kpiSummary} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard
                title={t('regions.show.sections.overview.title')}
                description={t('regions.show.sections.overview.description')}
                icon={<Globe className="h-5 w-5" />}
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.code')}</p>
                    <p className="mt-2 text-sm font-semibold">{region.code || notAvailableLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.capital')}</p>
                    <p className="mt-2 text-sm font-semibold">{region.capital || notAvailableLabel}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.coordinates')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinate(region.latitude)} / {formatCoordinate(region.longitude)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.elevation')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatNumber(region.elevation_m)} {t('regions.show.units.m')}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.lastSurveyed')}</p>
                    <p className="mt-2 text-sm font-semibold">{formatDate(region.last_surveyed_at)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">{t('regions.show.fields.populationDensity')}</p>
                    <p className="mt-2 text-sm font-semibold">
                      {region.area_km2 && Number(region.area_km2) > 0
                        ? `${formatNumber(Number(region.population ?? 0) / Number(region.area_km2), {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} ${t('regions.show.units.peoplePerKm2')}`
                        : notAvailableLabel}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {(region.infrastructure_notes || region.climate_profile) && (
                <DetailSectionCard
                  title={t('regions.show.sections.environment.title')}
                  description={t('regions.show.sections.environment.description')}
                  icon={<ThermometerSun className="h-5 w-5 text-amber-600" />}
                >
                  {region.infrastructure_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">{t('regions.show.fields.infrastructure')}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{region.infrastructure_notes}</p>
                    </div>
                  )}
                  {region.climate_profile && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">{t('regions.show.fields.climateProfile')}</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{region.climate_profile}</p>
                    </div>
                  )}
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Layers className="h-5 w-5" />
                    {t('regions.show.sections.quickActions.title')}
                  </CardTitle>
                  <CardDescription>{t('regions.show.sections.quickActions.description')}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href={`/regions/${region.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      {t('regions.show.quickActions.edit')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href="/zones">
                      <Layers className="h-4 w-4" />
                      {t('regions.show.quickActions.manageZones')}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href="/zones/create">
                      <MapPin className="h-4 w-4" />
                      {t('regions.show.quickActions.addZone')}
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{t('regions.show.sections.recordInfo.title')}</CardTitle>
                  <CardDescription>{t('regions.show.sections.recordInfo.description')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>{t('regions.show.fields.created')}</span>
                    <span>{formatDate(region.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>{t('regions.show.fields.updated')}</span>
                    <span>{formatDate(region.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <DetailSectionCard
            title={t('regions.show.sections.zones.title', { name: region.name })}
            description={t('regions.show.sections.zones.description')}
            icon={<Layers className="h-5 w-5" />}
          >
            {zones.length > 0 ? (
              <div className="space-y-3">
                {zones.map(zone => (
                  <div key={zone.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{zone.name}</p>
                      {zone.status && (
                        <Badge className={`mt-2 text-xs ${getStatusBadgeStyles(zone.status)}`}>
                          {zone.status === 'active' ? t('regions.status.active') : t('regions.status.inactive')}
                        </Badge>
                      )}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/zones/${zone.id}`}>{t('regions.actions.view')}</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">{t('regions.show.zones.empty')}</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard
            title={t('regions.show.sections.history.title')}
            description={t('regions.show.sections.history.description')}
            icon={<BarChart3 className="h-5 w-5" />}
          >
            {activityLogRows.length > 0 ? (
              <ActivityLogTable logs={activityLogRows} />
            ) : (
              <p className="text-sm text-muted-foreground">{t('regions.show.history.empty')}</p>
            )}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title={t('regions.delete.title')}
        description={t('regions.delete.description')}
        itemName={region.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </DetailPageLayout>
  );
}

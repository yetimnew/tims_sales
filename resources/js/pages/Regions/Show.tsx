import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPin, Compass, Building2, Globe, Layers, BarChart3, Calendar, ThermometerSun, Waves, Users } from 'lucide-react';
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

const formatNumber = (value?: number | string | null, options?: Intl.NumberFormatOptions) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  return numeric.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const formatCoordinate = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  return `${numeric.toFixed(5)}°`;
};

export default function RegionsShow({ region, activityLogs = [] }: RegionShowProps) {
  const { toast } = useToast();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Regions', href: '/regions' }, { title: region.name || `Region ${region.id}`, href: `/regions/${region.id}` }], [region.id, region.name]);

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
      label: 'Population',
      value: formatNumber(region.population),
      helper: 'Reported residents',
    },
    {
      label: 'Area',
      value: `${formatNumber(region.area_km2)} km²`,
      helper: 'Land coverage footprint',
    },
    {
      label: 'Accessibility',
      value: formatNumber(region.accessibility_score),
      helper: 'Mobility index (0-100)',
    },
    {
      label: 'Active Zones',
      value: activeZones,
      helper: `Of ${zones.length} mapped zones`,
    },
  ];

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/regions/${region.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Region Deleted', description: `${region.name} was removed successfully.` });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'Unable to delete the region. Try again later.';
        toast({
          title: '❌ Delete Failed',
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
      subtitle={region.description || 'Administrative profile and regional performance.'}
      breadcrumbs={breadcrumbs}
      icon={<Globe className="h-6 w-6 text-blue-700 dark:text-blue-300" />}
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/regions')} className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Regions
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-sm font-medium ${getStatusBadgeStyles(region.status)}`}>{region.status.charAt(0).toUpperCase() + region.status.slice(1)}</Badge>
            <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
              <Layers className="h-3.5 w-3.5" />
              {zones.length} zones
            </Badge>
            {region.capital && (
              <Badge variant="outline" className="flex items-center gap-2 text-sm font-medium">
                <Building2 className="h-3.5 w-3.5" />
                Capital: {region.capital}
              </Badge>
            )}
          </div>
          {(hasPermission('regions.edit') || hasPermission('regions.destroy')) && (
            <div className="flex items-center gap-2">
              {hasPermission('regions.edit') && (
                <Button variant="outline" asChild className="gap-2 hover:border-blue-300 hover:bg-blue-50">
                  <Link href={`/regions/${region.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('regions.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/30">
                  <Trash2 className="h-4 w-4" />
                  Delete
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
            <Globe className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="zones" className="flex items-center gap-2">
            <Layers className="h-4 w-4" /> Zones
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={kpiSummary} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title="Region Overview" description="Core identifiers and administrative context" icon={<Globe className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Region Code</p>
                    <p className="mt-2 text-sm font-semibold">{region.code || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Capital City</p>
                    <p className="mt-2 text-sm font-semibold">{region.capital || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinate(region.latitude)} / {formatCoordinate(region.longitude)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                    <p className="mt-2 text-sm font-semibold">{formatNumber(region.elevation_m)} m</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Last Surveyed</p>
                    <p className="mt-2 text-sm font-semibold">{formatDate(region.last_surveyed_at)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Population Density</p>
                    <p className="mt-2 text-sm font-semibold">
                      {region.area_km2 && Number(region.area_km2) > 0
                        ? `${formatNumber(Number(region.population ?? 0) / Number(region.area_km2), {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} people / km²`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {(region.infrastructure_notes || region.climate_profile) && (
                <DetailSectionCard title="Environmental Notes" description="Infrastructure readiness and climate outlook" icon={<ThermometerSun className="h-5 w-5 text-amber-600" />}>
                  {region.infrastructure_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Infrastructure</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{region.infrastructure_notes}</p>
                    </div>
                  )}
                  {region.climate_profile && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Climate Profile</h3>
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
                    Quick Actions
                  </CardTitle>
                  <CardDescription>Regional administration shortcuts</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-2">
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href={`/regions/${region.id}/edit`}>
                      <Edit className="h-4 w-4" />
                      Edit Region Details
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href="/zones">
                      <Layers className="h-4 w-4" />
                      Manage Zones
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="h-auto justify-start gap-3 py-3">
                    <Link href="/zones/create">
                      <MapPin className="h-4 w-4" />
                      Add New Zone
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Record Info</CardTitle>
                  <CardDescription>System tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span>{formatDate(region.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated</span>
                    <span>{formatDate(region.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="zones" className="space-y-6">
          <DetailSectionCard title={`Zones within ${region.name}`} description="Administrative clusters and their statuses" icon={<Layers className="h-5 w-5" />}>
            {zones.length > 0 ? (
              <div className="space-y-3">
                {zones.map(zone => (
                  <div key={zone.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{zone.name}</p>
                      {zone.status && <Badge className={`mt-2 text-xs ${getStatusBadgeStyles(zone.status)}`}>{zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}</Badge>}
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/zones/${zone.id}`}>View</Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No zones have been mapped to this region yet.</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Auditable timeline of changes" icon={<BarChart3 className="h-5 w-5" />}>
            {activityLogRows.length > 0 ? <ActivityLogTable logs={activityLogRows} /> : <p className="text-sm text-muted-foreground">No activity recorded for this region yet.</p>}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Region" description="Are you sure you want to delete this region? This action cannot be undone." itemName={region.name} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}

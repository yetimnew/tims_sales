import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, Layers, MapPin, Building2, Compass, Globe2, Users, ThermometerSun, BarChart3 } from 'lucide-react';
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

interface RegionSummary {
  id: number;
  name: string;
  status?: 'active' | 'inactive';
}

interface WoredaSummary {
  id: number;
  name: string;
  status?: 'active' | 'inactive';
  population?: number | string | null;
}

interface Zone {
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
  climate_profile?: string | null;
  created_at: string;
  updated_at: string;
  region?: RegionSummary | null;
  woredas?: WoredaSummary[];
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

interface ZoneShowProps {
  zone: Zone;
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

const formatCoordinate = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return 'N/A';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return 'N/A';
  return `${numeric.toFixed(5)}°`;
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

export default function ZonesShow({ zone, activityLogs = [] }: ZoneShowProps) {
  const { toast } = useToast();
  const { hasPermissions } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Zones', href: '/zones' }, { title: zone.name || `Zone ${zone.id}`, href: `/zones/${zone.id}` }], [zone.id, zone.name]);

  const woredas = zone.woredas ?? [];
  const activeWoredas = woredas.filter(w => w.status === 'active').length;
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
    { label: 'Population', value: formatNumber(zone.population), helper: 'Reported residents' },
    { label: 'Area', value: `${formatNumber(zone.area_km2)} km²`, helper: 'Land footprint' },
    { label: 'Accessibility', value: formatNumber(zone.accessibility_score), helper: 'Logistics readiness (0-100)' },
    { label: 'Active Woredas', value: activeWoredas, helper: `Of ${woredas.length} mapped woredas` },
  ];

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/zones/${zone.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Zone Deleted', description: `${zone.name} was removed successfully.` });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'Unable to delete the zone. Try again later.';
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
      title={zone.name}
      subtitle={zone.description || 'Zone administration overview and operational metrics.'}
      breadcrumbs={breadcrumbs}
      icon={<Layers className="h-6 w-6 text-cyan-700 dark:text-cyan-300" />}
      iconWrapperClassName="bg-cyan-100 dark:bg-cyan-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/zones')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Zones
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={`text-sm font-medium ${getStatusBadgeStyles(zone.status)}`}>{zone.status.charAt(0).toUpperCase() + zone.status.slice(1)}</Badge>
            {zone.region && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Globe2 className="h-3.5 w-3.5" /> Region: {zone.region.name}
              </Badge>
            )}
            {zone.administrative_center && (
              <Badge variant="outline" className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5" /> Admin Center: {zone.administrative_center}
              </Badge>
            )}
          </div>
          {(hasPermission('zones.edit') || hasPermission('zones.destroy')) && (
            <div className="flex items-center gap-2">
              {hasPermission('zones.edit') && (
                <Button variant="outline" asChild className="gap-2">
                  <Link href={`/zones/${zone.id}/edit`}>
                    <Edit className="h-4 w-4" />
                    Edit
                  </Link>
                </Button>
              )}
              {hasPermission('zones.destroy') && (
                <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="gap-2 border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
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
          <TabsTrigger value="overview">
            <Layers className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="woredas">
            <Users className="h-4 w-4 mr-2" /> Woredas
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={kpiSummary} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title="Zone Overview" description="Administrative identifiers and geography" icon={<Layers className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Zone Code</p>
                    <p className="mt-2 text-sm font-semibold">{zone.code || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Administrative Center</p>
                    <p className="mt-2 text-sm font-semibold">{zone.administrative_center || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Region</p>
                    <p className="mt-2 text-sm font-semibold">{zone.region?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                    <p className="mt-2 text-sm font-semibold">{formatNumber(zone.elevation_m)} m</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinate(zone.latitude)} / {formatCoordinate(zone.longitude)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Population Density</p>
                    <p className="mt-2 text-sm font-semibold">
                      {zone.area_km2 && Number(zone.area_km2) > 0
                        ? `${formatNumber(Number(zone.population ?? 0) / Number(zone.area_km2), {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} people / km²`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {(zone.infrastructure_notes || zone.climate_profile) && (
                <DetailSectionCard title="Environmental Notes" description="Infrastructure readiness and climate outlook" icon={<ThermometerSun className="h-5 w-5" />}>
                  {zone.infrastructure_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Infrastructure</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{zone.infrastructure_notes}</p>
                    </div>
                  )}
                  {zone.climate_profile && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Climate Profile</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{zone.climate_profile}</p>
                    </div>
                  )}
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Snapshot</CardTitle>
                  <CardDescription>Quick reference</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <Layers className="h-4 w-4" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Zone ID</p>
                      <p className="font-medium text-foreground">{zone.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Globe2 className="h-4 w-4" />
                    <div>
                      <p className="text-xs uppercase text-muted-foreground">Region</p>
                      <p className="font-medium text-foreground">{zone.region?.name || 'N/A'}</p>
                    </div>
                  </div>
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
                    <span>{formatDate(zone.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated</span>
                    <span>{formatDate(zone.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="woredas" className="space-y-6">
          <DetailSectionCard title={`Woredas within ${zone.name}`} description="Sub-regional administrations linked to the zone" icon={<Users className="h-5 w-5" />}>
            {woredas.length > 0 ? (
              <div className="space-y-3">
                {woredas.map(woreda => (
                  <div key={woreda.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-medium">{woreda.name}</p>
                      {woreda.population && <p className="text-xs text-muted-foreground">Population: {formatNumber(woreda.population)}</p>}
                    </div>
                    {woreda.status && <Badge className={`text-xs ${getStatusBadgeStyles(woreda.status)}`}>{woreda.status.charAt(0).toUpperCase() + woreda.status.slice(1)}</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No woredas have been mapped to this zone yet.</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Auditable timeline of changes" icon={<BarChart3 className="h-5 w-5" />}>
            {activityLogRows.length > 0 ? <ActivityLogTable logs={activityLogRows} /> : <p className="text-sm text-muted-foreground">No activity recorded for this zone yet.</p>}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Zone" description="Are you sure you want to delete this zone? This action cannot be undone." itemName={zone.name} onConfirm={handleDelete} isDeleting={isDeleting} />
    </DetailPageLayout>
  );
}

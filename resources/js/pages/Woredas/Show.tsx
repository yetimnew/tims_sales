import { useMemo, useState } from 'react';
import { Link, router } from '@inertiajs/react';
import { ArrowLeft, Edit, Trash2, MapPinned, Building2, Users, Navigation, Mountain, Ruler, ThermometerSun, HardHat, BarChart3, Calendar } from 'lucide-react';
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

const resolveActivityAction = (event?: string | null): 'created' | 'updated' | 'deleted' => {
  if (event === 'created' || event === 'updated' || event === 'deleted') {
    return event;
  }
  return 'updated';
};

export default function WoredasShow({ woreda, activityLogs = [] }: WoredasShowProps) {
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const breadcrumbs = useMemo<BreadcrumbItem[]>(() => [{ title: 'Woredas', href: '/woredas' }, { title: woreda.name || `Woreda ${woreda.id}`, href: `/woredas/${woreda.id}` }], [woreda.id, woreda.name]);

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
    { label: 'Population', value: formatNumber(woreda.population), helper: 'Reported residents' },
    { label: 'Area', value: `${formatNumber(woreda.area_km2)} km²`, helper: 'Land coverage' },
    { label: 'Accessibility', value: formatNumber(woreda.accessibility_score), helper: 'Logistics readiness (0-100)' },
    { label: 'Mapped Places', value: places.length, helper: 'Service delivery locations' },
  ];

  const handleDelete = () => {
    setIsDeleting(true);
    router.delete(`/woredas/${woreda.id}`, {
      preserveScroll: true,
      onSuccess: () => {
        toast({ title: '✅ Woreda Deleted', description: `${woreda.name} was removed successfully.` });
        setDeleteDialogOpen(false);
        setIsDeleting(false);
      },
      onError: errors => {
        const errorMessage = errors && typeof errors === 'object' && 'message' in errors ? String(errors.message) : 'Unable to delete the woreda. Try again later.';
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
      title={woreda.name}
      subtitle={woreda.description || 'Sub-regional administration and service delivery overview.'}
      breadcrumbs={breadcrumbs}
      icon={<MapPinned className="h-6 w-6 text-teal-700 dark:text-teal-300" />}
      iconWrapperClassName="bg-teal-100 dark:bg-teal-900/30"
      leading={
        <Button variant="outline" size="sm" onClick={() => router.get('/woredas')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Woredas
        </Button>
      }
      actions={
        <>
          <div className="flex flex-wrap gap-2">
            <Badge className={statusBadgeClass(woreda.status)}>{woreda.status.charAt(0).toUpperCase() + woreda.status.slice(1)}</Badge>
            {woreda.zone && (
              <Badge variant="outline">
                Zone: {woreda.zone.name}
              </Badge>
            )}
            {woreda.administrative_center && (
              <Badge variant="outline">
                <Building2 className="h-3.5 w-3.5 mr-1" />
                Admin Center: {woreda.administrative_center}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" asChild>
              <Link href={`/woredas/${woreda.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="border-red-200 text-red-600 hover:border-red-300 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </>
      }
    >
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">
            <MapPinned className="h-4 w-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="places">
            <Navigation className="h-4 w-4 mr-2" /> Places
          </TabsTrigger>
          <TabsTrigger value="history">
            <BarChart3 className="h-4 w-4 mr-2" /> History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <DetailSummaryGrid items={kpiSummary} />

          <div className="grid gap-6 lg:grid-cols-[1fr,20rem]">
            <div className="space-y-6">
              <DetailSectionCard title="Woreda Overview" description="Administrative identifiers and geography" icon={<MapPinned className="h-5 w-5" />}>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Woreda Code</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.code || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Administrative Center</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.administrative_center || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Zone</p>
                    <p className="mt-2 text-sm font-semibold">{woreda.zone?.name || 'N/A'}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Elevation</p>
                    <p className="mt-2 text-sm font-semibold">{formatNumber(woreda.elevation_m)} m</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Coordinates</p>
                    <p className="mt-2 text-sm font-semibold">
                      {formatCoordinate(woreda.latitude)} / {formatCoordinate(woreda.longitude)}
                    </p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-xs font-semibold uppercase text-muted-foreground">Population Density</p>
                    <p className="mt-2 text-sm font-semibold">
                      {woreda.area_km2 && Number(woreda.area_km2) > 0
                        ? `${formatNumber(Number(woreda.population ?? 0) / Number(woreda.area_km2), {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })} people / km²`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </DetailSectionCard>

              {(woreda.infrastructure_notes || woreda.road_quality_notes) && (
                <DetailSectionCard title="Infrastructure Notes" description="Accessibility and road conditions" icon={<ThermometerSun className="h-5 w-5" />}>
                  {woreda.infrastructure_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Infrastructure</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{woreda.infrastructure_notes}</p>
                    </div>
                  )}
                  {woreda.road_quality_notes && (
                    <div className="rounded-lg border p-4">
                      <h3 className="text-xs font-semibold uppercase tracking-wide">Road Quality</h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{woreda.road_quality_notes}</p>
                    </div>
                  )}
                </DetailSectionCard>
              )}
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Record Info</CardTitle>
                  <CardDescription>System tracking</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between">
                    <span>Created</span>
                    <span>{formatDate(woreda.created_at)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Updated</span>
                    <span>{formatDate(woreda.updated_at)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="places" className="space-y-6">
          <DetailSectionCard title={`Places within ${woreda.name}`} description="Service delivery locations" icon={<Navigation className="h-5 w-5" />}>
            {places.length > 0 ? (
              <div className="space-y-3">
                {places.map(place => (
                  <div key={place.id} className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <p className="font-semibold">{place.name}</p>
                      {place.is_logistics_hub && <Badge className="mt-2 text-xs">Logistics Hub</Badge>}
                    </div>
                    {place.status && <Badge className={`text-xs ${statusBadgeClass(place.status)}`}>{place.status.charAt(0).toUpperCase() + place.status.slice(1)}</Badge>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No places have been mapped to this woreda yet.</p>
            )}
          </DetailSectionCard>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <DetailSectionCard title="Activity History" description="Auditable timeline of changes" icon={<BarChart3 className="h-5 w-5" />}>
            {activityLogRows.length > 0 ? <ActivityLogTable logs={activityLogRows} /> : <p className="text-sm text-muted-foreground">No activity recorded for this woreda yet.</p>}
          </DetailSectionCard>
        </TabsContent>
      </Tabs>

      <DeleteConfirmationDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete Woreda" description="Are you sure you want to delete this woreda? This action cannot be undone." itemName={woreda.name} onConfirm={handleDelete} isLoading={isDeleting} />
    </DetailPageLayout>
  );
}
